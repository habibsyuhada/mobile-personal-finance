import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';

const DB_NAME = 'moraven';

export interface QueryResult {
  values: Record<string, unknown>[];
}

/**
 * Lapisan abstraksi database. UI/Repository hanya bicara lewat interface ini,
 * tidak langsung ke plugin SQLite. Ini menjaga portabilitas (NFR6).
 */
export interface Database {
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
  run(sql: string, params?: unknown[]): Promise<void>;
  /** Jalankan beberapa statement dalam satu transaksi atomik (NFR2). */
  transaction(work: (tx: Database) => Promise<void>): Promise<void>;
}

class CapacitorDatabase implements Database {
  private inTransaction = false;

  constructor(private db: SQLiteDBConnection) {}

  async query(sql: string, params: unknown[] = []): Promise<QueryResult> {
    const res = await this.db.query(sql, params as never[]);
    return { values: (res.values ?? []) as Record<string, unknown>[] };
  }

  async run(sql: string, params: unknown[] = []): Promise<void> {
    // Param ketiga `transaction`: bila true (default) plugin auto-commit tiap
    // statement. Saat di dalam transaksi manual, matikan agar tidak menutup
    // transaksi yang sedang aktif.
    await this.db.run(sql, params as never[], !this.inTransaction);
  }

  async transaction(work: (tx: Database) => Promise<void>): Promise<void> {
    await this.db.beginTransaction();
    this.inTransaction = true;
    try {
      await work(this);
      await this.db.commitTransaction();
    } catch (e) {
      try {
        await this.db.rollbackTransaction();
      } catch {
        /* abaikan error rollback */
      }
      throw e;
    } finally {
      this.inTransaction = false;
    }
  }
}

let sqliteConnection: SQLiteConnection | null = null;
let dbConnection: SQLiteDBConnection | null = null;
let database: Database | null = null;
let initPromise: Promise<Database> | null = null;

async function setupWebStore(sqlite: SQLiteConnection): Promise<void> {
  // Di web, elemen jeep-sqlite sudah didaftarkan & siap di main.tsx.
  // Di sini cukup inisialisasi web store (IndexedDB).
  if (Capacitor.getPlatform() === 'web') {
    await sqlite.initWebStore();
  }
}

async function ensureMetaTable(db: Database): Promise<void> {
  await db.run(
    `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`
  );
}

export async function initDatabase(): Promise<Database> {
  if (database) return database;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    sqliteConnection = new SQLiteConnection(CapacitorSQLite);
    await setupWebStore(sqliteConnection);

    const retained = (await sqliteConnection.isConnection(DB_NAME, false)).result;
    if (retained) {
      dbConnection = await sqliteConnection.retrieveConnection(DB_NAME, false);
    } else {
      dbConnection = await sqliteConnection.createConnection(
        DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );
    }

    await dbConnection.open();
    await dbConnection.execute('PRAGMA foreign_keys = ON;');

    database = new CapacitorDatabase(dbConnection);
    await ensureMetaTable(database);

    if (Capacitor.getPlatform() === 'web') {
      await sqliteConnection.saveToStore(DB_NAME);
    }
    return database;
  })();

  return initPromise;
}

export function getDatabase(): Database {
  if (!database) {
    throw new Error('Database belum diinisialisasi. Panggil initDatabase() dulu.');
  }
  return database;
}

/** Persist ke IndexedDB di web setelah operasi tulis. No-op di native. */
export async function persistWeb(): Promise<void> {
  if (Capacitor.getPlatform() === 'web' && sqliteConnection) {
    await sqliteConnection.saveToStore(DB_NAME);
  }
}
