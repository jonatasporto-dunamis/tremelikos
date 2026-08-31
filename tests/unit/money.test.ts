import { describe, it, expect } from 'vitest';
import { formatMoney, parseMoney, calculateSubtotal } from '@/lib/money';

describe('formatMoney', () => {
  it('formats BRL currency correctly', () => {
    expect(formatMoney(10)).toBe('R$ 10,00');
    expect(formatMoney(10.5)).toBe('R$ 10,50');
    expect(formatMoney(10.99)).toBe('R$ 10,99');
    expect(formatMoney(0)).toBe('R$ 0,00');
    expect(formatMoney(1000)).toBe('R$ 1.000,00');
  });
});

describe('parseMoney', () => {
  it('parses money string to number', () => {
    expect(parseMoney('R$ 10,00')).toBe(10);
    expect(parseMoney('10.50')).toBe(10.5);
    expect(parseMoney('10,50')).toBe(10.5);
    expect(parseMoney('')).toBe(0);
  });
});

describe('calculateSubtotal', () => {
  it('calculates subtotal correctly', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5.5, quantity: 1 },
    ];
    expect(calculateSubtotal(items)).toBe(25.5);
  });

  it('returns 0 for empty array', () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});
