// Sistem i18n ringan tanpa dependensi tambahan.
// Tambah bahasa baru: tambahkan entri pada LANGUAGES dan objek terjemahan.

export type Language = 'id' | 'en';

export interface LanguageOption {
  code: Language;
  label: string;
  locale: string; // untuk Intl (format uang/tanggal)
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', locale: 'en-US' },
  { code: 'id', label: 'Bahasa Indonesia', locale: 'id-ID' },
];

export function localeFor(lang: Language): string {
  return LANGUAGES.find((l) => l.code === lang)?.locale ?? 'en-US';
}

import { id } from './id';
import { en } from './en';

export type TranslationKey = keyof typeof id;

const DICTS: Record<Language, Record<TranslationKey, string>> = { id, en };

/**
 * Ambil fungsi penerjemah untuk bahasa tertentu.
 * Mendukung interpolasi: t('key', { name: 'X' }) menggantikan {name}.
 */
export function getTranslator(lang: Language) {
  const dict = DICTS[lang] ?? DICTS.en;
  return (key: TranslationKey, vars?: Record<string, string | number>): string => {
    let text = dict[key] ?? en[key] ?? String(key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  };
}
