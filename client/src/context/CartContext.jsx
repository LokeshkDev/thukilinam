import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { getShippingSettings, calculateShipping } from '../utils/shipping';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const shippingSettings = getShippingSettings(settings);
  const [cartItems, setCartItems] = useState([]);
  const [summary, setSummary] = useState({ subtotal: 0, shipping: 0, total: 0, itemCount: 0 });
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const cartCount = cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setSummary({ subtotal: 0, shipping: 0, total: 0, itemCount: 0 });
      setCoupon(null);
      setCouponError('');
    }
  }, [user]);

  // Recalculate summary when coupon changes
  useEffect(() => {
    if (cartItems.length > 0) {
      recalcSummary(cartItems);
    }
  }, [coupon, settings]);

  const recalcSummary = (items) => {
    const subtotal = items.reduce((sum, i) => {
      const price = parseFloat(i.variant_sale_price || i.variant_price || i.discount_price || i.price || 0);
      return sum + price * i.quantity;
    }, 0);
    const couponFreeShipping = Boolean(coupon?.is_free_shipping);
    let shipping = calculateShipping(subtotal, shippingSettings, { couponFreeShipping });
    let discount = 0;

    if (coupon) {
      discount = coupon.discount || 0;
    }

    const total = Math.max(0, subtotal - discount + shipping);
    const itemCount = items.reduce((total, item) => total + Number(item.quantity || 0), 0);

    setSummary({
      subtotal,
      shipping,
      total,
      discount,
      itemCount,
      freeThreshold: shippingSettings.free_threshold,
      standardCost: shippingSettings.standard_cost
    });
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cart');
      if (response.data.success) {
        setCartItems(response.data.items);
        // Use local recalc instead of server summary so coupon is applied
        recalcSummary(response.data.items);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, variantId, quantity = 1) => {
    try {
      const response = await api.post('/cart', { product_id: productId, variant_id: variantId, quantity });
      if (response.data.success) {
        fetchCart();
        return true;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
    return false;
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const response = await api.put(`/cart/${itemId}`, { quantity });
      if (response.data.success) {
        // Remove coupon when cart changes as discount may no longer be valid
        setCoupon(null);
        setCouponError('');
        fetchCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await api.delete(`/cart/${itemId}`);
      if (response.data.success) {
        setCoupon(null);
        setCouponError('');
        fetchCart();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await api.delete('/cart');
      if (response.data.success) {
        setCartItems([]);
        setSummary({ subtotal: 0, shipping: 0, total: 0, discount: 0, itemCount: 0 });
        setCoupon(null);
        setCouponError('');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const applyCoupon = async (code) => {
    setCouponError('');
    try {
      const response = await api.post('/coupons/apply', { code, subtotal: summary.subtotal });
      if (response.data.success) {
        setCoupon(response.data.coupon);
        return true;
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to apply coupon.';
      setCouponError(msg);
    }
    return false;
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError('');
    // Recalc without coupon
    recalcSummary(cartItems);
  };

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, summary, loading,
      addToCart, updateQuantity, removeFromCart, clearCart, fetchCart,
      coupon, couponError, applyCoupon, removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};
