// Rule-based design check. Takes the image analysis (computed once per upload)
// plus the current shirt and placement, and returns plain-language suggestions,
// each with an optional one-click fix.

import { contrastRatio, describeColor } from './color.js';
import { designBounds, isOutOfBounds, heightRatio } from './placement.js';
import { inches } from './format.js';

export const SEVERITY_ORDER = { error: 0, warning: 1, tip: 2, good: 3 };

const BLEND = 1.5; // contrast below this is hard to see on fabric
const WEAK = 2.2;

/** Share of the artwork's pixels that blend into, or barely stand out from, a shirt color. */
export function contrastProfile(palette, shirtHex) {
  if (!palette?.length) return { low: 0, weak: 0, median: 21 };
  const total = palette.reduce((s, c) => s + c.weight, 0) || 1;
  let low = 0;
  let weak = 0;
  const ratios = palette
    .map((c) => {
      const ratio = contrastRatio(c, shirtHex);
      if (ratio < BLEND) low += c.weight;
      else if (ratio < WEAK) weak += c.weight;
      return { ratio, weight: c.weight };
    })
    .sort((a, b) => a.ratio - b.ratio);
  let acc = 0;
  let median = ratios[ratios.length - 1].ratio;
  for (const r of ratios) {
    acc += r.weight;
    if (acc >= total / 2) {
      median = r.ratio;
      break;
    }
  }
  return { low: low / total, weak: weak / total, median };
}

/** The shirt color (from those available) that makes the artwork most visible. */
export function bestShirtColor(palette, colors, excludeId) {
  let best = null;
  for (const c of colors) {
    if (c.id === excludeId) continue;
    const p = contrastProfile(palette, c.hex);
    const score = p.low * 2 + p.weak - Math.min(p.median, 8) * 0.02;
    if (!best || score < best.score) best = { color: c, score, profile: p };
  }
  return best;
}

function artTone(palette) {
  const total = palette.reduce((s, c) => s + c.weight, 0) || 1;
  const avg = palette.reduce((s, c) => s + c.lum * c.weight, 0) / total;
  return avg < 0.18 ? 'dark' : avg > 0.6 ? 'light' : 'mid';
}

export function computeMetrics(design, area) {
  const widthIn = design.widthRatio * area.inchesW;
  const heightIn = widthIn * (design.naturalHeight / design.naturalWidth);
  const dpi = design.isVector ? null : Math.round(design.naturalWidth / widthIn);
  return { widthIn, heightIn, dpi };
}

/**
 * @param {object} args
 * @param {object} args.design   placed design incl. analysis
 * @param {'front'|'back'} args.side
 * @param {{id,name,hex}} args.shirt  current shirt color
 * @param {Array<{id,name,hex}>} args.colors  colors available for this style
 * @param {{inchesW,inchesH}} args.area  print area
 */
export function evaluateDesign({ design, side, shirt, colors, area }) {
  const a = design.analysis ?? {};
  const out = [];
  const metrics = computeMetrics(design, area);
  const add = (s) => out.push(s);

  // Resolution
  if (design.isVector) {
    add({ id: 'res-vector', severity: 'good', title: 'Sharp at any size', detail: 'Vector artwork scales without losing detail.' });
  } else {
    const { dpi, widthIn } = metrics;
    const sharpWidth = design.naturalWidth / 150;
    const sharpRatio = sharpWidth / area.inchesW;
    const action =
      sharpWidth >= 2.5 && sharpWidth < widthIn
        ? { type: 'set-width', label: `Shrink to ${inches(sharpWidth)} wide`, payload: { widthRatio: sharpRatio } }
        : undefined;
    if (dpi < 100) {
      add({
        id: 'res-low',
        severity: 'error',
        title: 'Your image may appear pixelated at this size',
        detail: `At ${inches(widthIn)} wide it prints at about ${dpi} DPI. Aim for 150 or more: make it smaller, or upload a file at least ${Math.ceil(
          widthIn * 150,
        )} px wide.`,
        action,
      });
    } else if (dpi < 150) {
      add({
        id: 'res-soft',
        severity: 'warning',
        title: 'Edges may look slightly soft',
        detail: `At ${inches(widthIn)} wide your image prints at ${dpi} DPI. Fine detail and small text will blur a little. 150 DPI or more prints cleanly.`,
        action,
      });
    } else {
      add({
        id: 'res-ok',
        severity: 'good',
        title: dpi >= 300 ? 'Plenty of resolution' : 'Prints cleanly at this size',
        detail: `${dpi} DPI at ${inches(widthIn)} wide.`,
      });
    }
  }

  // Background box
  if (a.background && !a.hasTransparency) {
    const bgName = describeColor(a.background);
    const label = bgName === 'colored' ? 'solid-colored' : `solid ${bgName}`;
    const visible = contrastRatio(a.background, shirt.hex) > 1.25;
    add({
      id: 'bg-box',
      severity: visible ? 'warning' : 'tip',
      title: `Your image has a ${label} background`,
      detail: visible
        ? `It will print as a visible rectangle on a ${shirt.name.toLowerCase()} shirt. Remove it so only your artwork prints.`
        : `It matches the shirt, but it will still print as a layer of ink, which feels stiffer. Removing it gives a softer print.`,
      action: { type: 'remove-bg', label: 'Remove background' },
    });
  }

  // Empty space around transparent artwork
  if (a.hasTransparency && a.contentBounds) {
    const { w, h } = a.contentBounds;
    if (w < 0.85 || h < 0.85) {
      add({
        id: 'trim',
        severity: 'tip',
        title: 'There’s empty space around your artwork',
        detail: 'Trimming the transparent edges makes sizing and centering match what actually prints.',
        action: { type: 'trim', label: 'Trim empty space' },
      });
    }
  }

  // Contrast
  if (a.palette?.length) {
    const profile = contrastProfile(a.palette, shirt.hex);
    const best = bestShirtColor(a.palette, colors, shirt.id);
    const better = best && best.profile.low + best.profile.weak < profile.low + profile.weak - 0.15 ? best.color : null;
    const switchAction = better
      ? { type: 'set-color', label: `Switch to ${better.name}`, payload: { colorId: better.id } }
      : undefined;
    const tone = artTone(a.palette);
    const shirtTone = contrastRatio(shirt.hex, '#000000') < 4 ? 'dark' : 'light';
    if (profile.low > 0.55) {
      const sameTone = tone === shirtTone;
      add({
        id: 'contrast-low',
        severity: 'error',
        title: sameTone
          ? `${tone === 'dark' ? 'Dark' : 'Light'} design on a ${tone} shirt`
          : 'Your design blends into the shirt',
        detail: `About ${Math.round(profile.low * 100)}% of your artwork is close to ${shirt.name.toLowerCase()} in tone, so it will be hard to see.${
          better ? ` ${better.name} would make it stand out.` : ' Try a shirt color with more contrast.'
        }`,
        action: switchAction,
      });
    } else if (profile.low + profile.weak > 0.3) {
      add({
        id: 'contrast-weak',
        severity: 'warning',
        title: 'Parts of your design may fade into the shirt',
        detail: `About ${Math.round((profile.low + profile.weak) * 100)}% of the artwork is low-contrast against ${shirt.name.toLowerCase()}. Thin lines in those areas can get lost.`,
        action: switchAction,
      });
    } else {
      add({
        id: 'contrast-ok',
        severity: 'good',
        title: 'Strong contrast',
        detail: `Your artwork stands out well on ${shirt.name.toLowerCase()}.`,
      });
    }

    if (a.isPhotographic && shirtTone === 'dark') {
      const white = colors.find((c) => c.id === 'white');
      add({
        id: 'photo-dark',
        severity: 'tip',
        title: 'Photos look truest on light shirts',
        detail: 'On dark fabric we print a white base layer first, which can mute skin tones and soft gradients.',
        action: white && white.id !== shirt.id ? { type: 'set-color', label: 'Switch to White', payload: { colorId: 'white' } } : undefined,
      });
    }
  }

  // Placement
  if (isOutOfBounds(design, area)) {
    add({
      id: 'bounds',
      severity: 'warning',
      title: 'Part of your design is outside the print area',
      detail: 'Anything past the dashed line won’t be printed.',
      action: { type: 'fit', label: 'Fit inside print area' },
    });
  }

  const tilt = Math.abs((((design.rotation ?? 0) + 540) % 360) - 180); // degrees away from upright
  if (tilt > 0.5 && tilt < 6) {
    add({
      id: 'tilt',
      severity: 'tip',
      title: `Your design is tilted ${tilt.toFixed(0)}°`,
      detail: 'A slight tilt can look like a printing mistake. Straighten it, or commit to a bolder angle.',
      action: { type: 'straighten', label: 'Straighten' },
    });
  }

  const { widthIn } = metrics;
  const offCenter = Math.abs(design.cx - 0.5);
  const bounds = designBounds(design, area);
  const isLeftChest = side === 'front' && widthIn <= 5 && design.cx > 0.62;

  if (side === 'front') {
    if (widthIn <= 5 && !isLeftChest && offCenter < 0.05) {
      add({
        id: 'small-center',
        severity: 'tip',
        title: 'Small designs work well on the left chest',
        detail: `At ${inches(widthIn)} wide, this reads like a logo. Moving it to the left chest looks deliberate; centered, it can look lost.`,
        action: { type: 'preset', label: 'Move to left chest', payload: { preset: 'left-chest' } },
      });
    } else if (widthIn > 5 && offCenter > 0.04) {
      add({
        id: 'center',
        severity: 'tip',
        title: 'Center chest placement works best for this design size',
        detail: `It’s ${inches(offCenter * area.inchesW)} off center. Designs this wide look balanced when centered.`,
        action: { type: 'center', label: 'Center it' },
      });
    }
  } else if (offCenter > 0.04) {
    add({
      id: 'center-back',
      severity: 'tip',
      title: 'Back prints look best centered',
      detail: `It’s ${inches(offCenter * area.inchesW)} off center.`,
      action: { type: 'center', label: 'Center it' },
    });
  }

  if (!isLeftChest && bounds.top > 0.22 && heightRatio(design, area) < 0.7) {
    // The print area starts roughly an inch below the collar seam.
    const below = bounds.top * area.inchesH + 1;
    add({
      id: 'low',
      severity: 'tip',
      title: 'Try raising your design',
      detail: `The top sits about ${inches(below)} below the collar. Prints read best when they start 2–4 in down, at chest height.`,
      action: { type: 'raise', label: 'Raise to chest height' },
    });
  }

  if (widthIn > 11.2) {
    add({
      id: 'wide',
      severity: 'tip',
      title: 'Very wide prints can reach the side seams',
      detail: `At ${inches(widthIn)} wide, the edges may wrap toward the seams on size S and M. 10–11 in is the safe maximum.`,
      action: { type: 'set-width', label: 'Set to 10.5 in wide', payload: { widthRatio: 10.5 / area.inchesW } },
    });
  }

  // File format
  if (design.format === 'jpg') {
    add({
      id: 'fmt-jpg',
      severity: 'tip',
      title: a.isPhotographic ? 'JPG works for photos' : 'PNG or SVG would print cleaner',
      detail: a.isPhotographic
        ? 'For logos or illustrations, a PNG with a transparent background gives crisper edges.'
        : 'JPG can’t store transparency and adds blurry compression around edges. Export a PNG with a transparent background, or an SVG.',
    });
  } else if (design.format === 'png') {
    add({
      id: 'fmt-png',
      severity: a.hasTransparency ? 'good' : 'tip',
      title: a.hasTransparency ? 'PNG with transparency' : 'This PNG has no transparent areas',
      detail: a.hasTransparency
        ? 'Only your artwork will print, not a background.'
        : 'Everything in the image prints, including its background. Export with transparency if the background isn’t part of the design.',
    });
  } else if (design.format === 'svg') {
    add({ id: 'fmt-svg', severity: 'good', title: 'SVG file', detail: 'Ideal for logos and type.' });
  }

  if (design.fileSize > 10 * 1024 * 1024) {
    add({
      id: 'fmt-size',
      severity: 'tip',
      title: 'Large file',
      detail: 'Files over 10 MB are fine, but anything above 300 DPI at print size adds no extra detail.',
    });
  }

  out.sort((x, y) => SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity]);
  return { metrics, suggestions: out };
}
