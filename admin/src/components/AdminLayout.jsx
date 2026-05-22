import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, Shield, KeyRound } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../api/axios';

const AdminLayout = () => {
  const { admin, logout, loading } = useAdminAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 992);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const requestPasswordReset = async () => {
    setResetLoading(true);
    setResetMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email: admin.email });
      setResetMessage(res.data.message || 'Password reset link sent to your admin email.');
    } catch (err) {
      setResetMessage(err.response?.data?.message || 'Unable to send reset link. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border text-primary"></div></div>;

  if (!admin) return <Navigate to="/login" replace />;

  return (
    <div className={`admin-layout d-flex bg-light min-vh-100 ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => {
        if (window.innerWidth < 992) setIsSidebarOpen(false);
      }} />
      
      <div 
        className="admin-main-content flex-grow-1 d-flex flex-column" 
        style={{ 
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <header className="admin-header bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <div className="d-flex align-items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(prev => !prev)} 
              className="btn btn-light p-2 border rounded d-flex align-items-center justify-content-center"
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
            <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
              <Shield size={20} className="text-primary d-none d-sm-inline" />
              <span>Console</span>
            </h5>
          </div>

          <div className="position-relative">
            <div 
              className="admin-profile d-flex align-items-center gap-2 border p-1 px-3 rounded hover-bg" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
            >
              <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px' }}>
                {admin.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-start d-none d-sm-block">
                <p className="mb-0 fw-bold small leading-none">{admin.name}</p>
                <small className="text-muted text-uppercase" style={{ fontSize: '9px', display: 'block', marginTop: '-2px' }}>{admin.role}</small>
              </div>
              <ChevronDown size={14} className="text-muted d-none d-sm-block" />
            </div>

            {isProfileOpen && (
              <>
                <div 
                  className="dropdown-overlay" 
                  onClick={() => setIsProfileOpen(false)} 
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                />
                <div 
                  className="dropdown-menu show position-absolute end-0 mt-2 shadow border-0 p-2" 
                  style={{ zIndex: 100, minWidth: '220px', borderRadius: '10px' }}
                >
                  <div className="px-3 py-2 border-bottom mb-2">
                    <p className="mb-0 fw-bold small">{admin.name}</p>
                    <small className="text-muted" style={{ fontSize: '11px' }}>{admin.role || 'Administrator'}</small>
                  </div>
                  <button
                    onClick={requestPasswordReset}
                    className="dropdown-item text-dark d-flex align-items-center gap-2 rounded py-2 w-100 text-start border-0 bg-transparent"
                    disabled={resetLoading}
                    type="button"
                  >
                    <KeyRound size={16} />
                    <span className="fw-semibold">{resetLoading ? 'Sending Link...' : 'Reset Password'}</span>
                  </button>
                  {resetMessage && (
                    <div className="px-3 py-2 small text-muted" style={{ lineHeight: 1.4 }}>
                      {resetMessage}
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }} 
                    className="dropdown-item text-danger d-flex align-items-center gap-2 rounded py-2 w-100 text-start border-0 bg-transparent"
                  >
                    <LogOut size={16} />
                    <span className="fw-semibold">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="p-4 flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
