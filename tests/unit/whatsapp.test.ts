import { describe, it, expect } from 'vitest';
import { formatWhatsAppMessage, generateShortCartId } from '@/features/whatsapp/formatOrder';
import { Store } from '@/types/database';

const mockStore: Store = {
  id: 'store-1',
  name: "Tremeliko's Burguer",
  slug: 'tremelikos-burguer',
  description: 'Hambúrguer na brasa',
  phone: '5573991542371',
  whatsapp: '5573991542371',
  timezone: 'America/Sao_Paulo',
  minimum_order: 15.0,
  address: 'Rua Gonçalves da Costa, 3',
  city: 'Jequié',
  state: 'BA',
  zip_code: '45208-089',
  logo_url: null,
  active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('formatWhatsAppMessage', () => {
  it('formats message with single item', () => {
    const message = formatWhatsAppMessage({
      cartId: 'ABC123',
      store: mockStore,
      items: [
        {
          id: '1',
          product: {
            id: 'p1',
            store_id: 'store-1',
            name: 'Cheese Burguer',
            slug: 'cheese-burguer',
            description: 'Pão, carne e queijo',
            base_price: 14.99,
            active: true,
            available: true,
            featured: false,
            badge: null,
            sku: null,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          quantity: 1,
        },
      ],
      subtotal: 14.99,
      minimumOrder: 15.0,
    });

    expect(message).toContain('Tremeliko');
    expect(message).toContain('ABC123');
    expect(message).toContain('Cheese Burguer');
    expect(message).toContain('R$ 14,99');
  });

  it('includes observations', () => {
    const message = formatWhatsAppMessage({
      cartId: 'XYZ789',
      store: mockStore,
      items: [
        {
          id: '1',
          product: {
            id: 'p1',
            store_id: 'store-1',
            name: 'Cheese Bacon',
            slug: 'cheese-bacon',
            description: 'Pão, carne, queijo e bacon',
            base_price: 24.5,
            active: true,
            available: true,
            featured: false,
            badge: null,
            sku: null,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          quantity: 1,
          observations: 'Sem cebola',
        },
      ],
      subtotal: 24.5,
      minimumOrder: 15.0,
    });

    expect(message).toContain('Sem cebola');
  });
});

describe('generateShortCartId', () => {
  it('generates 6 character alphanumeric id', () => {
    const id = generateShortCartId();
    expect(id).toHaveLength(6);
    expect(id).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateShortCartId()));
    expect(ids.size).toBeGreaterThan(90);
  });
});
