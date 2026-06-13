// Util penjadwalan berulang bersama (dipakai Todo & modul lain).

export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly';

/** Majukan tanggal sesuai frekuensi & interval (default 1). */
export function advanceDate(
  date: Date,
  freq: RecurrenceFreq,
  interval = 1
): Date {
  const d = new Date(date);
  const step = Math.max(1, interval);
  if (freq === 'daily') d.setDate(d.getDate() + step);
  else if (freq === 'weekly') d.setDate(d.getDate() + 7 * step);
  else if (freq === 'monthly') d.setMonth(d.getMonth() + step);
  return d;
}
