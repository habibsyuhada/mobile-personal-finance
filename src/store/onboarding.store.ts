import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';

const KEY = 'pref.onboarded';

interface OnboardingState {
  completed: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  finish: () => Promise<void>;
}

// Onboarding flag: tampilkan carousel saat pertama buka app (atau setelah reset).
// 'completed' = true artinya user sudah selesai carousel, langsung ke launcher.
export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: false,
  loaded: false,

  load: async () => {
    const { value } = await Preferences.get({ key: KEY });
    set({ completed: value === 'true', loaded: true });
  },

  finish: async () => {
    await Preferences.set({ key: KEY, value: 'true' });
    set({ completed: true });
  },
}));

export const SAMPLE_DATA_FLAG = 'pref.sampleData';
export async function markSampleLoaded(): Promise<void> {
  await Preferences.set({ key: SAMPLE_DATA_FLAG, value: 'true' });
}
export async function hasSampleLoaded(): Promise<boolean> {
  const { value } = await Preferences.get({ key: SAMPLE_DATA_FLAG });
  return value === 'true';
}
