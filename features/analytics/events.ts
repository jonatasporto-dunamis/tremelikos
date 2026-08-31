'use client';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
  }
}

export function pushToDataLayer(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

export function trackViewMenu() {
  pushToDataLayer('view_menu');
}

export function trackViewItem(product: { id: string; name: string; category: string; price: number }) {
  pushToDataLayer('view_item', {
    currency: 'BRL',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
      },
    ],
  });
}

export function trackAddToCart(product: { id: string; name: string; price: number }, quantity: number) {
  pushToDataLayer('add_to_cart', {
    currency: 'BRL',
    value: product.price * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity,
      },
    ],
  });
}

export function trackRemoveFromCart(product: { id: string; name: string; price: number }) {
  pushToDataLayer('remove_from_cart', {
    currency: 'BRL',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
      },
    ],
  });
}

export function trackBeginCheckout(value: number, itemCount: number) {
  pushToDataLayer('begin_checkout', {
    currency: 'BRL',
    value,
    num_items: itemCount,
  });
}

export function trackWhatsAppOrder(value: number, cartId: string) {
  pushToDataLayer('whatsapp_order', {
    currency: 'BRL',
    value,
    cart_id: cartId,
    transaction_id: cartId,
  });
}
