import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import api from '../api/axios';

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
      setMessage(res.data.message || 'Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page d-flex align-items-center justify-content-center min-vh-100 bg-dark">
      <div className="login-card bg-white p-5 rounded-4 shadow-lg" style={{ width: '100%', maxWidth: '420px' }}>
        <Link to="/login" className="text-muted text-decoration-none small fw-bold d-inline-flex align-items-center gap-2 mb-4">
          <ArrowLeft size={16} /> Back to Login
        </Link>
        <div className="text-center mb-4">
          <div className="bg-primary-soft text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 54, height: 54 }}>
            <KeyRound size={24} />
          </div>
          <h2 className="fw-bold mb-2">Create New Password</h2>
          <p className="text-muted mb-0">{token ? 'Choose a strong password for your admin account.' : 'This reset link is missing or invalid.'}</p>
        </div>

        {!token ? (
          <>
            <div className="alert alert-danger py-2 mb-4 small">This reset link is invalid or expired.</div>
            <Link to="/forgot-password" className="btn btn-primary w-100 py-3 fw-bold rounded-3">Request New Link</Link>
          </>
        ) : (
          <>
            {message && <div className="alert alert-success py-2 mb-4 small">{message}</div>}
            {error && <div className="alert alert-danger py-2 mb-4 small">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label className="form-label small fw-bold">New Password</label>
              <input
                type="password"
                className="form-control bg-light border-0 py-3 mb-3"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <label className="form-label small fw-bold">Confirm Password</label>
              <input
                type="password"
                className="form-control bg-light border-0 py-3 mb-4"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold rounded-3" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
