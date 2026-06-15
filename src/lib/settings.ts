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
  notifHabitNoonEnabled: 'pref.notif.habit.noon.enabled',
  notifTaskEnabled: 'pref.notif.task.enabled',
  notifTaskNoonEnabled: 'pref.notif.task.noon.enabled',
  notifFinanceEnabled: 'pref.notif.finance.enabled',
  notifFinanceNoonEnabled: 'pref.notif.finance.noon.enabled',
  notifFinanceTime: 'pref.notif.finance.time', // 'HH:mm'
  themePreset: 'pref.theme.preset', // 'indigo' | 'sunset' | 'forest' | 'mono'
  themeAccent: 'pref.theme.accent', // hex string override preset
  trueBlack: 'pref.theme.trueBlack', // 'true' | 'false' (AMOLED-friendly)
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'indigo' | 'sunset' | 'forest' | 'mono';

export interface AppSettings {
  theme: ThemeMode;
  language: Language;
  currency: string;
  locale: string;
  aiEndpoint: string;
  aiModel: string;
  aiApiKey: string;
  notifHabitEnabled: boolean;
  notifHabitNoonEnabled: boolean;
  notifTaskEnabled: boolean;
  notifTaskNoonEnabled: boolean;
  notifFinanceEnabled: boolean;
  notifFinanceNoonEnabled: boolean;
  notifFinanceTime: string; // 'HH:mm'
  themePreset: ThemePreset;
  themeAccent: string; // hex color, e.g. '#6366f1'
  trueBlack: boolean;
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
  notifHabitNoonEnabled: true,
  notifTaskEnabled: true,
  notifTaskNoonEnabled: true,
  notifFinanceEnabled: true,
  notifFinanceNoonEnabled: false,
  notifFinanceTime: '20:00',
  themePreset: 'indigo',
  themeAccent: '#6366f1',
  trueBlack: false,
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
    notifHabitNoonEnabled,
    notifTaskEnabled,
    notifTaskNoonEnabled,
    notifFinanceEnabled,
    notifFinanceNoonEnabled,
    notifFinanceTime,
    themePreset,
    themeAccent,
    trueBlack,
  ] = await Promise.all([
    get(KEYS.theme, DEFAULT_SETTINGS.theme),
    get(KEYS.language, DEFAULT_SETTINGS.language),
    get(KEYS.currency, DEFAULT_SETTINGS.currency),
    get(KEYS.locale, DEFAULT_SETTINGS.locale),
    get(KEYS.aiEndpoint, DEFAULT_SETTINGS.aiEndpoint),
    get(KEYS.aiModel, DEFAULT_SETTINGS.aiModel),
    get(KEYS.aiApiKey, DEFAULT_SETTINGS.aiApiKey),
    get(KEYS.notifHabitEnabled, 'true'),
    get(KEYS.notifHabitNoonEnabled, 'true'),
    get(KEYS.notifTaskEnabled, 'true'),
    get(KEYS.notifTaskNoonEnabled, 'true'),
    get(KEYS.notifFinanceEnabled, 'true'),
    get(KEYS.notifFinanceNoonEnabled, 'false'),
    get(KEYS.notifFinanceTime, DEFAULT_SETTINGS.notifFinanceTime),
    get(KEYS.themePreset, DEFAULT_SETTINGS.themePreset),
    get(KEYS.themeAccent, DEFAULT_SETTINGS.themeAccent),
    get(KEYS.trueBlack, 'false'),
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
    notifHabitNoonEnabled: notifHabitNoonEnabled !== 'false',
    notifTaskEnabled: notifTaskEnabled !== 'false',
    notifTaskNoonEnabled: notifTaskNoonEnabled !== 'false',
    notifFinanceEnabled: notifFinanceEnabled !== 'false',
    notifFinanceNoonEnabled: notifFinanceNoonEnabled === 'true',
    notifFinanceTime,
    themePreset: (themePreset as ThemePreset) || 'indigo',
    themeAccent: themeAccent || '#6366f1',
    trueBlack: trueBlack === 'true',
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
    notifHabitNoonEnabled: KEYS.notifHabitNoonEnabled,
    notifTaskEnabled: KEYS.notifTaskEnabled,
    notifTaskNoonEnabled: KEYS.notifTaskNoonEnabled,
    notifFinanceEnabled: KEYS.notifFinanceEnabled,
    notifFinanceNoonEnabled: KEYS.notifFinanceNoonEnabled,
    notifFinanceTime: KEYS.notifFinanceTime,
    themePreset: KEYS.themePreset,
    themeAccent: KEYS.themeAccent,
    trueBlack: KEYS.trueBlack,
  };
  await Preferences.set({ key: map[key], value: String(value) });
}
