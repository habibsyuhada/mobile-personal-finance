import type { Budget, NewBudget } from '../models';
import type { Database } from '../db/database';
import { persistWeb } from '../db/database';
import { newId, nowIso } from '@/lib/id';
import type { IBudgetRepository } from './interfaces';

type Row = Record<string, unknown>;

function mapBudget(r: Row): Budget {
  return {
    id: String(r.id),
    categoryId: String(r.category_id),
    period: String(r.period),
    amountLimit: Number(r.amount_limit),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export class SqliteBudgetRepository implements IBudgetRepository {
  constructor(private db: Database) {}

  async list(period: string): Promise<Budget[]> {
    const res = await this.db.query(
      `SELECT * FROM budgets WHERE period = ?;`,
      [period]
    );
    return res.values.map(mapBudget);
  }

  async getById(id: string): Promise<Budget | null> {
    const res = await this.db.query(`SELECT * FROM budgets WHERE id = ?;`, [id]);
    return res.values.length ? mapBudget(res.values[0]) : null;
  }

  async upsert(input: NewBudget): Promise<Budget> {
    // Satu anggaran per (kategori, periode).
    const existing = await this.db.query(
      `SELECT * FROM budgets WHERE category_id = ? AND period = ?;`,
      [input.categoryId, input.period]
    );
    const now = nowIso();
    if (existing.values.length) {
      const b = mapBudget(existing.values[0]);
      await this.db.run(
        `UPDATE budgets SET amount_limit = ?, updated_at = ? WHERE id = ?;`,
        [input.amountLimit, now, b.id]
      );
      await persistWeb();
      return { ...b, amountLimit: input.amountLimit, updatedAt: now };
    }
    const budget: Budget = {
      id: newId(),
      categoryId: input.categoryId,
      period: input.period,
      amountLimit: input.amountLimit,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.run(
      `INSERT INTO budgets (id, category_id, period, amount_limit, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        budget.id,
        budget.categoryId,
        budget.period,
        budget.amountLimit,
        budget.createdAt,
        budget.updatedAt,
      ]
    );
    await persistWeb();
    return budget;
  }

  async remove(id: string): Promise<void> {
    await this.db.run(`DELETE FROM budgets WHERE id = ?;`, [id]);
    await persistWeb();
  }
}
