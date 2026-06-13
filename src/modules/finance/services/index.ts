// Service container: instansiasi service di atas repositories.
import { getRepositories } from '@/modules/finance/data';
import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';
import { CategoryService } from './category.service';
import { BudgetService } from './budget.service';
import { RecurringService } from './recurring.service';

export interface Services {
  accounts: AccountService;
  transactions: TransactionService;
  categories: CategoryService;
  budgets: BudgetService;
  recurring: RecurringService;
}

let services: Services | null = null;

export function initServices(): Services {
  const repos = getRepositories();
  services = {
    accounts: new AccountService(repos.accounts),
    transactions: new TransactionService(repos.transactions),
    categories: new CategoryService(repos.categories),
    budgets: new BudgetService(repos.budgets, repos.transactions),
    recurring: new RecurringService(repos.recurring, repos.transactions),
  };
  return services;
}

export function getServices(): Services {
  if (!services) {
    throw new Error('Services belum diinisialisasi. Panggil initServices() dulu.');
  }
  return services;
}
