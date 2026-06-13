import type { Database } from '@/data/db/database';
import { MODULES } from './registry';

// Runner migrasi per-modul. Tiap modul punya versi sendiri di tabel `meta`
// dengan key `schema_version.<moduleId>`. Migrasi dijalankan berurutan dan
// idempoten; tiap langkah dalam transaksi agar aman (platform P5.3).
export async function runModuleMigrations(db: Database): Promise<void> {
  await db.run(
    `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`
  );

  for (const mod of MODULES) {
    if (!mod.migrations || mod.migrations.length === 0) continue;
    const key = `schema_version.${mod.id}`;
    const res = await db.query(`SELECT value FROM meta WHERE key = ?;`, [key]);
    const current = res.values.length ? parseInt(String(res.values[0].value), 10) : 0;

    const pending = mod.migrations
      .filter((m) => m.version > current)
      .sort((a, b) => a.version - b.version);

    for (const migration of pending) {
      await db.transaction(async (tx) => {
        for (const stmt of migration.statements) {
          await tx.run(stmt);
        }
        await tx.run(
          `INSERT INTO meta (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
          [key, String(migration.version)]
        );
      });
    }
  }
}

// Jalankan hook init tiap modul (seed/jadwal) setelah migrasi. Kegagalan satu
// modul tidak menggagalkan modul lain (platform NFR3).
export async function runModuleInit(db: Database): Promise<void> {
  for (const mod of MODULES) {
    if (!mod.init) continue;
    try {
      await mod.init(db);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Module init failed for "${mod.id}":`, e);
    }
  }
}
