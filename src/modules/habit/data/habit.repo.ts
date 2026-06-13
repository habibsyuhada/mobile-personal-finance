import type { Database } from '@/data/db/database';
import { persistWeb } from '@/data/db/database';
import { newId, nowIso } from '@/lib/id';
import type { Habit, HabitLog, NewHabit } from './models';

type Row = Record<string, unknown>;

function mapHabit(r: Row): Habit {
  return {
    id: String(r.id),
    name: String(r.name),
    icon: (r.icon as string) ?? null,
    color: (r.color as string) ?? null,
    type: r.type as Habit['type'],
    polarity: r.polarity as Habit['polarity'],
    target: r.target != null ? Number(r.target) : null,
    unit: (r.unit as string) ?? null,
    scheduleType: r.schedule_type as Habit['scheduleType'],
    weekdays: r.weekdays ? String(r.weekdays).split(',').map(Number) : null,
    timesPerWeek: r.times_per_week != null ? Number(r.times_per_week) : null,
    reminderTime: (r.reminder_time as string) ?? null,
    archived: Number(r.archived) === 1,
    sortOrder: Number(r.sort_order),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapLog(r: Row): HabitLog {
  return {
    id: String(r.id),
    habitId: String(r.habit_id),
    logDate: String(r.log_date),
    amount: Number(r.amount),
  };
}

export interface IHabitRepository {
  list(includeArchived?: boolean): Promise<Habit[]>;
  getById(id: string): Promise<Habit | null>;
  create(input: NewHabit): Promise<Habit>;
  update(id: string, patch: Partial<NewHabit>): Promise<Habit>;
  setArchived(id: string, archived: boolean): Promise<void>;
  remove(id: string): Promise<void>;

  logsForHabit(habitId: string): Promise<HabitLog[]>;
  logsForDate(date: string): Promise<HabitLog[]>;
  /** Tambah amount untuk hari (binary=set 1/0; quantifiable=akumulasi). */
  setLog(habitId: string, date: string, amount: number): Promise<void>;
  addToLog(habitId: string, date: string, delta: number): Promise<void>;
  clearLog(habitId: string, date: string): Promise<void>;
}

export class SqliteHabitRepository implements IHabitRepository {
  constructor(private db: Database) {}

  async list(includeArchived = false): Promise<Habit[]> {
    const sql = includeArchived
      ? `SELECT * FROM habit_habits ORDER BY sort_order, name COLLATE NOCASE;`
      : `SELECT * FROM habit_habits WHERE archived = 0 ORDER BY sort_order, name COLLATE NOCASE;`;
    const res = await this.db.query(sql);
    return res.values.map(mapHabit);
  }

  async getById(id: string): Promise<Habit | null> {
    const res = await this.db.query(`SELECT * FROM habit_habits WHERE id = ?;`, [id]);
    return res.values.length ? mapHabit(res.values[0]) : null;
  }

  async create(input: NewHabit): Promise<Habit> {
    const now = nowIso();
    const h: Habit = {
      id: newId(),
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      type: input.type,
      polarity: input.polarity,
      target: input.target ?? null,
      unit: input.unit ?? null,
      scheduleType: input.scheduleType,
      weekdays: input.weekdays ?? null,
      timesPerWeek: input.timesPerWeek ?? null,
      reminderTime: input.reminderTime ?? null,
      archived: input.archived ?? false,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.run(
      `INSERT INTO habit_habits
        (id, name, icon, color, type, polarity, target, unit, schedule_type,
         weekdays, times_per_week, reminder_time, archived, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        h.id,
        h.name,
        h.icon,
        h.color,
        h.type,
        h.polarity,
        h.target,
        h.unit,
        h.scheduleType,
        h.weekdays ? h.weekdays.join(',') : null,
        h.timesPerWeek,
        h.reminderTime,
        h.archived ? 1 : 0,
        h.sortOrder,
        h.createdAt,
        h.updatedAt,
      ]
    );
    await persistWeb();
    return h;
  }

  async update(id: string, patch: Partial<NewHabit>): Promise<Habit> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Habit not found');
    const m: Habit = { ...existing, ...patch, updatedAt: nowIso() };
    await this.db.run(
      `UPDATE habit_habits SET name = ?, icon = ?, color = ?, type = ?, polarity = ?,
         target = ?, unit = ?, schedule_type = ?, weekdays = ?, times_per_week = ?,
         reminder_time = ?, updated_at = ? WHERE id = ?;`,
      [
        m.name,
        m.icon ?? null,
        m.color ?? null,
        m.type,
        m.polarity,
        m.target ?? null,
        m.unit ?? null,
        m.scheduleType,
        m.weekdays ? m.weekdays.join(',') : null,
        m.timesPerWeek ?? null,
        m.reminderTime ?? null,
        m.updatedAt,
        id,
      ]
    );
    await persistWeb();
    return m;
  }

  async setArchived(id: string, archived: boolean): Promise<void> {
    await this.db.run(`UPDATE habit_habits SET archived = ?, updated_at = ? WHERE id = ?;`, [
      archived ? 1 : 0,
      nowIso(),
      id,
    ]);
    await persistWeb();
  }

  async remove(id: string): Promise<void> {
    await this.db.run(`DELETE FROM habit_habits WHERE id = ?;`, [id]);
    await persistWeb();
  }

  async logsForHabit(habitId: string): Promise<HabitLog[]> {
    const res = await this.db.query(
      `SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY log_date;`,
      [habitId]
    );
    return res.values.map(mapLog);
  }

  async logsForDate(date: string): Promise<HabitLog[]> {
    const res = await this.db.query(`SELECT * FROM habit_logs WHERE log_date = ?;`, [date]);
    return res.values.map(mapLog);
  }

  async setLog(habitId: string, date: string, amount: number): Promise<void> {
    if (amount <= 0) {
      await this.clearLog(habitId, date);
      return;
    }
    await this.db.run(
      `INSERT INTO habit_logs (id, habit_id, log_date, amount, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(habit_id, log_date) DO UPDATE SET amount = excluded.amount;`,
      [newId(), habitId, date, amount, nowIso()]
    );
    await persistWeb();
  }

  async addToLog(habitId: string, date: string, delta: number): Promise<void> {
    const res = await this.db.query(
      `SELECT amount FROM habit_logs WHERE habit_id = ? AND log_date = ?;`,
      [habitId, date]
    );
    const current = res.values.length ? Number(res.values[0].amount) : 0;
    const next = Math.max(0, current + delta);
    await this.setLog(habitId, date, next);
  }

  async clearLog(habitId: string, date: string): Promise<void> {
    await this.db.run(`DELETE FROM habit_logs WHERE habit_id = ? AND log_date = ?;`, [
      habitId,
      date,
    ]);
    await persistWeb();
  }
}
