import type { ModuleMigration } from '@/platform/types';

// Migrasi modul Notes (Notion-style). Prefix tabel `notes_`.
// Lihat docs/specs/notes/design.md §3.
//
// Catatan implementasi:
// - Pakai JSON TEXT untuk content (portabel, bukan BLOB SQLite) — NFR4.
// - FTS5 mungkin tidak tersedia di sql.js (web). Deteksi di runtime dan
//   fallback ke LIKE — lihat design §3.2.
// - Migrasi v1 membuat tabel utama. Database (Fase 3) ditambahkan di v2.

export const NOTES_MIGRATIONS: ModuleMigration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS notes_pages (
        id TEXT PRIMARY KEY,
        parent_id TEXT REFERENCES notes_pages(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'Tanpa judul',
        icon TEXT,
        cover_path TEXT,
        type TEXT NOT NULL DEFAULT 'page',
        is_favorite INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        opened_at TEXT
      );`,
      `CREATE INDEX IF NOT EXISTS idx_notes_pages_parent
        ON notes_pages(parent_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_pages_favorite
        ON notes_pages(is_favorite);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_pages_deleted
        ON notes_pages(is_deleted);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_pages_opened
        ON notes_pages(opened_at DESC);`,

      `CREATE TABLE IF NOT EXISTS notes_blocks (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL REFERENCES notes_pages(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'paragraph',
        content TEXT NOT NULL DEFAULT '[]',
        meta TEXT,
        src TEXT,
        checked INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_notes_blocks_page
        ON notes_blocks(page_id, sort_order);`,

      `CREATE TABLE IF NOT EXISTS notes_attachments (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL REFERENCES notes_pages(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_notes_attachments_page
        ON notes_attachments(page_id);`,
    ],
  },
  {
    // Fase 3 — Notion-style database (table/board/list views).
    version: 2,
    statements: [
      `CREATE TABLE IF NOT EXISTS notes_databases (
        id TEXT PRIMARY KEY,
        properties_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (id) REFERENCES notes_pages(id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS notes_db_rows (
        id TEXT PRIMARY KEY,
        database_id TEXT NOT NULL REFERENCES notes_databases(id) ON DELETE CASCADE,
        page_id TEXT NOT NULL,
        properties TEXT NOT NULL DEFAULT '{}',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (page_id) REFERENCES notes_pages(id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_notes_db_rows_db
        ON notes_db_rows(database_id, sort_order);`,
      `CREATE TABLE IF NOT EXISTS notes_db_views (
        id TEXT PRIMARY KEY,
        database_id TEXT NOT NULL REFERENCES notes_databases(id) ON DELETE CASCADE,
        name TEXT NOT NULL DEFAULT 'Default',
        view_type TEXT NOT NULL DEFAULT 'table',
        config_json TEXT NOT NULL DEFAULT '{}',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_notes_db_views_db
        ON notes_db_views(database_id);`,
    ],
  },
];
