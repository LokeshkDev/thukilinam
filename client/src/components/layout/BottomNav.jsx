import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const BottomNav = () => {
  const location = useLocation();
  const { settings } = useSettings();
  
  const isActive = (path) => location.pathname === path;

  const rawLinks = settings?.bottom_nav_links || [
    { id: '1', label: 'Home', url: '/', icon: 'home' },
    { id: '2', label: 'Shop', url: '/shop', icon: 'grid' },
    { id: '3', label: 'Saved', url: '/wishlist', icon: 'heart' },
    { id: '4', label: 'Bag', url: '/cart', icon: 'bag' }
  ];

  // Filter out any track or profile links
  const baseLinks = rawLinks.filter(
    (l) => l.url !== '/track' && l.label?.toLowerCase() !== 'track' && l.url !== '/profile' && l.url !== '/login'
  );

  return (
    <nav className="bottom-nav" aria-label="Mobile bottom navigation">
      {baseLinks.map((link, idx) => {
        const isLinkActive = link.url.startsWith('/#') 
          ? location.hash === link.url.substring(1) 
          : isActive(link.url);

        return (
          <Link key={link.id || idx} to={link.url} className={isLinkActive ? 'is-active' : ''}>
            <svg className="icon" aria-hidden="true">
              <use href={`#icon-${link.icon || 'grid'}`}></use>
            </svg>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
