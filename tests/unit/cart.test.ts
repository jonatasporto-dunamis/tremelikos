import { describe, it, expect } from 'vitest';
import { cartReducer, initialCartState, cartSubtotal, cartItemCount } from '@/features/cart/cartReducer';
import { CartItem } from '@/features/cart/cartTypes';
import type { Product } from '@/types/database';

const NOW = '2026-09-03T20:00:00Z';

const product = (id: string, base: number): Product => ({
  id,
  name: `P-${id}`,
  slug: id,
  description: null,
  base_price: base,
  category_id: 'c1',
  is_active: true,
  is_featured: false,
  is_combo: false,
  position: 0,
  prep_minutes: null,
  created_at: NOW,
  updated_at: NOW,
  deleted_at: null,
} as unknown as Product);

const item = (id: string, base: number, qty = 1, extras: Array<{ name: string; price: number }> = []): CartItem => ({
  id,
  quantity: qty,
  product: product(id, base),
  extras,
});

describe('cartReducer', () => {
  it('ADD_ITEM adiciona novo item e abre o carrinho', () => {
    const next = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10) });
    expect(next.items).toHaveLength(1);
    expect(next.isOpen).toBe(true);
  });

  it('ADD_ITEM com mesmo id: soma quantity', () => {
    let s = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10, 1) });
    s = cartReducer(s, { type: 'ADD_ITEM', payload: item('a', 10, 2) });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].quantity).toBe(3);
  });

  it('REMOVE_ITEM remove pelo id', () => {
    let s = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10) });
    s = cartReducer(s, { type: 'ADD_ITEM', payload: item('b', 5) });
    s = cartReducer(s, { type: 'REMOVE_ITEM', payload: 'a' });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].id).toBe('b');
  });

  it('UPDATE_QUANTITY altera qtd', () => {
    let s = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10, 1) });
    s = cartReducer(s, { type: 'UPDATE_QUANTITY', payload: { id: 'a', quantity: 5 } });
    expect(s.items[0].quantity).toBe(5);
  });

  it('UPDATE_QUANTITY com 0 mantém item (espera-se que caller faça REMOVE)', () => {
    let s = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10, 1) });
    s = cartReducer(s, { type: 'UPDATE_QUANTITY', payload: { id: 'a', quantity: 0 } });
    expect(s.items[0].quantity).toBe(0);
  });

  it('UPDATE_OBSERVATIONS define observação', () => {
    let s = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10) });
    s = cartReducer(s, { type: 'UPDATE_OBSERVATIONS', payload: { id: 'a', observations: 'Sem sal' } });
    expect(s.items[0].observations).toBe('Sem sal');
  });

  it('UPDATE_OBSERVATIONS com string vazia vira undefined', () => {
    let s = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10) });
    s = cartReducer(s, { type: 'UPDATE_OBSERVATIONS', payload: { id: 'a', observations: '' } });
    expect(s.items[0].observations).toBeUndefined();
  });

  it('UPDATE_EXTRAS substitui os adicionais', () => {
    let s = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10) });
    s = cartReducer(s, { type: 'UPDATE_EXTRAS', payload: { id: 'a', extras: [{ name: 'Bacon', price: 3 }] } });
    expect(s.items[0].extras).toEqual([{ name: 'Bacon', price: 3 }]);
  });

  it('UPDATE_REMOVED define ingredientes removidos', () => {
    let s = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10) });
    s = cartReducer(s, { type: 'UPDATE_REMOVED', payload: { id: 'a', removed: ['Cebola'] } });
    expect(s.items[0].removedIngredients).toEqual(['Cebola']);
  });

  it('CLEAR_CART esvazia', () => {
    let s = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: item('a', 10) });
    s = cartReducer(s, { type: 'CLEAR_CART' });
    expect(s.items).toEqual([]);
  });

  it('TOGGLE_CART alterna isOpen', () => {
    expect(initialCartState.isOpen).toBe(false);
    const a = cartReducer(initialCartState, { type: 'TOGGLE_CART' });
    expect(a.isOpen).toBe(true);
    const b = cartReducer(a, { type: 'TOGGLE_CART' });
    expect(b.isOpen).toBe(false);
  });

  it('SET_CART_OPEN força estado', () => {
    const a = cartReducer(initialCartState, { type: 'SET_CART_OPEN', payload: true });
    expect(a.isOpen).toBe(true);
  });

  it('ação desconhecida retorna state intacto', () => {
    const s = cartReducer(initialCartState, { type: 'UNKNOWN' as any });
    expect(s).toBe(initialCartState);
  });
});

describe('cartSubtotal', () => {
  it('soma preço * qtd', () => {
    expect(cartSubtotal([item('a', 10, 2), item('b', 5, 1)])).toBe(25);
  });

  it('inclui extras', () => {
    expect(cartSubtotal([item('a', 10, 1, [{ name: 'Bacon', price: 3 }, { name: 'Cheddar', price: 2 }])])).toBe(15);
  });

  it('0 para carrinho vazio', () => {
    expect(cartSubtotal([])).toBe(0);
  });
});

describe('cartItemCount', () => {
  it('soma quantity de todos os itens', () => {
    expect(cartItemCount([item('a', 10, 2), item('b', 5, 3)])).toBe(5);
  });
});
