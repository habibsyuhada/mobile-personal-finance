// Business logic untuk modul Notes. Bekerja di atas INotesRepository.
// Lihat docs/specs/notes/design.md §5.3.

import type {
  Block,
  Database as Db,
  DbRow,
  DbView,
  NewPage,
  Page,
  PagePatch,
  PropertyDef,
  PropertyValue,
  ViewConfig,
  ViewType,
} from '../data/models';
import { type INotesRepository } from '../data/notes.repo';
import { newId, nowIso } from '@/lib/id';
import { blocksToMarkdown, markdownToBlocks } from '../lib/markdown';

export class NotesValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotesValidationError';
  }
}

export class NotesService {
  constructor(private repo: INotesRepository) {}

  // ---- Pages ----

  listPages = (opts?: Parameters<INotesRepository['listPages']>[0]) =>
    this.repo.listPages(opts);

  getPage = (id: string) => this.repo.getPage(id);

  listRecent = (limit = 10) => this.repo.listRecent(limit);

  listTrash = () => this.repo.listTrash();

  async createPage(input: NewPage): Promise<Page> {
    const title = (input.title ?? '').trim() || 'Tanpa judul';
    return this.repo.createPage({ ...input, title });
  }

  updatePage(id: string, patch: PagePatch) {
    return this.repo.updatePage(id, patch);
  }

  async deletePage(id: string): Promise<void> {
    // Soft delete page + cascade ke semua child (recursively).
    const all = await this.repo.listPages({ includeDeleted: false });
    const childIds = collectDescendantIds(all, id);
    for (const cid of [id, ...childIds]) {
      await this.repo.softDeletePage(cid);
    }
  }

  async restorePage(id: string): Promise<void> {
    await this.repo.restorePage(id);
  }

  async movePage(id: string, parentId: string | null, sortOrder: number): Promise<Page> {
    if (parentId) {
      // Cegah cycle: parentId tidak boleh descendant dari id.
      const all = await this.repo.listPages({ includeDeleted: false });
      const desc = new Set(collectDescendantIds(all, id));
      if (desc.has(parentId)) {
        throw new NotesValidationError('Tidak bisa memindahkan page ke descendant-nya sendiri');
      }
    }
    return this.repo.movePage(id, parentId, sortOrder);
  }

  async toggleFavorite(id: string): Promise<Page> {
    const page = await this.repo.getPage(id);
    if (!page) throw new NotesValidationError('Page tidak ditemukan');
    await this.repo.toggleFavorite(id, !page.isFavorite);
    return { ...page, isFavorite: !page.isFavorite };
  }

  async trackOpen(id: string): Promise<void> {
    await this.repo.trackOpen(id);
  }

  async emptyTrash(): Promise<void> {
    await this.repo.emptyTrash();
  }

  async purgeOld(): Promise<void> {
    await this.repo.purgeOldDeleted(30);
  }

  // ---- Blocks ----

  listBlocks(pageId: string) {
    return this.repo.listBlocks(pageId);
  }

  async savePageContent(pageId: string, blocks: Block[]): Promise<void> {
    // Normalisasi sortOrder.
    const normalized = blocks.map((b, i) => ({ ...b, sortOrder: i, pageId, updatedAt: nowIso() }));
    await this.repo.saveBlocks(pageId, normalized);
  }

  getBlockText(pageId: string) {
    return this.repo.getBlockText(pageId);
  }

  // ---- Markdown export / import ----

  async exportPageMarkdown(id: string): Promise<string> {
    const page = await this.repo.getPage(id);
    if (!page) throw new NotesValidationError('Page tidak ditemukan');
    const blocks = await this.repo.listBlocks(id);
    const body = blocksToMarkdown(blocks);
    const fm = [
      '---',
      `title: ${yamlEscape(page.title)}`,
      page.icon ? `icon: ${yamlEscape(page.icon)}` : null,
      `created: ${page.createdAt}`,
      `updated: ${page.updatedAt}`,
      '---',
      '',
    ]
      .filter((l) => l != null)
      .join('\n');
    return fm + body;
  }

  async importPageMarkdown(md: string, parentId: string | null = null): Promise<Page> {
    const { frontmatter, body } = splitFrontmatter(md);
    const title = (frontmatter.title as string | undefined) ?? 'Imported';
    const icon = (frontmatter.icon as string | undefined) ?? null;
    const page = await this.createPage({ title, icon, parentId });
    const blocks = markdownToBlocks(body, {
      pageId: page.id,
      newId,
      nowIso,
    });
    if (blocks.length) await this.savePageContent(page.id, blocks);
    return page;
  }

  // ---- Database (Fase 3) ----

  async createDatabase(title: string, properties: PropertyDef[] = []): Promise<Page> {
    const page = await this.createPage({ title, type: 'database' });
    const db: Db = {
      id: page.id,
      properties: withDefaultProperties(properties),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await this.repo.upsertDatabase(db);
    await this.repo.ensureDefaultView(page.id, 'table');
    return page;
  }

  async getDatabase(id: string): Promise<Db | null> {
    return this.repo.getDatabase(id);
  }

  async saveDatabaseProperties(id: string, properties: PropertyDef[]): Promise<Db> {
    const existing = await this.repo.getDatabase(id);
    if (!existing) throw new NotesValidationError('Database tidak ditemukan');
    return this.repo.upsertDatabase({ ...existing, properties, updatedAt: nowIso() });
  }

  async createRow(databaseId: string, values: Record<string, PropertyValue> = {}): Promise<{ row: DbRow; page: Page }> {
    const db = await this.repo.getDatabase(databaseId);
    if (!db) throw new NotesValidationError('Database tidak ditemukan');
    const title = readTitleProp(values, db.properties) || 'Tanpa judul';
    const page = await this.createPage({ title, type: 'page' });
    const row = await this.repo.createRow({
      databaseId,
      pageId: page.id,
      properties: values,
    });
    return { row, page };
  }

  async updateRow(rowId: string, values: Record<string, PropertyValue>): Promise<DbRow> {
    const updated = await this.repo.updateRow(rowId, { properties: values });
    // Sinkronkan title page dengan property "Name" / title property.
    const db = await this.repo.getDatabase(updated.databaseId);
    if (db) {
      const title = readTitleProp(values, db.properties);
      if (title) await this.repo.updatePage(updated.pageId, { title });
    }
    return updated;
  }

  async deleteRow(rowId: string): Promise<void> {
    const row = await this.repo.getRow(rowId);
    if (!row) return;
    await this.repo.deleteRow(rowId);
    // Hard-delete page row.
    await this.repo.purgePage(row.pageId);
  }

  listRows(databaseId: string) {
    return this.repo.listRows(databaseId);
  }

  listViews(databaseId: string) {
    return this.repo.listViews(databaseId);
  }

  getView(id: string) {
    return this.repo.getView(id);
  }

  async createView(databaseId: string, name: string, viewType: ViewType, config: ViewConfig = {}): Promise<DbView> {
    return this.repo.createView(databaseId, name, viewType, config);
  }

  updateView(id: string, patch: { name?: string; viewType?: ViewType; config?: ViewConfig; sortOrder?: number }) {
    return this.repo.updateView(id, patch);
  }

  // ---- Search ----

  search(query: string, limit = 30) {
    return this.repo.search(query, limit);
  }

  // ---- Seed ----

  async ensurePersonalNotebook(): Promise<Page> {
    return this.repo.ensureDefaultPage('Catatan Pribadi', '📝');
  }
}

// ---- Helpers ----

function collectDescendantIds(all: Page[], rootId: string): string[] {
  const out: string[] = [];
  const byParent = new Map<string, string[]>();
  for (const p of all) {
    if (!p.parentId) continue;
    const arr = byParent.get(p.parentId) ?? [];
    arr.push(p.id);
    byParent.set(p.parentId, arr);
  }
  const stack = [...(byParent.get(rootId) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    const children = byParent.get(id);
    if (children) stack.push(...children);
  }
  return out;
}

function yamlEscape(s: string): string {
  if (/[:#\n"]/.test(s)) return `"${s.replace(/"/g, '\\"')}"`;
  return s;
}

function splitFrontmatter(md: string): { frontmatter: Record<string, unknown>; body: string } {
  const trimmed = md.replace(/^\uFEFF/, '');
  if (!trimmed.startsWith('---')) return { frontmatter: {}, body: trimmed };
  const end = trimmed.indexOf('\n---', 3);
  if (end < 0) return { frontmatter: {}, body: trimmed };
  const fmBlock = trimmed.slice(3, end).trim();
  const rest = trimmed.slice(end + 4).replace(/^\n/, '');
  const fm: Record<string, unknown> = {};
  for (const line of fmBlock.split('\n')) {
    const m = /^([\w-]+):\s*(.*)$/.exec(line);
    if (m) fm[m[1]] = stripQuotes(m[2]);
  }
  return { frontmatter: fm, body: rest };
}

function stripQuotes(v: string): string {
  const s = v.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

const DEFAULT_PROPS: PropertyDef[] = [
  { id: 'name', name: 'Name', type: 'text' },
];

function withDefaultProperties(props: PropertyDef[]): PropertyDef[] {
  if (props.length === 0) return [...DEFAULT_PROPS];
  if (props.some((p) => p.id === 'name')) return props;
  return [{ id: 'name', name: 'Name', type: 'text' }, ...props];
}

function readTitleProp(values: Record<string, PropertyValue>, properties: PropertyDef[]): string {
  // Cari property bernama "Name" / "Title" / "Judul" — case-insensitive.
  for (const p of properties) {
    const lname = p.name.toLowerCase();
    if (lname === 'name' || lname === 'title' || lname === 'judul') {
      const v = values[p.id];
      if (typeof v === 'string' && v.trim().length) return v.trim();
    }
  }
  // Fallback: property text pertama.
  for (const p of properties) {
    if (p.type === 'text') {
      const v = values[p.id];
      if (typeof v === 'string' && v.trim().length) return v.trim();
    }
  }
  return '';
}
