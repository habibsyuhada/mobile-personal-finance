import { walletOutline } from 'ionicons/icons';
import type { ModuleDescriptor } from '@/platform/types';
import type { Database } from '@/data/db/database';
import { FINANCE_MIGRATIONS } from './data/finance-migrations';
import { initData, getRepositories } from './data';
import { seedDefaultCategories } from './data/seed';
import { initServices, getServices } from './services';
import { scheduleFinanceSummary, cancelFinanceSummary } from './features/notifications';

// Init modul keuangan: siapkan repositories & services di atas DB bersama,
// seed kategori default, lalu proses transaksi berulang yang jatuh tempo.
async function initFinance(_db: Database): Promise<void> {
  await initData();
  await seedDefaultCategories(getRepositories().categories);
  initServices();
  await getServices().recurring.processDue();
}

async function scheduleFinanceReminders(): Promise<void> {
  await scheduleFinanceSummary();
}

async function cancelFinanceReminders(): Promise<void> {
  await cancelFinanceSummary();
}

export const financeModule: ModuleDescriptor = {
  id: 'finance',
  nameKey: 'module.finance.name',
  icon: walletOutline,
  color: '#6366f1',
  order: 1,
  enabled: true,
  routePath: '/m/finance',
  component: () => import('./FinanceRoot'),
  migrations: FINANCE_MIGRATIONS,
  init: initFinance,
  tables: [
    'accounts',
    'categories',
    'transactions',
    'transaction_items',
    'receipts',
    'budgets',
    'recurring_rules',
  ],
  scheduleReminders: scheduleFinanceReminders,
  cancelAllReminders: cancelFinanceReminders,
};
