import ProductShot from './ProductShot.jsx';
import { COLORS } from '../data/products.js';

/** Thumbnail for a cart line: the saved mockup for custom shirts, a studio shot for blanks. */
export function LineThumb({ item }) {
  return item.custom?.preview ? (
    <img src={item.custom.preview} alt={`Your custom ${item.name}`} className="line-thumb" />
  ) : (
    <ProductShot
      style={item.style}
      color={COLORS[item.colorId]?.hex ?? '#ffffff'}
      width={240}
      alt={`${item.name} in ${item.colorName}`}
      className="line-thumb"
    />
  );
}

export function lineDetails(item) {
  const parts = [item.colorName, `Size ${item.size}`];
  if (item.custom) {
    const sides = item.custom.sides.map((s) => (s === 'front' ? 'front' : 'back')).join(' and ');
    parts.push(`Printed on the ${sides}`);
  } else parts.push('Blank');
  return parts;
}
