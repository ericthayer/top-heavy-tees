import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { CartIcon, CloseIcon, MenuIcon } from './Icons.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { totals, openDrawer } = useCart();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Logo />
        <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Main">
          <NavLink to="/products" className="site-nav__link">
            Shirts
          </NavLink>
          <NavLink to="/design-studio" className="site-nav__link">
            Design studio
          </NavLink>
        </nav>
        <div className="site-header__actions">
          <button
            type="button"
            className="cart-link"
            onClick={openDrawer}
            aria-haspopup="dialog"
            aria-label={`Cart, ${totals.count} ${totals.count === 1 ? 'item' : 'items'}`}
          >
            <CartIcon size={22} />
            <span className="cart-link__label">Cart</span>
            {totals.count > 0 && (
              <span className="cart-link__count" key={totals.count}>
                {totals.count}
              </span>
            )}
          </button>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
