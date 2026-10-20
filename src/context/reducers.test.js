import { describe, expect, it } from 'vitest';
import { cartReducer, cartTotals, initialCart, qtyInCart } from './cartReducer.js';
import { designReducer, fromStored, initialDesign, toStored } from './designReducer.js';

const shirt = { productId: 'everyday-crew', colorId: 'black', size: 'M', qty: 1, unitPrice: 22, custom: null };

describe('cartReducer', () => {
  it('merges identical plain shirts into one line', () => {
    let s = cartReducer(initialCart, { type: 'add', item: shirt });
    s = cartReducer(s, { type: 'add', item: { ...shirt, qty: 2 } });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].qty).toBe(3);
  });

  it('keeps each custom design as its own line', () => {
    let s = cartReducer(initialCart, { type: 'add', item: { ...shirt, custom: { id: 'a' } } });
    s = cartReducer(s, { type: 'add', item: { ...shirt, custom: { id: 'b' } } });
    expect(s.items).toHaveLength(2);
    expect(qtyInCart(s.items, 'everyday-crew', 'M')).toBe(2);
  });

  it('removes a line when quantity drops to zero', () => {
    let s = cartReducer(initialCart, { type: 'add', item: shirt });
    s = cartReducer(s, { type: 'setQty', key: s.items[0].key, qty: 0 });
    expect(s.items).toHaveLength(0);
  });

  it('gives free standard shipping from $75', () => {
    expect(cartTotals([{ ...shirt, qty: 2 }]).shippingCost).toBe(5.95);
    expect(cartTotals([{ ...shirt, qty: 4 }]).shippingCost).toBe(0);
    expect(cartTotals([{ ...shirt, qty: 4 }], { shipping: 'express' }).shippingCost).toBe(14.95);
  });
});

describe('designReducer', () => {
  const placed = { src: 'data:a', storageSrc: 'data:a', naturalWidth: 10, naturalHeight: 10, widthRatio: 0.5, cx: 0.5, cy: 0.3, rotation: 0 };

  it('keeps the color when the new style offers it, otherwise picks the first', () => {
    const s = designReducer({ ...initialDesign, colorId: 'black' }, { type: 'setProduct', productId: 'heavyweight-box' });
    expect(s.colorId).toBe('black');
    const t = designReducer({ ...initialDesign, colorId: 'red' }, { type: 'setProduct', productId: 'heavyweight-box' });
    expect(t.colorId).toBe('black');
  });

  it('undoes one image edit', () => {
    let s = designReducer(initialDesign, { type: 'setDesign', side: 'front', design: placed });
    s = designReducer(s, { type: 'replaceImage', side: 'front', fields: { src: 'data:b' } });
    expect(s.designs.front.src).toBe('data:b');
    s = designReducer(s, { type: 'undoImage', side: 'front' });
    expect(s.designs.front.src).toBe('data:a');
  });

  it('round-trips through storage without undo history', () => {
    let s = designReducer(initialDesign, { type: 'setDesign', side: 'back', design: placed });
    s = designReducer(s, { type: 'replaceImage', side: 'back', fields: { src: 'data:b', storageSrc: 'data:b' } });
    const restored = fromStored(JSON.parse(JSON.stringify(toStored(s))));
    expect(restored.designs.back.src).toBe('data:b');
    expect(restored.designs.back.previous).toBeNull();
    expect(restored.designs.front).toBeNull();
  });
});
