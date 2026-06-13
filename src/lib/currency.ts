// Util uang. Disimpan sebagai integer minor unit.
// Untuk IDR, minor unit = rupiah bulat (0 desimal). Untuk USD = sen (2 desimal).

const DECIMALS: Record<string, number> = {
  IDR: 0,
  JPY: 0,
  USD: 2,
  EUR: 2,
  SGD: 2,
  MYR: 2,
};

export function decimalsFor(currency: string): number {
  return DECIMALS[currency.toUpperCase()] ?? 2;
}

/** Ubah angka tampilan (mis. 15000.50) menjadi minor unit integer. */
export function toMinor(value: number, currency = 'IDR'): number {
  const d = decimalsFor(currency);
  return Math.round(value * Math.pow(10, d));
}

/** Ubah minor unit integer menjadi angka tampilan. */
export function fromMinor(minor: number, currency = 'IDR'): number {
  const d = decimalsFor(currency);
  return minor / Math.pow(10, d);
}

/** Format minor unit menjadi string mata uang sesuai locale. */
export function formatMoney(
  minor: number,
  currency = 'IDR',
  locale = 'id-ID'
): string {
  const d = decimalsFor(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(fromMinor(minor, currency));
  } catch {
    return `${currency} ${fromMinor(minor, currency).toFixed(d)}`;
  }
}

/** Parse string input user (boleh ada pemisah ribuan) ke angka. */
export function parseAmount(input: string): number {
  if (!input) return 0;
  // buang semua kecuali digit, koma, titik, minus
  const cleaned = input.replace(/[^\d.,-]/g, '');
  // anggap titik = pemisah ribuan jika ada koma sebagai desimal; sederhanakan:
  // hilangkan pemisah ribuan umum (.) lalu ganti koma desimal dengan titik
  const normalized = cleaned.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}
