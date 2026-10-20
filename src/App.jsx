import { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';
import { InventoryProvider } from './context/InventoryContext.jsx';
import { DesignProvider } from './context/DesignContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Toasts from './components/Toasts.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import RouteFallback from './components/RouteFallback.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import { lazyRoute, preloadWhenIdle } from './lib/lazyRoute.js';

// Home is the landing page and ships in the entry chunk; every other route
// loads on demand and is warmed in the background once the page is idle.
const Catalog = lazyRoute(() => import('./pages/Catalog.jsx'));
const ProductDetail = lazyRoute(() => import('./pages/ProductDetail.jsx'));
const DesignStudio = lazyRoute(() => import('./pages/DesignStudio.jsx'));
const Cart = lazyRoute(() => import('./pages/Cart.jsx'));
const Checkout = lazyRoute(() => import('./pages/Checkout.jsx'));
const LAZY_ROUTES = [Catalog, ProductDetail, Cart, DesignStudio, Checkout];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => preloadWhenIdle(LAZY_ROUTES), []);

  return (
    <ToastProvider>
      <CartProvider>
        <InventoryProvider>
          <DesignProvider>
            <ScrollToTop />
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <Header />
            <main id="main" tabIndex={-1}>
              <ErrorBoundary resetKey={pathname}>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Catalog />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/design-studio" element={<DesignStudio />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
            <Toasts />
          </DesignProvider>
        </InventoryProvider>
      </CartProvider>
    </ToastProvider>
  );
}
