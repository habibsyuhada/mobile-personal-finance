import { create } from 'zustand';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSetting,
  ThemeMode,
} from '@/lib/settings';
import { localeFor, type Language } from '@/i18n';

interface SettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
}

type NotifChangeListener = (
  changes: Partial<
    Pick<
      AppSettings,
      | 'notifFinanceEnabled'
      | 'notifFinanceNoonEnabled'
      | 'notifFinanceTime'
      | 'notifHabitEnabled'
      | 'notifHabitNoonEnabled'
      | 'notifTaskEnabled'
      | 'notifTaskNoonEnabled'
    >
  >
) => void;
const notifListeners = new Set<NotifChangeListener>();

/** Dipanggil modul untuk reaktif terhadap perubahan setting notifikasi. */
export function onNotifSettingChange(fn: NotifChangeListener): () => void {
  notifListeners.add(fn);
  return () => notifListeners.delete(fn);
}

function applyTheme(theme: ThemeMode) {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('ion-palette-dark', dark);
  document.body.classList.toggle('dark', dark);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const s = await loadSettings();
    set({ ...s, loaded: true });
    applyTheme(s.theme);
    document.documentElement.lang = s.language;
  },

  set: async (key, value) => {
    await saveSetting(key, value);
    set({ [key]: value } as Pick<AppSettings, typeof key>);
    if (key === 'theme') applyTheme(value as ThemeMode);
    if (key === 'language') {
      const lang = value as Language;
      const locale = localeFor(lang);
      await saveSetting('locale', locale);
      set({ locale });
      document.documentElement.lang = lang;
    }
    // Beri tahu listener kalau ada perubahan terkait notifikasi.
    const notifKeys: (keyof AppSettings)[] = [
      'notifFinanceEnabled',
      'notifFinanceNoonEnabled',
      'notifFinanceTime',
      'notifHabitEnabled',
      'notifHabitNoonEnabled',
      'notifTaskEnabled',
      'notifTaskNoonEnabled',
    ];
    if (notifKeys.includes(key)) {
      const changes: Record<string, unknown> = { [key]: value };
      for (const l of notifListeners) l(changes);
    }
    void get;
  },
}));
