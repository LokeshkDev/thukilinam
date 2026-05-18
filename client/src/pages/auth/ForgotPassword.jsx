import React, { useState } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                <h2 className="fw-bold mb-2">Forgot <span className="text-gradient">Password?</span></h2>
                <p className="text-muted">Enter your email address to receive a reset link.</p>
              </div>

              {message && <div className="alert alert-success py-2 mb-4">{message}</div>}
              {error && <div className="alert alert-danger py-2 mb-4">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label small fw-bold">Email Address</label>
                  <div className="input-group-custom">
                    <i className="fa-regular fa-envelope icon"></i>
                    <input 
                      type="email" 
                      className="form-control glass-input" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary-custom w-100 py-3 fw-bold mb-4" disabled={loading}>
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="text-center">
                <p className="mb-0">Remember your password? <Link to="/login" className="text-gradient fw-bold text-decoration-none">Back to Login</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
