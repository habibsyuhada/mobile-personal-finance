import { Notifications } from '@/platform/notifications';
import { getServices } from '../services';
import { useSettingsStore } from '@/store/settings.store';
import { formatMoney } from '@/lib/currency';

const SUMMARY_ID = 'finance:daily-summary';

function nextOccurrence(hhmm: string): Date {
  const [hh, mm] = hhmm.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hh ?? 20, mm ?? 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

function dayRange(): { from: string; to: string } {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const from = d.toISOString();
  d.setHours(23, 59, 59, 999);
  return { from, to: d.toISOString() };
}

export async function scheduleFinanceSummary(): Promise<void> {
  await Notifications.cancel(SUMMARY_ID);
  const s = useSettingsStore.getState();
  if (!s.notifFinanceEnabled) return;
  const at = nextOccurrence(s.notifFinanceTime);
  // Hitung ringkasan hari ini.
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

export async function cancelFinanceSummary(): Promise<void> {
  await Notifications.cancel(SUMMARY_ID);
}
