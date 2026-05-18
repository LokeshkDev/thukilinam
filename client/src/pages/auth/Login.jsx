import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', formData);
      if (res.data.success) {
        login(res.data.user, res.data.token);
        navigate(location.state?.from?.pathname || '/profile', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">Thukilinam Account</p>
          <h1>Welcome back</h1>
          <p>Sign in to view orders, manage wishlist pieces, and checkout faster.</p>
          <div className="auth-benefits">
            <span>Wishlist sync</span>
            <span>Faster checkout</span>
            <span>Order updates</span>
          </div>
        </div>

        <div className="auth-card">
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
          <div className="auth-card-head">
            <span className="app-empty-icon small">
              <svg className="icon" aria-hidden="true">
                <use href="#icon-user"></use>
              </svg>
            </span>
            <div>
              <h2>Login</h2>
              <p>Use your registered email and password.</p>
            </div>
          </div>

          {error && <p className="form-alert">{error}</p>}

          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
              />
            </label>

            <label className="field">
              <span className="field-row">
                Password
                <Link to="/forgot-password">Forgot?</Link>
              </span>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </label>

            <button type="submit" className="button primary auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            New to Thukilinam? <Link to="/register">Create Account</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
