import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProduct, SIZES } from '../data/products.js';
import { KEYS, readJSON, writeJSON } from '../lib/storage.js';
import { useCart } from './CartContext.jsx';
import { qtyInCart } from './cartReducer.js';

// Stock is simulated: base counts come from the product data, and units sold
// through the mock checkout are subtracted and remembered in localStorage.
const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [sold, setSold] = useState(() => readJSON(KEYS.inventory, {}));
  const { items } = useCart();

  useEffect(() => {
    writeJSON(KEYS.inventory, sold);
  }, [sold]);

  const stockOf = useCallback(
    (productId, size) => {
      const product = getProduct(productId);
      if (!product) return 0;
      return Math.max(0, (product.stock[size] ?? 0) - (sold[productId]?.[size] ?? 0));
    },
    [sold],
  );

  const totalOf = useCallback((productId) => SIZES.reduce((s, size) => s + stockOf(productId, size), 0), [stockOf]);

  /** Units still available to add, after what's already in the cart. */
  const availableOf = useCallback(
    (productId, size, exceptKey) => Math.max(0, stockOf(productId, size) - qtyInCart(items, productId, size, exceptKey)),
    [stockOf, items],
  );

  const commitOrder = useCallback((orderItems) => {
    setSold((prev) => {
      const next = structuredClone(prev);
      for (const i of orderItems) {
        next[i.productId] ??= {};
        next[i.productId][i.size] = (next[i.productId][i.size] ?? 0) + i.qty;
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ stockOf, totalOf, availableOf, commitOrder }), [stockOf, totalOf, availableOf, commitOrder]);
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside InventoryProvider');
  return ctx;
}
