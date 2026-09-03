import { describe, it, expect, beforeEach, vi } from 'vitest';

// Polyfill mínimo de localStorage/cookie para ambiente Node
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
  key(i: number) { return Array.from(this.data.keys())[i] ?? null; }
  get length() { return this.data.size; }
}

beforeEach(() => {
  (globalThis as any).localStorage = new MemoryStorage();
  (globalThis as any).document = { cookie: '' };
  (globalThis as any).window = (globalThis as any).window || {
    dataLayer: [],
    fbq: vi.fn(),
  };
  (globalThis as any).window.dataLayer = [];
  (globalThis as any).window.fbq = vi.fn();
  (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true });
});

import { trackPurchase, trackCouponApply, trackWhatsAppOrder } from '@/features/analytics/events';

describe('trackPurchase — dedup event_id', () => {
  it('usa transaction_id como event_id (para dedup com CAPI)', () => {
    trackPurchase({
      transaction_id: 'TX-ABC-001',
      value: 100,
      order_type: 'pickup',
      items: [{ item_id: 'p1', item_name: 'X-Burger', price: 50, quantity: 2 }],
    });

    const dataLayer = (window as any).dataLayer;
    const ev = dataLayer.find((e: any) => e.event === 'purchase');
    expect(ev).toBeTruthy();
    expect(ev.event_id).toBe('TX-ABC-001');
    expect(ev.transaction_id).toBe('TX-ABC-001');
  });

  it('pixel fbq recebe Purchase com mesmo eventID do dataLayer', () => {
    trackPurchase({
      transaction_id: 'TX-XYZ',
      value: 50,
      order_type: 'delivery',
      items: [{ item_id: 'p1', item_name: 'Y', price: 50, quantity: 1 }],
    });
    const fbq = (window as any).fbq as ReturnType<typeof vi.fn>;
    const purchaseCall = fbq.mock.calls.find((c) => c[1] === 'Purchase');
    expect(purchaseCall).toBeTruthy();
    expect((purchaseCall as any)[3]).toEqual({ eventID: 'TX-XYZ' });
  });

  it('pixel fbq recebe Lead com eventID derivado (sufixo _lead)', () => {
    trackPurchase({
      transaction_id: 'TX-LEAD',
      value: 30,
      order_type: 'pickup',
      items: [{ item_id: 'p1', item_name: 'Z', price: 30, quantity: 1 }],
    });
    const fbq = (window as any).fbq as ReturnType<typeof vi.fn>;
    const leadCall = fbq.mock.calls.find((c) => c[1] === 'Lead');
    expect(leadCall).toBeTruthy();
    expect((leadCall as any)[3]).toEqual({ eventID: 'TX-LEAD_lead' });
  });

  it('valor/currency/itens presentes no payload do dataLayer', () => {
    trackPurchase({
      transaction_id: 'TX-1',
      value: 99.9,
      order_type: 'delivery',
      payment_method: 'pix',
      coupon: 'DESC10',
      discount: 10,
      shipping: 5,
      items: [{ item_id: 'p1', item_name: 'X', price: 49.95, quantity: 2 }],
    });
    const ev = (window as any).dataLayer.find((e: any) => e.event === 'purchase');
    expect(ev.currency).toBe('BRL');
    expect(ev.value).toBe(99.9);
    expect(ev.coupon).toBe('DESC10');
    expect(ev.discount).toBe(10);
    expect(ev.shipping).toBe(5);
  });
});

describe('trackWhatsAppOrder', () => {
  it('inclui event_id consistente com cartId', () => {
    trackWhatsAppOrder(75, 'CART-1');
    const ev = (window as any).dataLayer.find((e: any) => e.event === 'whatsapp_order');
    expect(ev).toBeTruthy();
    expect(ev.cart_id).toBe('CART-1');
    expect(ev.transaction_id).toBe('CART-1');
    expect(ev.value).toBe(75);
  });
});

describe('trackCouponApply', () => {
  it('registra cupom aplicado no dataLayer', () => {
    trackCouponApply('DESC10', 10);
    const ev = (window as any).dataLayer.find((e: any) => e.event === 'coupon_apply');
    expect(ev).toBeTruthy();
    expect(ev.coupon).toBe('DESC10');
    expect(ev.discount).toBe(10);
  });
});
