import { describe, it, expect } from 'vitest';
import { calculateProductPrice, calculateCartTotal, isPromotionActive } from '@/features/promotions/promoCalculator';
import type { Promotion, Product } from '@/types/database';

const NOW = new Date('2026-09-03T20:00:00Z'); // quinta 17:00 BRT (hora qualquer)

const product = (over: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'X-Burger',
  slug: 'x-burger',
  description: null,
  base_price: 25,
  category_id: 'c1',
  is_active: true,
  is_featured: false,
  is_combo: false,
  position: 0,
  prep_minutes: null,
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
  deleted_at: null,
  ...over,
} as Product);

const promo = (over: Partial<Promotion>): Promotion => ({
  id: 'pr1',
  name: 'Promo',
  type: 'fixed_percent',
  value: 10,
  priority: 0,
  active: true,
  starts_at: null,
  ends_at: null,
  weekdays: [],
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
  ...over,
} as Promotion);

describe('isPromotionActive', () => {
  it('ativa por padrão (active=true, sem data, sem weekday)', () => {
    expect(isPromotionActive(promo({}), NOW)).toBe(true);
  });

  it('inativa se active=false', () => {
    expect(isPromotionActive(promo({ active: false }), NOW)).toBe(false);
  });

  it('inativa se starts_at no futuro', () => {
    const future = new Date(NOW.getTime() + 86400000).toISOString();
    expect(isPromotionActive(promo({ starts_at: future }), NOW)).toBe(false);
  });

  it('inativa se ends_at no passado', () => {
    const past = new Date(NOW.getTime() - 86400000).toISOString();
    expect(isPromotionActive(promo({ ends_at: past }), NOW)).toBe(false);
  });

  it('respeita weekdays (3 = quarta-feira em JS Date.getDay()=3)', () => {
    // NOW é quinta-feira. weekdays=[4] deve estar ativa.
    expect(isPromotionActive(promo({ weekdays: [4] }), NOW)).toBe(true);
    expect(isPromotionActive(promo({ weekdays: [2] }), NOW)).toBe(false);
  });
});

describe('calculateProductPrice — promoção única', () => {
  it('fixed_percent: aplica percentual', () => {
    const result = calculateProductPrice(product(), [promo({ type: 'fixed_percent', value: 20 })]);
    expect(result.originalPrice).toBe(25);
    expect(result.discount).toBe(5); // 20% de 25
    expect(result.finalPrice).toBe(20);
  });

  it('fixed_amount: aplica valor fixo', () => {
    const result = calculateProductPrice(product(), [promo({ type: 'fixed_amount', value: 4 })]);
    expect(result.discount).toBe(4);
    expect(result.finalPrice).toBe(21);
  });

  it('product_price: força preço fixo', () => {
    const result = calculateProductPrice(product(), [promo({ type: 'product_price', value: 12.5 })]);
    expect(result.discount).toBe(12.5);
    expect(result.finalPrice).toBe(12.5);
  });

  it('sem promoção: final = original, sem desconto', () => {
    const result = calculateProductPrice(product(), []);
    expect(result.finalPrice).toBe(25);
    expect(result.discount).toBe(0);
    expect(result.promotionName).toBeNull();
  });

  it('final nunca negativo (Math.max aplicado)', () => {
    // desconto absurdamente grande via fixed_amount > base
    const result = calculateProductPrice(product({ base_price: 10 }), [
      promo({ type: 'fixed_amount', value: 50 }),
    ]);
    expect(result.finalPrice).toBe(0);
  });
});

describe('calculateProductPrice — múltiplas promoções', () => {
  it('vence a de maior priority', () => {
    const result = calculateProductPrice(product(), [
      promo({ id: 'a', type: 'fixed_percent', value: 10, priority: 0 }),
      promo({ id: 'b', type: 'fixed_amount', value: 5, priority: 10 }),
    ]);
    expect(result.promotionId).toBe('b');
    expect(result.discount).toBe(5);
  });

  it('em empate de priority, vence a de maior desconto', () => {
    const result = calculateProductPrice(product(), [
      promo({ id: 'a', type: 'fixed_percent', value: 10, priority: 5 }),
      promo({ id: 'b', type: 'fixed_amount', value: 8, priority: 5 }),
    ]);
    expect(result.promotionId).toBe('b');
  });

  it('descarta promoções inativas (fora de período)', () => {
    const past = new Date(NOW.getTime() - 86400000).toISOString();
    const result = calculateProductPrice(product(), [
      promo({ id: 'inactive', ends_at: past }),
      promo({ id: 'active', type: 'fixed_percent', value: 10 }),
    ]);
    expect(result.promotionId).toBe('active');
  });

  it('filtra promoções não-vinculadas ao produto', () => {
    const result = calculateProductPrice(
      product(),
      [promo({ id: 'linked' }), promo({ id: 'unlinked' })],
      new Set(['linked'])
    );
    expect(result.promotionId).toBe('linked');
  });

  it('NÃO acumula promoções (apenas a melhor)', () => {
    const result = calculateProductPrice(product(), [
      promo({ id: 'a', type: 'fixed_amount', value: 4, priority: 0 }),
      promo({ id: 'b', type: 'fixed_amount', value: 5, priority: 0 }),
    ]);
    expect(result.discount).toBe(5);
    expect(result.finalPrice).toBe(20);
  });
});

describe('calculateCartTotal', () => {
  const item = (id: string, base: number, qty = 1) => ({
    id,
    product: product({ id, base_price: base }),
    quantity: qty,
  });

  it('subtotal sem promo', () => {
    const result = calculateCartTotal([item('a', 10, 2), item('b', 5)], []);
    expect(result.subtotal).toBe(25);
    expect(result.totalDiscount).toBe(0);
    expect(result.finalTotal).toBe(25);
  });

  it('aplica promoção por produto', () => {
    const result = calculateCartTotal(
      [item('a', 20, 2)],
      [promo({ type: 'fixed_percent', value: 10 })]
    );
    expect(result.subtotal).toBe(40);
    expect(result.totalDiscount).toBe(4);
    expect(result.finalTotal).toBe(36);
  });

  it('soma extras ao subtotal', () => {
    const result = calculateCartTotal(
      [{
        id: 'a',
        product: product({ id: 'a', base_price: 10 }),
        quantity: 1,
        extras: [{ name: 'Bacon', price: 3 }, { name: 'Cheddar', price: 2 }],
      }],
      []
    );
    expect(result.subtotal).toBe(15);
  });

  it('cupom fixed_percent', () => {
    const result = calculateCartTotal(
      [item('a', 100, 1)],
      [],
      new Map(),
      { code: 'DESC10', type: 'fixed_percent', value: 10, minimum_order: 0 }
    );
    expect(result.couponDiscount).toBe(10);
    expect(result.finalTotal).toBe(90);
    expect(result.couponCode).toBe('DESC10');
    expect(result.couponError).toBeNull();
  });

  it('cupom fixed_amount', () => {
    const result = calculateCartTotal(
      [item('a', 50, 1)],
      [],
      new Map(),
      { code: '5OFF', type: 'fixed_amount', value: 5, minimum_order: 0 }
    );
    expect(result.couponDiscount).toBe(5);
  });

  it('cupom abaixo do mínimo: gera couponError, não aplica', () => {
    const result = calculateCartTotal(
      [item('a', 10, 1)],
      [],
      new Map(),
      { code: 'DESC20', type: 'fixed_percent', value: 20, minimum_order: 50 }
    );
    expect(result.couponError).toMatch(/Pedido mínimo/);
    expect(result.couponDiscount).toBe(0);
  });

  it('cupom não excede o subtotal após promoções', () => {
    const result = calculateCartTotal(
      [item('a', 30, 1)],
      [promo({ type: 'fixed_amount', value: 20 })], // 10 reais restantes
      new Map(),
      { code: 'BIG', type: 'fixed_amount', value: 50, minimum_order: 0 }
    );
    expect(result.couponDiscount).toBe(10);
    expect(result.finalTotal).toBe(0);
  });
});
