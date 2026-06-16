// Helper untuk search.
// Saat ini hanya LIKE-based (lihat design §3.2). FTS5 di v2.

import type { SearchResult } from '../data/models';

export function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (!q) return { match: false, score: 0 };
  if (t === q) return { match: true, score: 1000 };
  if (t.startsWith(q)) return { match: true, score: 800 };
  if (t.includes(q)) return { match: true, score: 500 };
  // Subsequence match.
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  if (qi === q.length) return { match: true, score: 100 };
  return { match: false, score: 0 };
}

export function highlightSnippet(snippet: string, query: string, max = 120): string {
  if (!query) return snippet.slice(0, max);
  const idx = snippet.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return snippet.slice(0, max);
  const start = Math.max(0, idx - 20);
  const end = Math.min(snippet.length, idx + query.length + 60);
  return (start > 0 ? '…' : '') + snippet.slice(start, end) + (end < snippet.length ? '…' : '');
}

export function sortSearchResults(results: SearchResult[], query: string): SearchResult[] {
  return [...results].sort((a, b) => {
    const sa = fuzzyMatch(query, a.page.title).score;
    const sb = fuzzyMatch(query, b.page.title).score;
    return sb - sa;
  });
}
