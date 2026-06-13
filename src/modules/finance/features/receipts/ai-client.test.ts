import { describe, it, expect } from 'vitest';
import { parseReceiptResponse, ReceiptAiError } from './ai-client';

describe('parseReceiptResponse', () => {
  it('parses clean JSON', () => {
    const r = parseReceiptResponse(
      '{"merchant":"Indomaret","date":"2026-06-10","currency":"IDR","total":25000,"items":[{"name":"Roti","qty":2,"price":12500}]}'
    );
    expect(r.merchant).toBe('Indomaret');
    expect(r.total).toBe(25000);
    expect(r.items).toHaveLength(1);
    expect(r.items[0].name).toBe('Roti');
  });

  it('strips markdown code fences', () => {
    const r = parseReceiptResponse(
      '```json\n{"merchant":"Alfamart","currency":"IDR","total":10000,"items":[]}\n```'
    );
    expect(r.merchant).toBe('Alfamart');
    expect(r.total).toBe(10000);
  });

  it('extracts JSON embedded in prose', () => {
    const r = parseReceiptResponse(
      'Berikut hasilnya: {"merchant":"Toko","currency":"IDR","total":5000,"items":[]} semoga membantu.'
    );
    expect(r.merchant).toBe('Toko');
  });

  it('defaults currency to IDR and items to empty', () => {
    const r = parseReceiptResponse('{"merchant":"X","total":1000}');
    expect(r.currency).toBe('IDR');
    expect(r.items).toEqual([]);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseReceiptResponse('bukan json sama sekali')).toThrow(ReceiptAiError);
  });

  it('throws when total is wrong type', () => {
    expect(() =>
      parseReceiptResponse('{"merchant":"X","total":"banyak","items":[]}')
    ).toThrow(ReceiptAiError);
  });
});
