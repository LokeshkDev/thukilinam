import React, { createContext, useState, useEffect, useContext } from 'react';
import { useCart } from './CartContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

const WISHLIST_STORAGE_KEY = 'thukilinam_wishlist';

export const WishlistProvider = ({ children }) => {
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (e) {
      console.error('Failed to save wishlist:', e);
    }
  }, [wishlistItems]);

  const toggleWishlist = (product) => {
    const productId = typeof product === 'object' ? product.id : product;
    setWishlistItems((prev) => {
      const exists = prev.some((item) => (item.id || item.product_id) === productId);
      if (exists) {
        return prev.filter((item) => (item.id || item.product_id) !== productId);
      } else {
        const itemToAdd = typeof product === 'object' ? product : { id: productId, product_id: productId };
        return [...prev, itemToAdd];
      }
    });
  };

  const moveToCart = async (product) => {
    const success = await addToCart(product, null, 1);
    if (success) {
      const productId = typeof product === 'object' ? product.id : product;
      setWishlistItems((prev) => prev.filter((item) => (item.id || item.product_id) !== productId));
      return true;
    }
    return false;
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, loading: false, toggleWishlist, moveToCart }}>
      {children}
    </WishlistContext.Provider>
  );
};
