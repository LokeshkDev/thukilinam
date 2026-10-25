import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Box, Ticket, Image, Settings, LogOut, X, MessageSquare } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAdminAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Categories', path: '/categories', icon: <LayoutDashboard size={20} /> },
    { name: 'Products', path: '/products', icon: <ShoppingBag size={20} /> },
    { name: 'Orders', path: '/orders', icon: <Box size={20} /> },
    { name: 'Coupons', path: '/coupons', icon: <Ticket size={20} /> },
    { name: 'Banners', path: '/banners', icon: <Image size={20} /> },
    { name: 'Homepage CMS', path: '/cms', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Sidebar Overlay backdrop for mobile */}
      {isOpen && (
        <div 
          className="admin-sidebar-backdrop d-lg-none" 
          onClick={onClose}
          style={{ transition: 'opacity 0.3s ease' }}
        />
      )}

      <div 
        className="admin-sidebar d-flex flex-column p-3 bg-dark text-white" 
        style={{ 
          width: '260px', 
          height: '100vh', 
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1050,
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        <div className="mb-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <img 
              src="/assets/thukilinam-logo.jpeg" 
              alt="Thukilinam Logo" 
              style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '2px solid rgba(255, 255, 255, 0.1)' }} 
            />
            <div className="text-start">
              <h5 className="mb-0 text-white text-gradient" style={{ fontFamily: "'Great Vibes', 'Italianno', 'Playball', 'Alex Brush', cursive", fontSize: '26px', fontWeight: 'normal', letterSpacing: '0', textTransform: 'none' }}>Thukilinam</h5>
              <small className="text-muted" style={{ fontSize: '10px' }}>Admin Console</small>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-dark p-1 d-lg-none border-0 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <X size={18} />
          </button>
        </div>

      <ul className="nav nav-pills flex-column mb-auto gap-2">
        {navItems.map((item) => (
          <li className="nav-item" key={item.name}>
            <NavLink 
              to={item.path} 
              onClick={onClose}
              className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-3 py-3 rounded-3 ${isActive ? 'bg-primary' : 'hover-opacity'}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <hr />
      <button 
        onClick={() => {
          onClose();
          logout();
        }} 
        className="btn btn-outline-danger d-flex align-items-center gap-3 py-2 border-0 w-100"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
    </>
  );
};

export default Sidebar;
