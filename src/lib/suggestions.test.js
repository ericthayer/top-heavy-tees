import { describe, expect, it } from 'vitest';
import { evaluateDesign, contrastProfile, bestShirtColor } from './suggestions.js';
import { luminance } from './color.js';

const area = { inchesW: 12, inchesH: 16 };
const colors = [
  { id: 'white', name: 'White', hex: '#FFFFFF' },
  { id: 'black', name: 'Black', hex: '#1C1C20' },
  { id: 'heather', name: 'Heather grey', hex: '#B8BBC1' },
];
const swatch = (r, g, b, weight) => ({ r, g, b, weight, lum: luminance({ r, g, b }) });
const darkArt = { hasTransparency: true, background: null, palette: [swatch(20, 20, 20, 1)], contentBounds: { x: 0, y: 0, w: 1, h: 1 } };

function design(overrides = {}) {
  return {
    naturalWidth: 3000,
    naturalHeight: 3000,
    format: 'png',
    isVector: false,
    fileSize: 1_000_000,
    cx: 0.5,
    cy: 0.35,
    widthRatio: 0.6,
    rotation: 0,
    analysis: darkArt,
    ...overrides,
  };
}

const ids = (result) => result.suggestions.map((s) => s.id);

describe('evaluateDesign', () => {
  it('warns about pixelation and offers a size that prints sharply', () => {
    const result = evaluateDesign({ design: design({ naturalWidth: 600, naturalHeight: 600 }), side: 'front', shirt: colors[0], colors, area });
    const res = result.suggestions.find((s) => s.id === 'res-low');
    expect(res.severity).toBe('error');
    expect(result.metrics.dpi).toBe(83);
    expect(res.action.type).toBe('set-width');
    expect(res.action.payload.widthRatio).toBeCloseTo(4 / 12);
  });

  it('treats vector artwork as sharp at any size', () => {
    const result = evaluateDesign({ design: design({ isVector: true, format: 'svg' }), side: 'front', shirt: colors[0], colors, area });
    expect(ids(result)).toContain('res-vector');
    expect(result.metrics.dpi).toBeNull();
  });

  it('flags a dark design on a dark shirt and suggests a lighter color', () => {
    const result = evaluateDesign({ design: design(), side: 'front', shirt: colors[1], colors, area });
    const c = result.suggestions.find((s) => s.id === 'contrast-low');
    expect(c.title).toBe('Dark design on a dark shirt');
    expect(c.action).toEqual({ type: 'set-color', label: 'Switch to White', payload: { colorId: 'white' } });
  });

  it('confirms good contrast for dark art on a white shirt', () => {
    const result = evaluateDesign({ design: design(), side: 'front', shirt: colors[0], colors, area });
    expect(ids(result)).toContain('contrast-ok');
  });

  it('suggests removing a solid background that would show on the shirt', () => {
    const analysis = { ...darkArt, hasTransparency: false, background: { r: 255, g: 255, b: 255 } };
    const result = evaluateDesign({ design: design({ analysis, format: 'jpg' }), side: 'front', shirt: colors[1], colors, area });
    const bg = result.suggestions.find((s) => s.id === 'bg-box');
    expect(bg.severity).toBe('warning');
    expect(bg.title).toBe('Your image has a solid white background');
    expect(bg.action.type).toBe('remove-bg');
  });

  it('recommends centering wide designs that sit off center', () => {
    const result = evaluateDesign({ design: design({ cx: 0.62 }), side: 'front', shirt: colors[0], colors, area });
    expect(ids(result)).toContain('center');
  });

  it('suggests the left chest for small centered designs', () => {
    const result = evaluateDesign({ design: design({ widthRatio: 0.3, cy: 0.12 }), side: 'front', shirt: colors[0], colors, area });
    const s = result.suggestions.find((x) => x.id === 'small-center');
    expect(s.action.payload.preset).toBe('left-chest');
  });

  it('warns when the design leaves the print area', () => {
    const result = evaluateDesign({ design: design({ cx: 0.9 }), side: 'front', shirt: colors[0], colors, area });
    expect(ids(result)).toContain('bounds');
  });

  it('notices a slight accidental tilt but not an upright design', () => {
    expect(ids(evaluateDesign({ design: design({ rotation: 3 }), side: 'front', shirt: colors[0], colors, area }))).toContain('tilt');
    expect(ids(evaluateDesign({ design: design({ rotation: -2 }), side: 'front', shirt: colors[0], colors, area }))).toContain('tilt');
    expect(ids(evaluateDesign({ design: design({ rotation: 0 }), side: 'front', shirt: colors[0], colors, area }))).not.toContain('tilt');
    expect(ids(evaluateDesign({ design: design({ rotation: 25 }), side: 'front', shirt: colors[0], colors, area }))).not.toContain('tilt');
  });

  it('sorts problems before tips and confirmations', () => {
    const result = evaluateDesign({ design: design({ naturalWidth: 500, naturalHeight: 500 }), side: 'front', shirt: colors[1], colors, area });
    const order = result.suggestions.map((s) => s.severity);
    const rank = { error: 0, warning: 1, tip: 2, good: 3 };
    expect(order.map((s) => rank[s])).toEqual([...order.map((s) => rank[s])].sort((a, b) => a - b));
  });
});

describe('contrast helpers', () => {
  it('measures how much of the art blends into the shirt', () => {
    const p = contrastProfile([swatch(20, 20, 20, 0.5), swatch(250, 250, 250, 0.5)], '#1C1C20');
    expect(p.low).toBeCloseTo(0.5);
  });

  it('picks the shirt color with the most contrast', () => {
    expect(bestShirtColor([swatch(250, 250, 250, 1)], colors, 'white').color.id).toBe('black');
  });
});
