import type { IHabitRepository } from '../data/habit.repo';
import type { Habit, HabitProgressToday, HabitStats, NewHabit } from '../data/models';
import { localDateStr } from '../lib/dates';
import {
  currentStreak,
  bestStreak,
  completionRate,
  isScheduledOn,
  isFulfilledOn,
} from '../lib/schedule';

export class HabitValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HabitValidationError';
  }
}

export class HabitService {
  constructor(private repo: IHabitRepository) {}

  list(includeArchived = false) {
    return this.repo.list(includeArchived);
  }
  getById(id: string) {
    return this.repo.getById(id);
  }

  create(input: NewHabit): Promise<Habit> {
    return (async () => {
      if (!input.name.trim()) throw new HabitValidationError('Name is required');
      if (input.type === 'quantifiable' && (!input.target || input.target <= 0)) {
        throw new HabitValidationError('Target must be greater than zero');
      }
      if (input.scheduleType === 'weekdays' && (!input.weekdays || input.weekdays.length === 0)) {
        throw new HabitValidationError('Pick at least one weekday');
      }
      if (input.scheduleType === 'times_per_week' && (!input.timesPerWeek || input.timesPerWeek <= 0)) {
        throw new HabitValidationError('Times per week must be greater than zero');
      }
      return this.repo.create({ ...input, name: input.name.trim() });
    })();
  }

  update(id: string, patch: Partial<NewHabit>) {
    return this.repo.update(id, patch);
  }
  archive(id: string, archived: boolean) {
    return this.repo.setArchived(id, archived);
  }
  remove(id: string) {
    return this.repo.remove(id);
  }

  /** Daftar habit terjadwal hari ini + status check-in. */
  async todayProgress(today: string = localDateStr()): Promise<HabitProgressToday[]> {
    const habits = await this.repo.list(false);
    const todays = await this.repo.logsForDate(today);
    const amountByHabit: Record<string, number> = {};
    for (const l of todays) amountByHabit[l.habitId] = l.amount;

    return habits
      .filter((h) => isScheduledOn(h, today))
      .map((habit) => {
        const amount = amountByHabit[habit.id] ?? 0;
        return { habit, amount, done: isFulfilledOn(habit, amount) };
      });
  }

  /** Check-in binary: toggle selesai/tidak untuk tanggal. */
  async toggleBinary(habit: Habit, date: string = localDateStr()): Promise<void> {
    const logs = await this.repo.logsForDate(date);
    const existing = logs.find((l) => l.habitId === habit.id);
    if (existing && existing.amount > 0) {
      await this.repo.clearLog(habit.id, date);
    } else {
      await this.repo.setLog(habit.id, date, 1);
    }
  }

  /** Check-in quantifiable: tambah/kurangi jumlah. */
  async addAmount(habit: Habit, delta: number, date: string = localDateStr()): Promise<void> {
    await this.repo.addToLog(habit.id, date, delta);
  }

  async stats(habitId: string, today: string = localDateStr()): Promise<HabitStats> {
    const habit = await this.repo.getById(habitId);
    if (!habit) return { currentStreak: 0, bestStreak: 0, completionRate30: 0 };
    const logs = await this.repo.logsForHabit(habitId);
    return {
      currentStreak: currentStreak(habit, logs, today),
      bestStreak: bestStreak(habit, logs),
      completionRate30: completionRate(habit, logs, 30, today),
    };
  }

  logsForHabit(habitId: string) {
    return this.repo.logsForHabit(habitId);
  }
}
