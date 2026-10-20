// Design placement math. A design's position is stored relative to its
// print area: cx/cy run 0..1 across the area, widthRatio is the design width
// as a fraction of the area width. That keeps placement stable when the
// shopper switches between shirt styles.

export const MIN_WIDTH = 0.08;
export const MAX_WIDTH = 1.6;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Design height as a fraction of print-area height. */
export function heightRatio(design, area) {
  const aspect = design.naturalHeight / design.naturalWidth;
  return design.widthRatio * aspect * (area.inchesW / area.inchesH);
}

/** Corners of the rotated design, normalized to the print area (0..1). */
export function designCorners(design, area) {
  const k = area.inchesH / area.inchesW; // area height in area-width units
  const w = design.widthRatio;
  const h = w * (design.naturalHeight / design.naturalWidth);
  const cx = design.cx;
  const cy = design.cy * k;
  const r = ((design.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ].map(([x, y]) => [cx + x * cos - y * sin, (cy + x * sin + y * cos) / k]);
}

export function designBounds(design, area) {
  const pts = designCorners(design, area);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

export function isOutOfBounds(design, area, tolerance = 0.01) {
  const b = designBounds(design, area);
  return b.left < -tolerance || b.top < -tolerance || b.right > 1 + tolerance || b.bottom > 1 + tolerance;
}

/** Largest width ratio that keeps the (unrotated) design inside the area. */
export function maxFitWidth(design, area) {
  const hPerW = (design.naturalHeight / design.naturalWidth) * (area.inchesW / area.inchesH);
  return Math.min(1, 1 / hPerW);
}

/** Shrink and move the design so it sits fully inside the print area. */
export function fitToArea(design, area) {
  const next = { ...design, rotation: 0 };
  next.widthRatio = Math.min(design.widthRatio, maxFitWidth(design, area) * 0.96);
  const hr = heightRatio(next, area);
  next.cx = clamp(design.cx, next.widthRatio / 2, 1 - next.widthRatio / 2);
  next.cy = clamp(design.cy, hr / 2, 1 - hr / 2);
  return next;
}

export const PRESETS = {
  front: [
    { id: 'center-chest', label: 'Center chest' },
    { id: 'left-chest', label: 'Left chest' },
    { id: 'full-front', label: 'Full front' },
  ],
  back: [
    { id: 'upper-back', label: 'Upper back' },
    { id: 'full-back', label: 'Full back' },
  ],
};

/** Apply a named placement preset. Sizes are in inches so they read true on every style. */
export function applyPreset(design, area, preset) {
  const inch = 1 / area.inchesW;
  const fit = maxFitWidth(design, area);
  const place = (widthRatio, cx, top) => {
    const next = { ...design, rotation: 0, widthRatio: Math.min(widthRatio, fit) };
    next.cx = cx;
    next.cy = top + heightRatio(next, area) / 2;
    return next;
  };
  switch (preset) {
    case 'left-chest':
      // Wearer's left chest is on the viewer's right.
      return place(Math.min(4 * inch, fit), 0.76, 0.05);
    case 'full-front':
      return place(11 * inch, 0.5, 0.03);
    case 'upper-back':
      return place(Math.min(9 * inch, fit), 0.5, 0.02);
    case 'full-back':
      return place(11 * inch, 0.5, 0.05);
    case 'center-chest':
    default:
      return place(Math.min(Math.max(design.widthRatio, 7 * inch), 10 * inch), 0.5, 0.06);
  }
}

/** Default placement for a freshly uploaded image: centered high on the chest. */
export function initialPlacement(natural, area, side = 'front') {
  const base = { ...natural, cx: 0.5, cy: 0.5, widthRatio: 0.7, rotation: 0 };
  const fit = maxFitWidth(base, area);
  base.widthRatio = Math.min(0.7, fit * 0.9);
  base.cy = (side === 'front' ? 0.06 : 0.04) + heightRatio(base, area) / 2;
  return base;
}
