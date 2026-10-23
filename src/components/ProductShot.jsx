import { memo, useEffect, useState } from 'react';
import ShirtImage from './ShirtImage.jsx';
import { peekShot, productShot, shotKey } from '../lib/productShots.js';

/**
 * A rendered "studio photo" of a shirt. The vector drawing shows immediately
 * and the render fades in over it once it is ready.
 */
function ProductShot({ style, color, side = 'front', view = 'studio', width = 720, design = null, fallbackDesign = null, alt, className = '' }) {
  const opts = { style, color, side, view, width, design };
  const key = shotKey(opts);
  const [url, setUrl] = useState(() => peekShot(opts));

  useEffect(() => {
    let alive = true;
    const cached = peekShot(opts);
    setUrl(cached);
    if (!cached) productShot(opts).then((u) => alive && setUrl(u), () => {});
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
