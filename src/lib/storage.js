// localStorage can be unavailable (private mode) or full; never let that break the app.

/** `isValid` guards against stale or hand-edited data from an older build. */
export function readJSON(key, fallback, isValid = () => true) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

/** Returns true when the value was saved. */
export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const KEYS = {
  cart: 'topheavy.cart.v1',
  design: 'topheavy.design.v1',
  inventory: 'topheavy.inventory.v1',
  orders: 'topheavy.orders.v1',
};

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isCount = (n) => Number.isInteger(n) && n > 0;

export const isStoredCart = (v) =>
  isObject(v) &&
  Array.isArray(v.items) &&
  v.items.every((i) => isObject(i) && typeof i.key === 'string' && isCount(i.qty) && Number.isFinite(i.unitPrice));

export const isStoredInventory = (v) =>
  isObject(v) && Object.values(v).every((sizes) => isObject(sizes) && Object.values(sizes).every(Number.isInteger));

export const isStoredOrders = (v) => Array.isArray(v) && v.every((o) => isObject(o) && typeof o.id === 'string');
