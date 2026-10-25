import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import ShippingNote from '../components/ui/ShippingNote';

const formatPrice = (value = 0) => `Rs. ${Number(value).toLocaleString('en-IN')}`;

const Checkout = () => {
  const { cartItems, summary, clearCart, coupon } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
    payment_method: 'cashfree'
  });

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData({ ...formData, phone: val });
    if (val.length > 0 && val.length < 10) {
      setPhoneError('Please enter a full 10-digit mobile number.');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Your shopping bag is empty.');
      navigate('/shop');
      return;
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setPhoneError('Valid 10-digit mobile number is mandatory.');
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          name: item.name,
          price: item.variant_sale_price || item.variant_price || item.discount_price || item.price,
          image: item.image,
          attributes: item.attributes,
          size: item.size,
          color: item.color
        })),
        customer_name: formData.full_name.trim(),
        customer_phone: cleanPhone.slice(-10),
        customer_email: formData.email.trim() || undefined,
        shipping_address: {
          full_name: formData.full_name.trim(),
          phone: cleanPhone.slice(-10),
          email: formData.email.trim() || undefined,
          line1: formData.line1.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          country: 'India'
        },
        payment_method: formData.payment_method,
        ...(coupon?.code ? { coupon_code: coupon.code } : {})
      };

      const res = await api.post('/orders', orderData);

      if (res.data.success && res.data.payment_session_id) {
        if (!window.Cashfree) {
          throw new Error('Payment gateway SDK failed to load. Please refresh the page and try again.');
        }

        const cashfreeMode = res.data.cashfree_mode || import.meta.env.VITE_CASHFREE_MODE || 'production';
        const sessionId = res.data.payment_session_id;

        if (!sessionId || typeof sessionId !== 'string') {
          throw new Error('Invalid payment session from server.');
        }

        // Clear cart now that order session is created
        clearCart();

        const cashfree = window.Cashfree({ mode: cashfreeMode });
        const checkoutOptions = {
          paymentSessionId: sessionId,
          returnUrl: `${window.location.origin}/payment-callback?order_id=${res.data.order.order_number}`
        };

        cashfree.checkout(checkoutOptions);
      } else {
        throw new Error('Failed to initialize payment session from backend.');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error placing order.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="app-page cart-page">
        <section className="app-empty-state">
          <span className="app-empty-icon">
            <svg className="icon" aria-hidden="true"><use href="#icon-bag"></use></svg>
          </span>
          <h2>Your shopping bag is empty</h2>
          <p>Add your favorite boutique pieces to proceed with checkout.</p>
          <Link to="/shop" className="button primary">
            Explore Collection
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page cart-page">
      <section className="app-page-head">
        <div>
          <p className="eyebrow">Quick &amp; Direct Checkout</p>
          <h1>Complete Your Order</h1>
          <p>No login needed. Fill in your delivery details to proceed to payment.</p>
        </div>
      </section>

      <section className="cart-layout">
        <form id="checkout-form" className="cart-items" onSubmit={handleSubmit}>
          
          <div className="auth-card" style={{ maxWidth: '100%', margin: '0 0 24px 0' }}>
            <div className="auth-card-head">
              <span className="app-empty-icon small">
                <svg className="icon" aria-hidden="true"><use href="#icon-bag"></use></svg>
              </span>
              <div>
                <h2>Delivery Details</h2>
                <p>Where should we deliver your boutique package?</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <label className="field">
                <span>Full Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </label>

              <label className="field">
                <span>Phone Number * (Mandatory)</span>
                <input
                  type="tel"
                  required
                  maxLength="10"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
                {phoneError && <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{phoneError}</span>}
              </label>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label className="field">
                <span>Email Address (Optional)</span>
                <input
                  type="email"
                  placeholder="name@example.com (optional, for invoice & updates)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </label>
            </div>

            <label className="field" style={{ marginTop: '16px' }}>
              <span>Address (Flat, House No, Building, Street) *</span>
              <input
                type="text"
                required
                placeholder="Door No, Street Name, Landmark"
                value={formData.line1}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <label className="field">
                <span>City *</span>
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </label>

              <label className="field">
                <span>State *</span>
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </label>

              <label className="field">
                <span>Pincode *</span>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="6-digit pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/[^0-9]/g, '') })}
                />
              </label>
            </div>
          </div>

          <div className="auth-card" style={{ maxWidth: '100%', margin: '0' }}>
            <div className="auth-card-head">
              <span className="app-empty-icon small">
                <svg className="icon" aria-hidden="true" style={{ stroke: 'none', fill: 'currentColor' }}>
                  <rect x="3" y="6" width="18" height="12" rx="2" ry="2"></rect>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2"></line>
                </svg>
              </span>
              <div>
                <h2>Payment Method</h2>
                <p>100% secure payment gateway.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '8px' }}>
              <label className="field" style={{
                border: formData.payment_method === 'cashfree' ? '2px solid var(--purple-700)' : '1px solid var(--line)',
                padding: '16px', borderRadius: '8px', cursor: 'pointer',
                flexDirection: 'row', alignItems: 'center', gap: '14px',
                background: formData.payment_method === 'cashfree' ? 'var(--soft)' : 'transparent',
                transition: 'all 0.2s ease', margin: 0
              }}>
                <input
                  type="radio"
                  checked={formData.payment_method === 'cashfree'}
                  onChange={() => setFormData({ ...formData, payment_method: 'cashfree' })}
                  style={{ width: 'auto', margin: 0 }}
                />
                <div>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>Online Payment (Cashfree)</strong>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Pay instantly via UPI (GPay, PhonePe, Paytm), Cards, Netbanking.</span>
                </div>
              </label>

              <label className="field" style={{
                border: '1px solid var(--line)', padding: '16px', borderRadius: '8px', cursor: 'not-allowed',
                opacity: 0.6, flexDirection: 'row', alignItems: 'center', gap: '14px', margin: 0,
                background: 'var(--soft)'
              }}>
                <input type="radio" disabled checked={false} style={{ width: 'auto', margin: 0 }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>Cash on Delivery</strong>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Currently unavailable for online boutique orders.</span>
                </div>
              </label>
            </div>
          </div>
        </form>

        <aside className="checkout-summary" aria-label="Order summary">
          <div className="summary-card">
            <p className="eyebrow">Your Selection</p>
            <h2>Order Summary</h2>

            <div style={{ maxHeight: '320px', overflowY: 'auto', margin: '20px 0', paddingRight: '8px' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--line)' }}>
                  <img src={item.image} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <strong style={{ fontSize: '14px', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '4px' }}>
                      {item.attributes ? (() => {
                        try {
                          const attrs = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes;
                          return Object.entries(attrs).map(([k, v]) => (
                            <span key={k}>{k}: {v} &nbsp;&bull;&nbsp; </span>
                          ));
                        } catch (e) {
                          return null;
                        }
                      })() : (
                        item.size && <span>Size: {item.size} &nbsp;&bull;&nbsp; </span>
                      )}
                      Qty: {item.quantity}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--purple-700)' }}>
                      {formatPrice((item.discount_price || item.price) * item.quantity)}
                      {item.discount_price && (
                        <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: '11px', marginLeft: '6px', fontWeight: '400' }}>
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <ShippingNote
              subtotal={summary.subtotal}
              shipping={summary.shipping}
              couponFreeShipping={coupon?.is_free_shipping}
            />

            <dl className="summary-list">
              <div>
                <dt>Subtotal ({summary.itemCount} items)</dt>
                <dd>{formatPrice(summary.subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd style={summary.shipping === 0 ? { color: '#16a34a', fontWeight: 600 } : {}}>
                  {summary.shipping === 0
                    ? (coupon?.is_free_shipping
                      ? 'Free (Coupon)'
                      : summary.subtotal >= (summary.freeThreshold || 0) && summary.freeThreshold > 0
                        ? 'Free shipping'
                        : 'Complimentary')
                    : formatPrice(summary.shipping)}
                </dd>
              </div>
              {(Number(summary.discount) > 0) && (
                <div>
                  <dt style={{ color: '#16a34a' }}>Discount ({coupon?.code})</dt>
                  <dd style={{ color: '#16a34a', fontWeight: 600 }}>-{formatPrice(Number(summary.discount))}</dd>
                </div>
              )}
              <div className="summary-total">
                <dt>Total Payable</dt>
                <dd>{formatPrice(summary.total)}</dd>
              </div>
            </dl>

            <button
              form="checkout-form"
              className="button primary"
              type="submit"
              disabled={loading || cartItems.length === 0}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Processing Payment...' : 'Proceed to Pay'}
            </button>
            <p className="summary-note">Encrypted &amp; secure checkout with Cashfree.</p>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Checkout;
