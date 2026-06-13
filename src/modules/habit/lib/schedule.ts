import type { Habit, HabitLog } from '../data/models';
import { addDays, isoWeekday, localDateStr, parseLocalDate, weekStartStr } from './dates';

// Logika jadwal & streak murni (tanpa I/O) agar mudah diuji.

/** Apakah habit terjadwal pada tanggal 'YYYY-MM-DD'? */
export function isScheduledOn(habit: Habit, dateStr: string): boolean {
  if (habit.scheduleType === 'daily') return true;
  if (habit.scheduleType === 'weekdays') {
    const wd = isoWeekday(parseLocalDate(dateStr));
    return (habit.weekdays ?? []).includes(wd);
  }
  // times_per_week: tidak terikat hari tertentu; dianggap "fleksibel"
  return true;
}

/** Map tanggal -> amount dari daftar log. */
function logMap(logs: HabitLog[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const l of logs) map[l.logDate] = (map[l.logDate] ?? 0) + l.amount;
  return map;
}

/** Apakah hari terpenuhi (binary: ada log; quantifiable: amount >= target)? */
export function isFulfilledOn(habit: Habit, amount: number): boolean {
  if (amount <= 0) return false;
  if (habit.type === 'quantifiable') {
    const target = habit.target ?? 1;
    return amount >= target;
  }
  return amount > 0;
}

/**
 * Current streak: hitung mundur dari `today`.
 * - daily/weekdays: hanya hari terjadwal yang dihitung; hari terjadwal tidak
 *   terpenuhi memutus streak; hari tidak terjadwal dilewati. Hari ini yang
 *   belum diisi tidak langsung memutus (dilewati bila belum terpenuhi).
 * - times_per_week: dihitung dalam satuan minggu yang memenuhi target.
 */
export function currentStreak(
  habit: Habit,
  logs: HabitLog[],
  today: string = localDateStr()
): number {
  const map = logMap(logs);
  if (habit.scheduleType === 'times_per_week') {
    return weeklyStreak(habit, map, today, /*best*/ false);
  }

  let streak = 0;
  let cursor = today;
  let isToday = true;
  // batasi 2 tahun untuk jaga-jaga
  for (let i = 0; i < 800; i++) {
    if (isScheduledOn(habit, cursor)) {
      const fulfilled = isFulfilledOn(habit, map[cursor] ?? 0);
      if (fulfilled) {
        streak += 1;
      } else if (isToday) {
        // hari ini belum diisi: jangan putus, lewati saja
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
    isToday = false;
  }
  return streak;
}

/** Best streak sepanjang riwayat log. */
export function bestStreak(habit: Habit, logs: HabitLog[]): number {
  if (logs.length === 0) return 0;
  const map = logMap(logs);
  const dates = Object.keys(map).sort();
  const start = dates[0];
  const end = dates[dates.length - 1];

  if (habit.scheduleType === 'times_per_week') {
    return weeklyStreak(habit, map, end, /*best*/ true, start);
  }

  let best = 0;
  let run = 0;
  let cursor = start;
  for (let i = 0; i < 5000 && cursor <= end; i++) {
    if (isScheduledOn(habit, cursor)) {
      if (isFulfilledOn(habit, map[cursor] ?? 0)) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }
  return best;
}

/** Streak mingguan untuk times_per_week. */
function weeklyStreak(
  habit: Habit,
  map: Record<string, number>,
  refDate: string,
  best: boolean,
  startDate?: string
): number {
  const target = habit.timesPerWeek ?? 1;
  const weekFulfilled = (weekStart: string): boolean => {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      if (isFulfilledOn(habit, map[d] ?? 0)) count += 1;
    }
    return count >= target;
  };

  if (!best) {
    // mundur dari minggu berjalan
    let streak = 0;
    let week = weekStartStr(refDate);
    let isCurrent = true;
    for (let i = 0; i < 520; i++) {
      if (weekFulfilled(week)) {
        streak += 1;
      } else if (isCurrent) {
        // minggu berjalan belum tercapai: jangan putus
      } else {
        break;
      }
      week = addDays(week, -7);
      isCurrent = false;
    }
    return streak;
  }

  // best: telusuri maju dari minggu start ke minggu ref
  let run = 0;
  let bestRun = 0;
  let week = weekStartStr(startDate ?? refDate);
  const endWeek = weekStartStr(refDate);
  for (let i = 0; i < 520 && week <= endWeek; i++) {
    if (weekFulfilled(week)) {
      run += 1;
      if (run > bestRun) bestRun = run;
    } else {
      run = 0;
    }
    week = addDays(week, 7);
  }
  return bestRun;
}

/** Persentase penyelesaian pada hari terjadwal dalam N hari terakhir. */
export function completionRate(
  habit: Habit,
  logs: HabitLog[],
  days = 30,
  today: string = localDateStr()
): number {
  const map = logMap(logs);
  let scheduled = 0;
  let done = 0;
  let cursor = today;
  for (let i = 0; i < days; i++) {
    if (isScheduledOn(habit, cursor)) {
      scheduled += 1;
      if (isFulfilledOn(habit, map[cursor] ?? 0)) done += 1;
    }
    cursor = addDays(cursor, -1);
  }
  return scheduled === 0 ? 0 : done / scheduled;
}
