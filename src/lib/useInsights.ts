import { useEffect, useState } from 'react';
import type { Insight } from './insights';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  insights: Insight[];
  expires: number;
}

const cache = new Map<string, CacheEntry>();

/** Hook: ambil insights, cache 1 jam. */
export function useInsights(
  key: string,
  loader: () => Promise<Insight[]>
): { insights: Insight[]; loading: boolean; refresh: () => Promise<void> } {
  const [insights, setInsights] = useState<Insight[]>(() => {
    const c = cache.get(key);
    return c && c.expires > Date.now() ? c.insights : [];
  });
  const [loading, setLoading] = useState(() => !cache.get(key) || cache.get(key)!.expires <= Date.now());

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const result = await loader();
      cache.set(key, { insights: result, expires: Date.now() + CACHE_TTL_MS });
      setInsights(result);
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { insights, loading, refresh: fetchInsights };
}
