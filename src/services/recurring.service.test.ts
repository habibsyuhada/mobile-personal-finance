import { describe, it, expect, vi } from 'vitest';
import { advance, RecurringService } from './recurring.service';
import type { SqliteRecurringRepository } from '@/data/repositories/recurring.repo';
import type { ITransactionRepository } from '@/data/repositories/interfaces';
import type { RecurringRule } from '@/data/models';

describe('advance', () => {
  it('advances daily', () => {
    expect(advance(new Date('2026-01-01T00:00:00Z'), 'daily').toISOString()).toBe(
      '2026-01-02T00:00:00.000Z'
    );
  });
  it('advances weekly', () => {
    expect(advance(new Date('2026-01-01T00:00:00Z'), 'weekly').toISOString()).toBe(
      '2026-01-08T00:00:00.000Z'
    );
  });
  it('advances monthly', () => {
    expect(advance(new Date('2026-01-15T00:00:00Z'), 'monthly').toISOString()).toBe(
      '2026-02-15T00:00:00.000Z'
    );
  });
});

describe('RecurringService.processDue', () => {
  function setup(rule: RecurringRule) {
    const created: unknown[] = [];
    const txRepo = {
      create: vi.fn(async (i) => {
        created.push(i);
        return { ...i, id: 'x', createdAt: 'x', updatedAt: 'x' };
      }),
    } as unknown as ITransactionRepository;
    let nextRun = rule.nextRunAt;
    const rulesRepo = {
      listDue: vi.fn(async () => [rule]),
      updateNextRun: vi.fn(async (_id: string, n: string) => {
        nextRun = n;
      }),
    } as unknown as SqliteRecurringRepository;
    const svc = new RecurringService(rulesRepo, txRepo);
    return { svc, created, getNextRun: () => nextRun };
  }

  const template = JSON.stringify({
    type: 'expense',
    amount: 5000,
    accountId: 'a',
    categoryId: 'c',
    occurredAt: '2026-01-01T00:00:00Z',
  });

  it('creates one transaction when one period is due', async () => {
    const rule: RecurringRule = {
      id: 'r1',
      templateJson: template,
      frequency: 'monthly',
      nextRunAt: '2026-01-01T00:00:00.000Z',
      active: true,
    };
    const { svc, created, getNextRun } = setup(rule);
    const count = await svc.processDue(new Date('2026-01-15T00:00:00Z'));
    expect(count).toBe(1);
    expect(created).toHaveLength(1);
    expect(getNextRun()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('catches up multiple missed periods', async () => {
    const rule: RecurringRule = {
      id: 'r2',
      templateJson: template,
      frequency: 'daily',
      nextRunAt: '2026-01-01T00:00:00.000Z',
      active: true,
    };
    const { svc, created } = setup(rule);
    const count = await svc.processDue(new Date('2026-01-04T00:00:00Z'));
    // due dates: Jan 1, 2, 3, 4 -> 4 transactions
    expect(count).toBe(4);
    expect(created).toHaveLength(4);
  });
});
