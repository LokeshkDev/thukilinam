import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Calendar, Tag, X, Edit2, ToggleLeft, ToggleRight, Truck } from 'lucide-react';

const emptyForm = {
  code: '',
  type: 'percentage',
  value: '',
  min_order_amount: '',
  max_discount: '',
  max_uses: '',
  expiry_date: '',
  is_active: 1
};

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      if (res.data.success) setCoupons(res.data.coupons);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (coupon) => {
    setForm({
      code: coupon.code || '',
      type: coupon.type || 'percentage',
      value: coupon.value || '',
      min_order_amount: coupon.min_order_amount || '',
      max_discount: coupon.max_discount || '',
      max_uses: coupon.max_uses || '',
      expiry_date: coupon.expiry_date ? coupon.expiry_date.slice(0, 10) : '',
      is_active: coupon.is_active !== undefined ? coupon.is_active : 1
    });
    setEditingId(coupon.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) return alert('Coupon code is required.');
    if (form.type !== 'free_shipping' && (!form.value || Number(form.value) <= 0)) return alert('Discount value is required.');
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: form.type === 'free_shipping' ? 0 : Number(form.value),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        max_uses: Number(form.max_uses) || 0,
        expiry_date: form.expiry_date || null
      };
      if (editingId) {
        await api.put(`/coupons/${editingId}`, payload);
      } else {
        await api.post('/coupons', payload);
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      console.error('Error saving coupon:', err);
      alert('Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await api.put(`/coupons/${coupon.id}`, {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value || 0,
        min_order_amount: coupon.min_order_amount || 0,
        max_discount: coupon.max_discount || null,
        max_uses: coupon.max_uses || 0,
        expiry_date: coupon.expiry_date ? coupon.expiry_date.slice(0, 10) : null,
        is_active: coupon.is_active ? 0 : 1
      });
      fetchCoupons();
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Failed to update coupon status.');
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      alert('Failed to delete coupon.');
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'percentage': return 'Percentage';
      case 'fixed': return 'Fixed Amount';
      case 'free_shipping': return 'Free Shipping';
      default: return type;
    }
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.type === 'percentage') return `${coupon.value}% OFF`;
    if (coupon.type === 'free_shipping') return 'FREE SHIPPING';
    return `₹${coupon.value} OFF`;
  };

  return (
    <div className="admin-coupons p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Promotional Coupons</h4>
          <p className="text-muted mb-0 small">Create and manage discount codes for your customers.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4" onClick={openCreate}>
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5"><div className="spinner-border"></div></div>
        ) : coupons.length === 0 ? (
          <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm">
            <Tag size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">No coupons found. Create your first coupon to get started!</p>
          </div>
        ) : coupons.map((coupon) => (
          <div className="col-xl-4 col-md-6" key={coupon.id}>
            <div className={`bg-white p-4 rounded-4 shadow-sm position-relative overflow-hidden border-start border-4 ${coupon.is_active ? 'border-primary' : 'border-secondary'}`}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-2">
                  {coupon.type === 'free_shipping' ? (
                    <span className="badge bg-success px-3 py-2 d-flex align-items-center gap-1"><Truck size={13} /> {coupon.code}</span>
                  ) : (
                    <span className="badge bg-primary px-3 py-2">{coupon.code}</span>
                  )}
                  <span className={`badge ${coupon.is_active ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${coupon.is_active ? 'text-success' : 'text-secondary'}`} style={{ fontSize: '10px' }}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-light" title="Edit" onClick={() => openEdit(coupon)}>
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn btn-sm btn-light"
                    title={coupon.is_active ? 'Deactivate' : 'Activate'}
                    onClick={() => toggleActive(coupon)}
                  >
                    {coupon.is_active ? <ToggleRight size={16} className="text-success" /> : <ToggleLeft size={16} className="text-muted" />}
                  </button>
                  <button className="btn btn-sm btn-light text-danger" onClick={() => deleteCoupon(coupon.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="fw-bold mb-1">{getDiscountDisplay(coupon)}</h3>
              <p className="text-muted small mb-2">{getTypeLabel(coupon.type)}</p>
              <p className="text-muted small mb-3">Min order: ₹{coupon.min_order_amount || 0}</p>
              {coupon.max_discount && coupon.type === 'percentage' && (
                <p className="text-muted small mb-3">Max discount: ₹{coupon.max_discount}</p>
              )}

              <div className="d-flex justify-content-between align-items-center border-top pt-3">
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <Calendar size={14} />
                  <span>{coupon.expiry_date ? `Exp: ${new Date(coupon.expiry_date).toLocaleDateString()}` : 'No Expiry'}</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <Tag size={14} />
                  <span>Used: {coupon.used_count || 0}{coupon.max_uses > 0 ? `/${coupon.max_uses}` : ''}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h5>
                <button type="button" className="btn btn-sm btn-light rounded-circle" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body pt-3">
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Coupon Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. SAVE20, FREESHIP"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Discount Type</label>
                  <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                {form.type !== 'free_shipping' && (
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">
                        Discount Value {form.type === 'percentage' ? '(%)' : '(₹)'}
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder={form.type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                      />
                    </div>
                    {form.type === 'percentage' && (
                      <div className="col-6">
                        <label className="form-label fw-semibold small">Max Discount (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 500"
                          value={form.max_discount}
                          onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold small">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 2000"
                      value={form.min_order_amount}
                      onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small">Max Uses (0 = Unlimited)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 100"
                      value={form.max_uses}
                      onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary rounded-pill px-4" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : (editingId ? 'Update Coupon' : 'Create Coupon')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
