// Studio-quality product images, rendered in the browser by the mockup engine.
// Renders run one at a time so the page stays responsive, are cached by key,
// and are handed out as object URLs.

import { composeShirt, renderStudio, renderAngled, renderFlatLay, canvasToBlob, OUT_W, OUT_H } from './mockup.js';
import { makeCanvas } from './imageUtils.js';

const pending = new Map();
const ready = new Map();
let queue = Promise.resolve();
const yieldToBrowser = () => new Promise((r) => setTimeout(r, 0));

function normalize({ style, color, side = 'front', view = 'studio', width = 720, design = null }) {
  return { style, color, side, view, width, design };
}

export function shotKey(opts) {
  const o = normalize(opts);
  return [o.style, o.color, o.side, o.view, o.width, o.design?.key ?? ''].join('|');
}

/** An already-rendered shot, or null. Lets cached images appear without a flash. */
export function peekShot(opts) {
  return ready.get(shotKey(opts)) ?? null;
}

/**
 * Resolve to an object URL for a product shot.
 * view: 'studio' (straight on), 'angled' or 'flatlay'. `design` is optional,
 * uses the studio's normalized placement, and needs a `key` for caching.
 */
export function productShot(opts) {
  const o = normalize(opts);
  const key = shotKey(o);
  if (pending.has(key)) return pending.get(key);
  const run = queue.then(yieldToBrowser).then(async () => {
    const shirt = await composeShirt({ style: o.style, side: o.side, color: o.color, design: o.design, px: 1000 });
    const full = o.view === 'angled' ? renderAngled(shirt) : o.view === 'flatlay' ? renderFlatLay(shirt, o.color) : renderStudio(shirt);
    const out = makeCanvas(o.width, Math.round((o.width * OUT_H) / OUT_W));
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(full, 0, 0, out.width, out.height);
    const blob = await canvasToBlob(out, 'image/webp', 0.9).catch(() => canvasToBlob(out, 'image/png'));
    const url = URL.createObjectURL(blob);
    ready.set(key, url);
    return url;
  });
  queue = run.catch(() => {});
  pending.set(key, run);
  run.catch(() => pending.delete(key));
  return run;
}
