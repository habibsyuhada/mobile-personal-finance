import { describe, it, expect } from 'vitest';
import {
  isScheduledOn,
  isFulfilledOn,
  currentStreak,
  bestStreak,
  completionRate,
} from './schedule';
import type { Habit, HabitLog } from '../data/models';

function habit(partial: Partial<Habit>): Habit {
  return {
    id: 'h',
    name: 'Test',
    type: 'binary',
    polarity: 'good',
    scheduleType: 'daily',
    archived: false,
    sortOrder: 0,
    createdAt: 'x',
    updatedAt: 'x',
    ...partial,
  };
}

function logs(dates: Array<[string, number?]>): HabitLog[] {
  return dates.map(([d, a], i) => ({
    id: `l${i}`,
    habitId: 'h',
    logDate: d,
    amount: a ?? 1,
  }));
}

describe('isScheduledOn', () => {
  it('daily always scheduled', () => {
    expect(isScheduledOn(habit({ scheduleType: 'daily' }), '2026-06-10')).toBe(true);
  });
  it('weekdays matches ISO weekday (2026-06-10 is Wednesday=3)', () => {
    const h = habit({ scheduleType: 'weekdays', weekdays: [1, 3, 5] });
    expect(isScheduledOn(h, '2026-06-10')).toBe(true); // Wed
    expect(isScheduledOn(h, '2026-06-11')).toBe(false); // Thu
  });
});

describe('isFulfilledOn', () => {
  it('binary fulfilled when amount > 0', () => {
    expect(isFulfilledOn(habit({ type: 'binary' }), 1)).toBe(true);
    expect(isFulfilledOn(habit({ type: 'binary' }), 0)).toBe(false);
  });
  it('quantifiable fulfilled when amount >= target', () => {
    const h = habit({ type: 'quantifiable', target: 8 });
    expect(isFulfilledOn(h, 8)).toBe(true);
    expect(isFulfilledOn(h, 7)).toBe(false);
  });
});

describe('currentStreak (daily)', () => {
  it('counts consecutive days ending today', () => {
    const h = habit({ scheduleType: 'daily' });
    const l = logs([
      ['2026-06-13'],
      ['2026-06-12'],
      ['2026-06-11'],
    ]);
    expect(currentStreak(h, l, '2026-06-13')).toBe(3);
  });

  it('today not yet logged does not break streak', () => {
    const h = habit({ scheduleType: 'daily' });
    const l = logs([['2026-06-12'], ['2026-06-11']]);
    expect(currentStreak(h, l, '2026-06-13')).toBe(2);
  });

  it('a missed past day breaks the streak', () => {
    const h = habit({ scheduleType: 'daily' });
    const l = logs([['2026-06-13'], ['2026-06-11']]); // missed 12th
    expect(currentStreak(h, l, '2026-06-13')).toBe(1);
  });
});

describe('currentStreak (weekdays)', () => {
  it('unscheduled days do not break streak', () => {
    // schedule Mon/Wed/Fri (1,3,5)
    const h = habit({ scheduleType: 'weekdays', weekdays: [1, 3, 5] });
    // Week of June 2026: Mon8, Wed10, Fri12 are scheduled
    const l = logs([['2026-06-12'], ['2026-06-10'], ['2026-06-08']]);
    // today Sat 13 (not scheduled) -> streak counts Fri,Wed,Mon = 3
    expect(currentStreak(h, l, '2026-06-13')).toBe(3);
  });
});

describe('quantifiable streak', () => {
  it('only counts days meeting target', () => {
    const h = habit({ type: 'quantifiable', target: 8, scheduleType: 'daily' });
    const l = logs([
      ['2026-06-13', 8],
      ['2026-06-12', 5], // below target -> breaks
      ['2026-06-11', 8],
    ]);
    expect(currentStreak(h, l, '2026-06-13')).toBe(1);
  });
});

describe('bestStreak', () => {
  it('finds the longest run in history (daily)', () => {
    const h = habit({ scheduleType: 'daily' });
    const l = logs([
      ['2026-06-01'],
      ['2026-06-02'],
      ['2026-06-03'],
      // gap 4th
      ['2026-06-05'],
      ['2026-06-06'],
    ]);
    expect(bestStreak(h, l)).toBe(3);
  });
});

describe('times_per_week', () => {
  it('week meets target when count >= timesPerWeek', () => {
    const h = habit({ scheduleType: 'times_per_week', timesPerWeek: 3 });
    // Week starting Mon 2026-06-08: log 3 days
    const l = logs([['2026-06-08'], ['2026-06-10'], ['2026-06-12']]);
    expect(currentStreak(h, l, '2026-06-13')).toBe(1);
  });

  it('week below target gives zero streak (past week)', () => {
    const h = habit({ scheduleType: 'times_per_week', timesPerWeek: 3 });
    // previous full week only 1 log; current week empty
    const l = logs([['2026-06-02']]);
    expect(currentStreak(h, l, '2026-06-13')).toBe(0);
  });
});

describe('completionRate', () => {
  it('ratio of fulfilled scheduled days', () => {
    const h = habit({ scheduleType: 'daily' });
    const l = logs([['2026-06-13'], ['2026-06-12'], ['2026-06-11']]);
    // last 5 days, 3 done
    expect(completionRate(h, l, 5, '2026-06-13')).toBeCloseTo(3 / 5);
  });

  it('returns 0 when nothing scheduled', () => {
    const h = habit({ scheduleType: 'weekdays', weekdays: [] });
    expect(completionRate(h, [], 30, '2026-06-13')).toBe(0);
  });
});
