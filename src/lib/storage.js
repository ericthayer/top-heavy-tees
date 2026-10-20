// localStorage can be unavailable (private mode) or full; never let that break the app.

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
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
