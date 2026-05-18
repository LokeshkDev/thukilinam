import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      if (res.data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page py-5 mt-5 d-flex align-items-center min-vh-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-5 col-md-7 text-center">
              <div className="auth-card glass p-5 rounded-4">
                <div className="mb-3 text-start">
                  <Link 
                    to="/" 
                    className="back-to-home-link"
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--muted)',
                      fontSize: '13px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--purple-700)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Home</span>
                  </Link>
                </div>
                <i className="fa-solid fa-circle-exclamation text-danger mb-3 fs-1"></i>
                <h3 className="fw-bold mb-3">Invalid Link</h3>
                <p className="text-muted mb-4">This password reset link is invalid or has expired.</p>
                <Link to="/forgot-password" name="forgot-password" id="forgot-password" className="btn btn-primary-custom w-100 py-3 fw-bold">Request New Link</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page py-5 mt-5 d-flex align-items-center min-vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-7">
            <div className="auth-card glass p-4 p-md-5 rounded-4" data-aos="zoom-in">
              <div className="mb-3">
                <Link 
                  to="/" 
                  className="back-to-home-link"
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--muted)',
                    fontSize: '13px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--purple-700)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Home</span>
                </Link>
              </div>
              <div className="text-center mb-5">
                <h2 className="fw-bold mb-2">Reset <span className="text-gradient">Password</span></h2>
                <p className="text-muted">Enter your new password below.</p>
              </div>

              {message && <div className="alert alert-success py-2 mb-4">{message}</div>}
              {error && <div className="alert alert-danger py-2 mb-4">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label small fw-bold">New Password</label>
                  <div className="input-group-custom">
                    <i className="fa-solid fa-lock icon"></i>
                    <input 
                      type="password" 
                      className="form-control glass-input" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold">Confirm New Password</label>
                  <div className="input-group-custom">
                    <i className="fa-solid fa-lock icon"></i>
                    <input 
                      type="password" 
                      className="form-control glass-input" 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary-custom w-100 py-3 fw-bold mb-4" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
