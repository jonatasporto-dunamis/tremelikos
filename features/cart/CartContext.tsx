'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product } from '@/types/database';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  observations?: string;
  removedIngredients?: string[];
  extras?: Array<{ name: string; price: number }>;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_OBSERVATIONS'; payload: { id: string; observations: string } }
  | { type: 'UPDATE_EXTRAS'; payload: { id: string; extras: Array<{ name: string; price: number }> } }
  | { type: 'UPDATE_REMOVED'; payload: { id: string; removed: string[] } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART_OPEN'; payload: boolean };

const initialState: CartState = {
  items: [],
  isOpen: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: newItems, isOpen: true };
      }
      return { ...state, items: [...state.items, action.payload], isOpen: true };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        ),
      };
    case 'UPDATE_OBSERVATIONS':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, observations: action.payload.observations } : item
        ),
      };
    case 'UPDATE_EXTRAS':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, extras: action.payload.extras } : item
        ),
      };
    case 'UPDATE_REMOVED':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, removedIngredients: action.payload.removed } : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'SET_CART_OPEN':
      return { ...state, isOpen: action.payload };
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  subtotal: number;
  itemCount: number;
  addItem: (item: Omit<CartItem, 'id'> & { id?: string }) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'tremelikos_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

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

  const subtotal = state.items.reduce((sum, item) => {
    const extrasTotal = item.extras?.reduce((s, e) => s + e.price, 0) || 0;
    return sum + (item.product.base_price + extrasTotal) * item.quantity;
  }, 0);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = (item: Omit<CartItem, 'id'> & { id?: string }) => {
    const id = item.id || `${item.product.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    dispatch({ type: 'ADD_ITEM', payload: { ...item, id } as CartItem });
  };

  return (
    <CartContext.Provider value={{ state, dispatch, subtotal, itemCount, addItem }}>
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
