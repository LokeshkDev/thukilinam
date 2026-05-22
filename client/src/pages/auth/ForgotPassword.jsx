import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import api from '../../api/axios';

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
      setError(err.response?.data?.message || 'Unable to send a reset link right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">Account recovery</p>
          <h1>Reset your password</h1>
          <p>Enter the email linked to your Thukilinam account. We will send a secure one-time reset link.</p>
          <div className="auth-benefits">
            <span>Secure link</span>
            <span>1 hour expiry</span>
            <span>One-time use</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="mb-3">
            <Link to="/login" className="back-to-home-link">
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>

          <div className="auth-card-head">
            <span className="app-empty-icon small">
              <Mail size={22} />
            </span>
            <div>
              <h2>Forgot Password</h2>
              <p>We will email instructions if the account exists.</p>
            </div>
          </div>

          {message && <p className="form-alert success">{message}</p>}
          {error && <p className="form-alert">{error}</p>}

          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </label>

            <button type="submit" className="button primary auth-submit" disabled={loading}>
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="auth-switch">
            Remember your password? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
