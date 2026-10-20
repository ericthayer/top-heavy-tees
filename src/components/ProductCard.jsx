import { useState } from 'react';
import { Link } from 'react-router-dom';
import ShirtImage from './ShirtImage.jsx';
import { COLORS } from '../data/products.js';
import { money } from '../lib/format.js';
import { useInventory } from '../context/InventoryContext.jsx';

const MAX_DOTS = 6;

export default function ProductCard({ product }) {
  const [colorId, setColorId] = useState(product.colors[0]);
  const { totalOf } = useInventory();
  const total = totalOf(product.id);
  const out = total === 0;
  const low = !out && total <= 20;
  const extra = product.colors.length - MAX_DOTS;

  return (
    <article className={`product-card${out ? ' is-out' : ''}`}>
      <Link to={`/products/${product.id}?color=${colorId}`} className="product-card__link">
        <div className="product-card__media">
          <ShirtImage style={product.style} color={COLORS[colorId].hex} alt={`${product.name} in ${COLORS[colorId].name}`} />
          {out && <span className="badge badge--out">Out of stock</span>}
          {low && <span className="badge badge--low">Low stock</span>}
        </div>
        <div className="product-card__text">
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__price">{money(product.price)}</p>
        </div>
        <p className="product-card__summary">{product.summary}</p>
      </Link>
      <div className="product-card__colors" role="group" aria-label={`${product.name} colors`}>
        {product.colors.slice(0, MAX_DOTS).map((id) => (
          <button
            key={id}
            type="button"
            className={`dot${id === colorId ? ' is-active' : ''}`}
            style={{ '--chip': COLORS[id].hex }}
            aria-label={`Show in ${COLORS[id].name}`}
            aria-pressed={id === colorId}
            onClick={() => setColorId(id)}
          />
        ))}
        {extra > 0 && <span className="dot-more">+{extra}</span>}
      </div>
    </article>
  );
}
