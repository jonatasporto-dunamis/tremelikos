'use client';

const STORAGE_KEY = 'tremelikos:checkout';

export interface DeliveryAddress {
  address: string;
  neighborhood: string;
  city: string;
  zip: string;
  complement?: string;
}

export type OrderType = 'pickup' | 'delivery';
export type PaymentMethod = 'pix' | 'cash' | 'card' | 'whatsapp';

export interface SavedCheckout {
  orderType?: OrderType;
  deliveryAddress?: DeliveryAddress;
  paymentMethod?: PaymentMethod;
  deliveryFee?: number;
  notes?: string;
}

export function loadSaved(): SavedCheckout {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCheckout(data: Partial<SavedCheckout>) {
  if (typeof window === 'undefined') return;
  try {
    const cur = loadSaved();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...data }));
  } catch {
    /* ignore */
  }
}

export function clearCheckout() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
