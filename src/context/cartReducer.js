// Pure cart logic, kept separate from React so it can be unit tested.

export const initialCart = { items: [] };

export function lineKey({ productId, colorId, size, custom }) {
  return custom ? `custom:${custom.id}` : `${productId}:${colorId}:${size}`;
}

export function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const item = action.item;
      const key = lineKey(item);
      const existing = state.items.find((i) => i.key === key);
      if (existing) {
        return {
          items: state.items.map((i) => (i.key === key ? { ...i, qty: i.qty + item.qty } : i)),
        };
      }
      return { items: [...state.items, { ...item, key, addedAt: Date.now() }] };
    }
    case 'setQty': {
      if (action.qty <= 0) return { items: state.items.filter((i) => i.key !== action.key) };
      return { items: state.items.map((i) => (i.key === action.key ? { ...i, qty: action.qty } : i)) };
    }
    case 'remove':
      return { items: state.items.filter((i) => i.key !== action.key) };
    case 'clear':
      return initialCart;
    default:
      return state;
  }
}

export function cartTotals(items, { shipping = 'standard' } = {}) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const shippingCost = count === 0 ? 0 : shipping === 'express' ? 14.95 : subtotal >= 75 ? 0 : 5.95;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  return { subtotal, count, shippingCost, tax, total: subtotal + shippingCost + tax };
}

/** Units of a product/size already in the cart, optionally ignoring one line. */
export function qtyInCart(items, productId, size, exceptKey) {
  return items
    .filter((i) => i.productId === productId && i.size === size && i.key !== exceptKey)
    .reduce((s, i) => s + i.qty, 0);
}
