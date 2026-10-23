import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { cartReducer, cartTotals, initialCart } from './cartReducer.js';
import { isStoredCart, KEYS, readJSON, writeJSON } from '../lib/storage.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCart, () => readJSON(KEYS.cart, initialCart, isStoredCart));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    writeJSON(KEYS.cart, state);
  }, [state]);

  const add = useCallback((item) => dispatch({ type: 'add', item }), []);
  const setQty = useCallback((key, qty) => dispatch({ type: 'setQty', key, qty }), []);
  const remove = useCallback((key) => dispatch({ type: 'remove', key }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo(
    () => ({ items: state.items, totals: cartTotals(state.items), add, setQty, remove, clear, drawerOpen, openDrawer, closeDrawer }),
    [state.items, add, setQty, remove, clear, drawerOpen, openDrawer, closeDrawer],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
