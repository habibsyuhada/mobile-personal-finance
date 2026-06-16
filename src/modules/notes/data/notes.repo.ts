import type { Database } from '@/data/db/database';
import { persistWeb } from '@/data/db/database';
import { newId, nowIso } from '@/lib/id';
import type {
  Attachment,
  Block,
  BlockText,
  BlockType,
  Database as Db,
  DbRow,
  DbView,
  InlineNode,
  NewPage,
  NewRow,
  Page,
  PagePatch,
  PageType,
  PropertyDef,
  PropertyValue,
  RowPatch,
  SearchResult,
  ViewConfig,
  ViewType,
} from './models';

type Row = Record<string, unknown>;

// ---------- Mapping helpers ----------

function mapPage(r: Row): Page {
  return {
    id: String(r.id),
    parentId: r.parent_id == null ? null : String(r.parent_id),
    title: String(r.title ?? 'Tanpa judul'),
    icon: (r.icon as string) ?? null,
    coverPath: (r.cover_path as string) ?? null,
    type: (r.type as PageType) ?? 'page',
    isFavorite: Number(r.is_favorite) === 1,
    isDeleted: Number(r.is_deleted) === 1,
    deletedAt: (r.deleted_at as string) ?? null,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    openedAt: (r.opened_at as string) ?? null,
  };
}

function mapBlock(r: Row): Block {
  let content: InlineNode[] = [];
  try {
    const raw = r.content;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) content = parsed as InlineNode[];
    }
  } catch {
    content = [];
  }
  let meta: Record<string, string> | null = null;
  if (typeof r.meta === 'string' && r.meta.length > 0) {
    try {
      meta = JSON.parse(r.meta) as Record<string, string>;
    } catch {
      meta = null;
    }
  }
  return {
    id: String(r.id),
    pageId: String(r.page_id),
    type: (r.type as BlockType) ?? 'paragraph',
    content,
    meta,
    src: (r.src as string) ?? null,
    checked: Number(r.checked) === 1,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapAttachment(r: Row): Attachment {
  return {
    id: String(r.id),
    pageId: String(r.page_id),
    filename: String(r.filename),
    mimeType: String(r.mime_type),
    sizeBytes: Number(r.size_bytes),
    filePath: String(r.file_path),
    createdAt: String(r.created_at),
  };
}

function mapDb(r: Row): Db {
  let properties: PropertyDef[] = [];
  try {
    const raw = r.properties_json;
    if (typeof raw === 'string' && raw.length > 0) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) properties = parsed as PropertyDef[];
    }
  } catch {
    properties = [];
  }
  return {
    id: String(r.id),
    properties,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapDbRow(r: Row): DbRow {
  let properties: Record<string, PropertyValue> = {};
  try {
    const raw = r.properties;
    if (typeof raw === 'string' && raw.length > 0) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        properties = parsed as Record<string, PropertyValue>;
      }
    }
  } catch {
    properties = {};
  }
  return {
    id: String(r.id),
    databaseId: String(r.database_id),
    pageId: String(r.page_id),
    properties,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapDbView(r: Row): DbView {
  let config: ViewConfig = {};
  try {
    const raw = r.config_json;
    if (typeof raw === 'string' && raw.length > 0) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        config = parsed as ViewConfig;
      }
    }
  } catch {
    config = {};
  }
  return {
    id: String(r.id),
    databaseId: String(r.database_id),
    name: String(r.name),
    viewType: (r.view_type as ViewType) ?? 'table',
    config,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: String(r.created_at),
  };
}

// ---------- Interface ----------

export interface ListPagesOptions {
  parentId?: string | null;
  includeDeleted?: boolean;
  favoritesOnly?: boolean;
  search?: string;
  type?: PageType;
  limit?: number;
}

export interface INotesRepository {
  // Pages
  listPages(opts?: ListPagesOptions): Promise<Page[]>;
  getPage(id: string): Promise<Page | null>;
  createPage(input: NewPage): Promise<Page>;
  updatePage(id: string, patch: PagePatch): Promise<Page>;
  movePage(id: string, parentId: string | null, sortOrder: number): Promise<Page>;
  softDeletePage(id: string): Promise<void>;
  restorePage(id: string): Promise<void>;
  purgePage(id: string): Promise<void>;
  emptyTrash(): Promise<void>;
  purgeOldDeleted(retentionDays: number): Promise<void>;
  listTrash(): Promise<Page[]>;
  listFavorites(): Promise<Page[]>;
  listRecent(limit?: number): Promise<Page[]>;
  trackOpen(id: string): Promise<void>;
  toggleFavorite(id: string, value: boolean): Promise<void>;
  ensureDefaultPage(title: string, icon?: string | null): Promise<Page>;

  // Blocks
  listBlocks(pageId: string): Promise<Block[]>;
  saveBlocks(pageId: string, blocks: Block[]): Promise<void>;
  getBlockText(pageId: string): Promise<BlockText>;

  // Database
  getDatabase(id: string): Promise<Db | null>;
  upsertDatabase(db: Db): Promise<Db>;
  listRows(databaseId: string): Promise<DbRow[]>;
  getRow(id: string): Promise<DbRow | null>;
  createRow(input: NewRow): Promise<DbRow>;
  updateRow(id: string, patch: RowPatch): Promise<DbRow>;
  deleteRow(id: string): Promise<void>;
  listViews(databaseId: string): Promise<DbView[]>;
  getView(id: string): Promise<DbView | null>;
  createView(databaseId: string, name: string, viewType: ViewType, config?: ViewConfig): Promise<DbView>;
  updateView(id: string, patch: { name?: string; viewType?: ViewType; config?: ViewConfig; sortOrder?: number }): Promise<DbView>;
  ensureDefaultView(databaseId: string, viewType?: ViewType): Promise<DbView>;

  // Search
  search(query: string, limit?: number): Promise<SearchResult[]>;

  // Attachments
  createAttachment(att: Omit<Attachment, 'createdAt'>): Promise<Attachment>;
  getAttachment(id: string): Promise<Attachment | null>;
  listAttachments(pageId: string): Promise<Attachment[]>;
  deleteAttachment(id: string): Promise<void>;
  totalAttachmentSize(): Promise<number>;
}

// ---------- Implementation ----------

export class SqliteNotesRepository implements INotesRepository {
  constructor(private db: Database) {}

  // ---- Pages ----

  async listPages(opts: ListPagesOptions = {}): Promise<Page[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.includeDeleted) {
      where.push('is_deleted = 1');
    } else {
      where.push('is_deleted = 0');
    }
    if (opts.favoritesOnly) where.push('is_favorite = 1');
    if (opts.type) {
      where.push('type = ?');
      params.push(opts.type);
    }
    if (opts.search) {
      where.push('title LIKE ?');
      params.push(`%${opts.search}%`);
    }
    if (opts.parentId === null) {
      where.push('parent_id IS NULL');
    } else if (typeof opts.parentId === 'string') {
      where.push('parent_id = ?');
      params.push(opts.parentId);
    }
    const limit = opts.limit && opts.limit > 0 ? ` LIMIT ${Math.floor(opts.limit)}` : '';
    const sql = `SELECT * FROM notes_pages WHERE ${where.join(' AND ')}
                 ORDER BY sort_order, updated_at DESC${limit};`;
    const res = await this.db.query(sql, params);
    return res.values.map(mapPage);
  }

  async getPage(id: string): Promise<Page | null> {
    const res = await this.db.query(`SELECT * FROM notes_pages WHERE id = ?;`, [id]);
    if (!res.values.length) return null;
    return mapPage(res.values[0]);
  }

  async createPage(input: NewPage): Promise<Page> {
    const now = nowIso();
    const page: Page = {
      id: newId(),
      parentId: input.parentId ?? null,
      title: input.title ?? 'Tanpa judul',
      icon: input.icon ?? null,
      coverPath: null,
      type: input.type ?? 'page',
      isFavorite: false,
      isDeleted: false,
      deletedAt: null,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
      openedAt: null,
    };
    await this.db.run(
      `INSERT INTO notes_pages
        (id, parent_id, title, icon, cover_path, type, is_favorite, is_deleted,
         deleted_at, sort_order, created_at, updated_at, opened_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        page.id,
        page.parentId,
        page.title,
        page.icon,
        page.coverPath,
        page.type,
        page.isFavorite ? 1 : 0,
        page.isDeleted ? 1 : 0,
        page.deletedAt,
        page.sortOrder,
        page.createdAt,
        page.updatedAt,
        page.openedAt,
      ]
    );
    await persistWeb();
    return page;
  }

  async updatePage(id: string, patch: PagePatch): Promise<Page> {
    const existing = await this.getPage(id);
    if (!existing) throw new Error('Page not found');
    const merged: Page = { ...existing, ...patch, updatedAt: nowIso() };
    await this.db.run(
      `UPDATE notes_pages
         SET parent_id = ?, title = ?, icon = ?, cover_path = ?, type = ?,
             is_favorite = ?, sort_order = ?, updated_at = ?
       WHERE id = ?;`,
      [
        merged.parentId,
        merged.title,
        merged.icon,
        merged.coverPath,
        merged.type,
        merged.isFavorite ? 1 : 0,
        merged.sortOrder,
        merged.updatedAt,
        id,
      ]
    );
    await persistWeb();
    return merged;
  }

  async movePage(id: string, parentId: string | null, sortOrder: number): Promise<Page> {
    return this.updatePage(id, { parentId, sortOrder });
  }

  async softDeletePage(id: string): Promise<void> {
    await this.db.run(
      `UPDATE notes_pages SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?;`,
      [nowIso(), nowIso(), id]
    );
    await persistWeb();
  }

  async restorePage(id: string): Promise<void> {
    // Jika parent masih di-trash atau hilang, pindah ke root.
    const page = await this.getPage(id);
    if (!page) return;
    let parentId = page.parentId;
    if (parentId) {
      const parent = await this.getPage(parentId);
      if (!parent || parent.isDeleted) parentId = null;
    }
    await this.db.run(
      `UPDATE notes_pages
         SET is_deleted = 0, deleted_at = NULL, parent_id = ?, updated_at = ?
       WHERE id = ?;`,
      [parentId, nowIso(), id]
    );
    await persistWeb();
  }

  async purgePage(id: string): Promise<void> {
    // Hapus attachments files di luar DB best-effort.
    const atts = await this.listAttachments(id);
    for (const a of atts) {
      try {
        await deleteAttachmentFile(a.filePath);
      } catch {
        /* ignore */
      }
    }
    await this.db.run(`DELETE FROM notes_pages WHERE id = ?;`, [id]);
    await persistWeb();
  }

  async emptyTrash(): Promise<void> {
    const trash = await this.listTrash();
    for (const p of trash) {
      await this.purgePage(p.id);
    }
  }

  async purgeOldDeleted(retentionDays: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffIso = cutoff.toISOString();
    const res = await this.db.query(
      `SELECT id FROM notes_pages WHERE is_deleted = 1 AND deleted_at IS NOT NULL AND deleted_at < ?;`,
      [cutoffIso]
    );
    for (const r of res.values) {
      await this.purgePage(String(r.id));
    }
  }

  async listTrash(): Promise<Page[]> {
    const res = await this.db.query(
      `SELECT * FROM notes_pages WHERE is_deleted = 1 ORDER BY deleted_at DESC;`
    );
    return res.values.map(mapPage);
  }

  async listFavorites(): Promise<Page[]> {
    const res = await this.db.query(
      `SELECT * FROM notes_pages WHERE is_favorite = 1 AND is_deleted = 0
       ORDER BY updated_at DESC;`
    );
    return res.values.map(mapPage);
  }

  async listRecent(limit = 10): Promise<Page[]> {
    const safe = Math.max(1, Math.floor(limit));
    const res = await this.db.query(
      `SELECT * FROM notes_pages WHERE opened_at IS NOT NULL AND is_deleted = 0
       ORDER BY opened_at DESC LIMIT ${safe};`
    );
    return res.values.map(mapPage);
  }

  async trackOpen(id: string): Promise<void> {
    await this.db.run(
      `UPDATE notes_pages SET opened_at = ? WHERE id = ?;`,
      [nowIso(), id]
    );
    await persistWeb();
  }

  async toggleFavorite(id: string, value: boolean): Promise<void> {
    await this.db.run(
      `UPDATE notes_pages SET is_favorite = ?, updated_at = ? WHERE id = ?;`,
      [value ? 1 : 0, nowIso(), id]
    );
    await persistWeb();
  }

  async ensureDefaultPage(title: string, icon: string | null = null): Promise<Page> {
    const res = await this.db.query(
      `SELECT * FROM notes_pages WHERE is_deleted = 0 ORDER BY created_at ASC LIMIT 1;`
    );
    if (res.values.length) return mapPage(res.values[0]);
    return this.createPage({ title, icon, parentId: null, sortOrder: 0 });
  }

  // ---- Blocks ----

  async listBlocks(pageId: string): Promise<Block[]> {
    const res = await this.db.query(
      `SELECT * FROM notes_blocks WHERE page_id = ? ORDER BY sort_order, rowid;`,
      [pageId]
    );
    return res.values.map(mapBlock);
  }

  async saveBlocks(pageId: string, blocks: Block[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.run(`DELETE FROM notes_blocks WHERE page_id = ?;`, [pageId]);
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        await tx.run(
          `INSERT INTO notes_blocks
             (id, page_id, type, content, meta, src, checked, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            b.id,
            pageId,
            b.type,
            JSON.stringify(b.content ?? []),
            b.meta ? JSON.stringify(b.meta) : null,
            b.src,
            b.checked ? 1 : 0,
            b.sortOrder ?? i,
            b.createdAt ?? nowIso(),
            nowIso(),
          ]
        );
      }
      // Update page's updated_at + bump search index.
      await tx.run(`UPDATE notes_pages SET updated_at = ? WHERE id = ?;`, [nowIso(), pageId]);
    });
    await persistWeb();
  }

  async getBlockText(pageId: string): Promise<BlockText> {
    const blocks = await this.listBlocks(pageId);
    return blocksToPlainText(blocks);
  }

  // ---- Database ----

  async getDatabase(id: string): Promise<Db | null> {
    const res = await this.db.query(`SELECT * FROM notes_databases WHERE id = ?;`, [id]);
    if (!res.values.length) return null;
    return mapDb(res.values[0]);
  }

  async upsertDatabase(db: Db): Promise<Db> {
    const exists = await this.getDatabase(db.id);
    if (exists) {
      await this.db.run(
        `UPDATE notes_databases SET properties_json = ?, updated_at = ? WHERE id = ?;`,
        [JSON.stringify(db.properties), nowIso(), db.id]
      );
    } else {
      await this.db.run(
        `INSERT INTO notes_databases (id, properties_json, created_at, updated_at)
         VALUES (?, ?, ?, ?);`,
        [db.id, JSON.stringify(db.properties), db.createdAt, db.updatedAt]
      );
    }
    await persistWeb();
    return { ...db, updatedAt: nowIso() };
  }

  async listRows(databaseId: string): Promise<DbRow[]> {
    const res = await this.db.query(
      `SELECT * FROM notes_db_rows WHERE database_id = ? ORDER BY sort_order, created_at;`,
      [databaseId]
    );
    return res.values.map(mapDbRow);
  }

  async getRow(id: string): Promise<DbRow | null> {
    const res = await this.db.query(`SELECT * FROM notes_db_rows WHERE id = ?;`, [id]);
    if (!res.values.length) return null;
    return mapDbRow(res.values[0]);
  }

  async createRow(input: NewRow): Promise<DbRow> {
    const now = nowIso();
    const row: DbRow = {
      id: newId(),
      databaseId: input.databaseId,
      pageId: input.pageId,
      properties: input.properties ?? {},
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.run(
      `INSERT INTO notes_db_rows
         (id, database_id, page_id, properties, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        row.id,
        row.databaseId,
        row.pageId,
        JSON.stringify(row.properties),
        row.sortOrder,
        row.createdAt,
        row.updatedAt,
      ]
    );
    await persistWeb();
    return row;
  }

  async updateRow(id: string, patch: RowPatch): Promise<DbRow> {
    const existing = await this.getRow(id);
    if (!existing) throw new Error('Row not found');
    const merged: DbRow = {
      ...existing,
      ...patch,
      properties: patch.properties ?? existing.properties,
      updatedAt: nowIso(),
    };
    await this.db.run(
      `UPDATE notes_db_rows
         SET properties = ?, sort_order = ?, updated_at = ?
       WHERE id = ?;`,
      [JSON.stringify(merged.properties), merged.sortOrder, merged.updatedAt, id]
    );
    await persistWeb();
    return merged;
  }

  async deleteRow(id: string): Promise<void> {
    await this.db.run(`DELETE FROM notes_db_rows WHERE id = ?;`, [id]);
    await persistWeb();
  }

  async listViews(databaseId: string): Promise<DbView[]> {
    const res = await this.db.query(
      `SELECT * FROM notes_db_views WHERE database_id = ? ORDER BY sort_order, created_at;`,
      [databaseId]
    );
    return res.values.map(mapDbView);
  }

  async getView(id: string): Promise<DbView | null> {
    const res = await this.db.query(`SELECT * FROM notes_db_views WHERE id = ?;`, [id]);
    if (!res.values.length) return null;
    return mapDbView(res.values[0]);
  }

  async createView(
    databaseId: string,
    name: string,
    viewType: ViewType,
    config: ViewConfig = {}
  ): Promise<DbView> {
    const view: DbView = {
      id: newId(),
      databaseId,
      name,
      viewType,
      config,
      sortOrder: 0,
      createdAt: nowIso(),
    };
    await this.db.run(
      `INSERT INTO notes_db_views
         (id, database_id, name, view_type, config_json, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        view.id,
        view.databaseId,
        view.name,
        view.viewType,
        JSON.stringify(view.config),
        view.sortOrder,
        view.createdAt,
      ]
    );
    await persistWeb();
    return view;
  }

  async updateView(
    id: string,
    patch: { name?: string; viewType?: ViewType; config?: ViewConfig; sortOrder?: number }
  ): Promise<DbView> {
    const existing = await this.getView(id);
    if (!existing) throw new Error('View not found');
    const merged: DbView = {
      ...existing,
      ...patch,
      config: patch.config ?? existing.config,
    };
    await this.db.run(
      `UPDATE notes_db_views
         SET name = ?, view_type = ?, config_json = ?, sort_order = ?
       WHERE id = ?;`,
      [merged.name, merged.viewType, JSON.stringify(merged.config), merged.sortOrder, id]
    );
    await persistWeb();
    return merged;
  }

  async ensureDefaultView(databaseId: string, viewType: ViewType = 'table'): Promise<DbView> {
    const existing = await this.listViews(databaseId);
    if (existing.length) return existing[0];
    return this.createView(databaseId, 'All', viewType, {});
  }

  // ---- Search (LIKE-based fallback; FTS5 opsional di v2) ----

  async search(query: string, limit = 50): Promise<SearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    const safeLimit = Math.max(1, Math.floor(limit));
    const like = `%${q}%`;
    // Cari di title page + plain text dari blocks.
    const titleRes = await this.db.query(
      `SELECT id, title FROM notes_pages
        WHERE is_deleted = 0 AND title LIKE ?
        ORDER BY updated_at DESC LIMIT ${safeLimit};`,
      [like]
    );
    const found = new Map<string, SearchResult>();
    for (const r of titleRes.values) {
      const id = String(r.id);
      const title = String(r.title);
      const idx = title.toLowerCase().indexOf(q.toLowerCase());
      found.set(id, {
        page: {
          ...((await this.getPage(id)) as Page),
        },
        snippet: idx >= 0 ? title.slice(Math.max(0, idx - 20), idx + 60) : title.slice(0, 60),
        matchIndex: idx >= 0 ? Math.min(20, idx) : 0,
      });
    }
    // Scan content dari blocks.
    if (found.size < safeLimit) {
      const blocksRes = await this.db.query(
        `SELECT b.page_id, b.content, p.title
           FROM notes_blocks b
           JOIN notes_pages p ON p.id = b.page_id
          WHERE p.is_deleted = 0 AND b.content LIKE ?
          LIMIT ${safeLimit * 4};`,
        [like]
      );
      for (const r of blocksRes.values) {
        const pageId = String(r.page_id);
        if (found.has(pageId)) continue;
        const content = String(r.content);
        const idx = content.toLowerCase().indexOf(q.toLowerCase());
        const page = await this.getPage(pageId);
        if (!page) continue;
        const snippet = idx >= 0 ? content.slice(Math.max(0, idx - 20), idx + 80) : String(r.title ?? '');
        found.set(pageId, {
          page,
          snippet: snippet.replace(/[[\]{}"]/g, ' ').trim().slice(0, 120),
          matchIndex: 0,
        });
        if (found.size >= safeLimit) break;
      }
    }
    return Array.from(found.values()).slice(0, safeLimit);
  }

  // ---- Attachments ----

  async createAttachment(att: Omit<Attachment, 'createdAt'>): Promise<Attachment> {
    const now = nowIso();
    const full: Attachment = { ...att, createdAt: now };
    await this.db.run(
      `INSERT INTO notes_attachments
         (id, page_id, filename, mime_type, size_bytes, file_path, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [full.id, full.pageId, full.filename, full.mimeType, full.sizeBytes, full.filePath, full.createdAt]
    );
    await persistWeb();
    return full;
  }

  async getAttachment(id: string): Promise<Attachment | null> {
    const res = await this.db.query(`SELECT * FROM notes_attachments WHERE id = ?;`, [id]);
    if (!res.values.length) return null;
    return mapAttachment(res.values[0]);
  }

  async listAttachments(pageId: string): Promise<Attachment[]> {
    const res = await this.db.query(
      `SELECT * FROM notes_attachments WHERE page_id = ? ORDER BY created_at DESC;`,
      [pageId]
    );
    return res.values.map(mapAttachment);
  }

  async deleteAttachment(id: string): Promise<void> {
    const att = await this.getAttachment(id);
    if (att) {
      try {
        await deleteAttachmentFile(att.filePath);
      } catch {
        /* ignore */
      }
    }
    await this.db.run(`DELETE FROM notes_attachments WHERE id = ?;`, [id]);
    await persistWeb();
  }

  async totalAttachmentSize(): Promise<number> {
    const res = await this.db.query(`SELECT COALESCE(SUM(size_bytes), 0) AS s FROM notes_attachments;`);
    return Number(res.values[0]?.s ?? 0);
  }
}

// ---- Plain text & helpers (shared) ----

export function blocksToPlainText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    const inlineText = (b.content ?? []).map((c) => c.text ?? '').join('');
    switch (b.type) {
      case 'heading_1':
        parts.push(`# ${inlineText}`);
        break;
      case 'heading_2':
        parts.push(`## ${inlineText}`);
        break;
      case 'heading_3':
        parts.push(`### ${inlineText}`);
        break;
      case 'quote':
        parts.push(`> ${inlineText}`);
        break;
      case 'code':
        parts.push('```' + (b.meta?.lang ?? '') + '\n' + inlineText + '\n```');
        break;
      case 'divider':
        parts.push('---');
        break;
      case 'callout':
        parts.push(`${b.meta?.emoji ?? '💡'} ${inlineText}`);
        break;
      case 'image':
        parts.push(`![${b.meta?.alt ?? ''}](${b.src ?? ''})`);
        break;
      case 'todo_list':
        parts.push(`${b.checked ? '[x]' : '[ ]'} ${inlineText}`);
        break;
      case 'bullet_list':
        parts.push(`- ${inlineText}`);
        break;
      case 'ordered_list':
        parts.push(`1. ${inlineText}`);
        break;
      case 'paragraph':
      default:
        parts.push(inlineText);
    }
  }
  return parts.join('\n');
}

/** Best-effort: hapus file lampiran. Di web biasanya no-op untuk object URL. */
async function deleteAttachmentFile(_path: string): Promise<void> {
  // Native: handled by AttachmentService; di repo kita tidak depend Capacitor.
  // Web: object URL di-revoke oleh komponen image saat unmount.
  // Method ini disiapkan untuk hook masa depan.
  return Promise.resolve();
}
