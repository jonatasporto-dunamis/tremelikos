import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: () => {},
}));

vi.mock('next/navigation', () => ({
  redirect: () => {},
}));

type Row = Record<string, any>;

const { data, Query, authProfile } = vi.hoisted(() => {
  const data: Record<string, Row[]> = {
    products: [],
    sections: [],
    store_overrides: [],
    admin_profiles: [],
    audit_logs: [],
  };

  class Query {
    private filters: Array<(row: Row) => boolean> = [];
    private nextId = 1;

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

    async single() {
      const rows = data[this.table].filter((row) => this.filters.every((filter) => filter(row)));
      if (rows.length === 0) return { data: null, error: { message: 'not found' } };
      return { data: rows[0], error: null };
    }

    async insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
      const list = Array.isArray(rows) ? rows : [rows];
      const inserted = list.map((r) => ({ ...r, id: String(this.nextId++) }));
      data[this.table].push(...inserted);
      return { data: Array.isArray(rows) ? inserted : inserted[0], error: null };
    }

    update(payload: Record<string, unknown>) {
      const self = this;
      const chain = {
        eq(field: string, value: unknown) {
          self.filters.push((row) => row[field] === value);
          return chain;
        },
        then(resolve: (v: any) => void, reject: (e: any) => void) {
          const rows = data[self.table].filter((row) => self.filters.every((filter) => filter(row)));
          rows.forEach((row) => Object.assign(row, payload));
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
        },
      };
      return chain;
    }

    delete() {
      const self = this;
      const chain = {
        eq(field: string, value: unknown) {
          self.filters.push((row) => row[field] === value);
          return chain;
        },
        then(resolve: (v: any) => void, reject: (e: any) => void) {
          const before = data[self.table].length;
          data[self.table] = data[self.table].filter((row) => !self.filters.every((filter) => filter(row)));
          return Promise.resolve({ data: null, error: null, count: before - data[self.table].length }).then(resolve, reject);
        },
      };
      return chain;
    }

    private result() {
      return {
        data: data[this.table].filter((row) => this.filters.every((filter) => filter(row))),
        error: null,
      };
    }
  }

  const authProfile = {
    user: { id: 'u1', email: 'admin@test.com' },
    profile: { role: 'admin', active: true, store_id: 's1' },
  };

  return { data, Query, authProfile };
});

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: (table: string) => new Query(table),
  },
}));

vi.mock('@/lib/supabase/auth', () => ({
  getServerAuthClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: authProfile.user }, error: null }),
    },
  }),
}));

const { updateProduct, bulkUpdateProducts, softDeleteProduct, deleteStoreOverride } = await import(
  '@/app/admin/(authenticated)/actions'
);

describe('admin actions store scoping', () => {
  beforeEach(() => {
    data.products = [
      {
        id: 'p1', store_id: 's1', name: 'X-Burger', base_price: 25, active: true, available: true,
        featured: false, badge: null, description: 'Delicioso', sku: null,
      },
      {
        id: 'p2', store_id: 's2', name: 'Outra Loja', base_price: 30, active: true, available: true,
        featured: false, badge: null, description: 'Não é da loja 1', sku: null,
      },
    ];
    data.sections = [];
    data.store_overrides = [
      { id: 'o1', store_id: 's1', date: '2026-09-01', status: 'open', opens_at: null, closes_at: null, reason: null },
      { id: 'o2', store_id: 's2', date: '2026-09-01', status: 'open', opens_at: null, closes_at: null, reason: null },
    ];
    data.admin_profiles = [{ user_id: 'u1', role: 'admin', active: true, store_id: 's1' }];
    data.audit_logs = [];
  });

  it('updateProduct preserves missing fields', async () => {
    const fd = new FormData();
    fd.set('id', 'p1');
    fd.set('slug', 'x-burger');
    fd.set('name', 'X-Burger');
    fd.set('base_price', '26');
    // intentionally omit description, badge, active, available, featured
    await updateProduct(fd);
    const product = data.products.find((p) => p.id === 'p1');
    expect(product.name).toBe('X-Burger');
    expect(product.base_price).toBe(26);
    expect(product.description).toBe('Delicioso');
    expect(product.active).toBe(true);
    expect(product.available).toBe(true);
    expect(product.featured).toBe(false);
  });

  it('admin cannot update product from another store', async () => {
    const fd = new FormData();
    fd.set('id', 'p2');
    fd.set('slug', 'outra-loja');
    fd.set('name', 'Outra Loja');
    fd.set('base_price', '99');
    await expect(updateProduct(fd)).rejects.toThrow('Produto não encontrado');
    const product = data.products.find((p) => p.id === 'p2');
    expect(product.base_price).toBe(30);
  });

  it('bulkUpdateProducts respects store_id', async () => {
    await expect(
      bulkUpdateProducts({ productIds: ['p1', 'p2'], setPrice: 10 })
    ).rejects.toThrow('Produtos não pertencem à loja');
    const p1 = data.products.find((p) => p.id === 'p1');
    const p2 = data.products.find((p) => p.id === 'p2');
    expect(p1.base_price).toBe(25);
    expect(p2.base_price).toBe(30);
  });

  it('deleteStoreOverride respects store_id', async () => {
    await deleteStoreOverride('o2');
    expect(data.store_overrides.find((o) => o.id === 'o2')).toBeDefined();
    expect(data.store_overrides.find((o) => o.id === 'o1')).toBeDefined();
  });
});
