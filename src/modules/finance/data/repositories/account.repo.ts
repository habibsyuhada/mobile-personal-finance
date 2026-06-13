import type { Account, AccountBalance, NewAccount } from '../models';
import type { Database } from '@/data/db/database';
import { persistWeb } from '@/data/db/database';
import { newId, nowIso } from '@/lib/id';
import type { IAccountRepository } from './interfaces';

type Row = Record<string, unknown>;

function mapAccount(r: Row): Account {
  return {
    id: String(r.id),
    name: String(r.name),
    type: r.type as Account['type'],
    currency: String(r.currency),
    initialBalance: Number(r.initial_balance),
    icon: (r.icon as string) ?? null,
    color: (r.color as string) ?? null,
    archived: Number(r.archived) === 1,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export class SqliteAccountRepository implements IAccountRepository {
  constructor(private db: Database) {}

  async list(includeArchived = false): Promise<Account[]> {
    const sql = includeArchived
      ? `SELECT * FROM accounts ORDER BY name COLLATE NOCASE;`
      : `SELECT * FROM accounts WHERE archived = 0 ORDER BY name COLLATE NOCASE;`;
    const res = await this.db.query(sql);
    return res.values.map(mapAccount);
  }

  async getById(id: string): Promise<Account | null> {
    const res = await this.db.query(`SELECT * FROM accounts WHERE id = ?;`, [id]);
    return res.values.length ? mapAccount(res.values[0]) : null;
  }

  async create(input: NewAccount): Promise<Account> {
    const now = nowIso();
    const account: Account = {
      id: newId(),
      name: input.name,
      type: input.type,
      currency: input.currency,
      initialBalance: input.initialBalance,
      icon: input.icon ?? null,
      color: input.color ?? null,
      archived: input.archived ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.run(
      `INSERT INTO accounts
        (id, name, type, currency, initial_balance, icon, color, archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        account.id,
        account.name,
        account.type,
        account.currency,
        account.initialBalance,
        account.icon,
        account.color,
        account.archived ? 1 : 0,
        account.createdAt,
        account.updatedAt,
      ]
    );
    await persistWeb();
    return account;
  }

  async update(id: string, patch: Partial<NewAccount>): Promise<Account> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Akun tidak ditemukan');
    const merged: Account = {
      ...existing,
      ...patch,
      updatedAt: nowIso(),
    };
    await this.db.run(
      `UPDATE accounts SET name = ?, type = ?, currency = ?, initial_balance = ?,
         icon = ?, color = ?, archived = ?, updated_at = ? WHERE id = ?;`,
      [
        merged.name,
        merged.type,
        merged.currency,
        merged.initialBalance,
        merged.icon ?? null,
        merged.color ?? null,
        merged.archived ? 1 : 0,
        merged.updatedAt,
        id,
      ]
    );
    await persistWeb();
    return merged;
  }

  async remove(id: string): Promise<void> {
    await this.db.run(`DELETE FROM accounts WHERE id = ?;`, [id]);
    await persistWeb();
  }

  async transactionCount(id: string): Promise<number> {
    const res = await this.db.query(
      `SELECT COUNT(*) AS c FROM transactions WHERE account_id = ? OR to_account_id = ?;`,
      [id, id]
    );
    return Number(res.values[0]?.c ?? 0);
  }

  async balances(): Promise<AccountBalance[]> {
    // Saldo = initial_balance
    //   + income masuk ke account_id
    //   - expense keluar dari account_id
    //   + transfer masuk (to_account_id)
    //   - transfer keluar (account_id)
    const res = await this.db.query(`
      SELECT a.id AS account_id,
        a.initial_balance
        + COALESCE((SELECT SUM(amount) FROM transactions
            WHERE account_id = a.id AND type = 'income'), 0)
        - COALESCE((SELECT SUM(amount) FROM transactions
            WHERE account_id = a.id AND type = 'expense'), 0)
        - COALESCE((SELECT SUM(amount) FROM transactions
            WHERE account_id = a.id AND type = 'transfer'), 0)
        + COALESCE((SELECT SUM(amount) FROM transactions
            WHERE to_account_id = a.id AND type = 'transfer'), 0)
        AS balance
      FROM accounts a;
    `);
    return res.values.map((r) => ({
      accountId: String(r.account_id),
      balance: Number(r.balance),
    }));
  }

  async balanceOf(id: string): Promise<number> {
    const all = await this.balances();
    return all.find((b) => b.accountId === id)?.balance ?? 0;
  }
}
