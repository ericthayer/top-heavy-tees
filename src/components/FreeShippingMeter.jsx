import { FREE_SHIPPING_MIN } from '../context/cartReducer.js';
import { money } from '../lib/format.js';

export default function FreeShippingMeter({ subtotal }) {
  const left = Math.max(0, FREE_SHIPPING_MIN - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);
  return (
    <div className={`ship-meter${left === 0 ? ' is-done' : ''}`}>
      <p>{left > 0 ? `Add ${money(left)} more for free standard shipping.` : 'Your order ships free.'}</p>
      <div
        className="ship-meter__track"
        role="progressbar"
        aria-label="Progress to free shipping"
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_MIN}
        aria-valuenow={Math.min(subtotal, FREE_SHIPPING_MIN)}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
