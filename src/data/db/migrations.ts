// Definisi migrasi skema database. Dijalankan berurutan berdasarkan versi.
// Tabel `meta` menyimpan schema_version agar update app tidak merusak data lama.

export interface Migration {
  version: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'IDR',
        initial_balance INTEGER NOT NULL DEFAULT 0,
        icon TEXT,
        color TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        parent_id TEXT REFERENCES categories(id),
        icon TEXT,
        color TEXT,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        image_path TEXT NOT NULL,
        merchant TEXT,
        raw_json TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        account_id TEXT NOT NULL REFERENCES accounts(id),
        to_account_id TEXT REFERENCES accounts(id),
        category_id TEXT REFERENCES categories(id),
        occurred_at TEXT NOT NULL,
        note TEXT,
        receipt_id TEXT REFERENCES receipts(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_tx_occurred ON transactions(occurred_at);`,
      `CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id);`,
      `CREATE TABLE IF NOT EXISTS transaction_items (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        qty REAL,
        unit_price INTEGER,
        line_total INTEGER
      );`,
      `CREATE INDEX IF NOT EXISTS idx_item_tx ON transaction_items(transaction_id);`,
      `CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES categories(id),
        period TEXT NOT NULL,
        amount_limit INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_budget_period ON budgets(period);`,
      `CREATE TABLE IF NOT EXISTS recurring_rules (
        id TEXT PRIMARY KEY,
        template_json TEXT NOT NULL,
        frequency TEXT NOT NULL,
        next_run_at TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      );`,
    ],
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
