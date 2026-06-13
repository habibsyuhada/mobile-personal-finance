import { describe, it, expect } from 'vitest';
import {
  toMinor,
  fromMinor,
  formatMoney,
  parseAmount,
  decimalsFor,
} from './currency';

describe('currency', () => {
  it('decimalsFor returns 0 for IDR and 2 for USD', () => {
    expect(decimalsFor('IDR')).toBe(0);
    expect(decimalsFor('usd')).toBe(2);
    expect(decimalsFor('XYZ')).toBe(2); // default
  });

  it('toMinor/fromMinor roundtrip for IDR', () => {
    expect(toMinor(15000, 'IDR')).toBe(15000);
    expect(fromMinor(15000, 'IDR')).toBe(15000);
  });

  it('toMinor/fromMinor roundtrip for USD', () => {
    expect(toMinor(15.5, 'USD')).toBe(1550);
    expect(fromMinor(1550, 'USD')).toBe(15.5);
  });

  it('toMinor avoids floating point errors', () => {
    expect(toMinor(0.1 + 0.2, 'USD')).toBe(30);
  });

  it('formatMoney formats IDR without decimals', () => {
    const s = formatMoney(15000, 'IDR', 'id-ID');
    expect(s).toContain('15.000');
  });

  it('parseAmount handles thousand separators', () => {
    expect(parseAmount('15.000')).toBe(15000);
    expect(parseAmount('Rp 1.250.000')).toBe(1250000);
    expect(parseAmount('1234')).toBe(1234);
  });

  it('parseAmount handles comma decimals', () => {
    expect(parseAmount('15,50')).toBe(15.5);
  });

  it('parseAmount returns 0 for empty/invalid', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
  });
});
