import { Notifications } from '@/platform/notifications';
import { getServices } from '../services';
import { useSettingsStore } from '@/store/settings.store';
import { formatMoney } from '@/lib/currency';

const SUMMARY_ID = 'finance:daily-summary';
const NOON_ID = 'finance:noon-checkin';

function nextOccurrence(hhmm: string): Date {
  const [hh, mm] = hhmm.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hh ?? 20, mm ?? 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

function noonToday(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

function dayRange(): { from: string; to: string } {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const from = d.toISOString();
  d.setHours(23, 59, 59, 999);
  return { from, to: d.toISOString() };
}

export async function scheduleFinanceSummary(): Promise<void> {
  const s = useSettingsStore.getState();
  // Evening summary.
  await Notifications.cancel(SUMMARY_ID);
  if (s.notifFinanceEnabled) {
    const at = nextOccurrence(s.notifFinanceTime);
    let body = 'Belum ada transaksi hari ini.';
    try {
      const { from, to } = dayRange();
      const { income, expense } = await getServices().transactions.totals(from, to);
      const net = income - expense;
      const sign = net >= 0 ? '+' : '-';
      body = `Masuk ${formatMoney(income, s.currency, s.locale)} · Keluar ${formatMoney(expense, s.currency, s.locale)} · Saldo ${sign}${formatMoney(Math.abs(net), s.currency, s.locale)}`;
    } catch {
      /* DB belum siap; pakai default */
    }
    await Notifications.schedule({
      id: SUMMARY_ID,
      title: 'Ringkasan Hari Ini',
      body,
      at: at.toISOString(),
      channel: Notifications.channelFor('finance').id,
      extra: {
        kind: 'finance',
        icon: null,
        categoryColor: '#16a34a',
      },
    });
  }
  // Noon "belum catat" nudge (opt-in).
  await Notifications.cancel(NOON_ID);
  if (s.notifFinanceNoonEnabled) {
    let body = 'Belum ada transaksi hari ini.';
    let title = 'Catat transaksi hari ini';
    try {
      const { from, to } = dayRange();
      const { income, expense } = await getServices().transactions.totals(from, to);
      if (income > 0 || expense > 0) {
        title = 'Sudah update?';
        body = `Masuk ${formatMoney(income, s.currency, s.locale)} · Keluar ${formatMoney(expense, s.currency, s.locale)}`;
      }
    } catch {
      /* DB belum siap */
    }
    await Notifications.schedule({
      id: NOON_ID,
      title,
      body,
      at: noonToday().toISOString(),
      channel: Notifications.channelFor('finance').id,
      extra: {
        kind: 'finance',
        icon: null,
        categoryColor: '#16a34a',
      },
    });
  }
}

export async function cancelFinanceSummary(): Promise<void> {
  await Notifications.cancel(SUMMARY_ID);
  await Notifications.cancel(NOON_ID);
}
