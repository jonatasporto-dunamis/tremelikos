import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, any>;

const { data, Query } = vi.hoisted(() => {
  const data: Record<string, Row[]> = {
    products: [],
    product_option_groups: [],
    option_groups: [],
    options: [],
  };

  class Query {
    private filters: Array<(row: Row) => boolean> = [];

    constructor(private table: string) {}

    select() {
      return this;
    }

    eq(field: string, value: unknown) {
      this.filters.push((row) => row[field] === value);
      return this;
    }

    in(field: string, values: unknown[]) {
      this.filters.push((row) => values.includes(row[field]));
      return Promise.resolve(this.result());
    }

    private result() {
      return {
        data: data[this.table].filter((row) => this.filters.every((filter) => filter(row))),
        error: null,
      };
    }
  }

  return { data, Query };
});

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: (table: string) => new Query(table),
  },
}));

const { loadCanonicalCartItems } = await import('@/features/orders/canonicalCart');

const product = (over: Row = {}) => ({
  id: 'p1',
  store_id: 's1',
  name: 'X-Burger',
  slug: 'x-burger',
  description: null,
  base_price: 25,
  active: true,
  available: true,
  featured: false,
  badge: null,
  sku: null,
  created_at: '2026-09-06T00:00:00Z',
  updated_at: '2026-09-06T00:00:00Z',
  ...over,
});

describe('loadCanonicalCartItems', () => {
  beforeEach(() => {
    data.products = [product()];
    data.product_option_groups = [{ product_id: 'p1', option_group_id: 'g1' }];
    data.option_groups = [{
      id: 'g1',
      store_id: 's1',
      name: 'Adicionais',
      min_choices: 0,
      max_choices: 3,
      required: false,
      active: true,
    }];
    data.options = [{
      id: 'o1',
      option_group_id: 'g1',
      name: 'Bacon',
      price_delta: 3,
      available: true,
    }];
  });

  it('reconstroi produto e adicional com preco do banco, ignorando payload adulterado', async () => {
    const result = await loadCanonicalCartItems({
      storeId: 's1',
      items: [{
        product: { id: 'p1', base_price: 1, name: 'Produto adulterado' } as any,
        quantity: 2,
        extras: [{ id: 'o1', name: 'Bacon adulterado', price: 999 }],
      }],
    });

    expect(result.items[0].product.name).toBe('X-Burger');
    expect(result.items[0].product.base_price).toBe(25);
    expect(result.items[0].extras).toEqual([{ id: 'o1', name: 'Bacon', price: 3 }]);
  });

  it('bloqueia produto inativo ou indisponivel', async () => {
    data.products = [product({ available: false })];

    await expect(loadCanonicalCartItems({
      storeId: 's1',
      items: [{ productId: 'p1', quantity: 1 }],
    })).rejects.toThrow('product_unavailable:p1');
  });

  it('bloqueia opcao que nao pertence ao produto', async () => {
    data.options = [{
      id: 'o2',
      option_group_id: 'g2',
      name: 'Queijo',
      price_delta: 2,
      available: true,
    }];

    await expect(loadCanonicalCartItems({
      storeId: 's1',
      items: [{ productId: 'p1', quantity: 1, selectedOptionIds: ['o2'] }],
    })).rejects.toThrow('invalid_option:o2');
  });

  it('bloqueia grupo obrigatorio sem selecao suficiente', async () => {
    data.option_groups = [{
      id: 'g1',
      store_id: 's1',
      name: 'Ponto da carne',
      min_choices: 1,
      max_choices: 1,
      required: true,
      active: true,
    }];

    await expect(loadCanonicalCartItems({
      storeId: 's1',
      items: [{ productId: 'p1', quantity: 1 }],
    })).rejects.toThrow('required_option_group:g1');
  });
});
