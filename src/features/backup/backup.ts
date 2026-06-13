import { getRepositories } from '@/data';
import { getDatabase } from '@/data/db/database';

// Ekspor & impor data untuk pemulihan (R7.3, R7.4).

interface ExportBundle {
  version: number;
  exportedAt: string;
  accounts: unknown[];
  categories: unknown[];
  transactions: unknown[];
  transactionItems: unknown[];
  budgets: unknown[];
}

async function dumpTable(table: string): Promise<unknown[]> {
  const res = await getDatabase().query(`SELECT * FROM ${table};`);
  return res.values;
}

export async function exportToJson(): Promise<string> {
  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: await dumpTable('accounts'),
    categories: await dumpTable('categories'),
    transactions: await dumpTable('transactions'),
    transactionItems: await dumpTable('transaction_items'),
    budgets: await dumpTable('budgets'),
  };
  return JSON.stringify(bundle, null, 2);
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(','));
  }
  return lines.join('\n');
}

export async function exportTransactionsCsv(): Promise<string> {
  const rows = (await dumpTable('transactions')) as Record<string, unknown>[];
  return toCsv(rows);
}

/** Impor dari bundle JSON. Mengganti seluruh data (restore). */
export async function importFromJson(json: string): Promise<void> {
  const bundle = JSON.parse(json) as ExportBundle;
  if (!bundle || typeof bundle !== 'object' || !Array.isArray(bundle.accounts)) {
    throw new Error('Berkas tidak valid.');
  }
  const db = getDatabase();
  await db.transaction(async (tx) => {
    // Kosongkan dulu (urutan menghormati FK).
    await tx.run('DELETE FROM transaction_items;');
    await tx.run('DELETE FROM transactions;');
    await tx.run('DELETE FROM budgets;');
    await tx.run('DELETE FROM accounts;');
    await tx.run('DELETE FROM categories;');

    const insertRows = async (table: string, rows: unknown[]) => {
      for (const row of rows as Record<string, unknown>[]) {
        const cols = Object.keys(row);
        const placeholders = cols.map(() => '?').join(', ');
        await tx.run(
          `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders});`,
          cols.map((c) => row[c])
        );
      }
    };

    await insertRows('categories', bundle.categories ?? []);
    await insertRows('accounts', bundle.accounts ?? []);
    await insertRows('transactions', bundle.transactions ?? []);
    await insertRows('transaction_items', bundle.transactionItems ?? []);
    await insertRows('budgets', bundle.budgets ?? []);
  });
  void getRepositories();
}

/** Hapus seluruh data (reset) dengan tetap mempertahankan skema (R7.5). */
export async function resetAllData(): Promise<void> {
  const db = getDatabase();
  await db.transaction(async (tx) => {
    await tx.run('DELETE FROM transaction_items;');
    await tx.run('DELETE FROM transactions;');
    await tx.run('DELETE FROM budgets;');
    await tx.run('DELETE FROM accounts;');
    await tx.run('DELETE FROM categories;');
  });
}
