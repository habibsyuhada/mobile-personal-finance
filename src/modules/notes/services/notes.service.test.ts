import { describe, it, expect, vi } from 'vitest';
import { NotesService, NotesValidationError } from './notes.service';
import type { INotesRepository, ListPagesOptions } from '../data/notes.repo';
import type { Page, DbRow, DbView, Block } from '../data/models';

function fakeRepo(): INotesRepository {
  const pages = new Map<string, Page>();
  const blocks: Block[] = [];
  const rows = new Map<string, DbRow>();
  const views = new Map<string, DbView>();
  const dbs = new Map<string, { id: string; properties: unknown; createdAt: string; updatedAt: string }>();
  let idCounter = 0;
  const nextId = () => `id-${++idCounter}`;
  const now = 1000;
  const nowIsoFn = () => new Date(now).toISOString();
  const repo: INotesRepository = {
    listPages: vi.fn(async (opts: ListPagesOptions = {}) => {
      let arr = Array.from(pages.values());
      if (!opts.includeDeleted) arr = arr.filter((p) => !p.isDeleted);
      if (opts.favoritesOnly) arr = arr.filter((p) => p.isFavorite);
      if (opts.search) {
        const q = opts.search.toLowerCase();
        arr = arr.filter((p) => p.title.toLowerCase().includes(q));
      }
      if (opts.parentId === null) arr = arr.filter((p) => !p.parentId);
      else if (typeof opts.parentId === 'string') arr = arr.filter((p) => p.parentId === opts.parentId);
      return arr.sort((a, b) => a.sortOrder - b.sortOrder);
    }),
    getPage: vi.fn(async (id) => pages.get(id) ?? null),
    createPage: vi.fn(async (input) => {
      const p: Page = {
        id: nextId(),
        parentId: input.parentId ?? null,
        title: input.title ?? 'Tanpa judul',
        icon: input.icon ?? null,
        coverPath: null,
        type: input.type ?? 'page',
        isFavorite: false,
        isDeleted: false,
        deletedAt: null,
        sortOrder: input.sortOrder ?? 0,
        createdAt: nowIsoFn(),
        updatedAt: nowIsoFn(),
        openedAt: null,
      };
      pages.set(p.id, p);
      return p;
    }),
    updatePage: vi.fn(async (id, patch) => {
      const p = pages.get(id);
      if (!p) throw new Error('not found');
      const next = { ...p, ...patch, updatedAt: nowIsoFn() };
      pages.set(id, next);
      return next;
    }),
    movePage: vi.fn(async (id, parentId, sortOrder) => {
      const p = pages.get(id);
      if (!p) throw new Error('not found');
      const next = { ...p, parentId, sortOrder, updatedAt: nowIsoFn() };
      pages.set(id, next);
      return next;
    }),
    softDeletePage: vi.fn(async (id) => {
      const p = pages.get(id);
      if (!p) return;
      pages.set(id, { ...p, isDeleted: true, deletedAt: nowIsoFn() });
    }),
    restorePage: vi.fn(async (id) => {
      const p = pages.get(id);
      if (!p) return;
      let parentId = p.parentId;
      if (parentId) {
        const parent = pages.get(parentId);
        if (!parent || parent.isDeleted) parentId = null;
      }
      pages.set(id, { ...p, isDeleted: false, deletedAt: null, parentId });
    }),
    purgePage: vi.fn(async (id) => {
      pages.delete(id);
      for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].pageId === id) blocks.splice(i, 1);
      }
      for (const r of Array.from(rows.values())) if (r.pageId === id) rows.delete(r.id);
    }),
    emptyTrash: vi.fn(async () => {
      for (const p of Array.from(pages.values())) {
        if (p.isDeleted) await repo.purgePage!(p.id);
      }
    }),
    purgeOldDeleted: vi.fn(async () => undefined),
    listTrash: vi.fn(async () => Array.from(pages.values()).filter((p) => p.isDeleted)),
    listFavorites: vi.fn(async () =>
      Array.from(pages.values()).filter((p) => p.isFavorite && !p.isDeleted)
    ),
    listRecent: vi.fn(async (limit = 10) =>
      Array.from(pages.values())
        .filter((p) => p.openedAt && !p.isDeleted)
        .sort((a, b) => (a.openedAt! < b.openedAt! ? 1 : -1))
        .slice(0, limit)
    ),
    trackOpen: vi.fn(async (id) => {
      const p = pages.get(id);
      if (p) pages.set(id, { ...p, openedAt: nowIsoFn() });
    }),
    toggleFavorite: vi.fn(async (id, value) => {
      const p = pages.get(id);
      if (p) pages.set(id, { ...p, isFavorite: value });
    }),
    ensureDefaultPage: vi.fn(async (title) => {
      const existing = Array.from(pages.values())[0];
      if (existing) return existing;
      return repo.createPage!({ title, icon: null });
    }),

    listBlocks: vi.fn(async (pageId) => blocks.filter((b) => b.pageId === pageId).sort((a, b) => a.sortOrder - b.sortOrder)),
    saveBlocks: vi.fn(async (pageId, newBlocks) => {
      for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].pageId === pageId) blocks.splice(i, 1);
      }
      blocks.push(...newBlocks);
    }),
    getBlockText: vi.fn(async () => ''),

    getDatabase: vi.fn(async (id) => {
      const d = dbs.get(id);
      return d ? { id: d.id, properties: d.properties as never, createdAt: d.createdAt, updatedAt: d.updatedAt } : null;
    }),
    upsertDatabase: vi.fn(async (db) => {
      const exists = dbs.has(db.id);
      const next = { id: db.id, properties: db.properties, createdAt: exists ? dbs.get(db.id)!.createdAt : db.createdAt, updatedAt: nowIsoFn() };
      dbs.set(db.id, next);
      return { id: next.id, properties: next.properties as never, createdAt: next.createdAt, updatedAt: next.updatedAt };
    }),
    listRows: vi.fn(async () => []),
    getRow: vi.fn(async () => null),
    createRow: vi.fn(async (input) => {
      const r: DbRow = {
        id: nextId(),
        databaseId: input.databaseId,
        pageId: input.pageId,
        properties: input.properties ?? {},
        sortOrder: input.sortOrder ?? 0,
        createdAt: nowIsoFn(),
        updatedAt: nowIsoFn(),
      };
      rows.set(r.id, r);
      return r;
    }),
    updateRow: vi.fn(async (id, patch) => {
      const r = rows.get(id);
      if (!r) throw new Error('not found');
      const next = { ...r, ...patch, properties: patch.properties ?? r.properties, updatedAt: nowIsoFn() };
      rows.set(id, next);
      return next;
    }),
    deleteRow: vi.fn(async (id) => {
      rows.delete(id);
    }),
    listViews: vi.fn(async (databaseId) =>
      Array.from(views.values()).filter((v) => v.databaseId === databaseId).sort((a, b) => a.sortOrder - b.sortOrder)
    ),
    getView: vi.fn(async (id) => views.get(id) ?? null),
    createView: vi.fn(async (databaseId, name, viewType) => {
      const v: DbView = {
        id: nextId(),
        databaseId,
        name,
        viewType,
        config: {},
        sortOrder: 0,
        createdAt: nowIsoFn(),
      };
      views.set(v.id, v);
      return v;
    }),
    updateView: vi.fn(async (id, patch) => {
      const v = views.get(id);
      if (!v) throw new Error('not found');
      const next = { ...v, ...patch, config: patch.config ?? v.config };
      views.set(id, next);
      return next;
    }),
    ensureDefaultView: vi.fn(async (databaseId, viewType = 'table') => {
      const existing = Array.from(views.values()).find((v) => v.databaseId === databaseId);
      if (existing) return existing;
      return repo.createView!(databaseId, 'All', viewType, {});
    }),

    search: vi.fn(async (q) => {
      const lower = q.toLowerCase();
      return Array.from(pages.values())
        .filter((p) => !p.isDeleted && p.title.toLowerCase().includes(lower))
        .slice(0, 50)
        .map((p) => ({ page: p, snippet: p.title, matchIndex: 0 }));
    }),

    createAttachment: vi.fn(async () => ({} as never)),
    getAttachment: vi.fn(async () => null),
    listAttachments: vi.fn(async () => []),
    deleteAttachment: vi.fn(async () => undefined),
    totalAttachmentSize: vi.fn(async () => 0),
  };
  return repo;
}

describe('NotesService', () => {
  it('createPage trims title and falls back to "Tanpa judul"', async () => {
    const svc = new NotesService(fakeRepo());
    const p1 = await svc.createPage({ title: '  Halo  ' });
    expect(p1.title).toBe('Halo');
    const p2 = await svc.createPage({ title: '   ' });
    expect(p2.title).toBe('Tanpa judul');
  });

  it('deletePage soft-deletes page and all descendants', async () => {
    const svc = new NotesService(fakeRepo());
    const root = await svc.createPage({ title: 'Root' });
    const child = await svc.createPage({ parentId: root.id, title: 'Child' });
    await svc.createPage({ parentId: child.id, title: 'Grand' });
    await svc.createPage({ title: 'Sibling' });

    await svc.deletePage(root.id);

    // Non-deleted pages: only the sibling.
    const remaining = await svc.listPages({});
    const titles = remaining.map((p) => p.title).sort();
    expect(titles).toEqual(['Sibling']);

    // Trash contains root + child + grand.
    const trash = await svc.listTrash();
    expect(trash.length).toBe(3);
    expect(trash.map((p) => p.title).sort()).toEqual(['Child', 'Grand', 'Root']);
  });

  it('restorePage moves orphan children to root', async () => {
    const svc = new NotesService(fakeRepo());
    const root = await svc.createPage({ title: 'Root' });
    const child = await svc.createPage({ parentId: root.id, title: 'Child' });
    await svc.deletePage(root.id);
    await svc.restorePage(child.id);
    const childAfter = await svc.getPage(child.id);
    expect(childAfter?.parentId).toBe(null);
  });

  it('movePage rejects cycle (parent is descendant)', async () => {
    const svc = new NotesService(fakeRepo());
    const a = await svc.createPage({ title: 'A' });
    const b = await svc.createPage({ parentId: a.id, title: 'B' });
    const c = await svc.createPage({ parentId: b.id, title: 'C' });
    await expect(svc.movePage(a.id, c.id, 0)).rejects.toBeInstanceOf(NotesValidationError);
  });

  it('toggleFavorite flips the flag', async () => {
    const svc = new NotesService(fakeRepo());
    const p = await svc.createPage({ title: 'X' });
    expect(p.isFavorite).toBe(false);
    const p2 = await svc.toggleFavorite(p.id);
    expect(p2.isFavorite).toBe(true);
  });

  it('search returns results with snippet and page', async () => {
    const svc = new NotesService(fakeRepo());
    await svc.createPage({ title: 'Catatan Keuangan' });
    await svc.createPage({ title: 'Catatan Tugas' });
    await svc.createPage({ title: 'Lainnya' });
    const res = await svc.search('catatan');
    expect(res.length).toBe(2);
  });

  it('createDatabase ensures default view exists', async () => {
    const svc = new NotesService(fakeRepo());
    const p = await svc.createDatabase('My DB');
    expect(p.type).toBe('database');
    const views = await svc.listViews(p.id);
    expect(views.length).toBe(1);
    expect(views[0].viewType).toBe('table');
  });
});
