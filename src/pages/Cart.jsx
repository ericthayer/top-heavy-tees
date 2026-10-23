import { Link, useNavigate } from 'react-router-dom';
import { LineThumb, lineDetails } from '../components/CartLine.jsx';
import FreeShippingMeter from '../components/FreeShippingMeter.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import { TrashIcon } from '../components/Icons.jsx';
import { money } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useInventory } from '../context/InventoryContext.jsx';
import { qtyInCart } from '../context/cartReducer.js';

export default function Cart() {
  const { items, totals, setQty, remove } = useCart();
  const { stockOf } = useInventory();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <section className="empty-page">
        <h1>Your cart is empty</h1>
        <p>Start with your own artwork in the design studio, or pick a shirt from the catalog.</p>
        <div className="button-row">
          <Link to="/design-studio" className="btn btn--primary">
            Start designing
          </Link>
          <Link to="/products" className="btn btn--outline">
            Browse shirts
          </Link>
        </div>
      </section>
    );
  }

  const problems = items.filter((i) => qtyInCart(items, i.productId, i.size) > stockOf(i.productId, i.size));

  return (
    <div className="cart-page">
      <h1 className="page-title">Cart</h1>
      <div className="cart-layout">
        <ul className="cart-lines" aria-label="Items in your cart">
          {items.map((item) => {
            const stock = stockOf(item.productId, item.size);
            const max = Math.max(0, stock - qtyInCart(items, item.productId, item.size, item.key));
            const short = item.qty > max;
            return (
              <li key={item.key} className="cart-line">
                <Link to={`/products/${item.productId}`} className="cart-line__thumb" tabIndex={-1} aria-hidden="true">
                  <LineThumb item={item} />
                </Link>
                <div className="cart-line__info">
                  <h2 className="cart-line__name">
                    <Link to={`/products/${item.productId}`}>{item.custom ? `Custom ${item.name}` : item.name}</Link>
                  </h2>
                  <ul className="cart-line__details">
                    {lineDetails(item).map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  {item.custom?.files?.length > 0 && <p className="cart-line__files">Artwork: {item.custom.files.join(', ')}</p>}
                  {short && (
                    <p className="form-error" role="alert">
                      {max === 0 ? `${item.size} is now sold out.` : `Only ${max} available in ${item.size}.`}
                    </p>
                  )}
                </div>
                <div className="cart-line__controls">
                  <QtyStepper value={item.qty} onChange={(q) => setQty(item.key, q)} max={Math.max(item.qty, max)} label={`Quantity of ${item.name}`} />
                  <button type="button" className="btn btn--small btn--ghost btn--danger" onClick={() => remove(item.key)}>
                    <TrashIcon size={16} />
                    Remove
                  </button>
                </div>
                <p className="cart-line__price">
                  <span className="data">{money(item.unitPrice * item.qty)}</span>
                  {item.qty > 1 && <span className="cart-line__each">{money(item.unitPrice)} each</span>}
                </p>
              </li>
            );
          })}
        </ul>

        <aside className="summary" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="summary__title">
            Order summary
          </h2>
          <dl className="price-lines">
            <div>
              <dt>Subtotal ({totals.count} {totals.count === 1 ? 'shirt' : 'shirts'})</dt>
              <dd>{money(totals.subtotal)}</dd>
            </div>
            <div>
              <dt>Standard shipping</dt>
              <dd>{totals.shippingCost === 0 ? 'Free' : money(totals.shippingCost)}</dd>
            </div>
            <div>
              <dt>Estimated tax</dt>
              <dd>{money(totals.tax)}</dd>
            </div>
            <div className="price-lines__total">
              <dt>Total</dt>
              <dd>{money(totals.total)}</dd>
            </div>
          </dl>
          <FreeShippingMeter subtotal={totals.subtotal} />
          <button type="button" className="btn btn--primary btn--lg btn--block" disabled={problems.length > 0} onClick={() => navigate('/checkout')}>
            Go to checkout
          </button>
          {problems.length > 0 && <p className="summary__note">Fix the stock issues above to continue.</p>}
          <Link to="/products" className="text-link summary__continue">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
