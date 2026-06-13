// Composition root: satu-satunya tempat implementasi repository dipilih.
// Untuk migrasi ke backend Postgres (fase 2), cukup ganti instansiasi di sini
// dengan ApiRepository tanpa menyentuh service/UI (NFR6).

import { getDatabase, initDatabase } from './db/database';
import { SqliteAccountRepository } from './repositories/account.repo';
import { SqliteCategoryRepository } from './repositories/category.repo';
import { SqliteTransactionRepository } from './repositories/transaction.repo';
import { SqliteBudgetRepository } from './repositories/budget.repo';
import { SqliteReceiptRepository } from './repositories/receipt.repo';
import { SqliteRecurringRepository } from './repositories/recurring.repo';
import type {
  IAccountRepository,
  IBudgetRepository,
  ICategoryRepository,
  ITransactionRepository,
} from './repositories/interfaces';

export interface Repositories {
  accounts: IAccountRepository;
  categories: ICategoryRepository;
  transactions: ITransactionRepository;
  budgets: IBudgetRepository;
  receipts: SqliteReceiptRepository;
  recurring: SqliteRecurringRepository;
}

let repos: Repositories | null = null;

export async function initData(): Promise<Repositories> {
  if (repos) return repos;
  await initDatabase();
  const db = getDatabase();
  repos = {
    accounts: new SqliteAccountRepository(db),
    categories: new SqliteCategoryRepository(db),
    transactions: new SqliteTransactionRepository(db),
    budgets: new SqliteBudgetRepository(db),
    receipts: new SqliteReceiptRepository(db),
    recurring: new SqliteRecurringRepository(db),
  };
  return repos;
}

export function getRepositories(): Repositories {
  if (!repos) {
    throw new Error('Repositories belum diinisialisasi. Panggil initData() dulu.');
  }
  return repos;
}
