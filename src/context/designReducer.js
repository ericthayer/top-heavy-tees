// Pure design-session logic: which shirt, which side, and the placed artwork
// for the front and back.

import { getProduct } from '../data/products.js';

export const initialDesign = {
  productId: 'everyday-crew',
  colorId: 'white',
  side: 'front',
  size: 'M',
  qty: 1,
  designs: { front: null, back: null },
};

const IMAGE_FIELDS = ['src', 'storageSrc', 'analysis', 'naturalWidth', 'naturalHeight', 'widthRatio', 'format', 'isVector'];
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

export function designReducer(state, action) {
  const withSide = (side, fn) => {
    const current = state.designs[side];
    return { ...state, designs: { ...state.designs, [side]: fn(current) } };
  };
  switch (action.type) {
    case 'setProduct': {
      const product = getProduct(action.productId);
      if (!product) return state;
      const colorId = product.colors.includes(action.colorId ?? state.colorId) ? action.colorId ?? state.colorId : product.colors[0];
      return { ...state, productId: product.id, colorId };
    }
    case 'setColor':
      return { ...state, colorId: action.colorId };
    case 'setSide':
      return { ...state, side: action.side };
    case 'setSize':
      return { ...state, size: action.size };
    case 'setQty':
      return { ...state, qty: Math.max(1, action.qty) };
    case 'setDesign':
      return withSide(action.side, () => action.design);
    case 'updateDesign':
      return withSide(action.side, (d) => (d ? { ...d, ...action.patch } : d));
    case 'replaceImage':
      // Image edits (background removal, trim) keep one step of undo.
      return withSide(action.side, (d) => (d ? { ...d, ...action.fields, previous: pick(d, IMAGE_FIELDS) } : d));
    case 'undoImage':
      return withSide(action.side, (d) => (d?.previous ? { ...d, ...d.previous, previous: null } : d));
    case 'removeDesign':
      return withSide(action.side, () => null);
    case 'reset':
      return { ...initialDesign };
    default:
      return state;
  }
}

/** Shape stored in localStorage: smaller image copies, no undo history. */
export function toStored(state, { withImages = true } = {}) {
  const strip = (d) => {
    if (!d || !withImages || !(d.storageSrc ?? d.src)) return null;
    const { previous, src, storageSrc, ...rest } = d;
    return { ...rest, storageSrc: storageSrc ?? src };
  };
  return { ...state, designs: { front: strip(state.designs.front), back: strip(state.designs.back) } };
}

export function fromStored(stored) {
  if (!stored || typeof stored !== 'object') return initialDesign;
  // Saved sessions can outlive a catalog change; drop anything that no longer resolves.
  const product = getProduct(stored.productId);
  if (!product) return initialDesign;
  const revive = (d) =>
    typeof d?.storageSrc === 'string' && d.storageSrc.startsWith('data:') ? { ...d, src: d.storageSrc, previous: null } : null;
  return {
    ...initialDesign,
    ...stored,
    colorId: product.colors.includes(stored.colorId) ? stored.colorId : product.colors[0],
    side: stored.side === 'back' ? 'back' : 'front',
    qty: Number.isInteger(stored.qty) && stored.qty > 0 ? stored.qty : initialDesign.qty,
    designs: { front: revive(stored.designs?.front), back: revive(stored.designs?.back) },
  };
}
