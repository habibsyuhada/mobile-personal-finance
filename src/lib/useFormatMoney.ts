import { useSettingsStore } from '@/store/settings.store';
import { formatMoney } from '@/lib/currency';

/** Hook untuk format uang sesuai mata uang & locale pengguna. */
export function useFormatMoney() {
  const currency = useSettingsStore((s) => s.currency);
  const locale = useSettingsStore((s) => s.locale);
  return (minor: number) => formatMoney(minor, currency, locale);
}

export function useCurrency() {
  return useSettingsStore((s) => s.currency);
}
