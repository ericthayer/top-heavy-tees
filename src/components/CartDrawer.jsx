import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QtyStepper from './QtyStepper.jsx';
import FreeShippingMeter from './FreeShippingMeter.jsx';
import { LineThumb, lineDetails } from './CartLine.jsx';
import { CloseIcon, TrashIcon } from './Icons.jsx';
import { money } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useInventory } from '../context/InventoryContext.jsx';

/** Slide-out cart. Opens after "Add to cart" and from the header cart button. */
export default function CartDrawer() {
  const { items, totals, setQty, remove, drawerOpen, closeDrawer } = useCart();
  const { availableOf } = useInventory();
  const ref = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (drawerOpen && !d.open) d.showModal();
    if (!drawerOpen && d.open) d.close();
  }, [drawerOpen]);

  // Navigating anywhere closes the drawer.
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  const go = (to) => {
    closeDrawer();
    navigate(to);
  };

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-title"
      onClose={closeDrawer}
      onClick={(e) => {
        if (e.target === ref.current) closeDrawer();
      }}
    >
      <div className="drawer__panel">
        <div className="drawer__head">
          <h2 id="drawer-title">
            Your cart <span className="drawer__count">{totals.count}</span>
          </h2>
          <button type="button" className="icon-btn" onClick={closeDrawer} aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {items.length ? (
          <>
            <div className="drawer__meter">
              <FreeShippingMeter subtotal={totals.subtotal} />
            </div>
            <ul className="drawer__lines" aria-label="Items in your cart">
              {items.map((item) => {
                const max = availableOf(item.productId, item.size, item.key);
                return (
                  <li key={item.key} className="drawer-line">
                    <LineThumb item={item} />
                    <div className="drawer-line__info">
                      <p className="drawer-line__name">{item.custom ? `Custom ${item.name}` : item.name}</p>
                      <p className="drawer-line__meta">{lineDetails(item).join(', ')}</p>
                      <div className="drawer-line__controls">
                        <QtyStepper value={item.qty} onChange={(q) => setQty(item.key, q)} max={Math.max(item.qty, max)} label={`Quantity of ${item.name}`} />
                        <button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(item.key)} aria-label={`Remove ${item.name}`}>
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="drawer-line__price data">{money(item.unitPrice * item.qty)}</p>
                  </li>
                );
              })}
            </ul>
            <div className="drawer__foot">
              <div className="drawer__subtotal">
                <span>Subtotal</span>
                <span className="data">{money(totals.subtotal)}</span>
              </div>
              <p className="drawer__note">Shipping and tax are calculated at checkout.</p>
              <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => go('/checkout')}>
                Checkout
              </button>
              <button type="button" className="btn btn--outline btn--block" onClick={() => go('/cart')}>
                View cart
              </button>
            </div>
          </>
        ) : (
          <div className="drawer__empty">
            <p>Your cart is empty.</p>
            <button type="button" className="btn btn--primary" onClick={() => go('/design-studio')}>
              Start designing
            </button>
            <button type="button" className="btn btn--outline" onClick={() => go('/products')}>
              Browse shirts
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
