import React, { useState } from 'react';
import api from '../api/axios';
import { COURIER_LINKS } from '../constants/couriers';

const formatPrice = (value = 0) => `Rs. ${Number(value).toLocaleString('en-IN')}`;

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    const isEmail = contact.includes('@');

    try {
      const res = await api.get('/orders/track', {
        params: {
          order_number: orderNumber.trim(),
          email: isEmail && contact.trim() ? contact.trim() : undefined,
          phone: !isEmail && contact.trim() ? contact.trim() : undefined
        }
      });
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to find this order. Please verify your order number.');
    } finally {
      setLoading(false);
    }
  };

  const activeCourier = order?.courier && COURIER_LINKS[order.courier];

  return (
    <main className="track-page">
      <section className="track-hero">
        <p className="eyebrow">Delivery Updates</p>
        <h1>Track Your Order</h1>
        <p>Enter your order number to view status and courier tracking details.</p>
      </section>

      <section className="track-form-card">
        <form onSubmit={handleSubmit} className="track-form">
          <label>
            <span>Order Number *</span>
            <input
              type="text"
              placeholder="e.g. THK12345678"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Mobile Number or Email (Optional)</span>
            <input
              type="text"
              placeholder="10-digit mobile or email address"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </label>
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>
        {error && <p className="track-error">{error}</p>}
      </section>

      {order && (
        <section className="track-result">
          <div className="track-result-summary">
            <div>
              <p className="eyebrow">Order</p>
              <h2>#{order.order_number}</h2>
            </div>
            <div className="track-status-pill" data-status={order.status}>
              {order.status?.replace('_', ' ')}
            </div>
          </div>

          <div className="track-meta-grid">
            <div>
              <span className="track-meta-label">Payment</span>
              <strong>{order.payment_method?.toUpperCase()} &bull; {order.payment_status?.toUpperCase()}</strong>
            </div>
            <div>
              <span className="track-meta-label">Total Amount</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
            <div>
              <span className="track-meta-label">Placed On</span>
              <strong>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </div>
            {order.tracking_number && (
              <div>
                <span className="track-meta-label">Tracking Number</span>
                <strong>{order.tracking_number}</strong>
              </div>
            )}
          </div>

          {activeCourier && (
            <div className="track-courier-banner">
              <div>
                <strong>Courier: {activeCourier.name}</strong>
                <p>Track your shipment directly on the courier portal.</p>
              </div>
              <a
                href={activeCourier.trackUrl(order.tracking_number)}
                target="_blank"
                rel="noreferrer"
                className="button primary"
              >
                Track on {activeCourier.name}
              </a>
            </div>
          )}

          {order.items && order.items.length > 0 && (
            <div className="track-items-list" style={{ marginTop: '24px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Ordered Items</h3>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  {item.product_image && (
                    <img src={item.product_image} alt={item.product_name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{item.product_name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      Qty: {item.quantity} &bull; {formatPrice(item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
};

export default TrackOrder;
