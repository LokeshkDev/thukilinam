import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { MapPin, Trash2, Home, Briefcase, Map, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    setFormData({ name: user?.name || '', phone: user?.phone || '' });
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.get('/users/addresses');
      if (res.data.success) {
        setAddresses(res.data.addresses);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/users/profile', formData);
      if (res.data.success) {
        setEditing(false);
      }
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await api.delete(`/users/addresses/${id}`);
      if (res.data.success) {
        fetchAddresses();
      }
    } catch (err) {
      alert('Failed to delete address.');
    }
  };

  const getAddressIcon = (type) => {
    if (type === 'home') return <Home size={18} />;
    if (type === 'work') return <Briefcase size={18} />;
    return <Map size={18} />;
  };

  return (
    <main className="app-page dashboard-page">
      <section className="app-page-head">
        <div>
          <p className="eyebrow">Your Account</p>
          <h1>Account</h1>
          <p>Manage your details, delivery preferences, and boutique updates.</p>
        </div>
      </section>

      <section className="dashboard-layout">
        <aside className="account-panel">
          <div className="account-avatar">{(user?.name || user?.email || 'T').charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="eyebrow">Signed In</p>
            <h2>{user?.name || 'Thukilinam Customer'}</h2>
            <p>{user?.email || 'Your boutique profile'}</p>
          </div>
          {/* Mobile-only logout button inside the profile card header */}
          <button
            type="button"
            onClick={logout}
            className="mobile-card-logout"
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
          <nav className="account-nav" aria-label="Account navigation">
            <Link to="/profile" className="is-active">Profile Settings</Link>
            <Link to="/orders">Order History</Link>
            <Link to="/wishlist">My Wishlist</Link>
            <button type="button" className="desktop-only-logout" onClick={logout}>Log Out</button>
          </nav>
        </aside>

        <div className="dashboard-content">
          <div className="content-toolbar">
            <div>
              <h2>Profile Settings</h2>
              <p>Keep your contact details ready for faster checkout.</p>
            </div>
            {!editing && (
              <button className="button primary" type="button" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>

          <form className="account-card" onSubmit={handleUpdate}>
            <div className="form-grid">
              <label className="field">
                <span>Full Name</span>
                <input
                  type="text"
                  disabled={!editing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </label>
              <label className="field">
                <span>Email Address</span>
                <input type="email" disabled value={user?.email || ''} placeholder="name@example.com" />
              </label>
              <label className="field">
                <span>Phone Number</span>
                <input
                  type="tel"
                  disabled={!editing}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </label>
            </div>

            {editing && (
              <div className="form-actions">
                <button type="submit" className="button primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="button secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            )}
          </form>

          <section className="account-card address-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2>Saved Addresses</h2>
                <p>Manage your delivery locations.</p>
              </div>
            </div>

            {loadingAddresses ? (
              <p style={{ color: 'var(--muted)' }}>Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <div className="app-empty-state compact" style={{ border: 'none', background: 'var(--soft)' }}>
                <span className="app-empty-icon"><MapPin size={24} /></span>
                <p>You have not saved any addresses yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {addresses.map(addr => (
                  <div key={addr.id} style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--purple-700)', fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {getAddressIcon(addr.type)} {addr.type}
                    </div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>{addr.full_name}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                      {addr.phone}<br/>
                      {addr.line1}<br/>
                      {addr.city}, {addr.state} - {addr.pincode}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => deleteAddress(addr.id)}
                      style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                      title="Delete Address"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
};

export default Profile;
