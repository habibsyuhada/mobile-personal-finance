// Helper tanggal lokal untuk modul Habit (NFR5: pakai tanggal lokal, bukan UTC).

/** Tanggal lokal 'YYYY-MM-DD' dari Date (default sekarang). */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse 'YYYY-MM-DD' menjadi Date lokal (tengah hari untuk aman dari DST). */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** ISO weekday 1=Mon .. 7=Sun dari Date. */
export function isoWeekday(d: Date): number {
  const js = d.getDay(); // 0=Sun..6=Sat
  return js === 0 ? 7 : js;
}

/** Tambah n hari ke 'YYYY-MM-DD'. */
export function addDays(dateStr: string, n: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

/** Kunci minggu (Senin) 'YYYY-MM-DD' untuk tanggal tertentu. */
export function weekStartStr(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const wd = isoWeekday(d); // 1..7
  d.setDate(d.getDate() - (wd - 1));
  return localDateStr(d);
}
