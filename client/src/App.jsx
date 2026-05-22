import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuth } from './context/AuthContext';

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
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/dashboard/Profile';
import Orders from './pages/dashboard/Orders';
import Wishlist from './pages/dashboard/Wishlist';
import ContentPage from './pages/ContentPage';
import Contact from './pages/Contact';
import TrackOrder from './pages/TrackOrder';
import CategoryLanding from './pages/CategoryLanding';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="app-page">
        <div className="app-empty-state">
          <p>Checking your account...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

const AppShell = () => {
  const { pathname } = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname);

  return (
    <>
      <ScrollToTop />
      <Loader />
      <div className={`site-shell ${isAuthPage ? 'auth-only-shell' : ''}`}>
        <IconSprite />
        {!isAuthPage && <Header />}
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
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/payment-callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Dashboard Routes */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        </Routes>
        {!isAuthPage && <Footer />}
        {!isAuthPage && <BottomNav />}
        {!isAuthPage && <SupportFAB />}
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
