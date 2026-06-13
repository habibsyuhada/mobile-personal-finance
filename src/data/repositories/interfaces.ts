import type {
  Account,
  AccountBalance,
  Budget,
  Category,
  NewAccount,
  NewBudget,
  NewCategory,
  NewTransaction,
  Transaction,
  TxFilter,
} from '../models';

export interface IAccountRepository {
  list(includeArchived?: boolean): Promise<Account[]>;
  getById(id: string): Promise<Account | null>;
  create(input: NewAccount): Promise<Account>;
  update(id: string, patch: Partial<NewAccount>): Promise<Account>;
  remove(id: string): Promise<void>;
  balances(): Promise<AccountBalance[]>;
  balanceOf(id: string): Promise<number>;
  transactionCount(id: string): Promise<number>;
}

export interface ICategoryRepository {
  list(kind?: 'income' | 'expense'): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(input: NewCategory): Promise<Category>;
  update(id: string, patch: Partial<NewCategory>): Promise<Category>;
  remove(id: string): Promise<void>;
  count(): Promise<number>;
}

export interface ITransactionRepository {
  list(filter?: TxFilter): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(input: NewTransaction): Promise<Transaction>;
  update(id: string, patch: Partial<NewTransaction>): Promise<Transaction>;
  remove(id: string): Promise<void>;
  /** Total per tipe dalam rentang. */
  totals(from: string, to: string): Promise<{ income: number; expense: number }>;
  /** Pengeluaran per kategori dalam rentang. */
  expenseByCategory(
    from: string,
    to: string
  ): Promise<{ categoryId: string | null; total: number }[]>;
  /** Total expense untuk kategori pada bulan (YYYY-MM). */
  spentForCategoryInMonth(categoryId: string, month: string): Promise<number>;
}

export interface IBudgetRepository {
  list(period: string): Promise<Budget[]>;
  getById(id: string): Promise<Budget | null>;
  upsert(input: NewBudget): Promise<Budget>;
  remove(id: string): Promise<void>;
}
