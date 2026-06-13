// Util tanggal sederhana berbasis ISO string.

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export type PeriodType = 'week' | 'month' | 'year' | 'custom';

export interface PeriodRange {
  from: string; // ISO
  to: string; // ISO
}

export function monthKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function rangeForPeriod(type: PeriodType, ref: Date = new Date()): PeriodRange {
  const r = new Date(ref);
  if (type === 'week') {
    const day = (r.getDay() + 6) % 7; // Senin = 0
    const start = new Date(r);
    start.setDate(r.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: startOfDay(start).toISOString(), to: endOfDay(end).toISOString() };
  }
  if (type === 'month') {
    const start = new Date(r.getFullYear(), r.getMonth(), 1);
    const end = new Date(r.getFullYear(), r.getMonth() + 1, 0);
    return { from: startOfDay(start).toISOString(), to: endOfDay(end).toISOString() };
  }
  if (type === 'year') {
    const start = new Date(r.getFullYear(), 0, 1);
    const end = new Date(r.getFullYear(), 11, 31);
    return { from: startOfDay(start).toISOString(), to: endOfDay(end).toISOString() };
  }
  return { from: startOfDay(r).toISOString(), to: endOfDay(r).toISOString() };
}

export function formatDate(iso: string, locale = 'id-ID'): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string, locale = 'id-ID'): string {
  try {
    return new Date(iso).toLocaleString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
