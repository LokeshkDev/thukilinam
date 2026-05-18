import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        login(res.data.user, res.data.token);
        navigate(location.state?.from?.pathname || '/profile', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">Create Account</p>
          <h1>Join Thukilinam</h1>
          <p>Save your wishlist, track orders, and keep delivery details ready for every boutique drop.</p>
          <div className="auth-benefits">
            <span>Saved addresses</span>
            <span>Order tracking</span>
            <span>Wishlist access</span>
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
              <h2>Register</h2>
              <p>Create your boutique account in a few details.</p>
            </div>
          </div>

          {error && <p className="form-alert">{error}</p>}

          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Full Name</span>
              <input
                type="text"
                required
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Phone Number</span>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                required
                placeholder="Create password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </label>

            <button type="submit" className="button primary auth-submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Register;
