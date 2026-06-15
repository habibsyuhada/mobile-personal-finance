import { create } from 'zustand';

export type BannerKind = 'habit' | 'task' | 'finance';

export interface BannerItem {
  id: string;
  title: string;
  body: string;
  kind: BannerKind;
  meta?: Record<string, unknown>;
  /** ms timestamp notifikasi seharusnya fire. */
  at: number;
  createdAt: number;
}

interface BannerState {
  items: BannerItem[];
  push: (b: Omit<BannerItem, 'createdAt'>) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

// Banner store: antrian notifikasi dalam aplikasi (web + native fallback).
// Banner di UI di-mount di root App dan subscribe ke store ini.
export const useBannerStore = create<BannerState>((set) => ({
  items: [],
  push: (b) =>
    set((s) => {
      // Hindari duplikat berurutan.
      if (s.items.some((x) => x.id === b.id)) return s;
      return { items: [...s.items, { ...b, createdAt: Date.now() }] };
    }),
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
  clear: () => set({ items: [] }),
}));
