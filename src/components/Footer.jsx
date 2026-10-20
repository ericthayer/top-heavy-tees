import { Link } from 'react-router-dom';
import { Wordmark } from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Wordmark className="wordmark--footer" />
          <p>Your artwork, printed big on shirts we keep in stock. Every shirt is printed to order within two business days.</p>
        </div>
        <nav className="site-footer__links" aria-label="Footer">
          <Link to="/products">All shirts</Link>
          <Link to="/design-studio">Design studio</Link>
          <Link to="/cart">Cart</Link>
        </nav>
        <p className="site-footer__note">This is a demo store. Checkout is simulated and no payment is taken.</p>
      </div>
    </footer>
  );
}
