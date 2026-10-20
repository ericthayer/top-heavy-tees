import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VIEW_W, VIEW_H, getPrintArea, designBox } from '../../lib/shirtSvg.js';
import { drawDesign, loadShirtLayer } from '../../lib/mockup.js';
import { loadImage } from '../../lib/imageUtils.js';
import { MIN_WIDTH, MAX_WIDTH, clamp } from '../../lib/placement.js';
import { luminance } from '../../lib/color.js';
import { UploadIcon } from '../Icons.jsx';

const SNAP = 0.015;
const ROT_OFFSET_CSS = 30;

const normAngle = (deg) => {
  let a = ((deg + 180) % 360 + 360) % 360 - 180;
  if (a === -180) a = 180;
  return a;
};

/**
 * Interactive placement canvas. The shirt is drawn from SVG layers, the design
 * sits between the base and the fabric shading, and guides are drawn on top.
 */
export default function DesignCanvas({ style, side, color, design, onChange, onDropFile, onRequestUpload, busy }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [cssW, setCssW] = useState(320);
  const [layers, setLayers] = useState(null);
  const [art, setArt] = useState(null);
  const [selected, setSelected] = useState(true);
  const [guide, setGuide] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const interaction = useRef(null);
  const pending = useRef(null);
  const frame = useRef(0);

  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2.5);
  const cssH = (cssW * VIEW_H) / VIEW_W;
  const px = Math.max(300, Math.round((cssW * dpr) / 100) * 100);
  const area = getPrintArea(style, side);
  const guideColor = luminance(color) < 0.3 ? 'rgba(255,255,255,0.85)' : 'rgba(42,68,212,0.85)';

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setCssW(Math.min(640, Math.max(240, entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Shirt layers. Keep the previous ones on screen until the new ones decode.
  useEffect(() => {
    let alive = true;
    Promise.all([
      loadShirtLayer({ style, side, color, layer: 'base', px }),
      loadShirtLayer({ style, side, color, layer: 'shade', px }),
    ]).then(([base, shade]) => alive && setLayers({ base, shade }));
    return () => {
      alive = false;
    };
  }, [style, side, color, px]);

  useEffect(() => {
    let alive = true;
    if (!design?.src) {
      setArt(null);
      return undefined;
    }
    loadImage(design.src).then((img) => alive && setArt(img));
    return () => {
      alive = false;
    };
  }, [design?.src]);

  // Select a design as soon as it is added.
  useEffect(() => {
    if (design?.id) setSelected(true);
  }, [design?.id]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layers) return;
    const W = Math.round(cssW * dpr);
    const H = Math.round(cssH * dpr);
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    const ctx = canvas.getContext('2d');
    const s = W / VIEW_W;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(layers.base, 0, 0, W, H);

    const showGuides = selected || !design;
    if (art && design) {
      if (selected) drawDesign(ctx, art, design, style, side, s, { clip: false, alpha: 0.28 });
      drawDesign(ctx, art, design, style, side, s);
    }
    ctx.drawImage(layers.shade, 0, 0, W, H);

    if (showGuides) {
      // Print area with registration marks at the corners.
      ctx.save();
      ctx.strokeStyle = guideColor;
      ctx.lineWidth = 1.25 * dpr;
      ctx.setLineDash([6 * dpr, 5 * dpr]);
      ctx.strokeRect(area.x * s, area.y * s, area.w * s, area.h * s);
      ctx.setLineDash([]);
      const r = 5 * dpr;
      const arm = 9 * dpr;
      const off = 10 * dpr;
      for (const [x, y, dx, dy] of [
        [area.x, area.y, -1, -1],
        [area.x + area.w, area.y, 1, -1],
        [area.x, area.y + area.h, -1, 1],
        [area.x + area.w, area.y + area.h, 1, 1],
      ]) {
        const cx = x * s + dx * off;
        const cy = y * s + dy * off;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.moveTo(cx - arm, cy);
        ctx.lineTo(cx + arm, cy);
        ctx.moveTo(cx, cy - arm);
        ctx.lineTo(cx, cy + arm);
        ctx.stroke();
      }
      ctx.fillStyle = guideColor;
      ctx.font = `600 ${11 * dpr}px Archivo, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.fillText(`Print area ${area.inchesW} × ${area.inchesH} in`, (area.x + area.w / 2) * s, (area.y + area.h) * s + 12 * dpr);
      ctx.restore();
    }

    if (guide) {
      ctx.save();
      ctx.strokeStyle = '#2A44D4';
      ctx.lineWidth = 1.5 * dpr;
      const x = (area.x + area.w / 2) * s;
      ctx.beginPath();
      ctx.moveTo(x, area.y * s);
      ctx.lineTo(x, (area.y + area.h) * s);
      ctx.stroke();
      ctx.restore();
    }

    if (design && selected) {
      const b = designBox(design, style, side);
      const rot = (b.rotation * Math.PI) / 180;
      ctx.save();
      ctx.translate(b.cx * s, b.cy * s);
      ctx.rotate(rot);
      const w = b.w * s;
      const h = b.h * s;
      ctx.strokeStyle = '#2A44D4';
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      const rotY = -h / 2 - ROT_OFFSET_CSS * dpr;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(0, rotY);
      ctx.stroke();
      const hs = 10 * dpr;
      ctx.fillStyle = '#ffffff';
      for (const [x, y] of [
        [-w / 2, -h / 2],
        [w / 2, -h / 2],
        [w / 2, h / 2],
        [-w / 2, h / 2],
      ]) {
        ctx.fillRect(x - hs / 2, y - hs / 2, hs, hs);
        ctx.strokeRect(x - hs / 2, y - hs / 2, hs, hs);
      }
      ctx.beginPath();
      ctx.arc(0, rotY, 7 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [layers, art, design, selected, guide, cssW, cssH, dpr, style, side, area.x, area.y, area.w, area.h, area.inchesW, area.inchesH, guideColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  // --- pointer interaction -------------------------------------------------

  const toView = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * VIEW_W) / rect.width,
      y: ((e.clientY - rect.top) * VIEW_H) / rect.height,
      unit: VIEW_W / rect.width, // view units per css px
    };
  };

  const hitTest = (p, touch) => {
    if (!design) return null;
    const b = designBox(design, style, side);
    const r = (-b.rotation * Math.PI) / 180;
    const dx = p.x - b.cx;
    const dy = p.y - b.cy;
    const lx = dx * Math.cos(r) - dy * Math.sin(r);
    const ly = dx * Math.sin(r) + dy * Math.cos(r);
    const tol = (touch ? 22 : 12) * p.unit;
    if (selected) {
      const rotY = -b.h / 2 - ROT_OFFSET_CSS * p.unit;
      if (Math.hypot(lx, ly - rotY) < tol) return 'rotate';
      for (const [cx, cy] of [
        [-b.w / 2, -b.h / 2],
        [b.w / 2, -b.h / 2],
        [b.w / 2, b.h / 2],
        [-b.w / 2, b.h / 2],
      ]) {
        if (Math.hypot(lx - cx, ly - cy) < tol) return 'scale';
      }
    }
    if (Math.abs(lx) <= b.w / 2 && Math.abs(ly) <= b.h / 2) return 'move';
    return null;
  };

  const push = (patch) => {
    pending.current = { ...pending.current, ...patch };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const p = pending.current;
      pending.current = null;
      if (p) onChange(p);
    });
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerDown = (e) => {
    if (!design || busy) return;
    const p = toView(e);
    const mode = hitTest(p, e.pointerType === 'touch');
    if (!mode) {
      setSelected(false);
      return;
    }
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    canvasRef.current.focus({ preventScroll: true });
    setSelected(true);
    const b = designBox(design, style, side);
    interaction.current = {
      mode,
      start: p,
      design: { ...design },
      center: { x: b.cx, y: b.cy },
      startDist: Math.hypot(p.x - b.cx, p.y - b.cy) || 1,
      startAngle: Math.atan2(p.y - b.cy, p.x - b.cx),
    };
  };

  const onPointerMove = (e) => {
    const it = interaction.current;
    const p = toView(e);
    if (!it) {
      const mode = hitTest(p, e.pointerType === 'touch');
      canvasRef.current.style.cursor =
        mode === 'move' ? 'move' : mode === 'scale' ? 'nwse-resize' : mode === 'rotate' ? 'grab' : 'default';
      return;
    }
    if (it.mode === 'move') {
      let cx = it.design.cx + (p.x - it.start.x) / area.w;
      const cy = it.design.cy + (p.y - it.start.y) / area.h;
      const snapped = Math.abs(cx - 0.5) < SNAP;
      if (snapped) cx = 0.5;
      setGuide(snapped);
      push({ cx: clamp(cx, -0.4, 1.4), cy: clamp(cy, -0.4, 1.4) });
    } else if (it.mode === 'scale') {
      const dist = Math.hypot(p.x - it.center.x, p.y - it.center.y);
      push({ widthRatio: clamp((it.design.widthRatio * dist) / it.startDist, MIN_WIDTH, MAX_WIDTH) });
    } else if (it.mode === 'rotate') {
      canvasRef.current.style.cursor = 'grabbing';
      const angle = Math.atan2(p.y - it.center.y, p.x - it.center.x);
      let rot = normAngle(it.design.rotation + ((angle - it.startAngle) * 180) / Math.PI);
      if (e.shiftKey) rot = Math.round(rot / 15) * 15;
      else {
        const nearest = Math.round(rot / 90) * 90;
        if (Math.abs(rot - nearest) < 4) rot = nearest;
      }
      push({ rotation: normAngle(rot) });
    }
  };

  const endInteraction = (e) => {
    if (interaction.current && canvasRef.current.hasPointerCapture?.(e.pointerId)) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
    interaction.current = null;
    setGuide(false);
  };

  const onKeyDown = (e) => {
    if (!design) return;
    const step = e.shiftKey ? 0.05 : 0.01;
    const patch = {};
    switch (e.key) {
      case 'ArrowLeft':
        patch.cx = design.cx - step;
        break;
      case 'ArrowRight':
        patch.cx = design.cx + step;
        break;
      case 'ArrowUp':
        patch.cy = design.cy - step;
        break;
      case 'ArrowDown':
        patch.cy = design.cy + step;
        break;
      case '+':
      case '=':
        patch.widthRatio = clamp(design.widthRatio * 1.04, MIN_WIDTH, MAX_WIDTH);
        break;
      case '-':
      case '_':
        patch.widthRatio = clamp(design.widthRatio / 1.04, MIN_WIDTH, MAX_WIDTH);
        break;
      case '[':
        patch.rotation = normAngle(design.rotation - (e.shiftKey ? 15 : 1));
        break;
      case ']':
        patch.rotation = normAngle(design.rotation + (e.shiftKey ? 15 : 1));
        break;
      case 'Escape':
        setSelected(false);
        return;
      default:
        return;
    }
    e.preventDefault();
    setSelected(true);
    onChange(patch);
  };

  // --- drag and drop files ----------------------------------------------------

  const onDragOver = (e) => {
    if ([...e.dataTransfer.types].includes('Files')) {
      e.preventDefault();
      setDragOver(true);
    }
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onDropFile(file);
  };

  const areaStyle = {
    left: `${(area.x / VIEW_W) * 100}%`,
    top: `${(area.y / VIEW_H) * 100}%`,
    width: `${(area.w / VIEW_W) * 100}%`,
    height: `${(area.h / VIEW_H) * 100}%`,
  };

  return (
    <div
      ref={wrapRef}
      className={`canvas-wrap${dragOver ? ' is-dragover' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="canvas-frame" style={{ width: cssW, height: cssH }}>
        {!layers && <div className="canvas-skeleton" aria-hidden="true" />}
        <canvas
          ref={canvasRef}
          className="design-canvas"
          style={{ width: cssW, height: cssH }}
          tabIndex={design ? 0 : -1}
          role="img"
          aria-label={
            design
              ? `${side === 'front' ? 'Front' : 'Back'} of the shirt with your design. Arrow keys move it, plus and minus resize, brackets rotate.`
              : `${side === 'front' ? 'Front' : 'Back'} of the shirt, no design yet.`
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endInteraction}
          onPointerCancel={endInteraction}
          onKeyDown={onKeyDown}
        />
        {!design && !busy && (
          <div className="canvas-empty" style={areaStyle}>
            <button type="button" className="canvas-empty__btn" onClick={onRequestUpload}>
              <UploadIcon size={22} />
              Upload artwork
            </button>
            <span className="canvas-empty__hint">or drop a file here</span>
          </div>
        )}
        {busy && (
          <div className="canvas-busy" role="status">
            <span className="spinner" aria-hidden="true" />
            <span className="canvas-busy__label">{busy.label}</span>
            {typeof busy.progress === 'number' && (
              <span className="progress" aria-hidden="true">
                <span className="progress__bar" style={{ width: `${Math.round(busy.progress * 100)}%` }} />
              </span>
            )}
          </div>
        )}
        {dragOver && (
          <div className="canvas-drop" aria-hidden="true">
            Drop to place on the {side}
          </div>
        )}
      </div>
    </div>
  );
}
