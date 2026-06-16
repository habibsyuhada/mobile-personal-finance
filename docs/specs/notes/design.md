# Design — Modul Notes (Notion-style)

Status: Draft v1
Tanggal: 2026-06-16
Mengacu pada: `requirements.md`, `../platform/`, `../todo/design.md`
(pola module mengikuti Todo & Habit)

## 1. Posisi dalam Platform

Modul `notes` didaftarkan di registry platform sebagai modul keempat. Mengikuti
pola Todo/Habit: descriptor + folder + i18n + descriptor di `registry.ts`.

```ts
// src/modules/notes/module.ts
export const notesModule: ModuleDescriptor = {
  id: 'notes',
  nameKey: 'module.notes.name',
  icon: documentTextOutline,        // ionicons
  color: '#10b981',                  // emerald (berbeda dari finance/todo/habit)
  order: 4,                          // tampil setelah habit di launcher
  enabled: true,
  routePath: '/m/notes',
  component: () => import('./NotesRoot'),
  migrations: NOTES_MIGRATIONS,
  init: seedNotesDefaults,           // buat "Personal Notebook" default
  tables: [
    'notes_pages',
    'notes_blocks',
    'notes_databases',
    'notes_db_rows',
    'notes_db_views',
    'notes_attachments',
  ],
};
```

## 2. Struktur Folder

```
src/modules/notes/
├─ module.ts                    # descriptor + migrations + init
├─ NotesRoot.tsx                # routing internal modul (2 view: tree + page)
├─ notes.tabs.ts                # ModuleTab[] (kalau pakai tab bottom; opsional)
├─ pages/
│  ├─ NotesPage.tsx             # layout utama: SidebarTree + EditorArea
│  ├─ TrashPage.tsx             # daftar page di Trash + restore/empty
│  └─ DatabasePage.tsx          # view database (table/board/list)
├─ components/
│  ├─ SidebarTree.tsx           # tree Favorites/Private/Recent/Trash
│  ├─ PageHeader.tsx            # title (inline edit) + icon + actions
│  ├─ EditorArea.tsx            # wrapper TipTap editor
│  ├─ BlockMenu.tsx             # slash command popover
│  ├─ DatabaseTableView.tsx
│  ├─ DatabaseBoardView.tsx
│  ├─ DatabaseListView.tsx
│  ├─ PropertyEditor.tsx        # panel property database
│  ├─ ImageBlock.tsx            # render + upload + zoom
│  ├─ GlobalSearch.tsx          # Cmd+K modal
│  ├─ QuickSwitcher.tsx         # Cmd+P modal
│  └─ EmptyStateNotes.tsx
├─ editor/
│  ├─ tiptap.ts                 # konfigurasi extensions
│  ├─ extensions/
│  │  ├─ SlashCommand.ts        # custom TipTap extension
│  │  ├─ ImageUpload.ts         # custom node + paste handler
│  │  ├─ Callout.ts             # custom node
│  │  └─ PageLink.ts            # node untuk [[page:id]] backlink
│  ├─ slashCommands.ts          # daftar command (/heading, /list, ...)
│  └─ serializers.ts            # export JSON <-> Markdown
├─ data/
│  ├─ models.ts                 # tipe domain (Page, Block, Database, Row, ...)
│  ├─ migrations.ts             # NOTES_MIGRATIONS
│  ├─ notes.repo.ts             # SqliteNotesRepository
│  └─ search.repo.ts            # FTS5 virtual table
├─ services/
│  ├─ notes.service.ts          # business logic (create, save, restore)
│  └─ attachment.service.ts     # handle file upload (Capacitor Filesystem)
├─ store/
│  └─ notes.store.ts            # Zustand: tree, current page, ui state
├─ i18n/
│  ├─ en.ts                     # notes.* keys
│  └─ id.ts
└─ lib/
   ├─ search.ts                 # FTS query builder
   └─ markdown.ts               # JSON <-> MD converter
```

## 3. Model Data (DDL, prefix `notes_`)

### 3.1 Tabel utama

```sql
-- Halaman (page) + page tree
CREATE TABLE notes_pages (
  id            TEXT PRIMARY KEY,
  parent_id     TEXT REFERENCES notes_pages(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT 'Tanpa judul',
  icon          TEXT,                       -- emoji atau ionicon name
  cover_path    TEXT,                       -- path ke file cover image
  type          TEXT NOT NULL DEFAULT 'page', -- 'page' | 'database'
  is_favorite   INTEGER NOT NULL DEFAULT 0,
  is_deleted    INTEGER NOT NULL DEFAULT 0, -- soft delete (Trash)
  deleted_at    TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  opened_at     TEXT                        -- untuk Recent
);
CREATE INDEX idx_notes_pages_parent ON notes_pages(parent_id);
CREATE INDEX idx_notes_pages_favorite ON notes_pages(is_favorite);
CREATE INDEX idx_notes_pages_deleted ON notes_pages(is_deleted);
CREATE INDEX idx_notes_pages_opened ON notes_pages(opened_at DESC);

-- Block (untuk page type='page')
CREATE TABLE notes_blocks (
  id          TEXT PRIMARY KEY,
  page_id     TEXT NOT NULL REFERENCES notes_pages(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,                -- JSON (TipTap doc fragment)
  text        TEXT NOT NULL DEFAULT '',     -- ringkasan teks polos (untuk FTS)
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX idx_notes_blocks_page ON notes_blocks(page_id, sort_order);

-- Lampiran
CREATE TABLE notes_attachments (
  id          TEXT PRIMARY KEY,
  page_id     TEXT NOT NULL REFERENCES notes_pages(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  file_path   TEXT NOT NULL,                -- path di app sandbox
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_notes_attachments_page ON notes_attachments(page_id);

-- Database definition (hanya untuk page type='database')
CREATE TABLE notes_databases (
  id              TEXT PRIMARY KEY,         -- = page id
  properties_json TEXT NOT NULL,            -- JSON: array of PropertyDef
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  FOREIGN KEY (id) REFERENCES notes_pages(id) ON DELETE CASCADE
);

-- Rows (untuk database page)
CREATE TABLE notes_db_rows (
  id          TEXT PRIMARY KEY,
  database_id TEXT NOT NULL REFERENCES notes_databases(id) ON DELETE CASCADE,
  page_id     TEXT NOT NULL,                -- row = page juga
  properties  TEXT NOT NULL DEFAULT '{}',   -- JSON: { propName: value }
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  FOREIGN KEY (page_id) REFERENCES notes_pages(id) ON DELETE CASCADE
);
CREATE INDEX idx_notes_db_rows_db ON notes_db_rows(database_id, sort_order);

-- Views per database
CREATE TABLE notes_db_views (
  id            TEXT PRIMARY KEY,
  database_id   TEXT NOT NULL REFERENCES notes_databases(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Default',
  view_type     TEXT NOT NULL DEFAULT 'table', -- 'table' | 'board' | 'list'
  config_json   TEXT NOT NULL DEFAULT '{}',    -- filter/sort/groupBy
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
CREATE INDEX idx_notes_db_views_db ON notes_db_views(database_id);
```

### 3.2 Full-text search (FTS5)

```sql
-- Virtual table untuk pencarian (otomatis ter-update via trigger)
CREATE VIRTUAL TABLE notes_fts USING fts5(
  page_id UNINDEXED,
  title,
  text,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Trigger: saat page di-update, rebuild entry FTS
CREATE TRIGGER notes_pages_ai AFTER INSERT ON notes_pages BEGIN
  INSERT INTO notes_fts(page_id, title, text)
  VALUES (NEW.id, NEW.title, '');
END;
CREATE TRIGGER notes_pages_au AFTER UPDATE ON notes_pages BEGIN
  UPDATE notes_fts SET title = NEW.title WHERE page_id = NEW.id;
END;
CREATE TRIGGER notes_blocks_au AFTER UPDATE ON notes_blocks BEGIN
  DELETE FROM notes_fts WHERE page_id = NEW.page_id;
  INSERT INTO notes_fts(page_id, title, text)
  SELECT NEW.page_id, p.title, GROUP_CONCAT(b.text, ' ')
  FROM notes_pages p, notes_blocks b
  WHERE p.id = NEW.page_id AND b.page_id = p.id;
END;
```

(Catatan: trigger di atas disederhanakan — pada SQLite-WASM (web) FTS5 mungkin
tidak tersedia; fallback ke `LIKE %query%` di repo dengan limit 100 hasil.)

## 4. Tipe Domain (TS)

```ts
export type PageType = 'page' | 'database';

export interface Page {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;          // emoji unicode
  coverPath: string | null;
  type: PageType;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  openedAt: string | null;
}

export interface Block {
  id: string;
  pageId: string;
  content: TipTapDoc;            // JSON
  text: string;                 // plain text (untuk FTS)
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType =
  | 'text' | 'number' | 'select' | 'multi_select'
  | 'date' | 'checkbox' | 'url' | 'email' | 'phone';

export interface PropertyDef {
  id: string;
  name: string;
  type: PropertyType;
  options?: { id: string; name: string; color: string }[]; // for select
}

export interface Database {
  id: string;                   // = page id
  properties: PropertyDef[];
  createdAt: string;
  updatedAt: string;
}

export interface DbRow {
  id: string;
  databaseId: string;
  pageId: string;               // row opens as page
  properties: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type ViewType = 'table' | 'board' | 'list';
export interface DbView {
  id: string;
  databaseId: string;
  name: string;
  viewType: ViewType;
  config: {
    filters?: { propId: string; op: string; value: unknown }[];
    sorts?: { propId: string; dir: 'asc' | 'desc' }[];
    groupBy?: string;            // propertyId (board view)
  };
  sortOrder: number;
}

export interface Attachment {
  id: string;
  pageId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  createdAt: string;
}
```

## 5. Repository & Service

### 5.1 `INotesRepository`

- Page CRUD: `listPages({parentId, includeDeleted, favoritesOnly, search})`,
  `getPage(id)`, `createPage(input)`, `updatePage(id, patch)`,
  `movePage(id, {parentId, sortOrder})`, `softDeletePage(id)`,
  `restorePage(id)`, `purgeOldDeleted(daysOld)`.
- Block ops: `listBlocks(pageId)`, `saveBlocks(pageId, blocks[])` (replace
  semua), `getBlockText(pageId)`.
- Database ops: `getDatabase(id)`, `listRows(dbId)`, `createRow(dbId, values)`,
  `updateRow(id, values)`, `deleteRow(id)`, `listViews(dbId)`, `createView(...)`,
  `updateView(...)`.
- Search: `search(query, limit)` — panggil FTS5 atau LIKE fallback.
- Attachment: `createAttachment(att)`, `getAttachment(id)`, `listAttachments(pageId)`,
  `deleteAttachment(id)`.

### 5.2 `SqliteNotesRepository`

Implementasi konkret — pola sama dengan `SqliteTodoRepository` & finance repos.
Gunakan `Database` interface (bukan plugin langsung) untuk portabilitas.

### 5.3 `NotesService`

- `createPage({parentId, title, type})` → generate id, set timestamps, persist.
- `savePageContent(pageId, tiptapDoc)` → serialize ke blocks table, update
  `text` column, trigger FTS rebuild.
- `movePage(id, target)` → update `parent_id` + `sort_order`, rekursif update
  `updated_at` ancestor.
- `softDeletePage(id)` → set `is_deleted = 1`, `deleted_at = now`. Jika page
  punya children, soft-delete semua (cascade logic di service, bukan DB).
- `restorePage(id)` → unset is_deleted; jika parent masih deleted, pindah ke root.
- `emptyTrash()` → hard delete semua page dengan `is_deleted = 1`.
- `trackOpen(pageId)` → set `opened_at = now` (untuk Recent).
- `toggleFavorite(id)` → flip `is_favorite`.
- `exportPageMarkdown(id)` → ambil blocks, konversi ke MD string, tambahkan
  frontmatter.

### 5.4 `AttachmentService`

- `uploadImage(file: File | Blob, pageId)` → generate uuid, simpan ke
  `Filesystem` di `${appDocDir}/notes/attachments/${uuid}.${ext}`, insert row
  `notes_attachments`, return file URL/path untuk di-embed.
- `deleteAttachment(id)` → hapus file + row.
- Di web: `uploadImage` fallback ke object URL (tidak persist) + simpan Blob
  di IndexedDB (opsional, stretch).

## 6. State (Zustand)

```ts
interface NotesStore {
  // Tree
  tree: PageNode[];             // nested tree
  expanded: Set<string>;        // expanded node ids
  favorites: Page[];
  recent: Page[];               // max 10
  trash: Page[];                // 30 days

  // Current
  currentPage: Page | null;
  currentBlocks: Block[];       // di-hydrate on page open
  currentDatabase: Database | null;
  currentRows: DbRow[];

  // UI
  searchOpen: boolean;
  switcherOpen: boolean;
  selectedViewId: string | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Actions
  loadTree(): Promise<void>;
  openPage(id: string): Promise<void>;
  savePageContent(blocks: Block[]): Promise<void>;
  createPage(parentId: string | null, type: 'page' | 'database'): Promise<Page>;
  deletePage(id: string): Promise<void>;
  restorePage(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  search(query: string): Promise<Page[]>;
  setSearchOpen(open: boolean): void;
  setSwitcherOpen(open: boolean): void;
}
```

## 7. UI / Navigasi

### 7.1 Layout utama `NotesPage`

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: app name | search icon | "+ Page" | menu            │
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar  │ Main area                                          │
│          │                                                    │
│ 🔍 Search│  ┌─ Page Header ──────────────────────────────┐   │
│          │  │ 📄 Icon [edit] Title [inline edit]         │   │
│ Favorites│  │    [Star] [Share v2] [More]                │   │
│ • Page A │  └────────────────────────────────────────────┘   │
│ • Page B │                                                    │
│          │  ┌─ Editor / Database view ────────────────────┐   │
│ Private  │  │  [TipTap editor area, virtualized]         │   │
│ ▼ Work   │  │  atau [Table view / Board view]            │   │
│   • Doc1 │  │                                              │   │
│   • Doc2 │  └────────────────────────────────────────────┘   │
│ ▼ Study  │                                                    │
│   ...    │  (save status: "Saved 2s ago" pojok kanan-bawah)  │
│          │                                                    │
│ Recent   │                                                    │
│ • Page C │                                                    │
│ • Page D │                                                    │
│          │                                                    │
│ Trash    │                                                    │
└──────────┴──────────────────────────────────────────────────┘
```

- **Mobile (default)**: Sidebar sebagai drawer (geser dari kiri) untuk
  hemat layar. Tombol hamburger di top bar membuka drawer.
- **Tablet/desktop** (`min-width: 900px`): Sidebar selalu tampil (split view).
- Gunakan `IonSplitPane` dari Ionic untuk perilaku responsive.

### 7.2 Sidebar tree

- Section collapsible: Favorites, Private (tree), Trash.
- Recent: list flat max 10.
- Tree node: icon (page icon) + title (truncate) + chevron expand/collapse.
- Tap node → buka page di main area. Long-press / right-click → context menu
  (rename, duplicate, delete, move).
- Drag handle di sebelah kanan node untuk reorder (desktop) atau swipe
  gesture (mobile).

### 7.3 Editor area

- `PageHeader` atas: icon + title (inline editable on click) + favorite star +
  more menu (duplicate, move to trash, export MD, copy link internal).
- Di bawah header: `EditorArea` dengan TipTap.
- Save status di kanan-bawah: "Menyimpan…" / "Tersimpan 2 detik lalu".
- Slash command: trigger pada `/` di awal paragraph. Popover dengan list
  blok (heading, list, todo, code, quote, callout, image, divider).
- Block image: tap → upload via attachment service; render dengan
  `IonImg` + tap to zoom modal.
- Keyboard: `Cmd/Ctrl+S` → save manual; `Cmd/Ctrl+K` → search; `Cmd/Ctrl+P`
  → quick switcher.

### 7.4 Database page

- Header: database title + "+" add row.
- View tabs di atas content area (All view disimpan di `notes_db_views`,
  default view = table).
- **Table view**: kolom = properties + title; baris = rows; inline edit cell
  (klik cell → input/switch sesuai type).
- **Board view**: kolom = `groupBy` (select option); card per row, drag ke
  kolom lain untuk ubah value.
- **List view**: ringkasan per row, click → buka page row.
- "+ Add property" di header → modal pilih type + name.

### 7.5 Trash page

- Daftar page yang di-delete dengan tanggal delete.
- Aksi per row: Restore, Delete Permanently.
- Tombol "Empty Trash" di header.

## 8. Editor (TipTap) — Detail Teknis

### 8.1 Extensions dipakai

Wajib:
- `StarterKit` (paragraph, heading, list, code, blockquote, hr, hardBreak,
  history, bold, italic, strike, code-mark, link).
- `Placeholder` (untuk show "Tulis '/ ' untuk perintah" di blok kosong).
- `Image` (core TipTap).
- `TaskList` + `TaskItem` (todo list internal).
- `Typography` (smart quotes, ellipsis).

Custom:
- `SlashCommand` (extension keymap `Mod-/`, plugin yang detect `/` di awal
  paragraph dan trigger popover).
- `Callout` (node baru: `<div data-type="callout" data-emoji="💡">`).
- `ImageUpload` (custom node yang trigger file picker on click, pakai
  AttachmentService).
- `PageLink` (mark untuk `[[page:id]]` — render sebagai chip dengan judul
  resolved, click → navigate ke page tsb).

### 8.2 Slash command

- Trigger: ketik `/` di awal baris (atau setelah whitespace).
- Popover: list of `{title, description, icon, command}`.
- Pilihan: Heading 1/2/3, Bullet List, Numbered List, Todo List, Quote,
  Code Block, Divider, Image, Callout, Toggle (v2).
- Keyboard navigation: arrow up/down, enter to select, esc to dismiss.

### 8.3 Serialization

- `JSON.stringify(editor.getJSON())` → simpan ke `notes_blocks.content`.
- Generate `text` polos dengan traversal node + text content untuk FTS.
- Export ke MD: traversal TipTap doc, konversi setiap node ke Markdown
  (`<h1>` → `#`, `<ul>` → `-`, dsb). Tangani custom node (callout → blockquote
  dengan emoji prefix, image → `![alt](path)`).

## 9. Search

- **Cmd/Ctrl+K** → buka `GlobalSearch` modal (full screen di mobile,
  centered modal di desktop).
- Query input → debounce 200ms → call `repo.search(query)`.
- Hasil: list page dengan snippet match highlighted. Group by page.
- Tap hasil → tutup modal, navigate ke page, scroll to first match.
- Recent searches disimpan di localStorage (max 5).

## 10. Storage Lampiran

- Direktori: `Filesystem.getUri({path: 'notes/attachments'})` di app
  `Documents` directory.
- File naming: `${uuid}.${ext}`.
- Saat page dihapus (Trash → empty), file juga dihapus.
- Quota: 50MB default; warning saat >80% terpakai.

## 11. i18n

Namespace `notes.*` di EN & ID, ditambah `module.notes.name`. Contoh key:

```
notes.title                   = "Notes" | "Catatan"
notes.search.placeholder      = "Search pages..." | "Cari halaman..."
notes.page.new                = "New page" | "Halaman baru"
notes.page.newDatabase        = "New database" | "Database baru"
notes.page.untitled           = "Untitled" | "Tanpa judul"
notes.page.favorite           = "Favorite" | "Favorit"
notes.page.delete             = "Move to Trash" | "Pindahkan ke Sampah"
notes.page.restore            = "Restore" | "Pulihkan"
notes.editor.slashPlaceholder = "Type '/' for commands" | "Ketik '/' untuk perintah"
notes.editor.saved            = "Saved" | "Tersimpan"
notes.editor.saving           = "Saving..." | "Menyimpan..."
notes.view.table              = "Table" | "Tabel"
notes.view.board              = "Board" | "Papan"
notes.view.list               = "List" | "Daftar"
notes.search.empty            = "No results" | "Tidak ada hasil"
notes.trash.empty             = "Empty Trash" | "Kosongkan Sampah"
notes.trash.confirmEmpty      = "Permanently delete all pages in Trash?"
                                | "Hapus permanen semua halaman di Sampah?"
```

## 12. Ekspor/Impor

- **Single page → MD**: `NotesService.exportPageMarkdown(id)`. Pakai
  `lib/markdown.ts` untuk konversi.
- **Database → CSV**: header = property names, rows = values. File di-download
  via `Filesystem` atau browser download.
- **Bundle platform**: tabel `notes_*` dimasukkan ke JSON bundle oleh
  importer/exporter yang sudah ada (di-spec-kan di `../platform/design.md`
  §11). Notes module ikut serta dengan `tables` di descriptor.

## 13. Pengujian

Unit (Vitest):
- `NotesService`: create page, save content, move, soft delete, restore,
  cascade soft-delete children.
- `markdown.ts`: TipTap doc ↔ Markdown round-trip (heading, list, code,
  callout, image).
- `repo.search`: FTS5 query (di test env dengan sqlite fallback LIKE).
- `attachment.service`: upload + delete file lifecycle (pakai temp dir).

Integrasi:
- Buat page → tulis konten → reload → konten tetap.
- Buat database → tambah row → switch ke board view → row muncul di kolom
  group-by yang benar.
- Soft delete parent → semua child juga is_deleted = 1.
- Restore child yang parent-nya masih deleted → child pindah ke root.
- Cmd+K search → ketik query → hasil muncul.
- Ekspor page → buka file .md di text editor → format valid.

## 14. Catatan Implementasi

- **TipTap di Ionic**: gunakan plain DOM rendering di dalam `IonContent` —
  TipTap adalah ProseMirror di atas `contentEditable`, tidak butuh wrapper
  khusus. Pastikan `IonContent` tidak steal focus saat keyboard muncul.
- **FTS5 di web (sql.js)**: `@capacitor-community/sqlite` dengan sql.js di web
  mungkin tidak support FTS5. **Fallback**: implementasi `LIKE`-based search
  di repo dengan `LIMIT 100`. Tandai kemampuan FTS di feature flag
  `notes.fts.enabled` di settings (auto-detect via `PRAGMA`).
- **Performance tree**: tree di-render flat dengan depth indent (bukan
  recursive component) untuk hindari re-render bertubi-tubi. Pakai
  `react-window` atau implementasi virtualized sederhana.
- **Bundle size**: monitor dengan `vite build --mode analyze` setelah
  dependency ditambahkan. TipTap full ≈ 250KB gzipped — masuk batas NFR7.
- **Image di web preview**: paste-image dari clipboard jalan di Chrome/
  Edge/Firefox. Di iOS Safari web perlu user gesture — tap tombol upload
  sebagai fallback.
- **Recent limit**: query `ORDER BY opened_at DESC LIMIT 10` — halaman
  tanpa `opened_at` (baru dibuat, belum pernah dibuka) tidak masuk Recent.
