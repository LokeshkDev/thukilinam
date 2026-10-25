import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { useSettings } from './SettingsContext';
import { getShippingSettings, calculateShipping } from '../utils/shipping';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const CART_STORAGE_KEY = 'thukilinam_cart';

export const CartProvider = ({ children }) => {
  const { settings } = useSettings();
  const shippingSettings = getShippingSettings(settings);

  // Initialize cart from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [summary, setSummary] = useState({ subtotal: 0, shipping: 0, total: 0, itemCount: 0, discount: 0 });
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const cartCount = cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
    recalcSummary(cartItems);
  }, [cartItems]);

  // Recalculate summary when coupon or settings change
  useEffect(() => {
    recalcSummary(cartItems);
  }, [coupon, settings]);

  const recalcSummary = (items) => {
    const subtotal = items.reduce((sum, i) => {
      const price = parseFloat(i.variant_sale_price || i.variant_price || i.discount_price || i.price || 0);
      return sum + price * (Number(i.quantity) || 1);
    }, 0);

    const couponFreeShipping = Boolean(coupon?.is_free_shipping);
    let shipping = calculateShipping(subtotal, shippingSettings, { couponFreeShipping });
    let discount = 0;

    if (coupon) {
      discount = coupon.discount || 0;
    }

    const total = Math.max(0, subtotal - discount + shipping);
    const itemCount = items.reduce((cnt, item) => cnt + Number(item.quantity || 0), 0);

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

  const addToCart = async (productOrId, variantOrId = null, quantity = 1) => {
    setLoading(true);
    try {
      let product = productOrId;

      // If only ID passed, fetch product details
      if (typeof productOrId === 'number' || typeof productOrId === 'string') {
        const res = await api.get(`/products/${productOrId}`);
        if (res.data?.success && res.data.product) {
          product = res.data.product;
        } else {
          return false;
        }
      }

      if (!product || !product.id) return false;

      const variant = typeof variantOrId === 'object' ? variantOrId : null;
      const variantId = variant?.id || (typeof variantOrId === 'number' || typeof variantOrId === 'string' ? variantOrId : null);

      const uniqueKey = `${product.id}_${variantId || 'base'}`;

      let primaryImage = product.primary_image || (product.images && product.images[0]?.image_url) || product.image || '';
      if (variant?.image_url) primaryImage = variant.image_url;

      setCartItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item.cart_item_key === uniqueKey);
        if (existingIndex > -1) {
          const updated = [...prevItems];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity
          };
          return updated;
        } else {
          const newItem = {
            id: uniqueKey,
            cart_item_key: uniqueKey,
            product_id: product.id,
            variant_id: variantId,
            name: product.name,
            slug: product.slug,
            price: product.price,
            discount_price: product.discount_price,
            variant_price: variant?.price || null,
            variant_sale_price: variant?.sale_price || null,
            image: primaryImage,
            attributes: variant?.attributes || null,
            size: variant?.size || null,
            color: variant?.color || null,
            quantity: quantity,
            stock: variant?.stock ?? product.stock ?? 10
          };
          return [...prevItems, newItem];
        }
      });

      return true;
    } catch (err) {
      console.error('Error adding to local cart:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    const qty = Math.max(1, parseInt(newQuantity) || 1);
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId || item.cart_item_key === itemId ? { ...item, quantity: qty } : item))
    );
    setCoupon(null);
    setCouponError('');
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId && item.cart_item_key !== itemId));
    setCoupon(null);
    setCouponError('');
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setCouponError('');
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {}
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
    recalcSummary(cartItems);
  };

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, summary, loading,
      addToCart, updateQuantity, removeFromCart, clearCart,
      coupon, couponError, applyCoupon, removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};
