import { describe, it, expect } from 'vitest';
import {
  calculateProductPrice,
  isPromotionActive,
  calculateCartTotal,
} from '@/features/promotions/promoCalculator';
import { Promotion, Product } from '@/types/database';
import { CartItem } from '@/features/cart/CartContext';

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

describe('priority', () => {
  it('honra maior priority mesmo com desconto menor', () => {
    const promo: Promotion = {
      id: 'p-low',
      store_id: 's',
      name: '20% off',
      type: 'fixed_percent',
      value: 20,
      starts_at: null,
      ends_at: null,
      weekdays: [],
      priority: 1,
      active: true,
      created_at: '2024-01-01',
    };
    const promoHigh: Promotion = {
      ...promo,
      id: 'p-high',
      name: '5% off (vip)',
      value: 5,
      priority: 10,
    };
    const r = calculateProductPrice(mockProduct, [promo, promoHigh]);
    expect(r.promotionName).toBe('5% off (vip)');
    expect(r.discount).toBe(1.0);
  });

  it('empate de priority -> maior desconto vence', () => {
    const a: Promotion = {
      id: 'a',
      store_id: 's',
      name: 'A 10%',
      type: 'fixed_percent',
      value: 10,
      starts_at: null,
      ends_at: null,
      weekdays: [],
      priority: 5,
      active: true,
      created_at: '2024-01-01',
    };
    const b: Promotion = {
      ...a,
      id: 'b',
      name: 'B 50%',
      value: 50,
    };
    const r = calculateProductPrice(mockProduct, [a, b]);
    expect(r.promotionName).toBe('B 50%');
  });
});

describe('product scope', () => {
  it('respeita promotion_products quando productPromoIds exclui a promo', () => {
    const promo: Promotion = {
      id: 'p1',
      store_id: 's',
      name: 'so para outro',
      type: 'fixed_percent',
      value: 10,
      starts_at: null,
      ends_at: null,
      weekdays: [],
      priority: 0,
      active: true,
      created_at: '2024-01-01',
    };
    const r = calculateProductPrice(mockProduct, [promo], new Set(['outra-promo']));
    expect(r.discount).toBe(0);
  });
});

describe('calculateCartTotal', () => {
  const item: CartItem = {
    id: 'ci1',
    product: mockProduct,
    quantity: 2,
  };

  it('subtotal = base * quantidade + extras; sem promocao', () => {
    const t = calculateCartTotal([item], []);
    expect(t.subtotal).toBe(40);
    expect(t.totalDiscount).toBe(0);
    expect(t.finalTotal).toBe(40);
  });

  it('aplica promocao por produto e mostra economia', () => {
    const promo: Promotion = {
      id: 'p1',
      store_id: 's',
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
    const t = calculateCartTotal([item], [promo]);
    expect(t.subtotal).toBe(40);
    expect(t.totalDiscount).toBe(4);
    expect(t.finalTotal).toBe(36);
    expect(t.appliedPromotions).toHaveLength(1);
    expect(t.appliedPromotions[0].promotionName).toBe('10% off');
    expect(t.appliedPromotions[0].discount).toBe(4);
  });

  it('cupom percentual sobre o subtotal', () => {
    const t = calculateCartTotal([item], [], new Map(), {
      code: 'BEMVINDO10',
      type: 'fixed_percent',
      value: 10,
      minimum_order: 10,
    });
    expect(t.couponDiscount).toBe(4);
    expect(t.couponCode).toBe('BEMVINDO10');
    expect(t.finalTotal).toBe(36);
  });

  it('cupom fixo limitado ao subtotal liquido', () => {
    const t = calculateCartTotal([item], [], new Map(), {
      code: 'BIG',
      type: 'fixed_amount',
      value: 999,
      minimum_order: 10,
    });
    expect(t.couponDiscount).toBe(40);
    expect(t.finalTotal).toBe(0);
  });

  it('cupom nao aplicado se subtotal < minimo', () => {
    const t = calculateCartTotal([item], [], new Map(), {
      code: 'MIN50',
      type: 'fixed_amount',
      value: 5,
      minimum_order: 100,
    });
    expect(t.couponDiscount).toBe(0);
    expect(t.couponError).toMatch(/Pedido mínimo/);
  });

  it('promocoes nunca acumulam: aplica a melhor desconto', () => {
    const p1: Promotion = {
      id: 'p1', store_id: 's', name: '10%',
      type: 'fixed_percent', value: 10,
      starts_at: null, ends_at: null, weekdays: [], priority: 0, active: true,
      created_at: '2024-01-01',
    };
    const p2: Promotion = {
      id: 'p2', store_id: 's', name: 'R$3',
      type: 'fixed_amount', value: 3,
      starts_at: null, ends_at: null, weekdays: [], priority: 0, active: true,
      created_at: '2024-01-01',
    };
    // produto R$20, qty 2 => 10% = R$4 (total), R$3 fixo = R$6 (total) => R$6 vence
    const t = calculateCartTotal([item], [p1, p2]);
    expect(t.totalDiscount).toBe(6);
    expect(t.appliedPromotions[0].promotionName).toBe('R$3');
  });
});
