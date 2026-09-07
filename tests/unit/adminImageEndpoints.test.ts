import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: () => {},
}));

type Row = Record<string, any>;

const { data, Query, authProfile, activeProfile, storageOps } = vi.hoisted(() => {
  const data: Record<string, Row[]> = {
    products: [],
    product_images: [],
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

    async maybeSingle() {
      const rows = data[this.table].filter((row) => this.filters.every((filter) => filter(row)));
      return { data: rows[0] || null, error: null };
    }

    async insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
      const list = Array.isArray(rows) ? rows : [rows];
      const inserted = list.map((r) => ({ ...r, id: String(this.nextId++) }));
      data[this.table].push(...inserted);
      return { data: Array.isArray(rows) ? inserted : inserted[0], error: null };
    }

    upsert(rows: Record<string, unknown> | Record<string, unknown>[]) {
      const list = Array.isArray(rows) ? rows : [rows];
      const inserted = list.map((r) => ({ ...r, id: String(this.nextId++) }));
      data[this.table].push(...inserted);
      const result = Array.isArray(rows) ? inserted : inserted[0];
      const chain = {
        select() {
          const r = Array.isArray(result) ? result[0] : result;
          return {
            single() {
              return Promise.resolve({ data: r, error: null });
            },
            then(resolve: (v: any) => void, reject: (e: any) => void) {
              return Promise.resolve({ data: r, error: null }).then(resolve, reject);
            },
          };
        },
      };
      return Object.assign(chain, {
        then(resolve: (v: any) => void, reject: (e: any) => void) {
          return Promise.resolve({ data: result, error: null }).then(resolve, reject);
        },
      });
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

  const authProfile = { id: 'u1', email: 'admin@test.com' };
  const activeProfile = { user_id: 'u1', role: 'admin', active: true, store_id: 's1' };
  const storageOps: Array<{ op: string; path: string }> = [];

  return { data, Query, authProfile, activeProfile, storageOps };
});

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: (table: string) => new Query(table),
    storage: {
      from: () => ({
        remove: (paths: string[]) => {
          for (const p of paths) storageOps.push({ op: 'remove', path: p });
          return Promise.resolve({ data: null, error: null });
        },
        upload: (path: string) => {
          storageOps.push({ op: 'upload', path });
          return Promise.resolve({ data: { path }, error: null });
        },
      }),
    },
  },
}));

// Mock auth-helpers-nextjs to control auth state
let mockUser: { id: string; email: string } | null = null;
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
    },
  }),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({}),
}));

const { POST: productImagesPOST, DELETE: productImagesDELETE } = await import(
  '@/app/api/admin/product-images/route'
);
const { POST: uploadPOST, DELETE: uploadDELETE } = await import(
  '@/app/api/admin/upload-image/route'
);

function makeJsonRequest(body: any): Request {
  return new Request('http://localhost/api/admin/product-images', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeUploadRequest(body: any): Request {
  return new Request('http://localhost/api/admin/upload-image', {
    method: 'POST',
    body,
  });
}

describe('admin image endpoints', () => {
  const UUID_S1 = '11111111-1111-1111-1111-111111111111';
  const UUID_S2 = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    data.products = [
      { id: UUID_S1, store_id: 's1', name: 'X-Burger', slug: 'x-burger', base_price: 25, active: true },
      { id: UUID_S2, store_id: 's2', name: 'Outra Loja', slug: 'outra', base_price: 30, active: true },
    ];
    data.product_images = [];
    data.admin_profiles = [activeProfile];
    data.audit_logs = [];
    storageOps.length = 0;
    mockUser = authProfile;
  });

  // =========================================================
  // /api/admin/product-images
  // =========================================================

  describe('product-images POST', () => {
    it('admin não autenticado retorna 401', async () => {
      mockUser = null;
      const res = await productImagesPOST(makeJsonRequest({ productId: UUID_S1, path: `products/${UUID_S1}/img.jpg` }) as any);
      expect(res.status).toBe(401);
    });

    it('admin inativo retorna 403', async () => {
      data.admin_profiles = [{ ...activeProfile, active: false }];
      const res = await productImagesPOST(makeJsonRequest({ productId: UUID_S1, path: `products/${UUID_S1}/img.jpg` }) as any);
      expect(res.status).toBe(403);
    });

    it('productId de outra loja retorna 403', async () => {
      const res = await productImagesPOST(makeJsonRequest({ productId: UUID_S2, path: `products/${UUID_S2}/img.jpg` }) as any);
      expect(res.status).toBe(403);
      expect(data.product_images).toHaveLength(0);
    });

    it('path inválido retorna 400', async () => {
      const res = await productImagesPOST(makeJsonRequest({ productId: UUID_S1, path: '../etc/passwd' }) as any);
      expect(res.status).toBe(400);
    });

    it('POST válido passa para produto da loja', async () => {
      const res = await productImagesPOST(makeJsonRequest({ productId: UUID_S1, path: `products/${UUID_S1}/img.jpg` }) as any);
      expect(res.status).toBe(200);
      expect(data.product_images).toHaveLength(1);
      expect(data.product_images[0].product_id).toBe(UUID_S1);
      expect(data.product_images[0].path).toBe(`products/${UUID_S1}/img.jpg`);
    });

    it('sem productId retorna 400', async () => {
      const res = await productImagesPOST(makeJsonRequest({ path: `products/${UUID_S1}/img.jpg` }) as any);
      expect(res.status).toBe(400);
    });
  });

  describe('product-images DELETE', () => {
    beforeEach(() => {
      data.product_images = [
        { id: 'img1', product_id: UUID_S1, path: `products/${UUID_S1}/img.jpg`, is_cover: true, alt_text: null, position: 0, created_at: '' },
      ];
    });

    it('admin não autenticado retorna 401', async () => {
      mockUser = null;
      const req = new Request(`http://localhost/api/admin/product-images?productId=${UUID_S1}&path=products/${UUID_S1}/img.jpg`, { method: 'DELETE' });
      const res = await productImagesDELETE(req as any);
      expect(res.status).toBe(401);
    });

    it('productId de outra loja retorna 403', async () => {
      const req = new Request(`http://localhost/api/admin/product-images?productId=${UUID_S2}&path=products/${UUID_S2}/img.jpg`, { method: 'DELETE' });
      const res = await productImagesDELETE(req as any);
      expect(res.status).toBe(403);
      expect(data.product_images.find((i) => i.id === 'img1')).toBeDefined();
    });

    it('DELETE válido passa somente para produto da loja', async () => {
      const req = new Request(`http://localhost/api/admin/product-images?productId=${UUID_S1}&path=products/${UUID_S1}/img.jpg`, { method: 'DELETE' });
      const res = await productImagesDELETE(req as any);
      expect(res.status).toBe(200);
      expect(data.product_images).toHaveLength(0);
      expect(storageOps.some((o) => o.op === 'remove' && o.path === `products/${UUID_S1}/img.jpg`)).toBe(true);
    });
  });

  // =========================================================
  // /api/admin/upload-image
  // =========================================================

  describe('upload-image POST', () => {
    function makeFile(type = 'image/jpeg', name = 'test.jpg'): File {
      return new File(['conteudo'], name, { type });
    }

    it('admin não autenticado retorna 401', async () => {
      mockUser = null;
      const fd = new FormData();
      fd.set('file', makeFile());
      fd.set('path', `products/${UUID_S1}/img.jpg`);
      const res = await uploadPOST(makeUploadRequest(fd) as any);
      expect(res.status).toBe(401);
    });

    it('admin inativo retorna 403', async () => {
      data.admin_profiles = [{ ...activeProfile, active: false }];
      const fd = new FormData();
      fd.set('file', makeFile());
      fd.set('path', `products/${UUID_S1}/img.jpg`);
      const res = await uploadPOST(makeUploadRequest(fd) as any);
      expect(res.status).toBe(403);
    });

    it('path inválido retorna 400', async () => {
      const fd = new FormData();
      fd.set('file', makeFile());
      fd.set('path', '../etc/passwd');
      const res = await uploadPOST(makeUploadRequest(fd) as any);
      expect(res.status).toBe(400);
    });

    it('mime não permitido retorna 400', async () => {
      const fd = new FormData();
      fd.set('file', makeFile('application/pdf'));
      fd.set('path', `products/${UUID_S1}/file.pdf`);
      const res = await uploadPOST(makeUploadRequest(fd) as any);
      expect(res.status).toBe(400);
    });

    it('productId de outra loja (path) retorna 403', async () => {
      const fd = new FormData();
      fd.set('file', makeFile());
      fd.set('path', `products/${UUID_S2}/img.jpg`);
      const res = await uploadPOST(makeUploadRequest(fd) as any);
      expect(res.status).toBe(403);
    });

    it('POST válido passa para produto da loja', async () => {
      const fd = new FormData();
      fd.set('file', makeFile());
      fd.set('path', `products/${UUID_S1}/img.jpg`);
      const res = await uploadPOST(makeUploadRequest(fd) as any);
      expect(res.status).toBe(200);
      expect(storageOps.some((o) => o.op === 'upload' && o.path === `products/${UUID_S1}/img.jpg`)).toBe(true);
    });

    it('aceita productId via FormData quando path não tem UUID', async () => {
      const fd = new FormData();
      fd.set('file', makeFile());
      fd.set('path', `products/${UUID_S1}/cover.jpg`);
      fd.set('productId', UUID_S1);
      const res = await uploadPOST(makeUploadRequest(fd) as any);
      expect(res.status).toBe(200);
    });
  });

  describe('upload-image DELETE', () => {
    it('admin não autenticado retorna 401', async () => {
      mockUser = null;
      const req = new Request(`http://localhost/api/admin/upload-image?path=products/${UUID_S1}/img.jpg`, { method: 'DELETE' });
      const res = await uploadDELETE(req as any);
      expect(res.status).toBe(401);
    });

    it('path de produto de outra loja retorna 403', async () => {
      const req = new Request(`http://localhost/api/admin/upload-image?path=products/${UUID_S2}/img.jpg`, { method: 'DELETE' });
      const res = await uploadDELETE(req as any);
      expect(res.status).toBe(403);
    });

    it('path inválido retorna 400', async () => {
      const req = new Request('http://localhost/api/admin/upload-image?path=../etc/passwd', { method: 'DELETE' });
      const res = await uploadDELETE(req as any);
      expect(res.status).toBe(400);
    });

    it('DELETE válido passa somente para produto da loja', async () => {
      const req = new Request(`http://localhost/api/admin/upload-image?path=products/${UUID_S1}/img.jpg`, { method: 'DELETE' });
      const res = await uploadDELETE(req as any);
      expect(res.status).toBe(200);
      expect(storageOps.some((o) => o.op === 'remove' && o.path === `products/${UUID_S1}/img.jpg`)).toBe(true);
    });
  });
});
