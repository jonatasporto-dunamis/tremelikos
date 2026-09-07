import { describe, it, expect } from 'vitest';
import { computeServerStoreStatus } from '@/features/storeStatus/serverStoreStatus';
import type { Store, BusinessHour, StoreOverride } from '@/types/database';

function at(y: number, m: number, d: number, hh: number, mm = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm, 0));
}

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
  delivery_min_minutes: 0,
  delivery_max_minutes: 0,
  delivery_areas: [],
  created_at: '',
  updated_at: '',
};

const hours: BusinessHour[] = [
  { id: '1', store_id: 'store-1', weekday: 2, opens_at: '18:30', closes_at: '23:00', closed: false },
  { id: '2', store_id: 'store-1', weekday: 3, opens_at: '18:30', closes_at: '23:00', closed: false },
  { id: '3', store_id: 'store-1', weekday: 4, opens_at: '18:30', closes_at: '23:00', closed: false },
  { id: '4', store_id: 'store-1', weekday: 5, opens_at: '18:30', closes_at: '23:00', closed: false },
  { id: '5', store_id: 'store-1', weekday: 6, opens_at: '18:30', closes_at: '23:00', closed: false },
];

describe('computeServerStoreStatus', () => {
  it('store active = false closes', () => {
    const result = computeServerStoreStatus({
      store: { ...store, active: false },
      businessHours: hours,
      overrides: [],
      now: at(2026, 9, 1, 19, 0),
    });
    expect(result.isOpen).toBe(false);
  });

  it('manual_pause = true closes', () => {
    const result = computeServerStoreStatus({
      store: { ...store, manual_pause: true },
      businessHours: hours,
      overrides: [],
      now: at(2026, 9, 1, 19, 0),
    });
    expect(result.isOpen).toBe(false);
  });

  it('normal schedule open', () => {
    const result = computeServerStoreStatus({
      store,
      businessHours: hours,
      overrides: [],
      now: at(2026, 9, 1, 19, 0),
    });
    expect(result.isOpen).toBe(true);
    expect(result.closingSoon).toBe(false);
  });

  it('normal schedule closed outside hours', () => {
    const result = computeServerStoreStatus({
      store,
      businessHours: hours,
      overrides: [],
      now: at(2026, 9, 1, 16, 0),
    });
    expect(result.isOpen).toBe(false);
    expect(result.nextOpenTime).toContain('Abre hoje');
  });

  it('override closed forces close', () => {
    const overrides: StoreOverride[] = [
      { id: '1', store_id: 'store-1', date: '2026-09-01', status: 'closed', opens_at: null, closes_at: null, reason: null },
    ];
    const result = computeServerStoreStatus({
      store,
      businessHours: hours,
      overrides,
      now: at(2026, 9, 1, 19, 0),
    });
    expect(result.isOpen).toBe(false);
  });

  it('override open within schedule opens', () => {
    const overrides: StoreOverride[] = [
      { id: '1', store_id: 'store-1', date: '2026-09-06', status: 'open', opens_at: '12:00', closes_at: '15:00', reason: null },
    ];
    const result = computeServerStoreStatus({
      store,
      businessHours: hours,
      overrides,
      now: at(2026, 9, 6, 13, 0),
    });
    expect(result.isOpen).toBe(true);
  });

  it('override open before schedule returns next open time', () => {
    const overrides: StoreOverride[] = [
      { id: '1', store_id: 'store-1', date: '2026-09-01', status: 'open', opens_at: '20:00', closes_at: '23:00', reason: null },
    ];
    const result = computeServerStoreStatus({
      store,
      businessHours: hours,
      overrides,
      now: at(2026, 9, 1, 19, 0),
    });
    expect(result.isOpen).toBe(false);
    expect(result.nextOpenTime).toContain('Abre hoje');
  });

  it('override date uses store timezone, not UTC', () => {
    const overrides: StoreOverride[] = [
      { id: '1', store_id: 'store-1', date: '2026-09-06', status: 'open', opens_at: '12:00', closes_at: '15:00', reason: null },
    ];
    const result = computeServerStoreStatus({
      store,
      businessHours: hours,
      overrides,
      now: at(2026, 9, 6, 13, 0),
    });
    expect(result.isOpen).toBe(true);
    expect(result.nextOpenTime).toBeNull();
  });
});
