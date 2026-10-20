import { lazy } from 'react';

// After a deploy, an open tab can ask for a chunk hash that no longer exists.
// Reload once to pick up the new build. The timestamp stops a reload loop when
// the failure is real (offline, server down) and lets the error boundary show it.
const RELOAD_KEY = 'topheavy.chunk-reload-at';
const RELOAD_COOLDOWN_MS = 30_000;

function isChunkError(err) {
  return /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i.test(
    String(err?.message ?? err),
  );
}

/** True when a reload was started; false when one already ran recently. */
function reloadOnce() {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY));
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** React.lazy with a one-time reload on stale chunks, plus a `preload()` hook. */
export function lazyRoute(factory) {
  let promise;
  // One shared request per chunk; a failure clears it so the next attempt retries.
  const fetchChunk = () =>
    (promise ??= factory().catch((err) => {
      promise = undefined;
      throw err;
    }));
  const load = () =>
    fetchChunk().catch((err) => {
      if (isChunkError(err) && reloadOnce()) return new Promise(() => {});
      throw err;
    });
  const Component = lazy(load);
  // Background warm-up must never trigger a reload or surface an error.
  Component.preload = () => {
    fetchChunk().catch(() => {});
  };
  return Component;
}

/** Warm route chunks once the browser is idle, so navigation doesn't wait on the network. */
export function preloadWhenIdle(routes) {
  const conn = navigator.connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return () => {};
  const run = () => routes.forEach((r) => r.preload());
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(run, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 2000);
  return () => window.clearTimeout(id);
}
