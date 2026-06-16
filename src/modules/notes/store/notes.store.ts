import { create } from 'zustand';
import { getDatabase } from '@/data/db/database';
import { SqliteNotesRepository, type INotesRepository } from '../data/notes.repo';
import { NotesService } from '../services/notes.service';
import { AttachmentService } from '../services/attachment.service';
import type {
  Block,
  Database as Db,
  DbRow,
  DbView,
  Page,
  PageType,
  SearchResult,
} from '../data/models';

let notesService: NotesService | null = null;
let attachmentService: AttachmentService | null = null;

export function notesSvc(): NotesService {
  if (!notesService) {
    notesService = new NotesService(new SqliteNotesRepository(getDatabase()));
  }
  return notesService;
}

export function notesRepo(): INotesRepository {
  return new SqliteNotesRepository(getDatabase());
}

export function attachmentSvc(): AttachmentService {
  if (!attachmentService) {
    attachmentService = new AttachmentService(getDatabase());
  }
  return attachmentService;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type ViewKind = 'table' | 'board' | 'list';

interface NotesState {
  // Tree
  pages: Page[];
  favorites: Page[];
  recent: Page[];
  trash: Page[];
  expandedIds: Record<string, boolean>;
  loading: boolean;

  // Current
  currentPage: Page | null;
  currentBlocks: Block[];
  currentDatabase: Db | null;
  currentRows: DbRow[];
  currentViews: DbView[];
  currentView: DbView | null;
  saveStatus: SaveStatus;

  // UI
  searchOpen: boolean;
  switcherOpen: boolean;
  searchResults: SearchResult[];

  // Actions: tree
  refreshTree: () => Promise<void>;
  refreshRecent: () => Promise<void>;
  refreshTrash: () => Promise<void>;
  toggleExpanded: (id: string) => void;
  expandTo: (id: string) => Promise<void>;

  // Pages
  createPage: (parentId: string | null, type: PageType) => Promise<Page>;
  openPage: (id: string | null) => Promise<void>;
  renamePage: (id: string, title: string) => Promise<void>;
  setIcon: (id: string, icon: string | null) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  restorePage: (id: string) => Promise<void>;
  permanentlyDelete: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  movePage: (id: string, parentId: string | null, sortOrder: number) => Promise<void>;

  // Blocks
  saveBlocks: (pageId: string, blocks: Block[]) => Promise<void>;
  loadBlocks: (pageId: string) => Promise<void>;

  // Database
  createDatabase: (title: string) => Promise<Page>;
  loadDatabase: (pageId: string) => Promise<void>;
  addRow: (values?: Record<string, unknown>) => Promise<void>;
  updateRow: (id: string, values: Record<string, unknown>) => Promise<void>;
  removeRow: (id: string) => Promise<void>;
  selectView: (viewId: string) => Promise<void>;
  setViewType: (viewId: string, viewType: ViewKind) => Promise<void>;

  // Search
  setSearchOpen: (open: boolean) => void;
  setSwitcherOpen: (open: boolean) => void;
  runSearch: (q: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  pages: [],
  favorites: [],
  recent: [],
  trash: [],
  expandedIds: {},
  loading: false,

  currentPage: null,
  currentBlocks: [],
  currentDatabase: null,
  currentRows: [],
  currentViews: [],
  currentView: null,
  saveStatus: 'idle',

  searchOpen: false,
  switcherOpen: false,
  searchResults: [],

  refreshTree: async () => {
    set({ loading: true });
    try {
      const [pages, favorites, recent] = await Promise.all([
        notesSvc().listPages({}),
        notesSvc().listPages({ favoritesOnly: true }),
        notesSvc().listRecent(10),
      ]);
      set({ pages, favorites, recent });
    } finally {
      set({ loading: false });
    }
  },

  refreshRecent: async () => {
    const recent = await notesSvc().listRecent(10);
    set({ recent });
  },

  refreshTrash: async () => {
    const trash = await notesSvc().listTrash();
    set({ trash });
  },

  toggleExpanded: (id) => {
    set((s) => ({ expandedIds: { ...s.expandedIds, [id]: !s.expandedIds[id] } }));
  },

  expandTo: async (id) => {
    const all = await notesSvc().listPages({});
    const parentOf = new Map<string, string | null>();
    for (const p of all) parentOf.set(p.id, p.parentId);
    const path: string[] = [];
    let cur: string | null | undefined = id;
    while (cur) {
      path.push(cur);
      cur = parentOf.get(cur) ?? null;
    }
    set((s) => {
      const next = { ...s.expandedIds };
      for (const pid of path) next[pid] = true;
      return { expandedIds: next };
    });
  },

  createPage: async (parentId, type) => {
    const page = await notesSvc().createPage({
      parentId: parentId ?? null,
      title: type === 'database' ? 'Database baru' : 'Tanpa judul',
      type,
    });
    if (type === 'database') {
      await notesSvc().createDatabase(page.title);
    }
    await get().refreshTree();
    if (parentId) {
      set((s) => ({ expandedIds: { ...s.expandedIds, [parentId]: true } }));
    }
    return page;
  },

  openPage: async (id) => {
    if (!id) {
      set({
        currentPage: null,
        currentBlocks: [],
        currentDatabase: null,
        currentRows: [],
        currentViews: [],
        currentView: null,
      });
      return;
    }
    const page = await notesSvc().getPage(id);
    if (!page) {
      set({ currentPage: null });
      return;
    }
    await get().expandTo(id);
    await notesSvc().trackOpen(id);
    const blocks = await notesSvc().listBlocks(id);
    set({
      currentPage: page,
      currentBlocks: blocks,
      currentDatabase: null,
      currentRows: [],
      currentViews: [],
      currentView: null,
    });
    if (page.type === 'database') {
      await get().loadDatabase(id);
    }
    await get().refreshRecent();
  },

  renamePage: async (id, title) => {
    await notesSvc().updatePage(id, { title: title.trim() || 'Tanpa judul' });
    await get().refreshTree();
    if (get().currentPage?.id === id) {
      set((s) => ({ currentPage: s.currentPage ? { ...s.currentPage, title } : null }));
    }
  },

  setIcon: async (id, icon) => {
    await notesSvc().updatePage(id, { icon });
    await get().refreshTree();
    if (get().currentPage?.id === id) {
      set((s) => ({ currentPage: s.currentPage ? { ...s.currentPage, icon } : null }));
    }
  },

  toggleFavorite: async (id) => {
    await notesSvc().toggleFavorite(id);
    await get().refreshTree();
  },

  deletePage: async (id) => {
    await notesSvc().deletePage(id);
    await get().refreshTree();
    if (get().currentPage?.id === id) {
      set({ currentPage: null, currentBlocks: [] });
    }
  },

  restorePage: async (id) => {
    await notesSvc().restorePage(id);
    await get().refreshTree();
    await get().refreshTrash();
  },

  permanentlyDelete: async (id) => {
    await notesRepo().purgePage(id);
    await get().refreshTrash();
    await get().refreshTree();
  },

  emptyTrash: async () => {
    await notesSvc().emptyTrash();
    await get().refreshTrash();
  },

  movePage: async (id, parentId, sortOrder) => {
    await notesSvc().movePage(id, parentId, sortOrder);
    await get().refreshTree();
  },

  saveBlocks: async (pageId, blocks) => {
    set({ saveStatus: 'saving' });
    try {
      await notesSvc().savePageContent(pageId, blocks);
      set({ saveStatus: 'saved' });
      setTimeout(() => {
        if (get().saveStatus === 'saved') set({ saveStatus: 'idle' });
      }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  loadBlocks: async (pageId) => {
    const blocks = await notesSvc().listBlocks(pageId);
    set({ currentBlocks: blocks });
  },

  createDatabase: async (title) => {
    const page = await notesSvc().createDatabase(title);
    await get().refreshTree();
    return page;
  },

  loadDatabase: async (pageId) => {
    const [db, rows, views] = await Promise.all([
      notesSvc().getDatabase(pageId),
      notesSvc().listRows(pageId),
      notesSvc().listViews(pageId),
    ]);
    set({
      currentDatabase: db,
      currentRows: rows,
      currentViews: views,
      currentView: views[0] ?? null,
    });
  },

  addRow: async (values = {}) => {
    const db = get().currentDatabase;
    if (!db) return;
    const { row } = await notesSvc().createRow(db.id, values as Record<string, never>);
    const rows = await notesSvc().listRows(db.id);
    set({ currentRows: rows });
    if (get().currentPage?.id !== row.pageId) {
      await get().openPage(row.pageId);
    }
  },

  updateRow: async (id, values) => {
    await notesSvc().updateRow(id, values as Record<string, never>);
    const db = get().currentDatabase;
    if (db) {
      const rows = await notesSvc().listRows(db.id);
      set({ currentRows: rows });
    }
  },

  removeRow: async (id) => {
    await notesSvc().deleteRow(id);
    const db = get().currentDatabase;
    if (db) {
      const rows = await notesSvc().listRows(db.id);
      set({ currentRows: rows });
    }
  },

  selectView: async (viewId) => {
    const v = await notesSvc().getView(viewId);
    set({ currentView: v });
  },

  setViewType: async (viewId, viewType) => {
    const updated = await notesSvc().updateView(viewId, { viewType });
    if (get().currentView?.id === viewId) set({ currentView: updated });
  },

  setSearchOpen: (open) => set({ searchOpen: open }),
  setSwitcherOpen: (open) => set({ switcherOpen: open }),

  runSearch: async (q) => {
    if (!q.trim()) {
      set({ searchResults: [] });
      return;
    }
    const results = await notesSvc().search(q, 30);
    set({ searchResults: results });
  },
}));
