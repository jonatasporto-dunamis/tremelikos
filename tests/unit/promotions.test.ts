import { describe, it, expect } from 'vitest';
import { calculateProductPrice, isPromotionActive } from '@/features/promotions/promoCalculator';
import { Promotion, Product } from '@/types/database';

const mockProduct: Product = {
  id: '1',
  store_id: 'store-1',
  name: 'Test Burger',
  slug: 'test-burger',
  description: 'Test',
  base_price: 20.0,
  active: true,
  available: true,
  featured: false,
  badge: null,
  sku: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('calculateProductPrice', () => {
  it('returns base price when no promotions', () => {
    const result = calculateProductPrice(mockProduct, []);
    expect(result.finalPrice).toBe(20.0);
    expect(result.discount).toBe(0);
    expect(result.promotionName).toBeNull();
  });

  it('applies fixed percent discount', () => {
    const promo: Promotion = {
      id: 'p1',
      store_id: 'store-1',
      name: '10% off',
      type: 'fixed_percent',
      value: 10,
      starts_at: null,
      ends_at: null,
      weekdays: [],
      priority: 0,
      active: true,
      created_at: '2024-01-01',
    };

    const result = calculateProductPrice(mockProduct, [promo]);
    expect(result.finalPrice).toBe(18.0);
    expect(result.discount).toBe(2.0);
    expect(result.promotionName).toBe('10% off');
  });

  it('applies fixed amount discount', () => {
    const promo: Promotion = {
      id: 'p1',
      store_id: 'store-1',
      name: 'R$5 off',
      type: 'fixed_amount',
      value: 5,
      starts_at: null,
      ends_at: null,
      weekdays: [],
      priority: 0,
      active: true,
      created_at: '2024-01-01',
    };

    const result = calculateProductPrice(mockProduct, [promo]);
    expect(result.finalPrice).toBe(15.0);
    expect(result.discount).toBe(5.0);
  });

  it('applies product price promotion', () => {
    const promo: Promotion = {
      id: 'p1',
      store_id: 'store-1',
      name: 'Special price',
      type: 'product_price',
      value: 15,
      starts_at: null,
      ends_at: null,
      weekdays: [],
      priority: 0,
      active: true,
      created_at: '2024-01-01',
    };

    const result = calculateProductPrice(mockProduct, [promo]);
    expect(result.finalPrice).toBe(15.0);
    expect(result.discount).toBe(5.0);
  });

  it('does not return negative price', () => {
    const promo: Promotion = {
      id: 'p1',
      store_id: 'store-1',
      name: 'Big discount',
      type: 'fixed_amount',
      value: 50,
      starts_at: null,
      ends_at: null,
      weekdays: [],
      priority: 0,
      active: true,
      created_at: '2024-01-01',
    };

    const result = calculateProductPrice(mockProduct, [promo]);
    expect(result.finalPrice).toBe(0);
  });
});

describe('isPromotionActive', () => {
  it('returns true for active promotion', () => {
    const promo: Promotion = {
      id: 'p1',
      store_id: 'store-1',
      name: 'Test',
      type: 'fixed_percent',
      value: 10,
      starts_at: null,
      ends_at: null,
      weekdays: [],
      priority: 0,
      active: true,
      created_at: '2024-01-01',
    };

    expect(isPromotionActive(promo)).toBe(true);
  });

  it('returns false for inactive promotion', () => {
    const promo: Promotion = {
      id: 'p1',
      store_id: 'store-1',
      name: 'Test',
      type: 'fixed_percent',
      value: 10,
      starts_at: null,
      ends_at: null,
      weekdays: [],
      priority: 0,
      active: false,
      created_at: '2024-01-01',
    };

    expect(isPromotionActive(promo)).toBe(false);
  });

  it('returns false for expired promotion', () => {
    const promo: Promotion = {
      id: 'p1',
      store_id: 'store-1',
      name: 'Test',
      type: 'fixed_percent',
      value: 10,
      starts_at: '2020-01-01',
      ends_at: '2020-12-31',
      weekdays: [],
      priority: 0,
      active: true,
      created_at: '2024-01-01',
    };

    expect(isPromotionActive(promo)).toBe(false);
  });
});
