import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import api from '../../api/axios';

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
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await api.post('/auth/reset-password', { token, password });
      if (res.data.success) {
        setMessage('Password reset successfully. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset your password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">Secure reset</p>
          <h1>Create a new password</h1>
          <p>Choose a strong password for your Thukilinam account. Reset links expire after 1 hour.</p>
          <div className="auth-benefits">
            <span>Private account</span>
            <span>Order access</span>
            <span>Wishlist sync</span>
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
              <LockKeyhole size={22} />
            </span>
            <div>
              <h2>Reset Password</h2>
              <p>{token ? 'Enter your new password below.' : 'This reset link is missing or invalid.'}</p>
            </div>
          </div>

          {!token ? (
            <>
              <p className="form-alert">This password reset link is invalid or has expired.</p>
              <Link to="/forgot-password" className="button primary auth-submit">Request New Link</Link>
            </>
          ) : (
            <>
              {message && <p className="form-alert success">{message}</p>}
              {error && <p className="form-alert">{error}</p>}

              <form onSubmit={handleSubmit}>
                <label className="field">
                  <span>New Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </label>

                <label className="field">
                  <span>Confirm New Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </label>

                <button type="submit" className="button primary auth-submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
