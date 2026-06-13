import { describe, it, expect, beforeEach } from 'vitest';
import type { Database, QueryResult } from '@/data/db/database';

// Mock persistWeb (no-op in tests) by mocking the module before importing repos.
import { vi } from 'vitest';
vi.mock('@/data/db/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/db/database')>();
  return { ...actual, persistWeb: vi.fn().mockResolvedValue(undefined) };
});

import { SqliteAccountRepository } from '@/data/repositories/account.repo';
import { SqliteTransactionRepository } from '@/data/repositories/transaction.repo';
import { AccountService, AccountDeletionError } from './account.service';
import { TransactionService } from './transaction.service';

// In-memory SQL engine is overkill; instead we build a tiny fake that
// implements just enough SQL behavior used by the repos. To keep it honest,
// we use sql.js-like semantics via a minimal interpreter is too much.
// Simpler: use better approach with an in-memory object store fake repo.

// We implement an in-memory Database that understands the specific queries.
class InMemoryDb implements Database {
  accounts: Record<string, Record<string, unknown>> = {};
  transactions: Record<string, Record<string, unknown>> = {};

  async query(sql: string, params: unknown[] = []): Promise<QueryResult> {
    const s = sql.replace(/\s+/g, ' ').trim();
    if (s.startsWith('SELECT * FROM accounts WHERE id =')) {
      const a = this.accounts[String(params[0])];
      return { values: a ? [a] : [] };
    }
    if (s.includes('FROM accounts WHERE archived = 0')) {
      return { values: Object.values(this.accounts).filter((a) => a.archived === 0) };
    }
    if (s.startsWith('SELECT * FROM accounts ORDER BY')) {
      return { values: Object.values(this.accounts) };
    }
    if (s.includes('COUNT(*) AS c FROM transactions WHERE account_id')) {
      const id = String(params[0]);
      const c = Object.values(this.transactions).filter(
        (t) => t.account_id === id || t.to_account_id === id
      ).length;
      return { values: [{ c }] };
    }
    if (s.includes('AS account_id') && s.includes('AS balance')) {
      // compute balances per account
      const values = Object.values(this.accounts).map((a) => {
        const id = a.id as string;
        const txs = Object.values(this.transactions);
        const income = txs
          .filter((t) => t.account_id === id && t.type === 'income')
          .reduce((s2, t) => s2 + Number(t.amount), 0);
        const expense = txs
          .filter((t) => t.account_id === id && t.type === 'expense')
          .reduce((s2, t) => s2 + Number(t.amount), 0);
        const transferOut = txs
          .filter((t) => t.account_id === id && t.type === 'transfer')
          .reduce((s2, t) => s2 + Number(t.amount), 0);
        const transferIn = txs
          .filter((t) => t.to_account_id === id && t.type === 'transfer')
          .reduce((s2, t) => s2 + Number(t.amount), 0);
        const balance =
          Number(a.initial_balance) + income - expense - transferOut + transferIn;
        return { account_id: id, balance };
      });
      return { values };
    }
    if (s.includes("SUM(CASE WHEN type = 'income'")) {
      const txs = Object.values(this.transactions);
      const income = txs
        .filter((t) => t.type === 'income')
        .reduce((s2, t) => s2 + Number(t.amount), 0);
      const expense = txs
        .filter((t) => t.type === 'expense')
        .reduce((s2, t) => s2 + Number(t.amount), 0);
      return { values: [{ income, expense }] };
    }
    return { values: [] };
  }

  async run(sql: string, params: unknown[] = []): Promise<void> {
    const s = sql.replace(/\s+/g, ' ').trim();
    if (s.startsWith('INSERT INTO accounts')) {
      const [id, name, type, currency, initial_balance, icon, color, archived] = params;
      this.accounts[String(id)] = {
        id,
        name,
        type,
        currency,
        initial_balance,
        icon,
        color,
        archived,
        created_at: 'x',
        updated_at: 'x',
      };
    } else if (s.startsWith('INSERT INTO transactions')) {
      const [id, type, amount, account_id, to_account_id, category_id] = params;
      this.transactions[String(id)] = {
        id,
        type,
        amount,
        account_id,
        to_account_id,
        category_id,
        occurred_at: 'x',
        created_at: 'x',
        updated_at: 'x',
      };
    } else if (s.startsWith('DELETE FROM accounts')) {
      delete this.accounts[String(params[0])];
    }
  }

  async transaction(work: (tx: Database) => Promise<void>): Promise<void> {
    await work(this);
  }
}

describe('AccountService + TransactionService (balance math)', () => {
  let db: InMemoryDb;
  let accountSvc: AccountService;
  let txSvc: TransactionService;
  let accountRepo: SqliteAccountRepository;

  beforeEach(() => {
    db = new InMemoryDb();
    accountRepo = new SqliteAccountRepository(db);
    const txRepo = new SqliteTransactionRepository(db);
    accountSvc = new AccountService(accountRepo);
    txSvc = new TransactionService(txRepo);
  });

  it('computes balance from initial + income - expense', async () => {
    const acc = await accountSvc.create({
      name: 'Tunai',
      type: 'cash',
      currency: 'IDR',
      initialBalance: 100000,
    });
    await txSvc.create({
      type: 'income',
      amount: 50000,
      accountId: acc.id,
      categoryId: 'c1',
      occurredAt: '2026-01-01T00:00:00.000Z',
    });
    await txSvc.create({
      type: 'expense',
      amount: 30000,
      accountId: acc.id,
      categoryId: 'c2',
      occurredAt: '2026-01-02T00:00:00.000Z',
    });
    expect(await accountSvc.balanceOf(acc.id)).toBe(120000);
  });

  it('transfer keeps net worth unchanged', async () => {
    const a = await accountSvc.create({
      name: 'Bank',
      type: 'bank',
      currency: 'IDR',
      initialBalance: 200000,
    });
    const b = await accountSvc.create({
      name: 'E-wallet',
      type: 'ewallet',
      currency: 'IDR',
      initialBalance: 0,
    });
    const before = await accountSvc.netWorth();
    await txSvc.create({
      type: 'transfer',
      amount: 75000,
      accountId: a.id,
      toAccountId: b.id,
      occurredAt: '2026-01-03T00:00:00.000Z',
    });
    expect(await accountSvc.balanceOf(a.id)).toBe(125000);
    expect(await accountSvc.balanceOf(b.id)).toBe(75000);
    expect(await accountSvc.netWorth()).toBe(before);
  });

  it('prevents deleting account with transactions unless forced', async () => {
    const acc = await accountSvc.create({
      name: 'Tunai',
      type: 'cash',
      currency: 'IDR',
      initialBalance: 0,
    });
    await txSvc.create({
      type: 'expense',
      amount: 1000,
      accountId: acc.id,
      categoryId: 'c1',
      occurredAt: '2026-01-01T00:00:00.000Z',
    });
    await expect(accountSvc.remove(acc.id)).rejects.toBeInstanceOf(AccountDeletionError);
    await expect(accountSvc.remove(acc.id, true)).resolves.toBeUndefined();
  });
});
