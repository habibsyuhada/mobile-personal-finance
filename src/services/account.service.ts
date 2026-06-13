import type {
  Account,
  NewAccount,
  AccountBalance,
} from '@/data/models';
import type { IAccountRepository } from '@/data/repositories/interfaces';

export class AccountDeletionError extends Error {
  constructor(public count: number) {
    super(`Akun masih memiliki ${count} transaksi`);
    this.name = 'AccountDeletionError';
  }
}

export class AccountService {
  constructor(private accounts: IAccountRepository) {}

  list(includeArchived = false): Promise<Account[]> {
    return this.accounts.list(includeArchived);
  }

  create(input: NewAccount): Promise<Account> {
    return this.accounts.create(input);
  }

  update(id: string, patch: Partial<NewAccount>): Promise<Account> {
    return this.accounts.update(id, patch);
  }

  /**
   * Hapus akun. Jika masih ada transaksi terkait, lempar error kecuali
   * `force` true (R2.4). Pemanggil bertanggung jawab konfirmasi user.
   */
  async remove(id: string, force = false): Promise<void> {
    const count = await this.accounts.transactionCount(id);
    if (count > 0 && !force) {
      throw new AccountDeletionError(count);
    }
    await this.accounts.remove(id);
  }

  balances(): Promise<AccountBalance[]> {
    return this.accounts.balances();
  }

  async netWorth(): Promise<number> {
    const balances = await this.accounts.balances();
    return balances.reduce((sum, b) => sum + b.balance, 0);
  }

  balanceOf(id: string): Promise<number> {
    return this.accounts.balanceOf(id);
  }
}
