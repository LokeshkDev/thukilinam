import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../api/axios';
import { Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
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
        login(res.data.admin, res.data.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page d-flex align-items-center justify-content-center min-vh-100 bg-dark">
      <div className="login-card bg-white p-5 rounded-4 shadow-lg" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold text-gradient">Thukilinam</h2>
          <p className="text-muted">Administrative Login</p>
        </div>

        {error && <div className="alert alert-danger py-2 mb-4 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label small fw-bold">Admin Email</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Mail size={18} className="text-muted" /></span>
              <input 
                type="email" 
                className="form-control bg-light border-0" 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="admin@thukilinam.com"
              />
            </div>
          </div>
          <div className="mb-5">
            <label className="form-label small fw-bold">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Lock size={18} className="text-muted" /></span>
              <input 
                type="password" 
                className="form-control bg-light border-0" 
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
            {loading ? 'Authenticating...' : 'Enter Console'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="small text-muted mb-0">Authorized Personnel Only</p>
          <small className="text-muted" style={{ fontSize: '10px' }}>© 2025 Thukilinam Boutique</small>
        </div>
      </div>
    </div>
  );
};

export default Login;
