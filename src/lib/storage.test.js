import { describe, expect, it } from 'vitest';
import { isStoredCart, isStoredInventory, isStoredOrders } from './storage.js';

describe('stored data guards', () => {
  it('accepts a well-formed cart and rejects broken ones', () => {
    expect(isStoredCart({ items: [] })).toBe(true);
    expect(isStoredCart({ items: [{ key: 'a', qty: 2, unitPrice: 22 }] })).toBe(true);
    expect(isStoredCart({ items: 'nope' })).toBe(false);
    expect(isStoredCart({ items: [{ key: 'a', qty: 0, unitPrice: 22 }] })).toBe(false);
    expect(isStoredCart({ items: [{ key: 'a', qty: 1, unitPrice: '22' }] })).toBe(false);
    expect(isStoredCart(null)).toBe(false);
  });

  it('checks inventory counts and orders', () => {
    expect(isStoredInventory({ 'everyday-crew': { M: 2 } })).toBe(true);
    expect(isStoredInventory({ 'everyday-crew': { M: 'lots' } })).toBe(false);
    expect(isStoredInventory([])).toBe(false);
    expect(isStoredOrders([{ id: 'FP-1' }])).toBe(true);
    expect(isStoredOrders({ id: 'FP-1' })).toBe(false);
  });
});
