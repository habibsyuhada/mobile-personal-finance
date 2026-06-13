import type { NewTransaction, Transaction, TxFilter } from '@/modules/finance/data/models';
import type { ITransactionRepository } from '@/modules/finance/data/repositories/interfaces';

export class TransactionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionValidationError';
  }
}

function validate(input: NewTransaction): void {
  if (input.amount <= 0) {
    throw new TransactionValidationError('Jumlah harus lebih dari nol');
  }
  if (!input.accountId) {
    throw new TransactionValidationError('Akun wajib dipilih');
  }
  if (input.type === 'transfer') {
    if (!input.toAccountId) {
      throw new TransactionValidationError('Akun tujuan wajib untuk transfer');
    }
    if (input.toAccountId === input.accountId) {
      throw new TransactionValidationError('Akun asal dan tujuan tidak boleh sama');
    }
  } else if (!input.categoryId) {
    throw new TransactionValidationError('Kategori wajib dipilih');
  }
  if (!input.occurredAt) {
    throw new TransactionValidationError('Tanggal wajib diisi');
  }
}

export class TransactionService {
  constructor(private repo: ITransactionRepository) {}

  list(filter?: TxFilter): Promise<Transaction[]> {
    return this.repo.list(filter);
  }

  getById(id: string): Promise<Transaction | null> {
    return this.repo.getById(id);
  }

  create(input: NewTransaction): Promise<Transaction> {
    return (async () => {
      validate(input);
      // Transfer tidak punya kategori.
      if (input.type === 'transfer') {
        input = { ...input, categoryId: null };
      } else {
        input = { ...input, toAccountId: null };
      }
      return this.repo.create(input);
    })();
  }

  update(id: string, patch: Partial<NewTransaction>): Promise<Transaction> {
    return this.repo.update(id, patch);
  }

  remove(id: string): Promise<void> {
    return this.repo.remove(id);
  }

  totals(from: string, to: string) {
    return this.repo.totals(from, to);
  }

  expenseByCategory(from: string, to: string) {
    return this.repo.expenseByCategory(from, to);
  }
}
