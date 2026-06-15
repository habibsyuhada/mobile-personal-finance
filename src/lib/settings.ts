import { Preferences } from '@capacitor/preferences';

// Penyimpanan ringan untuk preferensi & konfigurasi AI.
// CATATAN KEAMANAN (NFR3/RK2): API key disimpan di device. Ini berisiko bila
// device dikompromikan. Mitigasi sebenarnya (proxy backend) ada di fase lanjutan.
// Plugin Preferences tidak terenkripsi secara default; jangan log nilai key.

import type { Language } from '@/i18n';

const KEYS = {
  theme: 'pref.theme',
  language: 'pref.language',
  currency: 'pref.currency',
  locale: 'pref.locale',
  aiEndpoint: 'pref.ai.endpoint',
  aiModel: 'pref.ai.model',
  aiApiKey: 'pref.ai.apiKey',
  notifHabitEnabled: 'pref.notif.habit.enabled',
  notifTaskEnabled: 'pref.notif.task.enabled',
  notifFinanceEnabled: 'pref.notif.finance.enabled',
  notifFinanceTime: 'pref.notif.finance.time', // 'HH:mm'
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  language: Language;
  currency: string;
  locale: string;
  aiEndpoint: string;
  aiModel: string;
  aiApiKey: string;
  notifHabitEnabled: boolean;
  notifTaskEnabled: boolean;
  notifFinanceEnabled: boolean;
  notifFinanceTime: string; // 'HH:mm'
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  currency: 'IDR',
  locale: 'en-US',
  aiEndpoint: 'https://openai.bacanovelindo.casa/v1',
  aiModel: 'openrouter/google/gemma-4-31b-it:free',
  aiApiKey: '',
  notifHabitEnabled: true,
  notifTaskEnabled: true,
  notifFinanceEnabled: true,
  notifFinanceTime: '20:00',
};

async function get(key: string, fallback: string): Promise<string> {
  const { value } = await Preferences.get({ key });
  return value ?? fallback;
}

export async function loadSettings(): Promise<AppSettings> {
  const [
    theme,
    language,
    currency,
    locale,
    aiEndpoint,
    aiModel,
    aiApiKey,
    notifHabitEnabled,
    notifTaskEnabled,
    notifFinanceEnabled,
    notifFinanceTime,
  ] = await Promise.all([
    get(KEYS.theme, DEFAULT_SETTINGS.theme),
    get(KEYS.language, DEFAULT_SETTINGS.language),
    get(KEYS.currency, DEFAULT_SETTINGS.currency),
    get(KEYS.locale, DEFAULT_SETTINGS.locale),
    get(KEYS.aiEndpoint, DEFAULT_SETTINGS.aiEndpoint),
    get(KEYS.aiModel, DEFAULT_SETTINGS.aiModel),
    get(KEYS.aiApiKey, DEFAULT_SETTINGS.aiApiKey),
    get(KEYS.notifHabitEnabled, 'true'),
    get(KEYS.notifTaskEnabled, 'true'),
    get(KEYS.notifFinanceEnabled, 'true'),
    get(KEYS.notifFinanceTime, DEFAULT_SETTINGS.notifFinanceTime),
  ]);
  return {
    theme: theme as ThemeMode,
    language: language as Language,
    currency,
    locale,
    aiEndpoint,
    aiModel,
    aiApiKey,
    notifHabitEnabled: notifHabitEnabled !== 'false',
    notifTaskEnabled: notifTaskEnabled !== 'false',
    notifFinanceEnabled: notifFinanceEnabled !== 'false',
    notifFinanceTime,
  };
}

export async function saveSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const map: Record<keyof AppSettings, string> = {
    theme: KEYS.theme,
    language: KEYS.language,
    currency: KEYS.currency,
    locale: KEYS.locale,
    aiEndpoint: KEYS.aiEndpoint,
    aiModel: KEYS.aiModel,
    aiApiKey: KEYS.aiApiKey,
    notifHabitEnabled: KEYS.notifHabitEnabled,
    notifTaskEnabled: KEYS.notifTaskEnabled,
    notifFinanceEnabled: KEYS.notifFinanceEnabled,
    notifFinanceTime: KEYS.notifFinanceTime,
  };
  await Preferences.set({ key: map[key], value: String(value) });
}
