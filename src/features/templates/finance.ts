// Merchant suggestion: cari transaksi masa lalu dengan note yang mirip sebagai
// referensi. Karena transaction tidak punya field merchant, kita pakai `note`
// sebagai pseudo-merchant dan cocokkan prefix kata pertama.

import type { Transaction } from '@/modules/finance/data/models';

export interface MerchantSuggestion {
  /** Teks suggestion (kata/teks yang sering muncul). */
  text: string;
  /** Jumlah kemunculan di history. */
  count: number;
  /** ID transaksi terbaru dengan teks ini (untuk prefill kategori). */
  lastTransactionId: string;
  /** Kategori yang paling sering dipakai. */
  categoryId: string | null;
}

interface Agg {
  count: number;
  lastAt: number;
  lastTransactionId: string;
  categoryCount: Map<string, number>;
}

const STOP = new Set(['the', 'a', 'an', 'di', 'ke', 'dari', 'untuk', 'and', 'or', 'of', 'to', 'at']);

/**
 * Ekstrak "merchant key" dari note transaksi.
 * - Ambil 2 kata pertama (case-insensitive)
 * - Filter stop words
 * - Buang yang cuma angka
 */
function extractKey(note: string | null | undefined): string {
  if (!note) return '';
  const cleaned = note
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w));
  return words.slice(0, 2).join(' ');
}

export function buildMerchantSuggestions(
  transactions: Transaction[],
  query: string,
  limit = 5
): MerchantSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const agg = new Map<string, Agg>();
  for (const t of transactions) {
    const key = extractKey(t.note);
    if (!key) continue;
    const a = agg.get(key) ?? {
      count: 0,
      lastAt: 0,
      lastTransactionId: '',
      categoryCount: new Map(),
    };
    a.count += 1;
    const at = new Date(t.occurredAt).getTime();
    if (at > a.lastAt) {
      a.lastAt = at;
      a.lastTransactionId = t.id;
    }
    if (t.categoryId) a.categoryCount.set(t.categoryId, (a.categoryCount.get(t.categoryId) ?? 0) + 1);
    agg.set(key, a);
  }
  const out: MerchantSuggestion[] = [];
  for (const [key, a] of agg) {
    if (!key.startsWith(q)) continue;
    let bestCategory: string | null = null;
    let bestCount = 0;
    for (const [cid, c] of a.categoryCount) {
      if (c > bestCount) {
        bestCount = c;
        bestCategory = cid;
      }
    }
    out.push({
      text: key,
      count: a.count,
      lastTransactionId: a.lastTransactionId,
      categoryId: bestCategory,
    });
  }
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, limit);
}
