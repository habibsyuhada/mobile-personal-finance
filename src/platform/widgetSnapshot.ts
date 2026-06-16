// Compute widget snapshot dari store-state aplikasi. Dipanggil dari
// App.tsx setiap kali salah satu store berubah (subtle subscription).

import { useFinanceStore } from '@/modules/finance/store/finance.store';
import { useTodoStore } from '@/modules/todo/store/todo.store';
import { useHabitStore } from '@/modules/habit/store/habit.store';
import { useSettingsStore } from '@/store/settings.store';
import { toMinor } from '@/lib/currency';
import { pushWidgetSnapshot, type WidgetSnapshot } from './widget';

/** Format angka ke label uang ringkas (pakai locale user). */
function formatMoney(minor: number, locale: string): string {
  const major = toMinor(minor, 'IDR') === minor ? minor : minor;
  // Tampilkan apa adanya, scaled: kita asumsikan nilai sudah major-unit.
  const sign = major < 0 ? '-' : major > 0 ? '+' : '';
  const abs = Math.abs(major);
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs.toLocaleString(locale)}`;
}

export function computeWidgetSnapshot(): WidgetSnapshot {
  const finance = useFinanceStore.getState();
  const todo = useTodoStore.getState();
  const habit = useHabitStore.getState();
  const locale = useSettingsStore.getState().locale;

  // Top 3 task due hari ini (belum selesai), fallback ke upcoming.
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const dueToday = todo.tasks
    .filter(
      (t) =>
        !t.completed &&
        t.dueAt &&
        new Date(t.dueAt).getTime() <= endOfToday.getTime()
    )
    .slice(0, 3)
    .map((t) => t.title);
  const upcoming = todo.tasks
    .filter(
      (t) =>
        !t.completed &&
        (!t.dueAt || new Date(t.dueAt).getTime() > endOfToday.getTime())
    )
    .slice(0, 3)
    .map((t) => t.title);
  const topTasks = dueToday.length > 0 ? dueToday : upcoming;

  // Streak tertinggi (sederhana: habit.done = streak 1 hari ini).
  const todaysHabit = habit.today
    .filter((p) => p.done)
    .map((p) => p.habit.name);
  const topStreak =
    todaysHabit.length > 0
      ? { days: 1, name: todaysHabit[0] }
      : { days: 0, name: '' };

  // Net income-expense hari ini (pakai major unit: bagi 100 untuk rupiah).
  const todayStr = new Date().toISOString().slice(0, 10);
  const todays = finance.transactions.filter(
    (t) => t.occurredAt.slice(0, 10) === todayStr
  );
  const income = todays
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expense = todays
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  // amount stored as minor unit (e.g. cents) — convert ke major.
  const netMajor = (income - expense) / 100;

  return {
    task1: topTasks[0] ?? '—',
    task2: topTasks[1] ?? '',
    task3: topTasks[2] ?? '',
    streak: topStreak.days,
    streakName: topStreak.name,
    net: formatMoney(netMajor, locale),
  };
}

export { pushWidgetSnapshot };
