import { COLORS, PRODUCTS, STYLE_LABELS } from '../../data/products.js';
import { money } from '../../lib/format.js';
import Swatches from '../Swatches.jsx';
import { useInventory } from '../../context/InventoryContext.jsx';

export default function ShirtPanel({ product, colorId, onProduct, onColor }) {
  const { totalOf } = useInventory();
  return (
    <section className="panel" aria-labelledby="shirt-heading">
      <h2 id="shirt-heading" className="panel__title">
        Shirt
      </h2>
      <label className="field">
        <span className="field-label">Style</span>
        <span className="select">
          <select value={product.id} onChange={(e) => onProduct(e.target.value)}>
            {PRODUCTS.map((p) => {
              const out = totalOf(p.id) === 0;
              return (
                <option key={p.id} value={p.id} disabled={out}>
                  {p.name} ({STYLE_LABELS[p.style]}), {money(p.price)}
                  {out ? ', out of stock' : ''}
                </option>
              );
            })}
          </select>
        </span>
      </label>
      <Swatches colorIds={product.colors} value={colorId} onChange={onColor} name="studio-color" legend="Color" size="sm" />
      <p className="panel__note">{COLORS[colorId] && product.fabric}</p>
    </section>
  );
}
