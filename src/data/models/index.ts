// Tipe domain inti. Nilai uang disimpan sebagai integer minor unit
// (mis. rupiah bulat / sen) untuk menghindari galat floating point.

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'other';
export type CategoryKind = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type ReceiptStatus = 'pending' | 'parsed' | 'failed';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number; // minor unit
  icon?: string | null;
  color?: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId?: string | null;
  icon?: string | null;
  color?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  name: string;
  qty?: number | null;
  unitPrice?: number | null; // minor unit
  lineTotal?: number | null; // minor unit
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // minor unit, selalu positif
  accountId: string;
  toAccountId?: string | null; // hanya untuk transfer
  categoryId?: string | null;
  occurredAt: string; // ISO datetime
  note?: string | null;
  receiptId?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: TransactionItem[];
}

export interface Receipt {
  id: string;
  imagePath: string;
  merchant?: string | null;
  rawJson?: string | null;
  status: ReceiptStatus;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  period: string; // 'YYYY-MM'
  amountLimit: number; // minor unit
  createdAt: string;
  updatedAt: string;
}

export interface RecurringRule {
  id: string;
  templateJson: string;
  frequency: RecurringFrequency;
  nextRunAt: string;
  active: boolean;
}

// Input types (tanpa field yang di-generate sistem)
export type NewAccount = Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'archived'> & {
  archived?: boolean;
};
export type NewCategory = Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> & {
  isDefault?: boolean;
};
export type NewTransaction = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'items'> & {
  items?: Omit<TransactionItem, 'id' | 'transactionId'>[];
};
export type NewBudget = Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>;

export interface TxFilter {
  from?: string;
  to?: string;
  categoryId?: string;
  accountId?: string;
  type?: TransactionType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AccountBalance {
  accountId: string;
  balance: number; // minor unit
}
