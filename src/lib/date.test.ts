import { describe, it, expect } from 'vitest';
import { monthKey, rangeForPeriod } from './date';

describe('date utils', () => {
  it('monthKey formats YYYY-MM', () => {
    expect(monthKey(new Date('2026-03-15T10:00:00'))).toBe('2026-03');
    expect(monthKey(new Date('2026-12-01T00:00:00'))).toBe('2026-12');
  });

  it('rangeForPeriod month covers full month', () => {
    const { from, to } = rangeForPeriod('month', new Date('2026-02-15T12:00:00'));
    const start = new Date(from);
    const end = new Date(to);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(1); // Feb (0-indexed)
    expect(start.getDate()).toBe(1);
    // Feb 2026 has 28 days
    expect(end.getDate()).toBe(28);
    expect(end.getMonth()).toBe(1);
  });

  it('rangeForPeriod year covers full year', () => {
    const { from, to } = rangeForPeriod('year', new Date('2026-06-15T12:00:00'));
    const start = new Date(from);
    const end = new Date(to);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });

  it('rangeForPeriod week spans 7 days', () => {
    const { from, to } = rangeForPeriod('week', new Date('2026-06-10T12:00:00'));
    const diff = new Date(to).getTime() - new Date(from).getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(6);
    expect(days).toBeLessThan(7);
  });
});
