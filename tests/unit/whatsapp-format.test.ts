import { describe, it, expect } from 'vitest';
import { formatWhatsAppMessage } from '@/features/whatsapp/formatOrder';
import type { CartItem } from '@/features/cart/cartTypes';
import type { Store } from '@/types/database';

const NOW = '2026-09-03T20:00:00Z';

const baseStore: Store = {
  id: 's1',
  name: "Tremeliko's Burguer",
  slug: 'tremeliko',
  phone: '73991542371',
  whatsapp: '5573991542371',
  address: 'Rua Gonçalves da Costa, 3',
  city: 'Jequié',
  state: 'BA',
  neighborhood: 'Jequiezinho',
  created_at: NOW,
  updated_at: NOW,
} as unknown as Store;

const item = (id: string, name: string, price: number, qty = 1, extras: Array<{ name: string; price: number }> = []): CartItem => ({
  id,
  quantity: qty,
  product: {
    id,
    name,
    base_price: price,
    slug: id,
    description: null,
    category_id: 'c1',
    is_active: true,
    is_featured: false,
    is_combo: false,
    position: 0,
    prep_minutes: null,
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  } as any,
  extras,
});

describe('formatWhatsAppMessage', () => {
  it('inclui nome da loja, pedido e itens', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'ABC123',
      store: baseStore,
      items: [item('p1', 'X-Burger', 25, 2)],
      subtotal: 50,
      minimumOrder: 15,
    });
    expect(msg).toContain("Tremeliko's Burguer");
    expect(msg).toContain('PEDIDO #ABC123');
    expect(msg).toContain('2x X-Burger');
    expect(msg).toContain('R$ 50,00');
  });

  it('formata extras na linha do item', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X-Burger', 25, 1, [{ name: 'Bacon', price: 3 }])],
      subtotal: 28,
      minimumOrder: 15,
    });
    expect(msg).toContain('Bacon');
    expect(msg).toContain('+R$ 3,00');
  });

  it('formata removedIngredients com "Sem:"', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [{ ...item('p1', 'X-Burger', 25), removedIngredients: ['Cebola', 'Picles'] }],
      subtotal: 25,
      minimumOrder: 15,
    });
    expect(msg).toContain('- Sem: Cebola, Picles');
  });

  it('formata observations com 📝', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [{ ...item('p1', 'X-Burger', 25), observations: 'Sem sal' }],
      subtotal: 25,
      minimumOrder: 15,
    });
    expect(msg).toContain('Sem sal');
    expect(msg).toContain('📝');
  });

  it('inclui dados de contato', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X', 10)],
      subtotal: 10,
      minimumOrder: 15,
      contact: { name: 'João', phone: '73999999999' },
    });
    expect(msg).toMatch(/Cliente:.*João/);
    expect(msg).toContain('73999999999');
  });

  it('inclui modalidade de entrega', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X', 10)],
      subtotal: 10,
      minimumOrder: 15,
      orderType: 'delivery',
      deliveryAddress: { address: 'Rua A, 10', neighborhood: 'Centro', city: 'Jequié' },
    });
    expect(msg).toContain('Entrega 🛵');
    expect(msg).toContain('Rua A, 10');
    expect(msg).toContain('Centro');
  });

  it('inclui modalidade de retirada', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X', 10)],
      subtotal: 10,
      minimumOrder: 15,
      orderType: 'pickup',
    });
    expect(msg).toContain('Retirada no balcão');
  });

  it('inclui forma de pagamento', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X', 10)],
      subtotal: 10,
      minimumOrder: 15,
      paymentMethod: 'pix',
    });
    expect(msg).toContain('PIX');
  });

  it('inclui taxa de entrega quando > 0', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X', 10)],
      subtotal: 10,
      minimumOrder: 15,
      orderType: 'delivery',
      deliveryFee: 5,
      deliveryAddress: { address: 'R A' },
    });
    expect(msg).toContain('R$ 5,00');
  });

  it('formata cupom', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X', 100)],
      subtotal: 100,
      minimumOrder: 15,
      coupon: { code: 'DESC10', discount: 10 },
    });
    expect(msg).toContain('DESC10');
    expect(msg).toContain('R$ 10,00');
  });

  it('formata promoções aplicadas', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X-Burger', 25)],
      subtotal: 25,
      minimumOrder: 15,
      promotions: [{ productId: 'p1', productName: 'X-Burger', promotionName: '10% off', discount: 2.5 }],
    });
    expect(msg).toContain('10% off');
    expect(msg).toContain('X-Burger');
  });

  it('alerta quando abaixo do mínimo', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X', 5)],
      subtotal: 5,
      minimumOrder: 15,
    });
    expect(msg).toContain('Pedido mínimo');
    expect(msg).toContain('R$ 10,00'); // faltam
  });

  it('não alerta quando atinge o mínimo', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X', 20)],
      subtotal: 20,
      minimumOrder: 15,
    });
    expect(msg).not.toContain('Pedido mínimo');
  });

  it('formata agendamento', () => {
    const msg = formatWhatsAppMessage({
      cartId: 'X',
      store: baseStore,
      items: [item('p1', 'X', 10)],
      subtotal: 10,
      minimumOrder: 15,
      scheduledFor: new Date('2026-09-04T20:30:00Z'),
    });
    expect(msg).toMatch(/Agendado para:/);
  });
});
