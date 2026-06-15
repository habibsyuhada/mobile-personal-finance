import type { Insight, InsightPriority } from '@/lib/insights';
import { getServices } from '../services';
import { formatMoney } from '@/lib/currency';
import { useSettingsStore } from '@/store/settings.store';
import { rangeForPeriod } from '@/lib/date';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayRange(daysAgo: number): { from: string; to: string } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - daysAgo);
  start.setHours(0, 0, 0, 0);
  return { from: start.toISOString(), to: end.toISOString() };
}

export async function generateFinanceInsights(): Promise<Insight[]> {
  const s = useSettingsStore.getState();
  const currency = s.currency;
  const locale = s.locale;
  const insights: Insight[] = [];

  // Insight 1: bulan ini vs bulan lalu.
  try {
    const thisMonth = rangeForPeriod('month');
    const lastMonthEnd = new Date();
    lastMonthEnd.setDate(0);
    lastMonthEnd.setHours(23, 59, 59, 999);
    const lastMonthStart = new Date(lastMonthEnd);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const [{ expense: thisExp }, { expense: lastExp }] = await Promise.all([
      getServices().transactions.totals(thisMonth.from, thisMonth.to),
      getServices().transactions.totals(lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
    ]);
    if (lastExp > 0) {
      const delta = ((thisExp - lastExp) / lastExp) * 100;
      if (Math.abs(delta) >= 5) {
        const sign = delta > 0 ? '+' : '−';
        insights.push({
          id: 'finance.month-trend',
          emoji: delta > 0 ? '📈' : '📉',
          title: delta > 0 ? 'Pengeluaran naik' : 'Pengeluaran turun',
          body: `${sign}${Math.abs(Math.round(delta))}% dari bulan lalu (${formatMoney(thisExp, currency, locale)})`,
          priority: Math.abs(delta) > 30 ? 'high' : 'medium',
        });
      } else {
        insights.push({
          id: 'finance.month-stable',
          emoji: '✨',
          title: 'Pengeluaran stabil',
          body: `Sekitar sama dengan bulan lalu (${formatMoney(thisExp, currency, locale)}).`,
          priority: 'low',
        });
      }
    }
  } catch {
    /* skip */
  }

  // Insight 2: kategori top minggu ini vs minggu lalu.
  try {
    const thisWeek = dayRange(6);
    const lastWeek = { from: dayRange(13).from, to: dayRange(7).to };
    const [byCatThis, byCatLast] = await Promise.all([
      getServices().transactions.expenseByCategory(thisWeek.from, thisWeek.to),
      getServices().transactions.expenseByCategory(lastWeek.from, lastWeek.to),
    ]);
    const topThis = byCatThis[0];
    if (topThis && topThis.total > 0) {
      const lastSame = byCatLast.find((b) => b.categoryId === topThis.categoryId);
      const lastAmount = lastSame?.total ?? 0;
      if (lastAmount > 0) {
        const delta = ((topThis.total - lastAmount) / lastAmount) * 100;
        if (Math.abs(delta) >= 15) {
          const catName = await catNameById(topThis.categoryId);
          insights.push({
            id: 'finance.top-category',
            emoji: delta > 0 ? '⚠️' : '👍',
            title: delta > 0 ? `${catName} naik` : `${catName} turun`,
            body: `${delta > 0 ? '+' : '−'}${Math.abs(Math.round(delta))}% dari minggu lalu (${formatMoney(topThis.total, currency, locale)})`,
            priority: 'low',
          });
        }
      }
    }
  } catch {
    /* skip */
  }

  // Insight 3: rata-rata harian bulan ini.
  try {
    const thisMonth = rangeForPeriod('month');
    const { expense } = await getServices().transactions.totals(thisMonth.from, thisMonth.to);
    const dayCount = Math.max(1, new Date().getDate());
    if (expense > 0 && dayCount >= 3) {
      const daily = expense / dayCount;
      insights.push({
        id: 'finance.daily-avg',
        emoji: '💵',
        title: 'Rata-rata harian',
        body: `${formatMoney(daily, currency, locale)} per hari bulan ini.`,
        priority: 'low',
      });
    }
  } catch {
    /* skip */
  }

  // Insight 4: belum catat hari ini (kalau belum expense & income).
  try {
    const today = dayRange(0);
    const { income, expense } = await getServices().transactions.totals(today.from, today.to);
    const todayMs = startOfDay(new Date()).getTime();
    const nowMs = Date.now();
    const isLate = nowMs - todayMs > 60 * 60 * 1000 * 6; // >6 jam dari midnight
    if (income === 0 && expense === 0 && isLate) {
      insights.push({
        id: 'finance.no-entry-today',
        emoji: '📝',
        title: 'Belum ada transaksi hari ini',
        body: 'Yuk catat agar ringkasanmu akurat.',
        priority: 'low',
      });
    }
  } catch {
    /* skip */
  }

  // Sort by priority.
  const order: Record<InsightPriority, number> = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => order[a.priority] - order[b.priority]);
  return insights.slice(0, 4);
}

async function catNameById(id: string | null): Promise<string> {
  if (!id) return 'Uncategorized';
  const all = await getServices().categories.list();
  return all.find((c) => c.id === id)?.name ?? 'Uncategorized';
}
