import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wishlist');
      if (response.data.success) {
        setWishlistItems(response.data.items);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId) => {
    const isExist = wishlistItems.find(item => item.product_id === productId);
    try {
      if (isExist) {
        await api.delete(`/wishlist/${productId}`);
      } else {
        await api.post('/wishlist', { product_id: productId });
      }
      fetchWishlist();
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const moveToCart = async (productId) => {
    try {
      const response = await api.post(`/wishlist/${productId}/move-to-cart`);
      if (response.data.success) {
        fetchWishlist();
        return true;
      }
    } catch (error) {
      console.error('Error moving to cart:', error);
    }
    return false;
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, loading, toggleWishlist, moveToCart, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
