import { useMemo } from 'react';
import { useSettingsStore } from '@/store/settings.store';
import { getTranslator, type TranslationKey } from '@/i18n';

/** Hook penerjemah. Pakai: const t = useT(); t('key', { var: 'x' }) */
export function useT() {
  const language = useSettingsStore((s) => s.language);
  return useMemo(() => getTranslator(language), [language]);
}

export type { TranslationKey };
