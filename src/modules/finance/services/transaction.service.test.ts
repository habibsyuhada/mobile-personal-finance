import { describe, it, expect, vi } from 'vitest';
import { TransactionService, TransactionValidationError } from './transaction.service';
import type { ITransactionRepository } from '@/modules/finance/data/repositories/interfaces';
import type { NewTransaction, Transaction } from '@/modules/finance/data/models';

function fakeRepo(): ITransactionRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (i: NewTransaction) => ({
      ...i,
      id: 'x',
      createdAt: 'x',
      updatedAt: 'x',
    })) as unknown as ITransactionRepository['create'],
    update: vi.fn(),
    remove: vi.fn(),
    totals: vi.fn().mockResolvedValue({ income: 0, expense: 0 }),
    expenseByCategory: vi.fn().mockResolvedValue([]),
    spentForCategoryInMonth: vi.fn().mockResolvedValue(0),
  };
}

describe('TransactionService validation', () => {
  it('rejects non-positive amount', async () => {
    const svc = new TransactionService(fakeRepo());
    await expect(
      svc.create({
        type: 'expense',
        amount: 0,
        accountId: 'a',
        categoryId: 'c',
        occurredAt: '2026-01-01T00:00:00Z',
      })
    ).rejects.toBeInstanceOf(TransactionValidationError);
  });

  it('requires category for expense', async () => {
    const svc = new TransactionService(fakeRepo());
    await expect(
      svc.create({
        type: 'expense',
        amount: 100,
        accountId: 'a',
        occurredAt: '2026-01-01T00:00:00Z',
      } as NewTransaction)
    ).rejects.toBeInstanceOf(TransactionValidationError);
  });

  it('requires distinct accounts for transfer', async () => {
    const svc = new TransactionService(fakeRepo());
    await expect(
      svc.create({
        type: 'transfer',
        amount: 100,
        accountId: 'a',
        toAccountId: 'a',
        occurredAt: '2026-01-01T00:00:00Z',
      })
    ).rejects.toBeInstanceOf(TransactionValidationError);
  });

  it('clears category on transfer', async () => {
    const repo = fakeRepo();
    const svc = new TransactionService(repo);
    const result = (await svc.create({
      type: 'transfer',
      amount: 100,
      accountId: 'a',
      toAccountId: 'b',
      categoryId: 'should-be-removed',
      occurredAt: '2026-01-01T00:00:00Z',
    })) as Transaction;
    expect(result.categoryId).toBeNull();
  });

  it('accepts valid expense', async () => {
    const svc = new TransactionService(fakeRepo());
    await expect(
      svc.create({
        type: 'expense',
        amount: 5000,
        accountId: 'a',
        categoryId: 'c',
        occurredAt: '2026-01-01T00:00:00Z',
      })
    ).resolves.toBeTruthy();
  });
});
