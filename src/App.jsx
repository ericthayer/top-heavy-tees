import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';
import { InventoryProvider } from './context/InventoryContext.jsx';
import { DesignProvider } from './context/DesignContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Toasts from './components/Toasts.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import DesignStudio from './pages/DesignStudio.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import NotFound from './pages/NotFound.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <InventoryProvider>
          <DesignProvider>
            <ScrollToTop />
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <p className="announce">Free standard shipping on orders over $75</p>
            <Header />
            <main id="main" tabIndex={-1}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Catalog />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/design-studio" element={<DesignStudio />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <CartDrawer />
            <Toasts />
          </DesignProvider>
        </InventoryProvider>
      </CartProvider>
    </ToastProvider>
  );
}
