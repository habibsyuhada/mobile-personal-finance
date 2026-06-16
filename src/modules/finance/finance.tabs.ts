import {
  homeOutline,
  listOutline,
  scanOutline,
  pieChartOutline,
  walletOutline,
  pricetagsOutline,
  settingsOutline,
} from 'ionicons/icons';
import type { ModuleTab } from '@/app/ModuleBottomNav';


/** Tab utama (maks 4) yang tampil di bottom-nav Keuangan. */
export const FINANCE_MAIN_TABS: ModuleTab[] = [
  { key: 'dashboard', value: '/m/finance/dashboard', icon: homeOutline, labelKey: 'tab.dashboard' },
  {
    key: 'transactions',
    value: '/m/finance/transactions',
    icon: listOutline,
    labelKey: 'tab.transactions',
  },
  { key: 'scan', value: '/m/finance/scan', icon: scanOutline, labelKey: 'tab.scan' },
  { key: 'reports', value: '/m/finance/reports', icon: pieChartOutline, labelKey: 'tab.reports' },
];

/** Tab tambahan (Akun/Kategori/Anggaran/Pengaturan) yang muncul di modal "Lainnya". */
export const FINANCE_MORE_TABS: ModuleTab[] = [
  {
    key: 'accounts',
    value: '/m/finance/accounts',
    icon: walletOutline,
    labelKey: 'settings.accounts',
  },
  {
    key: 'categories',
    value: '/m/finance/categories',
    icon: pricetagsOutline,
    labelKey: 'settings.categories',
  },
  {
    key: 'budgets',
    value: '/m/finance/budgets',
    icon: pieChartOutline,
    labelKey: 'settings.budgets',
  },
  {
    key: 'settings',
    value: '/m/finance/settings',
    icon: settingsOutline,
    labelKey: 'tab.settings',
  },
];

/** Semua tab (untuk kompatibilitas/ekspor lain). */
export const FINANCE_TABS: ModuleTab[] = [...FINANCE_MAIN_TABS, ...FINANCE_MORE_TABS];
