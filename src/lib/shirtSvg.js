// Procedural T-shirt renderer. Every product image, the studio canvas and the
// mockups are drawn from these shapes, so any style can be shown in any color
// without photo assets. Coordinates live in a 600 × 700 view box.

import { luminance, shade } from './color.js';

export const VIEW_W = 600;
export const VIEW_H = 700;
const CX = VIEW_W / 2;

const mirror = ([x, y]) => [VIEW_W - x, y];
const pt = ([x, y]) => `${+x.toFixed(1)},${+y.toFixed(1)}`;
const toward = (a, b, d) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [a[0] + (dx / len) * d, a[1] + (dy / len) * d];
};

const CREW = {
  kind: 'sleeved',
  neck: [238, 62],
  shoulder: [128, 96],
  sleeveCtrl: [80, 140],
  sleeveTop: [30, 236],
  cuff: [92, 286],
  underCtrl: [116, 262],
  armpit: [124, 250],
  sideCtrl: [121, 440],
  hem: [126, 640],
  hemDip: 8,
  neckType: 'crew',
  frontDepth: 110,
  backDepth: 84,
  rib: 13,
  cuffRib: 0,
  printArea: {
    front: { x: 194, y: 136, w: 212, h: 283 },
    back: { x: 194, y: 114, w: 212, h: 283 },
  },
  printInches: { w: 12, h: 16 },
};

const GEOMETRY = {
  crew: CREW,
  pocket: { ...CREW, pocket: true },
  ringer: { ...CREW, trim: true, rib: 15, cuffRib: 16 },
  vneck: {
    ...CREW,
    shoulder: [134, 96],
    armpit: [130, 252],
    sideCtrl: [129, 440],
    hem: [134, 640],
    neckType: 'v',
    frontDepth: 168,
    rib: 11,
    printArea: {
      front: { x: 194, y: 184, w: 212, h: 283 },
      back: { x: 194, y: 114, w: 212, h: 283 },
    },
  },
  boxy: {
    ...CREW,
    neck: [236, 64],
    shoulder: [110, 104],
    sleeveCtrl: [68, 152],
    sleeveTop: [20, 252],
    cuff: [96, 308],
    underCtrl: [110, 284],
    armpit: [112, 270],
    sideCtrl: [110, 440],
    hem: [112, 612],
    hemDip: 5,
    frontDepth: 114,
    backDepth: 86,
    rib: 17,
    printArea: {
      front: { x: 194, y: 144, w: 212, h: 283 },
      back: { x: 194, y: 120, w: 212, h: 283 },
    },
  },
  longsleeve: {
    ...CREW,
    sleeveCtrl: [56, 226],
    sleeveTop: [10, 584],
    cuff: [68, 600],
    underCtrl: [96, 384],
    armpit: [126, 254],
    cuffRib: 30,
    long: true,
  },
  tank: {
    kind: 'tank',
    neck: [222, 60],
    strap: [176, 62],
    armCtrl: [172, 198],
    armpit: [128, 262],
    sideCtrl: [127, 450],
    hem: [132, 640],
    hemDip: 8,
    neckType: 'crew',
    frontDepth: 160,
    backDepth: 108,
    rib: 10,
    printArea: {
      front: { x: 212, y: 186, w: 176, h: 264 },
      back: { x: 212, y: 138, w: 176, h: 264 },
    },
    printInches: { w: 10, h: 15 },
  },
};

export const SHIRT_STYLES = Object.keys(GEOMETRY);

export function getPrintArea(style, side = 'front') {
  const g = GEOMETRY[style] ?? CREW;
  const area = g.printArea[side];
  return { ...area, inchesW: g.printInches.w, inchesH: g.printInches.h };
}

/** Path segment from `from` to `to` dipping to `depth` at the center line. */
function neckCurve(from, to, depth, type) {
  if (type === 'v') {
    const c1 = [from[0] + (CX - from[0]) * 0.12, from[1] + (depth - from[1]) * 0.35];
    const c2 = [to[0] + (CX - to[0]) * 0.12, to[1] + (depth - to[1]) * 0.35];
    return `Q ${pt(c1)} ${pt([CX, depth])} Q ${pt(c2)} ${pt(to)}`;
  }
  const yEnds = (from[1] + to[1]) / 2;
  const c = (depth - 0.25 * yEnds) / 0.75;
  const c1 = [from[0] + (CX - from[0]) * 0.18, c];
  const c2 = [to[0] + (CX - to[0]) * 0.18, c];
  return `C ${pt(c1)} ${pt(c2)} ${pt(to)}`;
}

function sleevedBody(g, side) {
  const { neck, shoulder, sleeveCtrl, sleeveTop, cuff, underCtrl, armpit, sideCtrl, hem, hemDip } = g;
  const shCtrl = [(neck[0] + shoulder[0]) / 2, (neck[1] + shoulder[1]) / 2 - 3];
  const depth = side === 'front' ? g.frontDepth : g.backDepth;
  const type = side === 'front' ? g.neckType : 'crew';
  return [
    `M ${pt(neck)}`,
    `Q ${pt(shCtrl)} ${pt(shoulder)}`,
    `Q ${pt(sleeveCtrl)} ${pt(sleeveTop)}`,
    `L ${pt(cuff)}`,
    `Q ${pt(underCtrl)} ${pt(armpit)}`,
    `Q ${pt(sideCtrl)} ${pt(hem)}`,
    `Q ${pt([CX, hem[1] + hemDip])} ${pt(mirror(hem))}`,
    `Q ${pt(mirror(sideCtrl))} ${pt(mirror(armpit))}`,
    `Q ${pt(mirror(underCtrl))} ${pt(mirror(cuff))}`,
    `L ${pt(mirror(sleeveTop))}`,
    `Q ${pt(mirror(sleeveCtrl))} ${pt(mirror(shoulder))}`,
    `Q ${pt(mirror(shCtrl))} ${pt(mirror(neck))}`,
    neckCurve(mirror(neck), neck, depth, type),
    'Z',
  ].join(' ');
}

function tankBody(g, side) {
  const { neck, strap, armCtrl, armpit, sideCtrl, hem, hemDip } = g;
  const depth = side === 'front' ? g.frontDepth : g.backDepth;
  return [
    `M ${pt(neck)}`,
    `L ${pt(strap)}`,
    `Q ${pt(armCtrl)} ${pt(armpit)}`,
    `Q ${pt(sideCtrl)} ${pt(hem)}`,
    `Q ${pt([CX, hem[1] + hemDip])} ${pt(mirror(hem))}`,
    `Q ${pt(mirror(sideCtrl))} ${pt(mirror(armpit))}`,
    `Q ${pt(mirror(armCtrl))} ${pt(mirror(strap))}`,
    `L ${pt(mirror(neck))}`,
    neckCurve(mirror(neck), neck, depth, 'crew'),
    'Z',
  ].join(' ');
}

/** All the paths needed to draw one style from one side. */
export function getShirtGeometry(style, side = 'front') {
  const g = GEOMETRY[style] ?? CREW;
  const front = side === 'front';
  const depth = front ? g.frontDepth : g.backDepth;
  const type = front ? g.neckType : 'crew';
  const { neck, rib } = g;
  const neckOuter = [neck[0] - rib, neck[1] + rib * 0.33];
  const outerDepth = depth + rib * (type === 'v' ? 1.4 : 1);

  const out = {
    body: g.kind === 'tank' ? tankBody(g, side) : sleevedBody(g, side),
    interior: null,
    backRib: null,
    collar: `M ${pt(mirror(neck))} ${neckCurve(mirror(neck), neck, depth, type)} L ${pt(neckOuter)} ${neckCurve(
      neckOuter,
      mirror(neckOuter),
      outerDepth,
      type,
    )} Z`,
    collarStitch: (() => {
      const s = [neck[0] - rib - 4, neck[1] + rib * 0.45];
      return `M ${pt(s)} ${neckCurve(s, mirror(s), outerDepth + 4, type)}`;
    })(),
    seams: [],
    stitches: [],
    cuffs: [],
    pocket: null,
    folds: [],
    highlights: [],
    collarShadow: null,
  };

  if (front) {
    out.interior = `M ${pt(neck)} ${neckCurve(neck, mirror(neck), g.backDepth, 'crew')} ${neckCurve(
      mirror(neck),
      neck,
      depth,
      type,
    )} Z`;
    const inner = [neck[0] + rib * 0.6, neck[1] + 1];
    out.backRib = `M ${pt(neck)} ${neckCurve(neck, mirror(neck), g.backDepth, 'crew')} L ${pt(
      mirror(inner),
    )} ${neckCurve(mirror(inner), inner, g.backDepth + rib * 0.75, 'crew')} Z`;
  }

  {
    const s = [neck[0] - rib - 2, neck[1] + rib * 0.5];
    out.collarShadow = `M ${pt(s)} ${neckCurve(s, mirror(s), outerDepth + 6, type)}`;
  }

  const hem = g.hem;
  const hemStitch = `M ${pt([hem[0] + 1, hem[1] - 14])} Q ${pt([CX, hem[1] + g.hemDip - 14])} ${pt([
    VIEW_W - hem[0] - 1,
    hem[1] - 14,
  ])}`;
  out.stitches.push(hemStitch);

  if (g.kind === 'sleeved') {
    const { shoulder, sleeveTop, cuff, armpit, sleeveCtrl, underCtrl } = g;
    for (const flip of [false, true]) {
      const f = flip ? mirror : (p) => p;
      out.seams.push(
        `M ${pt(f(shoulder))} Q ${pt(f([shoulder[0] + 16, (shoulder[1] + armpit[1]) / 2]))} ${pt(f(armpit))}`,
      );
      if (g.cuffRib) {
        const inTop = toward(sleeveTop, g.long ? sleeveCtrl : shoulder, g.cuffRib);
        const inBot = toward(cuff, g.long ? underCtrl : armpit, g.cuffRib);
        out.cuffs.push(`M ${pt(f(sleeveTop))} L ${pt(f(cuff))} L ${pt(f(inBot))} L ${pt(f(inTop))} Z`);
      } else {
        out.stitches.push(
          `M ${pt(f(toward(sleeveTop, shoulder, 14)))} L ${pt(f(toward(cuff, armpit, 14)))}`,
        );
      }
      // Soft folds where the sleeve meets the body and along the sleeve.
      out.folds.push({
        d: `M ${pt(f(armpit))} Q ${pt(f([armpit[0] + 30, armpit[1] + 52]))} ${pt(f([armpit[0] + 64, armpit[1] + 128]))}`,
        w: 18,
        a: 1,
      });
      out.folds.push({
        d: `M ${pt(f(toward(shoulder, armpit, 24)))} Q ${pt(f(toward(sleeveCtrl, underCtrl, 26)))} ${pt(
          f(toward(cuff, sleeveTop, 16)),
        )}`,
        w: 14,
        a: 0.7,
      });
      out.highlights.push({
        d: `M ${pt(f(toward(shoulder, sleeveTop, 22)))} Q ${pt(f(toward(sleeveCtrl, sleeveTop, 10)))} ${pt(
          f(toward(sleeveTop, cuff, 14)),
        )}`,
        w: 12,
        a: 0.8,
      });
    }
  } else {
    // Tank: arm bindings.
    const { strap, armCtrl, armpit } = g;
    for (const flip of [false, true]) {
      const f = flip ? mirror : (p) => p;
      out.seams.push(`M ${pt(f(strap))} Q ${pt(f(armCtrl))} ${pt(f(armpit))}`);
      out.folds.push({
        d: `M ${pt(f(armpit))} Q ${pt(f([armpit[0] + 36, armpit[1] + 50]))} ${pt(f([armpit[0] + 70, armpit[1] + 120]))}`,
        w: 18,
        a: 1,
      });
    }
  }

  // Body drape shared by every style.
  out.folds.push(
    { d: `M ${pt([hem[0] + 18, hem[1] - 120])} Q ${pt([hem[0] + 60, hem[1] - 92])} ${pt([hem[0] + 84, hem[1] - 40])}`, w: 22, a: 0.45 },
    { d: `M ${pt([VIEW_W - hem[0] - 22, hem[1] - 140])} Q ${pt([VIEW_W - hem[0] - 52, hem[1] - 96])} ${pt([VIEW_W - hem[0] - 90, hem[1] - 48])}`, w: 20, a: 0.4 },
  );
  out.highlights.push(
    { d: `M 214,250 Q 202,400 218,${hem[1] - 90}`, w: 34, a: 1 },
    { d: `M 392,236 Q 408,380 388,${hem[1] - 140}`, w: 24, a: 0.8 },
  );

  if (g.pocket && front) {
    out.pocket = {
      d: 'M 350,170 L 412,170 L 412,230 Q 412,240 402,240 L 360,240 Q 350,240 350,230 Z',
      stitch: 'M 354,182 L 354,229 Q 354,236 361,236 L 401,236 Q 408,236 408,229 L 408,182',
      hemLine: 'M 350,180 L 412,180',
    };
  }

  return out;
}

function trimColorFor(hex) {
  return luminance(hex) > 0.45 ? '#24305A' : '#F2F2EE';
}

function defs(geo, style, side, lum) {
  const dA = 0.07 + 0.07 * lum;
  const lA = 0.04 + 0.08 * (1 - lum);
  const pa = getPrintArea(style, side);
  return {
    dA,
    lA,
    markup: `<defs>
<clipPath id="body"><path d="${geo.body}"/></clipPath>
<clipPath id="pa"><rect x="${pa.x}" y="${pa.y}" width="${pa.w}" height="${pa.h}"/></clipPath>
<linearGradient id="sides" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${VIEW_W}" y2="0">
<stop offset="0" stop-color="#0a0e1c" stop-opacity="${(dA * 1.2).toFixed(3)}"/>
<stop offset="0.2" stop-color="#0a0e1c" stop-opacity="${(dA * 0.9).toFixed(3)}"/>
<stop offset="0.32" stop-color="#0a0e1c" stop-opacity="0"/>
<stop offset="0.68" stop-color="#0a0e1c" stop-opacity="0"/>
<stop offset="0.8" stop-color="#0a0e1c" stop-opacity="${(dA * 0.9).toFixed(3)}"/>
<stop offset="1" stop-color="#0a0e1c" stop-opacity="${(dA * 1.2).toFixed(3)}"/>
</linearGradient>
<linearGradient id="hemShade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${VIEW_H}">
<stop offset="0.78" stop-color="#0a0e1c" stop-opacity="0"/>
<stop offset="0.95" stop-color="#0a0e1c" stop-opacity="${(dA * 0.7).toFixed(3)}"/>
</linearGradient>
<radialGradient id="topLight" gradientUnits="userSpaceOnUse" cx="290" cy="220" r="300">
<stop offset="0" stop-color="#ffffff" stop-opacity="${(lA * 1.3).toFixed(3)}"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
<filter id="b4" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="b10" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="b18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/>
<feComponentTransfer><feFuncA type="table" tableValues="0 ${(0.05 + 0.05 * (1 - lum)).toFixed(3)}"/></feComponentTransfer>
</filter>
</defs>`,
  };
}

function baseLayer(geo, color, trim) {
  const interior = shade(color, -0.28);
  const outline = shade(color, -0.32);
  const stitch = shade(color, -0.38);
  const collar = trim ?? shade(color, -0.05);
  const parts = [];
  if (geo.interior) parts.push(`<path d="${geo.interior}" fill="${interior}"/>`);
  if (geo.backRib) parts.push(`<path d="${geo.backRib}" fill="${trim ?? shade(color, -0.16)}"/>`);
  parts.push(`<path d="${geo.body}" fill="${color}" stroke="${outline}" stroke-opacity="0.5" stroke-width="1.4"/>`);
  parts.push(`<path d="${geo.collar}" fill="${collar}" stroke="${outline}" stroke-opacity="0.35" stroke-width="1"/>`);
  for (const c of geo.cuffs) {
    parts.push(`<path d="${c}" fill="${trim ?? shade(color, -0.05)}" stroke="${outline}" stroke-opacity="0.35" stroke-width="1"/>`);
  }
  parts.push(
    `<path d="${geo.collarStitch}" fill="none" stroke="${stitch}" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="3 3"/>`,
  );
  for (const s of geo.seams) {
    parts.push(`<path d="${s}" fill="none" stroke="${outline}" stroke-opacity="0.45" stroke-width="1.3"/>`);
  }
  for (const s of geo.stitches) {
    parts.push(
      `<path d="${s}" fill="none" stroke="${stitch}" stroke-opacity="0.5" stroke-width="1.2" stroke-dasharray="3 3"/>`,
    );
  }
  if (geo.pocket) {
    parts.push(`<path d="${geo.pocket.d}" fill="${shade(color, -0.02)}" stroke="${outline}" stroke-opacity="0.45" stroke-width="1.2"/>`);
    parts.push(`<path d="${geo.pocket.stitch}" fill="none" stroke="${stitch}" stroke-opacity="0.5" stroke-width="1.1" stroke-dasharray="3 3"/>`);
    parts.push(`<path d="${geo.pocket.hemLine}" fill="none" stroke="${stitch}" stroke-opacity="0.4" stroke-width="1.1" stroke-dasharray="3 3"/>`);
  }
  return `<g>${parts.join('')}</g>`;
}

function shadeLayer(geo, dA, lA) {
  const folds = geo.folds
    .map((f) => `<path d="${f.d}" stroke="#0a0e1c" stroke-opacity="${(dA * 1.05 * f.a).toFixed(3)}" stroke-width="${f.w}"/>`)
    .join('');
  const highlights = geo.highlights
    .map((h) => `<path d="${h.d}" stroke="#ffffff" stroke-opacity="${(lA * 0.75 * h.a).toFixed(3)}" stroke-width="${h.w}"/>`)
    .join('');
  const pocketShadow = geo.pocket
    ? `<path d="M 352,242 L 410,242" stroke="#0a0e1c" stroke-opacity="${(dA * 1.4).toFixed(3)}" stroke-width="4" filter="url(#b4)"/>`
    : '';
  return `<g clip-path="url(#body)">
<rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#sides)"/>
<rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#hemShade)"/>
<rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#topLight)"/>
<g filter="url(#b10)" fill="none" stroke-linecap="round">${folds}</g>
<g filter="url(#b18)" fill="none" stroke-linecap="round">${highlights}</g>
<path d="${geo.collarShadow}" fill="none" stroke="#0a0e1c" stroke-opacity="${(dA * 1.6).toFixed(3)}" stroke-width="5" filter="url(#b4)"/>
${pocketShadow}
<rect width="${VIEW_W}" height="${VIEW_H}" filter="url(#grain)"/>
</g>`;
}

function designLayer(design) {
  if (!design?.href) return '';
  const { href, cx, cy, w, h, rotation = 0 } = design;
  return `<g clip-path="url(#pa)"><image href="${href}" x="${(cx - w / 2).toFixed(2)}" y="${(cy - h / 2).toFixed(
    2,
  )}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" preserveAspectRatio="none" transform="rotate(${rotation} ${cx.toFixed(
    2,
  )} ${cy.toFixed(2)})"/></g>`;
}

/**
 * Build a standalone SVG document.
 * layers: any of 'base' and 'shade'. A design (in view-box units) is placed
 * between them so fabric shading falls across the print.
 */
export function buildShirtSvg({ style = 'crew', side = 'front', color = '#ffffff', layers = ['base', 'shade'], design = null, width, height }) {
  const geo = getShirtGeometry(style, side);
  const g = GEOMETRY[style] ?? CREW;
  const lum = luminance(color);
  const trim = g.trim ? trimColorFor(color) : null;
  const d = defs(geo, style, side, lum);
  const size = width ? ` width="${width}" height="${height ?? Math.round((width * VIEW_H) / VIEW_W)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}"${size}>${d.markup}${
    layers.includes('base') ? baseLayer(geo, color, trim) : ''
  }${designLayer(design)}${layers.includes('shade') ? shadeLayer(geo, d.dA, d.lA) : ''}</svg>`;
}

export function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function shirtDataUrl(options) {
  return svgToDataUrl(buildShirtSvg(options));
}

/** Convert a stored design (normalized to its print area) into view-box units. */
export function designBox(design, style, side) {
  const pa = getPrintArea(style, side);
  const w = design.widthRatio * pa.w;
  const h = w * (design.naturalHeight / design.naturalWidth);
  return {
    cx: pa.x + design.cx * pa.w,
    cy: pa.y + design.cy * pa.h,
    w,
    h,
    rotation: design.rotation ?? 0,
  };
}
