import { walletOutline } from 'ionicons/icons';
import type { ModuleDescriptor } from '@/platform/types';

// Deskriptor modul Keuangan. Untuk Fase A, komponen menunjuk ke Tabs keuangan
// yang sudah ada (adapter). Migrasi & init keuangan masih ditangani jalur lama
// di App bootstrap; akan dipindah ke sini pada Fase C.
export const financeModule: ModuleDescriptor = {
  id: 'finance',
  nameKey: 'module.finance.name',
  icon: walletOutline,
  color: '#6366f1',
  order: 1,
  enabled: true,
  routePath: '/m/finance',
  component: () => import('@/app/Tabs').then((m) => ({ default: m.Tabs })),
  tables: [
    'accounts',
    'categories',
    'transactions',
    'transaction_items',
    'receipts',
    'budgets',
    'recurring_rules',
  ],
};
