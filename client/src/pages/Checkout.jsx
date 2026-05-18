import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const formatPrice = (value = 0) => `Rs. ${Number(value).toLocaleString('en-IN')}`;

const Checkout = () => {
  const { cartItems, summary, clearCart, coupon } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [addressType, setAddressType] = useState('home');

  const [formData, setFormData] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
    payment_method: 'cod'
  });

  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      const res = await api.get('/users/addresses');
      if (res.data.success && res.data.addresses.length > 0) {
        setSavedAddresses(res.data.addresses);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleAddressSelect = (id) => {
    if (id === 'new') {
      setSelectedAddressId('');
      setFormData({
        ...formData,
        full_name: user?.name || '', phone: user?.phone || '',
        line1: '', city: '', state: '', pincode: ''
      });
      return;
    }
    
    setSelectedAddressId(id);
    setSaveNewAddress(false);
    const addr = savedAddresses.find(a => a.id.toString() === id.toString());
    if (addr) {
      setFormData({
        ...formData,
        full_name: addr.full_name,
        phone: addr.phone,
        line1: addr.line1,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setLoading(true);
    try {
      // 1. Save address if requested
      if (!selectedAddressId && saveNewAddress) {
        await api.post('/users/addresses', {
          type: addressType,
          full_name: formData.full_name,
          phone: formData.phone,
          line1: formData.line1,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India',
          is_default: savedAddresses.length === 0
        });
      }

      // 2. Place Order
      const orderData = {
        shipping_address: {
          full_name: formData.full_name,
          phone: formData.phone,
          line1: formData.line1,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India'
        },
        payment_method: formData.payment_method
      };
      
      const res = await api.post('/orders', orderData);
      if (res.data.success) {
        clearCart();
        alert('Order placed successfully!');
        navigate('/orders');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error placing order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-page cart-page">
      <section className="app-page-head">
        <div>
          <p className="eyebrow">Secure Checkout</p>
          <h1>Complete Your Order</h1>
          <p>Provide your shipping and payment details.</p>
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
                <h2>Shipping Information</h2>
                <p>Where should we send your order?</p>
              </div>
            </div>

            {savedAddresses.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label className="field">
                  <span>Saved Addresses</span>
                  <select 
                    value={selectedAddressId || 'new'} 
                    onChange={(e) => handleAddressSelect(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--soft)', width: '100%', outline: 'none' }}
                  >
                    <option value="new">+ Enter a new address</option>
                    {savedAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.type.toUpperCase()} - {addr.full_name}, {addr.line1}, {addr.city} - {addr.pincode}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <label className="field">
                <span>Full Name</span>
                <input type="text" required placeholder="John Doe" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={!!selectedAddressId} />
              </label>
              
              <label className="field">
                <span>Phone Number</span>
                <input type="tel" required placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!!selectedAddressId} />
              </label>
            </div>

            <label className="field" style={{ marginTop: '16px' }}>
              <span>Address (Line 1)</span>
              <input type="text" required placeholder="House No, Street, Landmark" value={formData.line1} onChange={e => setFormData({...formData, line1: e.target.value})} disabled={!!selectedAddressId} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <label className="field">
                <span>City</span>
                <input type="text" required placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} disabled={!!selectedAddressId} />
              </label>
              
              <label className="field">
                <span>State</span>
                <input type="text" required placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} disabled={!!selectedAddressId} />
              </label>
              
              <label className="field">
                <span>Pincode</span>
                <input type="text" required placeholder="000 000" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} disabled={!!selectedAddressId} />
              </label>
            </div>

            {!selectedAddressId && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--soft)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={saveNewAddress} onChange={(e) => setSaveNewAddress(e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                  Save this address for future orders
                </label>
                
                {saveNewAddress && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                    {['home', 'work', 'other'].map(type => (
                      <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textTransform: 'capitalize' }}>
                        <input type="radio" name="addr_type" checked={addressType === type} onChange={() => setAddressType(type)} style={{ width: 'auto', margin: 0 }} />
                        {type}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                <p>Choose how you want to pay.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '8px' }}>
              <label className="field" style={{
                border: formData.payment_method === 'cod' ? '2px solid var(--purple-700)' : '1px solid var(--line)',
                padding: '16px', borderRadius: '8px', cursor: 'pointer',
                flexDirection: 'row', alignItems: 'center', gap: '14px',
                background: formData.payment_method === 'cod' ? 'var(--soft)' : 'transparent',
                transition: 'all 0.2s ease', margin: 0
              }}>
                <input type="radio" checked={formData.payment_method === 'cod'} onChange={() => setFormData({...formData, payment_method: 'cod'})} style={{ width: 'auto', margin: 0 }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>Cash on Delivery</strong>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Pay securely on arrival.</span>
                </div>
              </label>
              
              <label className="field" style={{
                border: '1px solid var(--line)', padding: '16px', borderRadius: '8px', cursor: 'not-allowed',
                opacity: 0.6, flexDirection: 'row', alignItems: 'center', gap: '14px', margin: 0
              }}>
                <input type="radio" disabled style={{ width: 'auto', margin: 0 }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>Online Payment</strong>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Currently unavailable.</span>
                </div>
              </label>
            </div>
          </div>
        </form>

        <aside className="checkout-summary" aria-label="Order summary">
          <div className="summary-card">
            <p className="eyebrow">Your Order</p>
            <h2>Order Summary</h2>

            <div style={{ maxHeight: '320px', overflowY: 'auto', margin: '20px 0', paddingRight: '8px' }}>
              {cartItems.map(item => (
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

            <dl className="summary-list">
              <div>
                <dt>Subtotal ({summary.itemCount} items)</dt>
                <dd>{formatPrice(summary.subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd style={coupon?.is_free_shipping ? { color: '#16a34a', fontWeight: 600 } : {}}>
                  {summary.shipping === 0
                    ? (coupon?.is_free_shipping ? 'Free (Coupon)' : 'Complimentary')
                    : formatPrice(summary.shipping)}
                </dd>
              </div>
              {(Number(summary.discount) > 0) && (
                <div>
                  <dt style={{ color: '#16a34a' }}>Discount ({coupon?.code})</dt>
                  <dd style={{ color: '#16a34a', fontWeight: 600 }}>-{formatPrice(Number(summary.discount))}</dd>
                </div>
              )}
              <div>
                <dt>Estimated Tax (5%)</dt>
                <dd>{formatPrice(summary.tax)}</dd>
              </div>
              <div className="summary-total">
                <dt>Total Payable</dt>
                <dd>{formatPrice(summary.total)}</dd>
              </div>
            </dl>

            <button form="checkout-form" className="button primary" type="submit" disabled={loading || cartItems.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Processing...' : 'Confirm Order'}
            </button>
            <p className="summary-note">Secure checkout with encrypted details.</p>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Checkout;
