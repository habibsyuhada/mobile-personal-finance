import type { Budget, NewBudget } from '@/modules/finance/data/models';
import type {
  IBudgetRepository,
  ITransactionRepository,
} from '@/modules/finance/data/repositories/interfaces';

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  ratio: number; // 0..n
  status: 'ok' | 'warning' | 'over';
}

const WARNING_THRESHOLD = 0.8;

export class BudgetService {
  constructor(
    private budgets: IBudgetRepository,
    private transactions: ITransactionRepository
  ) {}

  list(period: string): Promise<Budget[]> {
    return this.budgets.list(period);
  }

  upsert(input: NewBudget): Promise<Budget> {
    return this.budgets.upsert(input);
  }

  remove(id: string): Promise<void> {
    return this.budgets.remove(id);
  }

  /** Hitung progres pemakaian tiap anggaran pada periode (R4.2, R4.3). */
  async progress(period: string): Promise<BudgetProgress[]> {
    const budgets = await this.budgets.list(period);
    const result: BudgetProgress[] = [];
    for (const b of budgets) {
      const spent = await this.transactions.spentForCategoryInMonth(
        b.categoryId,
        period
      );
      const ratio = b.amountLimit > 0 ? spent / b.amountLimit : 0;
      const status: BudgetProgress['status'] =
        ratio >= 1 ? 'over' : ratio >= WARNING_THRESHOLD ? 'warning' : 'ok';
      result.push({ budget: b, spent, ratio, status });
    }
    return result;
  }
}
