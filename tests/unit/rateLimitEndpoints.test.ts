import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createMockRequest } = (() => {
  function createMockRequest(url: string, init?: RequestInit): Request {
    return new Request(url, init);
  }
  return { createMockRequest };
})();

describe('rate limited endpoints return 429', () => {
  it('whatsapp/send rejects after limit', async () => {
    vi.mock('@/lib/supabase/server', () => ({
      supabaseAdmin: {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { active: true, store_id: 'store-1' }, error: null }),
            }),
          }),
          insert: () => Promise.resolve({ data: null, error: null }),
        }),
      },
    }));

    vi.mock('@/features/whatsapp/buildServerOrder', () => ({
      buildServerOrder: () => ({ cartId: 'c1', items: [], finalTotal: 0 }),
    }));

    vi.mock('@/features/whatsapp/formatOrder', () => ({
      formatWhatsAppMessage: () => 'msg',
      generateShortCartId: () => 'c1',
    }));

    vi.mock('@/features/orders/createOrder', () => ({
      createOrFindOrder: () => ({ orderId: 'o1', deliveryFee: 0 }),
    }));

    vi.mock('@/lib/waha', () => ({
      waha: { sendMessage: () => ({ success: true, messageId: 'm1' } as any) },
    }));

    const { POST } = await import('@/app/api/whatsapp/send/route');
    const req = createMockRequest('http://localhost/api/whatsapp/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
      body: JSON.stringify({ phone: '5511999999999', storeId: 'store-1', items: [] }),
    });

    for (let i = 0; i < 5; i++) {
      const res = await POST(req);
      if (i < 4) {
        expect(res.status).not.toBe(429);
      }
    }

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('requisições');
  });

  it('coupons/validate rejects after limit', async () => {
    vi.mock('@/lib/supabase/client', () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        }),
      },
    }));

    const { POST } = await import('@/app/api/coupons/validate/route');
    const req = createMockRequest('http://localhost/api/coupons/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.2' },
      body: JSON.stringify({ code: 'TEST' }),
    });

    for (let i = 0; i < 10; i++) {
      const res = await POST(req);
      if (i < 9) {
        expect(res.status).not.toBe(429);
      }
    }

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain('requisições');
  });

  it('analytics/events rejects after limit', async () => {
    const { POST } = await import('@/app/api/analytics/events/route');
    const req = createMockRequest('http://localhost/api/analytics/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.3' },
      body: JSON.stringify({ event: 'page_view', payload: {}, consent: {} }),
    });

    for (let i = 0; i < 30; i++) {
      const res = await POST(req);
      if (i < 29) {
        expect(res.status).not.toBe(429);
      }
    }

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toBe('rate_limit_exceeded');
  });
});
