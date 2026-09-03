import { CartItem } from './cartTypes';

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_OBSERVATIONS'; payload: { id: string; observations: string | undefined } }
  | { type: 'UPDATE_EXTRAS'; payload: { id: string; extras: Array<{ name: string; price: number }> } }
  | { type: 'UPDATE_REMOVED'; payload: { id: string; removed: string[] } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART_OPEN'; payload: boolean };

export const initialCartState: CartState = {
  items: [],
  isOpen: false,
};

export function cartReducer(state: CartState, action: CartAction): CartState {
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
          item.id === action.payload.id
            ? { ...item, observations: action.payload.observations || undefined }
            : item
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

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const extrasTotal = item.extras?.reduce((s, e) => s + e.price, 0) || 0;
    return sum + (item.product.base_price + extrasTotal) * item.quantity;
  }, 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
