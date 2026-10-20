// Canvas compositing for the studio editor and the mockup generator.

import { buildShirtSvg, svgToDataUrl, getPrintArea, designBox, VIEW_W, VIEW_H } from './shirtSvg.js';
import { loadImage, makeCanvas } from './imageUtils.js';
import { luminance } from './color.js';

/** Shirt layer ('base' or 'shade') rasterized at a given pixel width. */
export function loadShirtLayer({ style, side, color, layer, px }) {
  const svg = buildShirtSvg({ style, side, color, layers: [layer], width: px, height: Math.round((px * VIEW_H) / VIEW_W) });
  return loadImage(svgToDataUrl(svg));
}

/** Draw a placed design into a context whose units are `scale` px per view-box unit. */
export function drawDesign(ctx, img, design, style, side, scale, { clip = true, alpha = 1 } = {}) {
  const pa = getPrintArea(style, side);
  const box = designBox(design, style, side);
  ctx.save();
  if (clip) {
    ctx.beginPath();
    ctx.rect(pa.x * scale, pa.y * scale, pa.w * scale, pa.h * scale);
    ctx.clip();
  }
  ctx.globalAlpha = alpha;
  ctx.translate(box.cx * scale, box.cy * scale);
  ctx.rotate((box.rotation * Math.PI) / 180);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (-box.w / 2) * scale, (-box.h / 2) * scale, box.w * scale, box.h * scale);
  ctx.restore();
}

// Deterministic randomness keeps generated backgrounds stable between renders.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let knitTile = null;
/** Jersey-knit noise tile, used with an overlay blend. */
function getKnitTile() {
  if (knitTile) return knitTile;
  const size = 96;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const rand = seeded(42);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const knit = (x % 3 === 0 ? -10 : 3) + (y % 2 === 0 ? 2 : -2);
      const v = 128 + knit + (rand() - 0.5) * 34;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  knitTile = c;
  return c;
}

function applyKnit(ctx, maskImg, w, h, strength = 0.5) {
  const tex = makeCanvas(w, h);
  const t = tex.getContext('2d');
  t.fillStyle = t.createPattern(getKnitTile(), 'repeat');
  t.fillRect(0, 0, w, h);
  t.globalCompositeOperation = 'destination-in';
  t.drawImage(maskImg, 0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = strength;
  ctx.drawImage(tex, 0, 0);
  ctx.restore();
}

/** One shirt side with its design, shading and fabric texture, on a transparent canvas. */
export async function composeShirt({ style, side, color, design, px = 1000 }) {
  const h = Math.round((px * VIEW_H) / VIEW_W);
  const [base, shadeImg, art] = await Promise.all([
    loadShirtLayer({ style, side, color, layer: 'base', px }),
    loadShirtLayer({ style, side, color, layer: 'shade', px }),
    design ? loadImage(design.src) : null,
  ]);
  const c = makeCanvas(px, h);
  const ctx = c.getContext('2d');
  ctx.drawImage(base, 0, 0, px, h);
  if (art) drawDesign(ctx, art, design, style, side, px / VIEW_W, { alpha: 0.97 });
  ctx.drawImage(shadeImg, 0, 0, px, h);
  applyKnit(ctx, base, px, h, 0.45);
  return c;
}

export const OUT_W = 1200;
export const OUT_H = 1400;

function studioBackground(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#F4F4F4');
  g.addColorStop(1, '#DCDCDC');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const spot = ctx.createRadialGradient(w * 0.45, h * 0.35, 40, w * 0.5, h * 0.45, w * 0.8);
  spot.addColorStop(0, 'rgba(255,255,255,0.7)');
  spot.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, w, h);
}

function floorShadow(ctx, cx, cy, rx, ry, alpha = 0.22) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Straight-on product shot. */
export function renderStudio(shirt) {
  const c = makeCanvas(OUT_W, OUT_H);
  const ctx = c.getContext('2d');
  studioBackground(ctx, OUT_W, OUT_H);
  const sw = 1000;
  const sh = (shirt.height / shirt.width) * sw;
  const x = (OUT_W - sw) / 2;
  const y = 100;
  floorShadow(ctx, OUT_W / 2, y + sh - 10, 420, 40, 0.18);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 22;
  ctx.drawImage(shirt, x, y, sw, sh);
  ctx.restore();
  return c;
}

/**
 * Three-quarter view: the flat shirt is wrapped around a cylinder, seen from
 * slightly above, and lit from the front left.
 */
export function renderAngled(shirt) {
  const c = makeCanvas(OUT_W, OUT_H);
  const ctx = c.getContext('2d');
  studioBackground(ctx, OUT_W, OUT_H);

  const W = shirt.width;
  const H = shirt.height;
  const warped = makeCanvas(OUT_W, OUT_H);
  const wctx = warped.getContext('2d');
  const R = W * 0.54;
  const turn = 0.46;
  const spread = 1.0;
  const light = -0.35;
  const minX = Math.sin(-spread + turn);
  const maxX = Math.sin(spread + turn);
  const cx = OUT_W / 2 - ((minX + maxX) / 2) * R;
  const cy = 100 + H / 2;
  const strip = 2;
  const columns = [];

  for (let sx = 0; sx < W; sx += strip) {
    const a1 = ((sx / W) * 2 - 1) * spread + turn;
    const a2 = (((sx + strip) / W) * 2 - 1) * spread + turn;
    const x1 = R * Math.sin(a1);
    const x2 = R * Math.sin(a2);
    const am = (a1 + a2) / 2;
    const z = Math.cos(am);
    const s = 0.9 + 0.12 * z;
    const dh = H * s;
    const dy = cy - dh / 2 + 26 * z;
    const dx = cx + x1;
    const dw = Math.max(0.5, x2 - x1) + 0.7;
    wctx.drawImage(shirt, sx, 0, strip, H, dx, dy, dw, dh);
    columns.push({ dx, dw, dy, dh, lit: Math.cos(am - light) });
  }

  // Shade by how much each part of the cylinder faces the light. One smooth
  // gradient per pass avoids banding where the strips overlap.
  const x0 = columns[0].dx;
  const x1 = columns[columns.length - 1].dx + columns[columns.length - 1].dw;
  const shadow = wctx.createLinearGradient(x0, 0, x1, 0);
  const shine = wctx.createLinearGradient(x0, 0, x1, 0);
  const step = Math.max(1, Math.floor(columns.length / 48));
  for (let i = 0; i < columns.length; i += step) {
    const col = columns[i];
    const t = Math.min(1, Math.max(0, (col.dx - x0) / (x1 - x0)));
    const dark = Math.max(0, 1 - Math.max(0, col.lit)) * 0.5;
    const glow = Math.max(0, col.lit - 0.94) * 1.2;
    shadow.addColorStop(t, `rgba(12,16,30,${dark.toFixed(3)})`);
    shine.addColorStop(t, `rgba(255,255,255,${glow.toFixed(3)})`);
  }
  wctx.globalCompositeOperation = 'source-atop';
  wctx.fillStyle = shadow;
  wctx.fillRect(x0, 0, x1 - x0, OUT_H);
  wctx.fillStyle = shine;
  wctx.fillRect(x0, 0, x1 - x0, OUT_H);

  floorShadow(ctx, cx + 30, cy + H * 0.5 + 10, 380, 44, 0.2);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 46;
  ctx.shadowOffsetX = 24;
  ctx.shadowOffsetY = 20;
  ctx.drawImage(warped, 0, 0);
  ctx.restore();
  return c;
}

function surface(ctx, w, h, dark, rand) {
  ctx.fillStyle = dark ? '#3F4652' : '#D5D8DB';
  ctx.fillRect(0, 0, w, h);
  // Mottled concrete.
  for (let i = 0; i < 70; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 60 + rand() * 260;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tone = rand() > 0.5 ? '255,255,255' : '0,0,0';
    g.addColorStop(0, `rgba(${tone},${(0.03 + rand() * 0.04).toFixed(3)})`);
    g.addColorStop(1, `rgba(${tone},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const grain = ctx.createImageData(w, h);
  for (let i = 0; i < grain.data.length; i += 4) {
    const v = 128 + (rand() - 0.5) * 60;
    grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = v;
    grain.data[i + 3] = 255;
  }
  const gc = makeCanvas(w, h);
  gc.getContext('2d').putImageData(grain, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.18;
  ctx.drawImage(gc, 0, 0);
  ctx.restore();
}

const MARK_W = 1949.02;
const MARK_H = 1686.87;
const MARK_POLYS = [
  [853.5, 1479.46, 973.25, 1686.88, 1949.02, 0, 1708.77, 0.43, 1315.41, 679.9, 1069.53, 681.03, 1221.75, 419.93, 982.2, 419.69, 610.32, 1058.26, 729.83, 1265.25, 948.9, 888.67, 1195.98, 887.36],
  [481.63, 421.36, 358.81, 208.62, 1345.58, 208.14, 1467.17, 0.23, 0, 1.15, 483.35, 838.34, 727.41, 419.58],
];

/** Draw the Top Heavy mark centered at (cx, cy), `width` px wide. */
function drawLogoMark(ctx, cx, cy, width, color) {
  const k = width / MARK_W;
  ctx.save();
  ctx.translate(cx - width / 2, cy - (MARK_H * k) / 2);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  for (const pts of MARK_POLYS) {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function hangTag(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 8;
  const tw = 150;
  const th = 230;
  ctx.fillStyle = '#C8A579';
  ctx.beginPath();
  ctx.moveTo(-tw / 2 + 24, 0);
  ctx.lineTo(tw / 2 - 24, 0);
  ctx.lineTo(tw / 2, 24);
  ctx.lineTo(tw / 2, th);
  ctx.lineTo(-tw / 2, th);
  ctx.lineTo(-tw / 2, 24);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(40,30,20,0.55)';
  ctx.beginPath();
  ctx.arc(0, 26, 8, 0, Math.PI * 2);
  ctx.fill();
  drawLogoMark(ctx, 0, 92, 74, '#000000');
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = '850 19px Archivo, "Helvetica Neue", Arial, sans-serif';
  if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
  ctx.fillText('TOP HEAVY', 0, 160);
  ctx.font = '450 15px Archivo, "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('TEES', 0, 179);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.font = '500 12px Archivo, "Helvetica Neue", Arial, sans-serif';
  if ('fontStretch' in ctx) ctx.fontStretch = 'normal';
  ctx.fillText('Printed to order', 0, 208);
  ctx.restore();
}

function leafShadows(ctx, w, h, rand) {
  const layer = makeCanvas(w, h);
  const l = layer.getContext('2d');
  l.fillStyle = 'rgba(8,12,20,1)';
  const stems = [
    { x: w * 0.98, y: -40, angle: 2.2, len: 560 },
    { x: w * 1.04, y: h * 0.22, angle: 2.6, len: 440 },
  ];
  for (const s of stems) {
    for (let i = 1; i <= 9; i++) {
      const t = i / 10;
      const px = s.x + Math.cos(s.angle) * s.len * t;
      const py = s.y + Math.sin(s.angle) * s.len * t;
      const side = i % 2 ? 1 : -1;
      l.save();
      l.translate(px, py);
      l.rotate(s.angle + side * (0.9 + rand() * 0.3));
      l.beginPath();
      l.ellipse(48, 0, 54 - t * 14, 17, 0, 0, Math.PI * 2);
      l.fill();
      l.restore();
    }
  }
  ctx.save();
  if ('filter' in ctx) ctx.filter = 'blur(14px)';
  ctx.globalAlpha = 0.2;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

/** Lifestyle flat lay on concrete with a hang tag and window light. */
export function renderFlatLay(shirt, color) {
  const c = makeCanvas(OUT_W, OUT_H);
  const ctx = c.getContext('2d');
  const rand = seeded(7);
  const darkSurface = luminance(color) > 0.3;
  surface(ctx, OUT_W, OUT_H, darkSurface, rand);

  const sw = 960;
  const sh = (shirt.height / shirt.width) * sw;
  const cx = OUT_W / 2 - 10;
  const cy = OUT_H / 2 + 10;
  const angle = -0.1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.shadowColor = darkSurface ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 16;
  ctx.drawImage(shirt, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();

  // Tag string runs from the collar to the tag.
  const collar = { x: cx + 40, y: cy - sh / 2 + 70 };
  const tag = { x: cx + 330, y: cy - sh / 2 + 40 };
  ctx.save();
  ctx.strokeStyle = 'rgba(245,245,240,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(collar.x, collar.y);
  ctx.bezierCurveTo(collar.x + 90, collar.y - 40, tag.x - 80, tag.y - 30, tag.x + 4, tag.y + 24);
  ctx.stroke();
  ctx.restore();
  hangTag(ctx, tag.x, tag.y, 0.24);

  // Window light and leaf shadows.
  const glow = ctx.createLinearGradient(0, 0, OUT_W, OUT_H);
  glow.addColorStop(0, 'rgba(255,250,240,0.18)');
  glow.addColorStop(0.55, 'rgba(255,250,240,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  leafShadows(ctx, OUT_W, OUT_H, rand);

  const v = ctx.createRadialGradient(OUT_W / 2, OUT_H / 2, OUT_W * 0.35, OUT_W / 2, OUT_H / 2, OUT_W * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  return c;
}

// A timer (not requestAnimationFrame) so generation keeps going in background tabs.
const tick = () => new Promise((r) => setTimeout(r, 16));

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Couldn’t export the image.'))), type, quality),
  );
}

/**
 * Generate every mockup view. Reports progress as { step, label, fraction }.
 * Returns [{ id, label, blob, url }]; callers revoke the urls when done.
 */
export async function generateMockups({ style, color, designs, onProgress, signal }) {
  const sides = ['front', 'back'].filter((s) => designs[s]);
  const primary = sides[0] ?? 'front';
  const plan = [
    ...sides.map((s) => ({ id: s, label: s === 'front' ? 'Front' : 'Back', kind: 'studio', side: s })),
    { id: 'angled', label: 'Angled', kind: 'angled', side: primary },
    { id: 'flatlay', label: 'Flat lay', kind: 'flatlay', side: primary },
  ];
  const total = plan.length + 1;
  const report = (i, label) => onProgress?.({ step: i, label, fraction: i / total });

  report(0, 'Preparing your artwork');
  await tick();
  const shirts = {};
  for (const s of new Set(plan.map((p) => p.side))) {
    shirts[s] = await composeShirt({ style, side: s, color, design: designs[s] });
    if (signal?.aborted) return null;
  }

  const views = [];
  for (let i = 0; i < plan.length; i++) {
    const view = plan[i];
    report(i + 1, `Rendering ${view.label.toLowerCase()} view`);
    await tick();
    if (signal?.aborted) return null;
    const shirt = shirts[view.side];
    const canvas =
      view.kind === 'angled' ? renderAngled(shirt) : view.kind === 'flatlay' ? renderFlatLay(shirt, color) : renderStudio(shirt);
    const blob = await canvasToBlob(canvas);
    views.push({ id: view.id, label: view.label, blob, url: URL.createObjectURL(blob) });
  }
  report(total, 'Done');
  return views;
}

/** Small JPEG thumbnail of the shirt for the cart. */
export async function makeCartPreview({ style, color, designs }) {
  const side = designs.front ? 'front' : designs.back ? 'back' : 'front';
  const shirt = await composeShirt({ style, side, color, design: designs[side], px: 400 });
  const c = makeCanvas(360, 420);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#E7E7E7';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(shirt, 10, 12, 340, (shirt.height / shirt.width) * 340);
  return c.toDataURL('image/jpeg', 0.84);
}
