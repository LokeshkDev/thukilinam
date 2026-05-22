import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { X, Package, Truck, CreditCard, Save, Trash2 } from 'lucide-react';

const formatPrice = (value = 0) => `₹${Number(value).toLocaleString('en-IN')}`;

const OrderDetailsModal = ({ orderId, onClose, onStatusUpdate, onDelete }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    status: 'pending',
    payment_status: 'pending',
    notes: '',
    tracking_number: '',
    courier: ''
  });

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.success) {
        const o = res.data.order;
        setOrder(o);
        setForm({
          status: o.status || 'pending',
          payment_status: o.payment_status || 'pending',
          notes: o.notes || '',
          tracking_number: o.tracking_number || '',
          courier: o.courier || ''
        });
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const payload = { status: newStatus };
      if (newStatus === 'shipped') {
        const trackingNumber = window.prompt('Enter tracking / AWB number', form.tracking_number || '');
        if (trackingNumber === null) return;
        const courier = window.prompt('Enter courier service (st_courier, professional_courier, or other)', form.courier || '');
        if (courier === null) return;
        payload.tracking_number = trackingNumber.trim();
        payload.courier = courier.trim();
      }

      const res = await api.put(`/orders/${orderId}/status`, payload);
      if (res.data.success) {
        fetchOrderDetails();
        if (onStatusUpdate) onStatusUpdate();
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/orders/${orderId}`, form);
      if (res.data.success) {
        alert(res.data.message);
        fetchOrderDetails();
        if (onStatusUpdate) onStatusUpdate();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete order #${order?.order_number}? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/orders/${orderId}`);
      if (res.data.success) {
        alert(res.data.message);
        if (onDelete) onDelete();
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete order.');
    }
  };

  if (!orderId) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, padding: '20px'
    }}>
      <div className="card border-0 shadow-lg" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center sticky-top">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary-soft text-primary p-2 rounded-circle">
              <Package size={24} />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Order #{order?.order_number || 'Loading...'}</h5>
              {order && <small className="text-muted">{new Date(order.created_at).toLocaleString()}</small>}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-light text-danger" type="button" onClick={handleDelete} title="Delete order">
              <Trash2 size={18} />
            </button>
            <button className="btn btn-light rounded-circle p-2" type="button" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5 text-muted">Loading order details...</div>
          ) : !order ? (
            <div className="text-center py-5 text-muted">Order not found.</div>
          ) : (
            <>
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><Truck size={16} /> Customer & Shipping</h6>
                    {(() => {
                      try {
                        const addr = typeof order.shipping_address === 'string'
                          ? JSON.parse(order.shipping_address)
                          : (order.shipping_address || {});

                        if (!addr.full_name && !addr.line1) return <span className="text-muted">No address provided.</span>;

                        return (
                          <div className="small">
                            <strong>{addr.full_name || order.customer_name}</strong><br/>
                            {addr.phone}<br/>
                            {addr.line1}<br/>
                            {addr.city}, {addr.state} - {addr.pincode}
                          </div>
                        );
                      } catch (e) { return <span className="text-muted">No address provided.</span>; }
                    })()}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><CreditCard size={16} /> Payment Info</h6>
                    <div className="small mb-3">
                      <div>Method: <strong className="text-uppercase">{order.payment_method}</strong></div>
                    </div>

                    <h6 className="fw-bold mb-2">Quick status</h6>
                    <div className="dropdown w-100 mb-3">
                      <button className="btn btn-white border w-100 text-start d-flex justify-content-between align-items-center" data-bs-toggle="dropdown" type="button">
                        <span className="text-capitalize">{order.status.replace('_', ' ')}</span>
                      </button>
                      <ul className="dropdown-menu w-100 shadow-sm border-0">
                        <li><button type="button" className="dropdown-item" onClick={() => handleStatusUpdate('pending')}>Pending</button></li>
                        <li><button type="button" className="dropdown-item" onClick={() => handleStatusUpdate('processing')}>Processing</button></li>
                        <li><button type="button" className="dropdown-item" onClick={() => handleStatusUpdate('shipped')}>Shipped</button></li>
                        <li><button type="button" className="dropdown-item text-success" onClick={() => handleStatusUpdate('delivered')}>Delivered</button></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button type="button" className="dropdown-item text-danger" onClick={() => handleStatusUpdate('cancelled')}>Cancelled</button></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border rounded-3 mb-4">
                <h6 className="fw-bold mb-3">Edit order &amp; tracking</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Order status</label>
                    <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Payment status</label>
                    <select className="form-select" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
                      {['pending', 'paid', 'failed', 'refunded'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">AWB / Tracking number</label>
                    <input className="form-control" value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} placeholder="Courier AWB number" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Courier</label>
                    <select className="form-select" value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })}>
                      <option value="">Not set</option>
                      <option value="st_courier">ST Courier</option>
                      <option value="professional_courier">Professional Courier</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Admin notes</label>
                    <textarea className="form-control" rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                <button type="button" className="btn btn-primary mt-3 d-flex align-items-center gap-2" onClick={handleSave} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>

              <h6 className="fw-bold mb-3">Line Items</h6>
              <div className="border rounded-3 overflow-hidden mb-4">
                <table className="table mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items && order.items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <img src={item.product_image} alt={item.product_name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                            <div className="fw-bold small">{item.product_name}</div>
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td className="text-end">{formatPrice(item.price)}</td>
                        <td className="text-end fw-bold">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row justify-content-end">
                <div className="col-md-5">
                  <div className="bg-light p-3 rounded-3">
                    <div className="d-flex justify-content-between mb-2 small">
                      <span className="text-muted">Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2 small">
                      <span className="text-muted">Shipping</span>
                      <span>{order.shipping_charge === 0 ? 'Free' : formatPrice(order.shipping_charge)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
