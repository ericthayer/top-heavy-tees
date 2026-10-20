import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useInventory } from '../context/InventoryContext.jsx';
import { cartTotals, qtyInCart } from '../context/cartReducer.js';
import { money } from '../lib/format.js';
import { KEYS, readJSON, writeJSON } from '../lib/storage.js';
import { LineThumb, lineDetails } from './Cart.jsx';
import { CheckIcon } from '../components/Icons.jsx';
import NotFound from './NotFound.jsx';

const EMPTY = {
  email: '',
  name: '',
  address1: '',
  address2: '',
  city: '',
  region: '',
  zip: '',
  country: 'United States',
  shipping: 'standard',
  card: '',
  expiry: '',
  cvc: '',
};

const digits = (v) => v.replace(/\D/g, '');

function luhn(num) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function validate(f) {
  const e = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter an email address like name@example.com.';
  if (f.name.trim().length < 2) e.name = 'Enter the name for the delivery.';
  if (f.address1.trim().length < 4) e.address1 = 'Enter a street address.';
  if (!f.city.trim()) e.city = 'Enter a city.';
  if (!f.region.trim()) e.region = 'Enter a state or region.';
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/.test(f.zip.trim())) e.zip = 'Enter a valid ZIP or postal code.';
  const card = digits(f.card);
  if (card.length < 13 || card.length > 19 || !luhn(card)) e.card = 'Enter a valid card number. For this demo, use 4242 4242 4242 4242.';
  const m = f.expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) e.expiry = 'Enter the expiry as MM/YY.';
  else {
    const now = new Date();
    const exp = new Date(2000 + Number(m[2]), Number(m[1]), 1);
    if (exp <= now) e.expiry = 'This card has expired.';
  }
  if (!/^\d{3,4}$/.test(f.cvc)) e.cvc = 'Enter the 3 or 4 digit security code.';
  return e;
}

function deliveryWindow(method, from = new Date()) {
  const addBusinessDays = (d, n) => {
    const out = new Date(d);
    while (n > 0) {
      out.setDate(out.getDate() + 1);
      if (out.getDay() !== 0 && out.getDay() !== 6) n--;
    }
    return out;
  };
  const [a, b] = method === 'express' ? [3, 4] : [5, 7];
  const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${fmt.format(addBusinessDays(from, a))} – ${fmt.format(addBusinessDays(from, b))}`;
}

function Field({ id, label, error, hint, className = '', children }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${className}${error ? ' has-error' : ''}`}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })}
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function Confirmation({ order }) {
  return (
    <div className="confirm">
      <div className="confirm__head">
        <span className="confirm__icon" aria-hidden="true">
          <CheckIcon size={28} />
        </span>
        <h1>Order placed</h1>
        <p>
          Thanks, {order.address.name.split(' ')[0]}. Your order number is <strong className="data">{order.id}</strong>.
        </p>
      </div>
      <div className="confirm__grid">
        <section className="confirm__card" aria-labelledby="c-items">
          <h2 id="c-items">Items</h2>
          <ul className="mini-lines">
            {order.items.map((i) => (
              <li key={i.key}>
                <LineThumb item={i} />
                <div>
                  <p className="mini-lines__name">
                    {i.custom ? `Custom ${i.name}` : i.name} × {i.qty}
                  </p>
                  <p className="mini-lines__meta">{lineDetails(i).join(', ')}</p>
                </div>
                <span className="data">{money(i.unitPrice * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="price-lines">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(order.totals.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{order.totals.shippingCost === 0 ? 'Free' : money(order.totals.shippingCost)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{money(order.totals.tax)}</dd>
            </div>
            <div className="price-lines__total">
              <dt>Total</dt>
              <dd>{money(order.totals.total)}</dd>
            </div>
          </dl>
        </section>
        <section className="confirm__card" aria-labelledby="c-delivery">
          <h2 id="c-delivery">Delivery</h2>
          <p className="confirm__eta">{order.eta}</p>
          <p>{order.shipping === 'express' ? 'Express shipping' : 'Standard shipping'}</p>
          <address>
            {order.address.name}
            <br />
            {order.address.address1}
            {order.address.address2 && (
              <>
                <br />
                {order.address.address2}
              </>
            )}
            <br />
            {order.address.city}, {order.address.region} {order.address.zip}
            <br />
            {order.address.country}
          </address>
          <p className="confirm__muted">Card ending {order.last4}. Confirmation for {order.email}.</p>
        </section>
      </div>
      <p className="notice">This was a demo checkout. No payment was taken and nothing will ship.</p>
      <div className="button-row">
        <Link to="/design-studio" className="btn btn--primary">
          Design another shirt
        </Link>
        <Link to="/products" className="btn btn--outline">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { items, clear } = useCart();
  const { commitOrder, stockOf } = useInventory();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const formRef = useRef(null);

  const orderId = params.get('order');
  const order = useMemo(() => (orderId ? readJSON(KEYS.orders, []).find((o) => o.id === orderId) : null), [orderId]);
  const totals = cartTotals(items, { shipping: form.shipping });
  const errors = validate(form);
  const shown = (k) => (submitted || touched[k]) && errors[k];

  if (orderId) {
    return order ? <Confirmation order={order} /> : <NotFound title="We couldn’t find that order" text="Orders are stored in this browser only." />;
  }

  if (!items.length) {
    return (
      <section className="empty-page">
        <h1>Nothing to check out</h1>
        <p>Your cart is empty. Add a shirt first.</p>
        <div className="button-row">
          <Link to="/products" className="btn btn--primary">
            Browse shirts
          </Link>
        </div>
      </section>
    );
  }

  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === 'card') v = digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
    if (k === 'expiry') {
      const d = digits(v).slice(0, 4);
      v = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    }
    if (k === 'cvc') v = digits(v).slice(0, 4);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const bind = (k) => ({ value: form[k], onChange: set(k), onBlur: blur(k) });

  const stockProblem = items.some((i) => qtyInCart(items, i.productId, i.size) > stockOf(i.productId, i.size));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const invalid = Object.keys(errors);
    if (invalid.length) {
      // Errors render on the next pass, so find the first field by id.
      formRef.current?.querySelector(`#${invalid[0]}`)?.focus();
      return;
    }
    if (stockProblem) return;
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 1300));
    const id = `FP-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      id,
      createdAt: new Date().toISOString(),
      items,
      totals,
      shipping: form.shipping,
      eta: deliveryWindow(form.shipping),
      email: form.email.trim(),
      address: {
        name: form.name.trim(),
        address1: form.address1.trim(),
        address2: form.address2.trim(),
        city: form.city.trim(),
        region: form.region.trim(),
        zip: form.zip.trim(),
        country: form.country,
      },
      last4: digits(form.card).slice(-4),
    };
    const orders = readJSON(KEYS.orders, []);
    if (!writeJSON(KEYS.orders, [newOrder, ...orders].slice(0, 10))) {
      // Previews can be large; keep the order without them if storage is full.
      writeJSON(KEYS.orders, [{ ...newOrder, items: items.map((i) => (i.custom ? { ...i, custom: { ...i.custom, preview: null } } : i)) }]);
    }
    commitOrder(items);
    clear();
    navigate(`/checkout?order=${id}`, { replace: true });
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="checkout">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout__layout">
        <form ref={formRef} className="checkout__form" onSubmit={submit} noValidate>
          {submitted && errorCount > 0 && (
            <div className="notice notice--error" role="alert">
              {errorCount === 1 ? 'One field needs attention.' : `${errorCount} fields need attention.`} Check the messages below.
            </div>
          )}

          <fieldset className="form-section">
            <legend>Contact</legend>
            <Field id="email" label="Email" error={shown('email')}>
              {(a) => <input {...a} type="email" autoComplete="email" {...bind('email')} />}
            </Field>
          </fieldset>

          <fieldset className="form-section">
            <legend>Shipping address</legend>
            <Field id="name" label="Full name" error={shown('name')}>
              {(a) => <input {...a} autoComplete="name" {...bind('name')} />}
            </Field>
            <Field id="address1" label="Street address" error={shown('address1')}>
              {(a) => <input {...a} autoComplete="address-line1" {...bind('address1')} />}
            </Field>
            <Field id="address2" label="Apartment, suite, etc. (optional)">
              {(a) => <input {...a} autoComplete="address-line2" {...bind('address2')} />}
            </Field>
            <div className="field-row field-row--3">
              <Field id="city" label="City" error={shown('city')}>
                {(a) => <input {...a} autoComplete="address-level2" {...bind('city')} />}
              </Field>
              <Field id="region" label="State" error={shown('region')}>
                {(a) => <input {...a} autoComplete="address-level1" {...bind('region')} />}
              </Field>
              <Field id="zip" label="ZIP code" error={shown('zip')}>
                {(a) => <input {...a} autoComplete="postal-code" inputMode="numeric" {...bind('zip')} />}
              </Field>
            </div>
            <Field id="country" label="Country">
              {(a) => (
                <span className="select">
                  <select {...a} autoComplete="country-name" value={form.country} onChange={set('country')}>
                    <option>United States</option>
                    <option>Canada</option>
                  </select>
                </span>
              )}
            </Field>
          </fieldset>

          <fieldset className="form-section">
            <legend>Delivery</legend>
            <div className="radio-cards">
              {[
                { v: 'standard', label: 'Standard', note: deliveryWindow('standard'), price: totals.subtotal >= 75 ? 'Free' : money(5.95) },
                { v: 'express', label: 'Express', note: deliveryWindow('express'), price: money(14.95) },
              ].map((o) => (
                <label key={o.v} className="radio-card">
                  <input type="radio" name="shipping" value={o.v} checked={form.shipping === o.v} onChange={set('shipping')} />
                  <span className="radio-card__body">
                    <span className="radio-card__label">{o.label}</span>
                    <span className="radio-card__note">Arrives {o.note}</span>
                  </span>
                  <span className="radio-card__price">{o.price}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Payment</legend>
            <p className="form-section__note">This is a demo. No card is charged and card details never leave your browser.</p>
            <Field id="card" label="Card number" error={shown('card')} hint="Use 4242 4242 4242 4242 with any future date and any CVC.">
              {(a) => <input {...a} inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" {...bind('card')} />}
            </Field>
            <div className="field-row">
              <Field id="expiry" label="Expiry" error={shown('expiry')}>
                {(a) => <input {...a} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" {...bind('expiry')} />}
              </Field>
              <Field id="cvc" label="Security code" error={shown('cvc')}>
                {(a) => <input {...a} inputMode="numeric" autoComplete="cc-csc" placeholder="123" {...bind('cvc')} />}
              </Field>
            </div>
          </fieldset>

          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={placing || stockProblem}>
            {placing ? (
              <>
                <span className="spinner spinner--sm spinner--light" aria-hidden="true" />
                Placing order…
              </>
            ) : (
              `Place order, ${money(totals.total)}`
            )}
          </button>
          {stockProblem && <p className="form-error">Some items are no longer in stock. Update your cart to continue.</p>}
        </form>

        <aside className="summary" aria-labelledby="co-summary">
          <h2 id="co-summary" className="summary__title">
            Your order
          </h2>
          <ul className="mini-lines">
            {items.map((i) => (
              <li key={i.key}>
                <LineThumb item={i} />
                <div>
                  <p className="mini-lines__name">
                    {i.custom ? `Custom ${i.name}` : i.name} × {i.qty}
                  </p>
                  <p className="mini-lines__meta">{lineDetails(i).join(', ')}</p>
                </div>
                <span className="data">{money(i.unitPrice * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="price-lines">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(totals.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
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
          <Link to="/cart" className="text-link">
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
