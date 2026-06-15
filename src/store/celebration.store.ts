import { create } from 'zustand';

interface CelebrationState {
  emoji: string | null;
  show: (emoji?: string) => void;
  clear: () => void;
}

export const useCelebration = create<CelebrationState>((set) => ({
  emoji: null,
  show: (emoji = '✨') => set({ emoji }),
  clear: () => set({ emoji: null }),
}));
