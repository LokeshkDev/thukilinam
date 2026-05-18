import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-nav" aria-label="Mobile bottom navigation">
      <Link to="/" className={isActive('/') ? 'is-active' : ''}>
        <svg className="icon" aria-hidden="true">
          <use href="#icon-home"></use>
        </svg>
        Home
      </Link>
      <Link to="/#trends" className={location.hash === '#trends' ? 'is-active' : ''}>
        <svg className="icon" aria-hidden="true">
          <use href="#icon-trend"></use>
        </svg>
        Trends
      </Link>
      <Link to="/shop" className={isActive('/shop') ? 'is-active' : ''}>
        <svg className="icon" aria-hidden="true">
          <use href="#icon-grid"></use>
        </svg>
        Shop
      </Link>
      <Link to="/wishlist" className={isActive('/wishlist') ? 'is-active' : ''}>
        <svg className="icon" aria-hidden="true">
          <use href="#icon-heart"></use>
        </svg>
        Saved
      </Link>
      <Link to="/login" className={isActive('/login') ? 'is-active' : ''}>
        <svg className="icon" aria-hidden="true">
          <use href="#icon-user"></use>
        </svg>
        Profile
      </Link>
    </nav>
  );
};

export default BottomNav;
