import type { Insight } from '@/lib/insights';
import { habitService } from '../store/habit.store';
import { localDateStr, isoWeekday } from '../lib/dates';
import { isScheduledOn, isFulfilledOn } from '../lib/schedule';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function dayKey(d: Date): string {
  return localDateStr(d);
}

export async function generateHabitInsights(): Promise<Insight[]> {
  const habits = await habitService().list(false);
  const out: Insight[] = [];
  if (habits.length === 0) return out;

  // Insight 1: hari paling konsisten (last 30 days).
  const since = Date.now() - 30 * MS_PER_DAY;
  const dayCounts: Record<number, { done: number; scheduled: number }> = {};
  for (let d = 0; d < 30; d++) {
    const date = new Date(since + d * MS_PER_DAY);
    const dateStr = dayKey(date);
    const wd = isoWeekday(date);
    if (!dayCounts[wd]) dayCounts[wd] = { done: 0, scheduled: 0 };
    const logs = await habitService().logsForDate(dateStr);
    const amountByHabit: Record<string, number> = {};
    for (const l of logs) amountByHabit[l.habitId] = l.amount;
    for (const h of habits) {
      if (!isScheduledOn(h, dateStr)) continue;
      dayCounts[wd].scheduled += 1;
      if (isFulfilledOn(h, amountByHabit[h.id] ?? 0)) dayCounts[wd].done += 1;
    }
  }
  let bestDay = -1;
  let bestRate = -1;
  for (const [wd, c] of Object.entries(dayCounts)) {
    if (c.scheduled > 0) {
      const rate = c.done / c.scheduled;
      if (rate > bestRate) {
        bestRate = rate;
        bestDay = Number(wd);
      }
    }
  }
  if (bestDay > 0 && bestRate >= 0.6) {
    out.push({
      id: 'habit.best-day',
      emoji: '🌟',
      title: 'Most consistent day',
      body: `You show up most on ${WEEKDAY_LABELS[bestDay - 1]} (${Math.round(bestRate * 100)}% completion).`,
      priority: 'low',
    });
  }

  // Insight 2: streak tertinggi.
  let bestStreak = 0;
  let bestHabit: typeof habits[number] | null = null;
  for (const h of habits) {
    const logs = await habitService().logsForHabit(h.id);
    // Hitung streak tertinggi secara kasar (best 30-day run).
    const map: Record<string, number> = {};
    for (const l of logs) map[l.logDate] = (map[l.logDate] ?? 0) + l.amount;
    let run = 0;
    let maxRun = 0;
    for (let d = 0; d < 30; d++) {
      const date = dayKey(new Date(since + d * MS_PER_DAY));
      if (!isScheduledOn(h, date)) continue;
      if (isFulfilledOn(h, map[date] ?? 0)) {
        run += 1;
        if (run > maxRun) maxRun = run;
      } else {
        run = 0;
      }
    }
    if (maxRun > bestStreak) {
      bestStreak = maxRun;
      bestHabit = h;
    }
  }
  if (bestStreak >= 7 && bestHabit) {
    out.push({
      id: 'habit.best-streak',
      emoji: '🔥',
      title: 'Best streak',
      body: `${bestHabit.name} hit ${bestStreak} days in a row.`,
      priority: 'low',
    });
  }

  // Insight 3: habit perlu perhatian.
  for (const h of habits) {
    if (h.archived) continue;
    if (!h.reminderTime) continue;
    const lastLogDate = await lastFulfilledDate(h.id, 7);
    if (lastLogDate === null) {
      out.push({
        id: `habit.attention-${h.id}`,
        emoji: '⏰',
        title: `${h.name} needs attention`,
        body: 'No check-in the last 7 days.',
        priority: 'medium',
      });
    }
  }

  return out.slice(0, 3);
}

async function lastFulfilledDate(habitId: string, lookbackDays: number): Promise<string | null> {
  const logs = await habitService().logsForHabit(habitId);
  const map: Record<string, number> = {};
  for (const l of logs) map[l.logDate] = (map[l.logDate] ?? 0) + l.amount;
  for (let d = 0; d < lookbackDays; d++) {
    const dStr = dayKey(new Date(Date.now() - d * MS_PER_DAY));
    if ((map[dStr] ?? 0) > 0) return dStr;
  }
  return null;
}
