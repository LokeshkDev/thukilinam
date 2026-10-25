import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BottomNav from './components/layout/BottomNav';
import SupportFAB from './components/layout/SupportFAB';
import Loader from './components/layout/Loader';
import IconSprite from './components/ui/IconSprite';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentCallback from './pages/PaymentCallback';
import Wishlist from './pages/dashboard/Wishlist';
import ContentPage from './pages/ContentPage';
import Contact from './pages/Contact';
import CategoryLanding from './pages/CategoryLanding';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppShell = () => {
  return (
    <>
      <ScrollToTop />
      <Loader />
      <div className="site-shell">
        <IconSprite />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/new-in" element={<CategoryLanding pageKey="new-in" />} />
          <Route path="/sarees" element={<CategoryLanding pageKey="sarees" />} />
          <Route path="/kurti-sets" element={<CategoryLanding pageKey="kurti-sets" />} />
          <Route path="/fusion-wear" element={<CategoryLanding pageKey="fusion-wear" />} />
          <Route path="/boutique-deals" element={<CategoryLanding pageKey="boutique-deals" />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/secure-checkout" element={<ContentPage pageKey="secure-checkout" />} />
          <Route path="/customer-care" element={<ContentPage pageKey="customer-care" />} />
          <Route path="/exchange-policy" element={<ContentPage pageKey="exchange-policy" />} />
          <Route path="/exchange" element={<ContentPage pageKey="exchange-policy" />} />
          <Route path="/shipping-details" element={<ContentPage pageKey="shipping-details" />} />
          <Route path="/shipping" element={<ContentPage pageKey="shipping-details" />} />
          <Route path="/stores" element={<ContentPage pageKey="stores" />} />
          <Route path="/help" element={<ContentPage pageKey="help" />} />
          <Route path="/contact" element={<Contact />} />

          {/* Cart & Checkout (Guest / Direct checkout - no login required) */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-callback" element={<PaymentCallback />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Redirects for removed login/register routes */}
          <Route path="/login" element={<Navigate to="/shop" replace />} />
          <Route path="/register" element={<Navigate to="/shop" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/shop" replace />} />
          <Route path="/reset-password" element={<Navigate to="/shop" replace />} />
          <Route path="/profile" element={<Navigate to="/" replace />} />
          <Route path="/orders" element={<Navigate to="/" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
        <BottomNav />
        <SupportFAB />
      </div>
    </>
  );
};

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }, []);

  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
