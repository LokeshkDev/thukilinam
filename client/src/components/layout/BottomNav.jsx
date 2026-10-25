import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const BottomNav = () => {
  const location = useLocation();
  const { settings } = useSettings();
  
  const isActive = (path) => location.pathname === path;

  const baseLinks = settings?.bottom_nav_links || [
    { id: '1', label: 'Home', url: '/', icon: 'home' },
    { id: '2', label: 'Shop', url: '/shop', icon: 'grid' },
    { id: '3', label: 'Saved', url: '/wishlist', icon: 'heart' },
    { id: '4', label: 'Track', url: '/track', icon: 'trend' },
    { id: '5', label: 'Bag', url: '/cart', icon: 'bag' }
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile bottom navigation">
      {baseLinks.map((link, idx) => {
        let targetUrl = link.url;
        // Redirect any legacy profile/login links to /track
        if (targetUrl === '/profile' || targetUrl === '/login' || link.icon === 'user') {
          targetUrl = '/track';
        }

        const isLinkActive = targetUrl.startsWith('/#') 
          ? location.hash === targetUrl.substring(1) 
          : isActive(targetUrl);

        return (
          <Link key={link.id || idx} to={targetUrl} className={isLinkActive ? 'is-active' : ''}>
            <svg className="icon" aria-hidden="true">
              <use href={`#icon-${link.icon === 'user' ? 'trend' : (link.icon || 'grid')}`}></use>
            </svg>
            {link.label === 'Profile' ? 'Track' : link.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
