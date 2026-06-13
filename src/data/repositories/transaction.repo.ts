import type {
  NewTransaction,
  Transaction,
  TransactionItem,
  TxFilter,
} from '../models';
import type { Database } from '../db/database';
import { persistWeb } from '../db/database';
import { newId, nowIso } from '@/lib/id';
import type { ITransactionRepository } from './interfaces';

type Row = Record<string, unknown>;

function mapTransaction(r: Row): Transaction {
  return {
    id: String(r.id),
    type: r.type as Transaction['type'],
    amount: Number(r.amount),
    accountId: String(r.account_id),
    toAccountId: (r.to_account_id as string) ?? null,
    categoryId: (r.category_id as string) ?? null,
    occurredAt: String(r.occurred_at),
    note: (r.note as string) ?? null,
    receiptId: (r.receipt_id as string) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapItem(r: Row): TransactionItem {
  return {
    id: String(r.id),
    transactionId: String(r.transaction_id),
    name: String(r.name),
    qty: r.qty != null ? Number(r.qty) : null,
    unitPrice: r.unit_price != null ? Number(r.unit_price) : null,
    lineTotal: r.line_total != null ? Number(r.line_total) : null,
  };
}

export class SqliteTransactionRepository implements ITransactionRepository {
  constructor(private db: Database) {}

  async list(filter: TxFilter = {}): Promise<Transaction[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.from) {
      where.push('occurred_at >= ?');
      params.push(filter.from);
    }
    if (filter.to) {
      where.push('occurred_at <= ?');
      params.push(filter.to);
    }
    if (filter.categoryId) {
      where.push('category_id = ?');
      params.push(filter.categoryId);
    }
    if (filter.accountId) {
      where.push('(account_id = ? OR to_account_id = ?)');
      params.push(filter.accountId, filter.accountId);
    }
    if (filter.type) {
      where.push('type = ?');
      params.push(filter.type);
    }
    if (filter.search) {
      where.push('note LIKE ?');
      params.push(`%${filter.search}%`);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = filter.limit ? `LIMIT ${Number(filter.limit)}` : '';
    const offset = filter.offset ? `OFFSET ${Number(filter.offset)}` : '';
    const res = await this.db.query(
      `SELECT * FROM transactions ${whereClause}
       ORDER BY occurred_at DESC, created_at DESC ${limit} ${offset};`,
      params
    );
    return res.values.map(mapTransaction);
  }

  async getById(id: string): Promise<Transaction | null> {
    const res = await this.db.query(`SELECT * FROM transactions WHERE id = ?;`, [id]);
    if (!res.values.length) return null;
    const tx = mapTransaction(res.values[0]);
    const items = await this.db.query(
      `SELECT * FROM transaction_items WHERE transaction_id = ?;`,
      [id]
    );
    tx.items = items.values.map(mapItem);
    return tx;
  }

  async create(input: NewTransaction): Promise<Transaction> {
    const now = nowIso();
    const id = newId();
    const tx: Transaction = {
      id,
      type: input.type,
      amount: input.amount,
      accountId: input.accountId,
      toAccountId: input.toAccountId ?? null,
      categoryId: input.categoryId ?? null,
      occurredAt: input.occurredAt,
      note: input.note ?? null,
      receiptId: input.receiptId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.transaction(async (t) => {
      await t.run(
        `INSERT INTO transactions
          (id, type, amount, account_id, to_account_id, category_id,
           occurred_at, note, receipt_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          tx.id,
          tx.type,
          tx.amount,
          tx.accountId,
          tx.toAccountId,
          tx.categoryId,
          tx.occurredAt,
          tx.note,
          tx.receiptId,
          tx.createdAt,
          tx.updatedAt,
        ]
      );
      if (input.items?.length) {
        for (const item of input.items) {
          await t.run(
            `INSERT INTO transaction_items
              (id, transaction_id, name, qty, unit_price, line_total)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [
              newId(),
              tx.id,
              item.name,
              item.qty ?? null,
              item.unitPrice ?? null,
              item.lineTotal ?? null,
            ]
          );
        }
      }
    });
    await persistWeb();
    return tx;
  }

  async update(id: string, patch: Partial<NewTransaction>): Promise<Transaction> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Transaksi tidak ditemukan');
    // `items` pada patch (bentuk input) tidak dipersist di sini; abaikan.
    const { items: _ignored, ...rest } = patch;
    void _ignored;
    const merged: Transaction = { ...existing, ...rest, updatedAt: nowIso() };
    await this.db.run(
      `UPDATE transactions SET type = ?, amount = ?, account_id = ?, to_account_id = ?,
         category_id = ?, occurred_at = ?, note = ?, receipt_id = ?, updated_at = ?
       WHERE id = ?;`,
      [
        merged.type,
        merged.amount,
        merged.accountId,
        merged.toAccountId ?? null,
        merged.categoryId ?? null,
        merged.occurredAt,
        merged.note ?? null,
        merged.receiptId ?? null,
        merged.updatedAt,
        id,
      ]
    );
    await persistWeb();
    return merged;
  }

  async remove(id: string): Promise<void> {
    await this.db.run(`DELETE FROM transactions WHERE id = ?;`, [id]);
    await persistWeb();
  }

  async totals(from: string, to: string): Promise<{ income: number; expense: number }> {
    const res = await this.db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions WHERE occurred_at >= ? AND occurred_at <= ?;`,
      [from, to]
    );
    const r = res.values[0] ?? {};
    return { income: Number(r.income ?? 0), expense: Number(r.expense ?? 0) };
  }

  async expenseByCategory(
    from: string,
    to: string
  ): Promise<{ categoryId: string | null; total: number }[]> {
    const res = await this.db.query(
      `SELECT category_id, SUM(amount) AS total FROM transactions
       WHERE type = 'expense' AND occurred_at >= ? AND occurred_at <= ?
       GROUP BY category_id ORDER BY total DESC;`,
      [from, to]
    );
    return res.values.map((r) => ({
      categoryId: (r.category_id as string) ?? null,
      total: Number(r.total),
    }));
  }

  async spentForCategoryInMonth(categoryId: string, month: string): Promise<number> {
    const res = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE type = 'expense' AND category_id = ?
       AND strftime('%Y-%m', occurred_at) = ?;`,
      [categoryId, month]
    );
    return Number(res.values[0]?.total ?? 0);
  }
}
