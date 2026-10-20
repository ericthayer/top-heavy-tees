// Browser-side image handling: reading uploads, measuring them for the design
// check, and the two one-click fixes (background removal, trimming).

import { luminance } from './color.js';

export const ACCEPTED = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
};
export const ACCEPT_ATTR = '.png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml';
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_WORKING_SIDE = 4000; // larger rasters are scaled down for editing
const SVG_RASTER_SIDE = 2400;
const STORAGE_CHAR_BUDGET = 1_800_000;

export function fileFormat(file) {
  if (ACCEPTED[file.type]) return ACCEPTED[file.type];
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
  if (ext === 'svg') return 'svg';
  return null;
}

/** Returns an error message, or null when the file can be used. */
export function validateFile(file) {
  if (!file) return 'No file selected.';
  if (!fileFormat(file)) return `${file.name} isn’t a PNG, JPG or SVG. Export your design in one of those formats and try again.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 15 MB. Export a smaller version and try again.`;
  if (file.size === 0) return `${file.name} is empty.`;
  return null;
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

const imageCache = new Map();
export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This image couldn’t be opened. The file may be damaged.'));
    img.src = src;
  });
  imageCache.set(src, p);
  if (imageCache.size > 40) imageCache.delete(imageCache.keys().next().value);
  p.catch(() => imageCache.delete(src));
  return p;
}

function readFile(file, as, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`${file.name} couldn’t be read. Try saving it again.`));
    if (as === 'text') reader.readAsText(file);
    else reader.readAsDataURL(file);
  });
}

function canvasHasTransparency(ctx, w, h) {
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 3; i < data.length; i += 16) if (data[i] < 250) return true;
  return false;
}

/** A smaller copy for localStorage, so a design survives a page reload. */
function storageCopy(img, src, hasAlpha) {
  if (src.length <= STORAGE_CHAR_BUDGET) return src;
  for (const side of [1600, 1200, 900]) {
    const s = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const c = makeCanvas(img.naturalWidth * s, img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const out = hasAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.88);
    if (out.length <= STORAGE_CHAR_BUDGET) return out;
  }
  return null;
}

async function svgToRaster(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) {
    throw new Error('This SVG couldn’t be read. Re-export it and try again.');
  }
  let vw = parseFloat(svg.getAttribute('width'));
  let vh = parseFloat(svg.getAttribute('height'));
  const vb = svg.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
  if (vb?.length === 4 && vb[2] > 0 && vb[3] > 0) {
    vw = vb[2];
    vh = vb[3];
  } else if (vw > 0 && vh > 0) {
    svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
  } else {
    vw = vh = 512;
  }
  const s = SVG_RASTER_SIDE / Math.max(vw, vh);
  svg.setAttribute('width', String(Math.round(vw * s)));
  svg.setAttribute('height', String(Math.round(vh * s)));
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  const img = await loadImage(url);
  const c = makeCanvas(img.naturalWidth || vw * s, img.naturalHeight || vh * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/**
 * Read and normalize an uploaded file. SVGs are rasterized at high resolution
 * so every format flows through the same canvas pipeline.
 */
export async function prepareUpload(file, onProgress) {
  const error = validateFile(file);
  if (error) throw new Error(error);
  const format = fileFormat(file);

  let src;
  let naturalWidth;
  let naturalHeight;
  let hasAlpha = format !== 'jpg';

  if (format === 'svg') {
    const text = await readFile(file, 'text', onProgress);
    const canvas = await svgToRaster(text);
    src = canvas.toDataURL('image/png');
    naturalWidth = canvas.width;
    naturalHeight = canvas.height;
  } else {
    const dataUrl = await readFile(file, 'dataurl', onProgress);
    const img = await loadImage(dataUrl);
    naturalWidth = img.naturalWidth;
    naturalHeight = img.naturalHeight;
    if (!naturalWidth || !naturalHeight) throw new Error('This image has no dimensions. Try exporting it again.');
    src = dataUrl;
    const longest = Math.max(naturalWidth, naturalHeight);
    if (longest > MAX_WORKING_SIDE) {
      const s = MAX_WORKING_SIDE / longest;
      const c = makeCanvas(naturalWidth * s, naturalHeight * s);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      if (format === 'png') hasAlpha = canvasHasTransparency(ctx, c.width, c.height);
      src = hasAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.92);
    }
  }

  const img = await loadImage(src);
  const analysis = analyzeImage(img);
  return {
    id: `d_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    src,
    storageSrc: storageCopy(img, src, analysis.hasTransparency),
    name: file.name,
    format,
    fileSize: file.size,
    // Resolution is judged on the original pixels, not the working copy.
    naturalWidth,
    naturalHeight,
    isVector: format === 'svg',
    analysis,
  };
}

const dist2 = (r1, g1, b1, r2, g2, b2) => (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;

/**
 * Measure an image on a small sample: transparency, background box,
 * a weighted color palette of the artwork, and where the artwork sits.
 */
export function analyzeImage(img, maxSide = 220) {
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Border: is there a solid background box?
  let bTotal = 0;
  let bOpaque = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  const border = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x !== 0 && y !== 0 && x !== w - 1 && y !== h - 1) continue;
      const i = (y * w + x) * 4;
      bTotal++;
      if (data[i + 3] > 200) {
        bOpaque++;
        sr += data[i];
        sg += data[i + 1];
        sb += data[i + 2];
        border.push(i);
      }
    }
  }
  let background = null;
  if (bOpaque / bTotal > 0.95) {
    const mr = sr / bOpaque;
    const mg = sg / bOpaque;
    const mb = sb / bOpaque;
    const close = border.filter((i) => dist2(data[i], data[i + 1], data[i + 2], mr, mg, mb) < 40 * 40).length;
    if (close / border.length > 0.92) background = { r: Math.round(mr), g: Math.round(mg), b: Math.round(mb) };
  }

  let transparent = 0;
  let art = 0;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  const bins = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      if (alpha < 250) transparent++;
      if (alpha <= 40) continue;
      if (background && dist2(r, g, b, background.r, background.g, background.b) < 40 * 40) continue;
      art++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const bin = bins.get(key);
      if (bin) {
        bin.n++;
        bin.r += r;
        bin.g += g;
        bin.b += b;
      } else bins.set(key, { n: 1, r, g, b });
    }
  }

  const sorted = [...bins.values()].sort((a, b) => b.n - a.n);
  const palette = sorted.slice(0, 32).map((bin) => {
    const rgb = { r: Math.round(bin.r / bin.n), g: Math.round(bin.g / bin.n), b: Math.round(bin.b / bin.n) };
    return { ...rgb, weight: art ? bin.n / art : 0, lum: luminance(rgb) };
  });
  const colorCount = sorted.filter((bin) => bin.n / Math.max(1, art) > 0.002).length;
  const hasTransparency = transparent / (w * h) > 0.01;

  return {
    hasTransparency,
    background,
    artCoverage: art / (w * h),
    palette,
    colorCount,
    isPhotographic: colorCount > 120 && !hasTransparency,
    contentBounds: art ? { x: minX / w, y: minY / h, w: (maxX - minX + 1) / w, h: (maxY - minY + 1) / h } : null,
  };
}

const nextFrame = () => new Promise((r) => setTimeout(r, 16));

/**
 * Knock out a solid background by flood-filling from the image edges, so
 * matching colors inside the artwork are kept. Edges are feathered.
 */
export async function removeBackground(src, tolerance = 44) {
  const img = await loadImage(src);
  await nextFrame();
  const s = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * s);
  const h = Math.round(img.naturalHeight * s);
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  // Background color = mean of the opaque border pixels.
  let n = 0;
  let br = 0;
  let bg = 0;
  let bb = 0;
  const edge = (x, y) => {
    const i = (y * w + x) * 4;
    if (d[i + 3] > 200) {
      n++;
      br += d[i];
      bg += d[i + 1];
      bb += d[i + 2];
    }
  };
  for (let x = 0; x < w; x++) {
    edge(x, 0);
    edge(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    edge(0, y);
    edge(w - 1, y);
  }
  if (!n) return { src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, changed: false };
  br /= n;
  bg /= n;
  bb /= n;

  const t2 = tolerance * tolerance;
  const soft2 = (tolerance * 1.8) ** 2;
  const visited = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let top = 0;
  const seed = (x, y) => {
    const p = y * w + x;
    if (visited[p]) return;
    const i = p * 4;
    if (dist2(d[i], d[i + 1], d[i + 2], br, bg, bb) < t2) {
      visited[p] = 1;
      stack[top++] = p;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x, 0);
    seed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    seed(0, y);
    seed(w - 1, y);
  }
  let cleared = 0;
  while (top > 0) {
    const p = stack[--top];
    d[p * 4 + 3] = 0;
    cleared++;
    const x = p % w;
    const y = (p / w) | 0;
    const neighbors = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
    for (const q of neighbors) {
      if (q < 0 || visited[q]) continue;
      const i = q * 4;
      const dd = dist2(d[i], d[i + 1], d[i + 2], br, bg, bb);
      if (dd < t2) {
        visited[q] = 1;
        stack[top++] = q;
      } else if (dd < soft2) {
        visited[q] = 1;
        const f = (Math.sqrt(dd) - tolerance) / (tolerance * 0.8);
        d[i + 3] = Math.min(d[i + 3], Math.round(255 * Math.max(0, Math.min(1, f))));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return {
    src: c.toDataURL('image/png'),
    naturalWidth: w,
    naturalHeight: h,
    changed: cleared > 0,
  };
}

/** Crop away fully transparent edges. */
export async function trimTransparent(src) {
  const img = await loadImage(src);
  await nextFrame();
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { src, naturalWidth: w, naturalHeight: h, cropW: 1, cropH: 1 };
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const out = makeCanvas(cw, ch);
  out.getContext('2d').drawImage(c, minX, minY, cw, ch, 0, 0, cw, ch);
  return { src: out.toDataURL('image/png'), naturalWidth: cw, naturalHeight: ch, cropW: cw / w, cropH: ch / h };
}

/** Re-measure an edited image and produce the fields a design needs. */
export async function refreshImage(src, extra = {}) {
  const img = await loadImage(src);
  const analysis = analyzeImage(img);
  return { src, storageSrc: storageCopy(img, src, analysis.hasTransparency), analysis, ...extra };
}
