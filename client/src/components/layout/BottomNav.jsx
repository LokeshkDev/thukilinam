import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = useSettings();
  
  const isActive = (path) => location.pathname === path;

  // Load links from CMS or fallback to default ones
  const baseLinks = settings?.bottom_nav_links || [
    { id: '1', label: 'Home', url: '/', icon: 'home', access: 'everyone' },
    { id: '2', label: 'Trends', url: '/#trends', icon: 'trend', access: 'everyone' },
    { id: '3', label: 'Shop', url: '/shop', icon: 'grid', access: 'everyone' },
    { id: '4', label: 'Saved', url: '/wishlist', icon: 'heart', access: 'everyone' },
    { id: '5', label: 'Profile', url: '/profile', icon: 'user', access: 'everyone' }
  ];

  // Filter based on user session state and CMS configured access controls
  const navLinks = baseLinks.filter(link => {
    if (!link.access || link.access === 'everyone') return true;
    if (link.access === 'logged_in') return !!user;
    if (link.access === 'guest') return !user;
    return true;
  });

  return (
    <nav className="bottom-nav" aria-label="Mobile bottom navigation">
      {navLinks.map((link, idx) => {
        // Resolve profile/account URLs to /profile to let ProtectedRoute handle authentication/loading state gracefully
        let targetUrl = link.url;
        const isProfileOrLogin = 
          targetUrl === '/profile' || 
          targetUrl === '/login' || 
          link.label.toLowerCase().includes('profile') || 
          link.label.toLowerCase().includes('account') || 
          link.label.toLowerCase().includes('login') || 
          link.icon === 'user';
        
        if (isProfileOrLogin) {
          targetUrl = '/profile';
        }

        const isLinkActive = targetUrl.startsWith('/#') 
          ? location.hash === targetUrl.substring(1) 
          : isActive(targetUrl);

        return (
          <Link key={link.id || idx} to={targetUrl} className={isLinkActive ? 'is-active' : ''}>
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
