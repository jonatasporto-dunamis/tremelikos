'use client';

import { useEffect, useRef } from 'react';
import { useCart } from './CartContext';
import { trackCartAbandon } from '@/features/analytics/events';

const ABANDON_DELAY_MS = 30_000; // 30s no carrinho sem ação
const STORAGE_KEY = 'tremelikos_cart_abandoned';

export function CartAbandonTracker() {
  const { state, subtotal, itemCount } = useCart();
  const lastItems = useRef<number>(0);
  const lastValue = useRef<number>(0);
  const onCartPage = useRef<boolean>(false);
  const abandonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedThisSession = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    onCartPage.current = window.location.pathname.startsWith('/carrinho');
  });

  // Detecta entrada em /carrinho com itens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onRoute = () => {
      onCartPage.current = window.location.pathname.startsWith('/carrinho');
      if (onCartPage.current && itemCount > 0) {
        // começa a contar o tempo para abandono
        if (abandonTimer.current) clearTimeout(abandonTimer.current);
        abandonTimer.current = setTimeout(() => {
          if (!firedThisSession.current) {
            firedThisSession.current = true;
            trackCartAbandon({
              items: state.items.map((it) => {
                const ex = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
                return {
                  item_id: it.product.id,
                  item_name: it.product.name,
                  price: it.product.base_price + ex,
                  quantity: it.quantity,
                };
              }),
              value: subtotal,
              step: 'cart',
            });
            // também dispara o evento (não-conversão) para o Meta Audiences
            if (window.fbq) {
              window.fbq('trackCustom', 'CartAbandon', { value: subtotal, currency: 'BRL' });
            }
            try {
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                timestamp: Date.now(),
                value: subtotal,
                itemCount,
                items: state.items.map((it) => ({ id: it.product.id, name: it.product.name, qty: it.quantity })),
              }));
            } catch { /* noop */ }
          }
        }, ABANDON_DELAY_MS);
      } else if (!onCartPage.current && abandonTimer.current) {
        clearTimeout(abandonTimer.current);
        abandonTimer.current = null;
      }
    };
    onRoute();
    window.addEventListener('popstate', onRoute);
    const orig = window.history.pushState;
    window.history.pushState = function (...args) {
      orig.apply(this, args as any);
      setTimeout(onRoute, 0);
    };
    return () => {
      window.removeEventListener('popstate', onRoute);
      window.history.pushState = orig;
      if (abandonTimer.current) clearTimeout(abandonTimer.current);
    };
  }, [itemCount, state.items, subtotal]);

  // Detecta fechar aba com carrinho cheio
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      if (itemCount > 0 && !firedThisSession.current) {
        const items = state.items.map((it) => {
          const ex = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
          return {
            item_id: it.product.id,
            item_name: it.product.name,
            price: it.product.base_price + ex,
            quantity: it.quantity,
          };
        });
        const data = JSON.stringify({
          event: 'cart_abandon',
          payload: { value: subtotal, currency: 'BRL', items, step: 'unload' },
        });
        navigator.sendBeacon('/api/analytics/events', new Blob([data], { type: 'application/json' }));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            timestamp: Date.now(), value: subtotal, itemCount, items,
          }));
        } catch { /* noop */ }
      }
    };
    window.addEventListener('pagehide', handler);
    return () => window.removeEventListener('pagehide', handler);
  }, [itemCount, state.items, subtotal]);

  // Limpa flag quando o user faz uma compra (purchase/whatsapp_order)
  useEffect(() => {
    if (itemCount === 0 && firedThisSession.current) {
      firedThisSession.current = false;
    }
    lastItems.current = itemCount;
    lastValue.current = subtotal;
  }, [itemCount, subtotal]);

  return null;
}