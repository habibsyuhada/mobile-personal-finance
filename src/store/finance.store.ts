import { create } from 'zustand';
import type {
  Account,
  AccountBalance,
  Category,
  NewAccount,
  NewTransaction,
  Transaction,
  TxFilter,
} from '@/data/models';
import { getServices } from '@/services';
import { AccountDeletionError } from '@/services/account.service';

interface FinanceState {
  accounts: Account[];
  balances: Record<string, number>;
  netWorth: number;
  categories: Category[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;

  refreshAccounts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshTransactions: (filter?: TxFilter) => Promise<void>;
  refreshAll: () => Promise<void>;

  addAccount: (input: NewAccount) => Promise<void>;
  updateAccount: (id: string, patch: Partial<NewAccount>) => Promise<void>;
  deleteAccount: (id: string, force?: boolean) => Promise<void>;

  addTransaction: (input: NewTransaction) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<NewTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  balances: {},
  netWorth: 0,
  categories: [],
  transactions: [],
  loading: false,
  error: null,

  refreshAccounts: async () => {
    const svc = getServices();
    const accounts = await svc.accounts.list();
    const balanceList: AccountBalance[] = await svc.accounts.balances();
    const balances: Record<string, number> = {};
    for (const b of balanceList) balances[b.accountId] = b.balance;
    const netWorth = balanceList.reduce((s, b) => s + b.balance, 0);
    set({ accounts, balances, netWorth });
  },

  refreshCategories: async () => {
    const svc = getServices();
    set({ categories: await svc.categories.list() });
  },

  refreshTransactions: async (filter?: TxFilter) => {
    const svc = getServices();
    set({ transactions: await svc.transactions.list(filter) });
  },

  refreshAll: async () => {
    set({ loading: true, error: null });
    try {
      await get().refreshAccounts();
      await get().refreshCategories();
      await get().refreshTransactions({ limit: 100 });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },

  addAccount: async (input) => {
    await getServices().accounts.create(input);
    await get().refreshAccounts();
  },

  updateAccount: async (id, patch) => {
    await getServices().accounts.update(id, patch);
    await get().refreshAccounts();
  },

  deleteAccount: async (id, force = false) => {
    try {
      await getServices().accounts.remove(id, force);
      await get().refreshAccounts();
    } catch (e) {
      if (e instanceof AccountDeletionError) throw e;
      set({ error: e instanceof Error ? e.message : String(e) });
      throw e;
    }
  },

  addTransaction: async (input) => {
    await getServices().transactions.create(input);
    await get().refreshTransactions({ limit: 100 });
    await get().refreshAccounts();
  },

  updateTransaction: async (id, patch) => {
    await getServices().transactions.update(id, patch);
    await get().refreshTransactions({ limit: 100 });
    await get().refreshAccounts();
  },

  deleteTransaction: async (id) => {
    await getServices().transactions.remove(id);
    await get().refreshTransactions({ limit: 100 });
    await get().refreshAccounts();
  },
}));
