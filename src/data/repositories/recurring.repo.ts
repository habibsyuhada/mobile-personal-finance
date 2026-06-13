import type { NewTransaction, RecurringFrequency, RecurringRule } from '../models';
import type { Database } from '../db/database';
import { persistWeb } from '../db/database';
import { newId } from '@/lib/id';

type Row = Record<string, unknown>;

function mapRule(r: Row): RecurringRule {
  return {
    id: String(r.id),
    templateJson: String(r.template_json),
    frequency: r.frequency as RecurringFrequency,
    nextRunAt: String(r.next_run_at),
    active: Number(r.active) === 1,
  };
}

export interface NewRecurringRule {
  template: NewTransaction;
  frequency: RecurringFrequency;
  nextRunAt: string;
}

export class SqliteRecurringRepository {
  constructor(private db: Database) {}

  async list(): Promise<RecurringRule[]> {
    const res = await this.db.query(
      `SELECT * FROM recurring_rules ORDER BY next_run_at;`
    );
    return res.values.map(mapRule);
  }

  async listDue(now: string): Promise<RecurringRule[]> {
    const res = await this.db.query(
      `SELECT * FROM recurring_rules WHERE active = 1 AND next_run_at <= ?;`,
      [now]
    );
    return res.values.map(mapRule);
  }

  async create(input: NewRecurringRule): Promise<RecurringRule> {
    const rule: RecurringRule = {
      id: newId(),
      templateJson: JSON.stringify(input.template),
      frequency: input.frequency,
      nextRunAt: input.nextRunAt,
      active: true,
    };
    await this.db.run(
      `INSERT INTO recurring_rules (id, template_json, frequency, next_run_at, active)
       VALUES (?, ?, ?, ?, 1);`,
      [rule.id, rule.templateJson, rule.frequency, rule.nextRunAt]
    );
    await persistWeb();
    return rule;
  }

  async updateNextRun(id: string, nextRunAt: string, active = true): Promise<void> {
    await this.db.run(
      `UPDATE recurring_rules SET next_run_at = ?, active = ? WHERE id = ?;`,
      [nextRunAt, active ? 1 : 0, id]
    );
    await persistWeb();
  }

  async remove(id: string): Promise<void> {
    await this.db.run(`DELETE FROM recurring_rules WHERE id = ?;`, [id]);
    await persistWeb();
  }
}
