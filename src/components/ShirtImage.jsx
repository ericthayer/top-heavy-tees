import { memo, useMemo } from 'react';
import { shirtDataUrl } from '../lib/shirtSvg.js';

/** Rendered shirt in any style and color, optionally with a design (view-box units). */
function ShirtImage({ style, color, side = 'front', design = null, alt, className = '', loading = 'lazy' }) {
  const src = useMemo(() => shirtDataUrl({ style, color, side, design }), [style, color, side, design]);
  return <img src={src} alt={alt} className={`shirt-img ${className}`} loading={loading} decoding="async" width="600" height="700" />;
}

export default memo(ShirtImage);
