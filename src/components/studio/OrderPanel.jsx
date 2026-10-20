import { PRINT_FEES, XXL_UPCHARGE, unitPrice } from '../../data/products.js';
import { money } from '../../lib/format.js';
import SizePicker from '../SizePicker.jsx';
import QtyStepper from '../QtyStepper.jsx';
import SizeGuideButton from '../SizeGuide.jsx';
import { useInventory } from '../../context/InventoryContext.jsx';

export default function OrderPanel({ product, size, qty, sides, onSize, onQty, onAdd, adding }) {
  const { availableOf } = useInventory();
  const available = size ? availableOf(product.id, size) : 0;
  const price = size ? unitPrice(product, size, sides) : product.price;
  const canAdd = sides.length > 0 && available >= qty && !adding;

  return (
    <section className="panel order-panel" id="order-panel" aria-labelledby="order-heading">
      <h2 id="order-heading" className="panel__title">
        Your shirt
      </h2>
      <SizePicker
        value={size}
        onChange={onSize}
        stockFor={(s) => availableOf(product.id, s)}
        name="studio-size"
        extra={<SizeGuideButton fit={product.fit} />}
      />
      <div className="order-panel__qty">
        <span className="field-label">Quantity</span>
        <QtyStepper value={qty} onChange={onQty} max={Math.max(1, available)} />
      </div>
      <dl className="price-lines">
        <div>
          <dt>{product.name}</dt>
          <dd>{money(product.price)}</dd>
        </div>
        {sides.map((s) => (
          <div key={s}>
            <dt>{s === 'front' ? 'Front print' : 'Back print'}</dt>
            <dd>{money(PRINT_FEES[s])}</dd>
          </div>
        ))}
        {size === 'XXL' && (
          <div>
            <dt>XXL</dt>
            <dd>{money(XXL_UPCHARGE)}</dd>
          </div>
        )}
        <div className="price-lines__total">
          <dt>{qty > 1 ? `${qty} shirts at ${money(price)}` : 'Per shirt'}</dt>
          <dd>{money(price * qty)}</dd>
        </div>
      </dl>
      <button type="button" className="btn btn--primary btn--block btn--lg" onClick={onAdd} disabled={!canAdd}>
        {adding ? 'Adding…' : 'Add to cart'}
      </button>
      <p className="order-panel__hint">
        {sides.length === 0
          ? 'Add artwork to the front or back to order this shirt.'
          : available < qty
            ? available === 0
              ? `${size} is sold out or already in your cart.`
              : `Only ${available} more available in ${size}.`
            : 'Printed within two business days.'}
      </p>
    </section>
  );
}
