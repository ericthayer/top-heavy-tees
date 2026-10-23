import { memo, useEffect, useState } from 'react';
import ShirtImage from './ShirtImage.jsx';

// The renderer pulls in the mockup engine, so it loads on demand: the vector
// drawing below covers the moment before it arrives.
let renderer = null;
const loadRenderer = () => import('../lib/productShots.js').then((m) => (renderer = m));

/**
 * A rendered "studio photo" of a shirt. The vector drawing shows immediately
 * and the render fades in over it once it is ready.
 */
function ProductShot({ style, color, side = 'front', view = 'studio', width = 720, design = null, fallbackDesign = null, alt, className = '' }) {
  const opts = { style, color, side, view, width, design };
  const key = [style, color, side, view, width, design?.key ?? ''].join('|');
  const [url, setUrl] = useState(() => renderer?.peekShot(opts) ?? null);

  useEffect(() => {
    let alive = true;
    loadRenderer().then((r) => {
      if (!alive) return;
      const cached = r.peekShot(opts);
      setUrl(cached);
      if (!cached) r.productShot(opts).then((u) => alive && setUrl(u), () => {});
    });
    return () => {
      alive = false;
    };
    // `key` captures every option.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className={`shot shot--${view} ${className}${url ? ' is-ready' : ''}`}>
      <ShirtImage style={style} color={color} side={side} design={fallbackDesign} alt={url ? '' : alt} className="shot__fallback" />
      {url && <img key={url} src={url} alt={alt} className="shot__img" decoding="async" draggable="false" />}
    </div>
  );
}

export default memo(ProductShot);
