import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { User, Shield, ShieldOff, Search, Mail, Phone, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const Customers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { search: searchTerm } });
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id) => {
    try {
      const res = await api.put(`/users/${id}/block`);
      if (res.data.success) {
        alert(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const handleEdit = (user) => {
    setCurrentCustomer(user);
    setFormData({ name: user.name, email: user.email, phone: user.phone || '', password: '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data.success) {
        alert(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      alert('Failed to delete customer.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCustomer) {
        const res = await api.put(`/users/${currentCustomer.id}`, formData);
        if (res.data.success) alert(res.data.message);
      } else {
        const res = await api.post('/users', formData);
        if (res.data.success) alert(res.data.message);
      }
      setShowModal(false);
      fetchUsers();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save customer.');
    }
  };

  const resetForm = () => {
    setCurrentCustomer(null);
    setFormData({ name: '', email: '', phone: '', password: '' });
  };

  return (
    <div className="admin-customers">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Customer Oversight</h4>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4"
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="filters-card bg-white p-3 rounded-4 shadow-sm mb-4">
        <div className="row">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0"><Search size={18} className="text-muted" /></span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Search by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="customers-table bg-white rounded-4 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Customer</th>
                <th>Contact</th>
                <th>Joined Date</th>
                <th>Orders</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5">No customers found.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="avatar bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <User size={20} />
                      </div>
                      <div className="fw-bold">{user.name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="small d-flex align-items-center gap-2 mb-1"><Mail size={14} className="text-muted" /> {user.email}</div>
                    {user.phone && <div className="small d-flex align-items-center gap-2"><Phone size={14} className="text-muted" /> {user.phone}</div>}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td><span className="badge bg-light text-dark border">{user.order_count} Orders</span></td>
                  <td>
                    <span className={`badge ${user.is_blocked ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'}`}>
                      {user.is_blocked ? 'BLOCKED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-sm btn-icon border" title="View History"><Search size={16} /></button>
                      <button className="btn btn-sm btn-icon border" title="Edit" onClick={() => handleEdit(user)}><Edit2 size={16} /></button>
                      <button className="btn btn-sm btn-icon border text-danger" title="Delete" onClick={() => handleDelete(user.id)}><Trash2 size={16} /></button>
                      <button 
                        className={`btn btn-sm btn-icon border ${user.is_blocked ? 'text-success' : 'text-danger'}`}
                        onClick={() => toggleBlock(user.id)}
                        title={user.is_blocked ? 'Unblock User' : 'Block User'}
                      >
                        {user.is_blocked ? <Shield size={16} /> : <ShieldOff size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{currentCustomer ? 'Edit Customer' : 'Add Customer'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Phone</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Password {currentCustomer && '(Leave blank to keep current)'}</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      required={!currentCustomer}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4">
                    <Save size={18} className="me-2" /> Save Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
