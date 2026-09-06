'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode, useMemo } from 'react';
import { trackAddToCart, trackRemoveFromCart } from '@/features/analytics/events';
import { CartItem } from './cartTypes';
export type { CartItem };
import { CartState, CartAction, cartReducer, initialCartState, cartSubtotal, cartItemCount } from './cartReducer';
import { useActivePromotions } from '@/features/promotions/PromotionsContext';
import { calculateCartPricing } from '@/features/pricing/pricingService';

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  subtotal: number;
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, 'id'> & { id?: string }) => void;
  removeItem: (id: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'tremelikos_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const { promotions, productPromotions } = useActivePromotions();

  useEffect(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.items?.length > 0) {
          parsed.items.forEach((item: CartItem) => {
            dispatch({ type: 'ADD_ITEM', payload: item });
          });
        }
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [state.items]);

  const subtotal = cartSubtotal(state.items);
  const itemCount = cartItemCount(state.items);

  const productPromoIds = useMemo(
    () => {
      const map = new Map<string, Set<string>>();
      for (const item of state.items) {
        const ids = productPromotions[item.product.id];
        if (ids?.length) map.set(item.product.id, new Set(ids));
      }
      return map;
    },
    [state.items, productPromotions]
  );

  const total = useMemo(
    () => calculateCartPricing(state.items, promotions, productPromoIds, null).finalTotal,
    [state.items, promotions, productPromoIds]
  );

  const addItem = (item: Omit<CartItem, 'id'> & { id?: string }) => {
    const id = item.id || `${item.product.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const extrasTotal = item.extras?.reduce((s, e) => s + e.price, 0) || 0;
    const unitPrice = item.product.base_price + extrasTotal;
    trackAddToCart({
      item_id: item.product.id,
      item_name: item.product.name,
      item_category: (item.product as any).category?.name || undefined,
      price: unitPrice,
      quantity: item.quantity,
    });
    dispatch({ type: 'ADD_ITEM', payload: { ...item, id } as CartItem });
  };

  const removeItem = (id: string) => {
    const item = state.items.find((i) => i.id === id);
    if (item) {
      const extrasTotal = item.extras?.reduce((s, e) => s + e.price, 0) || 0;
      const unitPrice = item.product.base_price + extrasTotal;
      trackRemoveFromCart({
        item_id: item.product.id,
        item_name: item.product.name,
        price: unitPrice,
        quantity: item.quantity,
      });
    }
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  return (
    <CartContext.Provider value={{ state, dispatch, subtotal, itemCount, total, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
