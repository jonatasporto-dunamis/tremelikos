import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, any>;

const { rows, Query } = vi.hoisted(() => {
  const rows: Row[] = [];

  class Query {
    private filters: Array<(row: Row) => boolean> = [];

    select() {
      return this;
    }

    eq(field: string, value: unknown) {
      this.filters.push((row) => row[field] === value);
      return this;
    }

    maybeSingle() {
      const data = rows.find((row) => this.filters.every((filter) => filter(row))) || null;
      return Promise.resolve({ data, error: null });
    }
  }

  return { rows, Query };
});

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: () => new Query(),
  },
}));

const { loadValidCoupon } = await import('@/features/orders/couponValidation');

describe('loadValidCoupon', () => {
  beforeEach(() => {
    rows.length = 0;
    rows.push({
      id: 'c1',
      store_id: 's1',
      code: 'DESC10',
      type: 'fixed_percent',
      value: 10,
      minimum_order: 20,
      starts_at: null,
      ends_at: null,
      max_uses: null,
      current_uses: 0,
      active: true,
    });
  });

  it('retorna cupom ativo da loja', async () => {
    await expect(loadValidCoupon('s1', 'DESC10')).resolves.toEqual({
      code: 'DESC10',
      type: 'fixed_percent',
      value: 10,
      minimum_order: 20,
    });
  });

  it('bloqueia cupom inativo ou inexistente', async () => {
    rows[0].active = false;

    await expect(loadValidCoupon('s1', 'DESC10')).rejects.toThrow('invalid_coupon');
  });

  it('bloqueia cupom expirado', async () => {
    rows[0].ends_at = '2026-01-01T00:00:00Z';

    await expect(loadValidCoupon('s1', 'DESC10', new Date('2026-09-06T00:00:00Z')))
      .rejects.toThrow('invalid_coupon');
  });

  it('bloqueia cupom sem usos restantes', async () => {
    rows[0].max_uses = 10;
    rows[0].current_uses = 10;

    await expect(loadValidCoupon('s1', 'DESC10')).rejects.toThrow('coupon_exhausted');
  });
});
