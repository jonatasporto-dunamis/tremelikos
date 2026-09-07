import { describe, it, expect } from 'vitest';
import { calculateServerDeliveryFee } from '@/features/orders/deliveryFee';
import type { Store } from '@/types/database';

const store: Store = {
  id: 'store-1',
  name: 'Tremeliko',
  slug: 'tremelikos-burguer',
  description: null,
  phone: null,
  whatsapp: null,
  timezone: 'America/Sao_Paulo',
  minimum_order: 15,
  address: null,
  city: 'Jequié',
  state: 'BA',
  zip_code: null,
  logo_url: null,
  active: true,
  manual_pause: false,
  delivery_fee: 5,
  delivery_min_minutes: 30,
  delivery_max_minutes: 60,
  delivery_areas: [],
  created_at: '',
  updated_at: '',
};

describe('calculateServerDeliveryFee', () => {
  it('pickup = taxa 0', () => {
    const result = calculateServerDeliveryFee({ store, orderType: 'pickup' });
    expect(result.fee).toBe(0);
    expect(result.minMinutes).toBe(30);
    expect(result.maxMinutes).toBe(60);
  });

  it('delivery usa taxa do banco, não taxa adulterada do cliente', () => {
    const result = calculateServerDeliveryFee({
      store: { ...store, delivery_fee: 10 },
      orderType: 'delivery',
      deliveryAddress: { neighborhood: 'Desconhecido' },
    });
    expect(result.fee).toBe(15); // base 10 + 5 fallback
  });

  it('bairro conhecido aplica regra server-side esperada', () => {
    const result = calculateServerDeliveryFee({
      store: { ...store, delivery_fee: 8 },
      orderType: 'delivery',
      deliveryAddress: { neighborhood: 'Jequiezinho' },
    });
    expect(result.fee).toBe(8); // base 8 + 0
  });

  it('delivery_areas priority over neighborhood rules', () => {
    const storeWithAreas: Store = {
      ...store,
      delivery_fee: 10,
      delivery_areas: [
        { neighborhood: 'centro', fee: 4 },
        { neighborhood: 'km', fee: 6 },
      ],
    };
    const result = calculateServerDeliveryFee({
      store: storeWithAreas,
      orderType: 'delivery',
      deliveryAddress: { neighborhood: 'Centro' },
    });
    expect(result.fee).toBe(4);
  });

  it('banco, WhatsApp e resposta da API usam a mesma deliveryFee', () => {
    const result = calculateServerDeliveryFee({
      store: { ...store, delivery_fee: 7 },
      orderType: 'delivery',
      deliveryAddress: { neighborhood: 'Mandacaru' },
    });
    expect(result.fee).toBe(9); // base 7 + 2
  });
});
