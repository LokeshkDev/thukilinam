import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import api from '../api/axios';

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
      setMessage(res.data.message || 'If this admin email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset link.');
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
            <Mail size={24} />
          </div>
          <h2 className="fw-bold mb-2">Reset Admin Password</h2>
          <p className="text-muted mb-0">Enter your admin email to receive a secure reset link.</p>
        </div>

        {message && <div className="alert alert-success py-2 mb-4 small">{message}</div>}
        {error && <div className="alert alert-danger py-2 mb-4 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="form-label small fw-bold">Admin Email</label>
          <input
            type="email"
            className="form-control bg-light border-0 py-3 mb-4"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@thukilinam.com"
          />
          <button type="submit" className="btn btn-primary w-100 py-3 fw-bold rounded-3" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
