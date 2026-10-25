import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const BottomNav = () => {
  const location = useLocation();
  const { settings } = useSettings();
  
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const defaultLinks = [
    { id: '1', label: 'Home', url: '/', icon: 'home' },
    { id: '2', label: 'Shop', url: '/shop', icon: 'grid' },
    { id: '3', label: 'Saved', url: '/wishlist', icon: 'heart' },
    { id: '4', label: 'Bag', url: '/cart', icon: 'bag' }
  ];

  const rawLinks = settings?.bottom_nav_links?.length ? settings.bottom_nav_links : defaultLinks;

  // Filter out any removed links (track, profile, etc.)
  const baseLinks = rawLinks.filter(
    (l) => l.url !== '/track' && l.label?.toLowerCase() !== 'track' && l.url !== '/profile' && l.url !== '/login'
  );

  // Guarantee exactly 4 grid items
  const displayLinks = baseLinks.length === 4 ? baseLinks : defaultLinks;

  return (
    <nav className="bottom-nav" aria-label="Mobile bottom navigation">
      {displayLinks.map((link, idx) => {
        const isLinkActive = link.url.startsWith('/#') 
          ? location.hash === link.url.substring(1) 
          : isActive(link.url);

        return (
          <Link 
            key={link.id || idx} 
            to={link.url} 
            className={`bottom-nav-item ${isLinkActive ? 'is-active' : ''}`}
          >
            <span className="bottom-nav-icon-wrap">
              <svg className="icon" aria-hidden="true">
                <use href={`#icon-${link.icon || 'grid'}`}></use>
              </svg>
            </span>
            <span className="bottom-nav-label">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
