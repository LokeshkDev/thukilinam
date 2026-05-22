import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const Header = () => {
  const location = useLocation();
  const { settings } = useSettings();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const announcementText = settings?.header?.announcement || "New arrivals every week";
  const logoText = settings?.header?.logo_text || "Thukilinam";
  const logoImage = settings?.header?.logo_image || "/assets/thukilinam-logo.jpeg";

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        try {
          const res = await api.get(`/products?search=${searchTerm}&limit=5`);
          if (res.data.success) {
            setSearchResults(res.data.products);
            setShowDropdown(true);
          }
        } catch (err) {
          console.error('Error searching products:', err);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`desktop-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="utility-bar">
          <span>{announcementText}</span>
          <nav aria-label="Utility navigation">
            <Link to="/track">Track order</Link>
            <Link to="/stores">Stores</Link>
            <Link to="/help">Help</Link>
          </nav>
        </div>

        <div className="main-nav">
          <Link className="brand" to="/" aria-label={`${logoText} home`}>
            <img src={logoImage} alt={`${logoText} logo`} />
            <span>{logoText}</span>
          </Link>

          <div className="search-field-container" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <label className="search-field" style={{ width: '100%' }}>
              <svg className="icon" aria-hidden="true">
                <use href="#icon-search"></use>
              </svg>
              <span>Search</span>
              <input 
                type="search" 
                placeholder="Search sarees, kurti sets, bags" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onFocus={() => searchTerm && setShowDropdown(true)}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
              />
            </label>
            
            {showDropdown && searchResults.length > 0 && (
              <div className="search-dropdown" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                boxShadow: 'var(--shadow)',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {searchResults.map(prod => (
                  <Link 
                    key={prod.id} 
                    to={`/product/${prod.slug}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px',
                      borderBottom: '1px solid var(--line)',
                      textDecoration: 'none',
                      color: 'var(--ink)'
                    }}
                    onClick={() => {
                      setSearchTerm('');
                      setShowDropdown(false);
                    }}
                  >
                    <img 
                      src={prod.primary_image?.startsWith('http') ? prod.primary_image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${prod.primary_image}`} 
                      alt={prod.name} 
                      style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '500' }}>{prod.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.9em' }}>
                        Rs. {prod.discount_price || prod.price}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {showDropdown && searchTerm && searchResults.length === 0 && (
              <div className="search-dropdown" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                boxShadow: 'var(--shadow)',
                zIndex: 1000,
                padding: '10px',
                textAlign: 'center',
                color: 'var(--muted)'
              }}>
                No products found
              </div>
            )}
          </div>

          <nav className="action-nav" aria-label="Shopping actions">
            <Link 
              to={user ? "/profile" : "/login"}
              style={location.pathname === (user ? "/profile" : "/login") ? { boxShadow: '0 2px 0 0 var(--purple-700)', color: 'var(--purple-700)' } : {}}
            >
              <svg className="icon" aria-hidden="true">
                <use href="#icon-user"></use>
              </svg>
              Account
            </Link>
            {!user && (
              <Link 
                to="/register"
                style={location.pathname === "/register" ? { boxShadow: '0 2px 0 0 var(--purple-700)', color: 'var(--purple-700)' } : {}}
              >
                <svg className="icon" aria-hidden="true">
                  <use href="#icon-user"></use>
                </svg>
                Register
              </Link>
            )}
            <Link 
              to="/wishlist"
              style={location.pathname === "/wishlist" ? { boxShadow: '0 2px 0 0 var(--purple-700)', color: 'var(--purple-700)' } : {}}
            >
              <svg className="icon" aria-hidden="true">
                <use href="#icon-heart"></use>
              </svg>
              Wishlist
            </Link>
            <Link 
              to="/cart"
              style={location.pathname === "/cart" ? { boxShadow: '0 2px 0 0 var(--purple-700)', color: 'var(--purple-700)' } : {}}
            >
              <svg className="icon" aria-hidden="true">
                <use href="#icon-bag"></use>
              </svg>
              Bag {cartCount > 0 && <strong>{cartCount}</strong>}
            </Link>
          </nav>
        </div>

        <nav className="category-nav" aria-label="Shop categories">
          {(settings?.header_links || [
            { label: 'New In', url: '/shop?sort=newest' },
            { label: 'Sarees', url: '/shop?cat=sarees' },
            { label: 'Kurti Sets', url: '/shop?cat=kurtis' },
            { label: 'Fusion Wear', url: '/shop?cat=salwar-sets' },
            { label: 'Boutique Deals', url: '/shop?sort=price_asc' }
          ]).map((link, idx) => {
            const currentUrl = location.pathname + location.search;
            const urlParams = new URLSearchParams(location.search);
            const currentCat = urlParams.get('cat');
            const linkParams = new URLSearchParams(link.url.split('?')[1] || '');
            const linkCat = linkParams.get('cat');
            
            const isActive = currentUrl === link.url || (currentCat && currentCat === linkCat);

            return (
              <Link 
                key={idx} 
                to={link.url}
                className={isActive ? 'active-tab' : ''}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <header className="mobile-header">
        <div className="mobile-top">
          <Link className="brand compact" to="/" aria-label={`${logoText} home`}>
            <img src={logoImage} alt={`${logoText} logo`} />
            <span>{logoText}</span>
          </Link>
          <Link className="icon-button mobile-bag-button" to="/cart" aria-label={`Open bag with ${cartCount} items`}>
            <svg className="icon" aria-hidden="true">
              <use href="#icon-bag"></use>
            </svg>
            {cartCount > 0 && <strong>{cartCount}</strong>}
          </Link>
        </div>
        <label className="mobile-search">
          <svg className="icon" aria-hidden="true">
            <use href="#icon-search"></use>
          </svg>
          <input type="search" placeholder="Search sarees, kurti sets..." />
        </label>
      </header>
    </>
  );
};

export default Header;
