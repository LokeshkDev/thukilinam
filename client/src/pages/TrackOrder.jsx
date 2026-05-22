import React, { useState } from 'react';
import api from '../api/axios';
import { COURIER_LINKS } from '../constants/couriers';

const formatPrice = (value = 0) => `₹${Number(value).toLocaleString('en-IN')}`;

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await api.get('/orders/track', {
        params: {
          order_number: orderNumber.trim(),
          email: email.trim() || undefined
        }
      });
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to find this order. Check your order number and email.');
    } finally {
      setLoading(false);
    }
  };

  const activeCourier = order?.courier && COURIER_LINKS[order.courier];

  return (
    <main className="track-page">
      <section className="track-hero">
        <p className="eyebrow">Delivery updates</p>
        <h1>Track your order</h1>
        <p>Enter your order number and email to view status and courier tracking links.</p>
      </section>

      <section className="track-form-card">
        <form onSubmit={handleSubmit} className="track-form">
          <label>
            <span>Order number</span>
            <input
              type="text"
              placeholder="e.g. THK12345678"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Email (recommended)</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? 'Searching...' : 'Track order'}
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
              {order.status.replace('_', ' ')}
            </div>
          </div>

          <div className="track-meta-grid">
            <div>
              <span className="track-meta-label">Payment</span>
              <strong>{order.payment_method?.toUpperCase()} · {order.payment_status?.toUpperCase()}</strong>
            </div>
            <div>
              <span className="track-meta-label">Order total</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
            <div>
              <span className="track-meta-label">Placed on</span>
              <strong>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </div>
            {order.tracking_number && (
              <div>
                <span className="track-meta-label">AWB / Tracking number</span>
                <strong className="track-awb">{order.tracking_number}</strong>
              </div>
            )}
          </div>

          <div className="track-courier-section">
            <h3>Courier tracking</h3>
            <p>
              {order.tracking_number
                ? 'Use your tracking number on the courier website below.'
                : 'Tracking number will appear here once your order is shipped.'}
            </p>
            {activeCourier && (
              <p className="track-courier-hint">
                Assigned courier: <strong>{activeCourier.name}</strong>
              </p>
            )}
            <div className="track-courier-links">
              <a
                href={COURIER_LINKS.st_courier.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`track-courier-btn${order.courier === 'st_courier' ? ' is-primary' : ''}`}
              >
                <span className="track-courier-name">ST Courier</span>
                <span className="track-courier-desc">{COURIER_LINKS.st_courier.description}</span>
              </a>
              <a
                href={COURIER_LINKS.professional_courier.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`track-courier-btn${order.courier === 'professional_courier' ? ' is-primary' : ''}`}
              >
                <span className="track-courier-name">Professional Courier</span>
                <span className="track-courier-desc">{COURIER_LINKS.professional_courier.description}</span>
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default TrackOrder;
