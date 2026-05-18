import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const formatPrice = (value = 0) => `Rs. ${Number(value).toLocaleString('en-IN')}`;

const Cart = () => {
  const {
    cartItems, summary, updateQuantity, removeFromCart, loading,
    coupon, couponError, applyCoupon, removeCoupon
  } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(couponCode.trim());
    setApplyingCoupon(false);
  };

  if (loading && cartItems.length === 0) {
    return (
      <main className="app-page cart-page">
        <div className="app-empty-state">
          <p>Loading your bag...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page cart-page">
      <section className="app-page-head">
        <div>
          <p className="eyebrow">Your Selection</p>
          <h1>Shopping Bag</h1>
          <p>Review your pieces, adjust quantities, and checkout securely.</p>
        </div>
        {cartItems.length > 0 && (
          <Link to="/shop" className="button secondary">
            Continue Shopping
          </Link>
        )}
      </section>

      {cartItems.length === 0 ? (
        <section className="app-empty-state">
          <span className="app-empty-icon">
            <svg className="icon" aria-hidden="true">
              <use href="#icon-bag"></use>
            </svg>
          </span>
          <h2>Your bag is empty</h2>
          <p>Discover boutique edits and save your favorites for checkout.</p>
          <Link to="/shop" className="button primary">
            Explore Collection
          </Link>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => {
              const itemPrice = item.variant_sale_price || item.variant_price || item.discount_price || item.price;
              return (
                <article key={item.id} className="cart-item-card">
                  <Link to={`/product/${item.slug}`} className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </Link>

                  <div className="cart-item-body">
                    <div className="cart-item-top">
                      <div>
                        <Link to={`/product/${item.slug}`} className="cart-item-title">
                          {item.name}
                        </Link>
                        <div className="cart-item-meta">
                          {item.attributes ? (() => {
                            try {
                              const attrs = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes;
                              return Object.entries(attrs).map(([k, v]) => {
                                const [valName] = v.includes('|') ? v.split('|') : [v, v];
                                return (
                                  <span key={k} className="me-2">{k}: {valName}</span>
                                );
                              });
                            } catch (e) {
                              return null;
                            }
                          })() : (
                            <>
                              {item.size && <span>Size {item.size}</span>}
                              {item.color && <span>{item.color}</span>}
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="icon-pill-button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        x
                      </button>
                    </div>

                    <div className="cart-item-bottom">
                      <div className="quantity-stepper" aria-label={`Quantity for ${item.name}`}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-price">
                        <strong>{formatPrice(itemPrice * item.quantity)}</strong>
                        {item.discount_price && (
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="checkout-summary" aria-label="Order summary">
            <div className="summary-card">
              <p className="eyebrow">Checkout</p>
              <h2>Order Summary</h2>

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
                {(summary.discount > 0) && (
                  <div>
                    <dt style={{ color: '#16a34a' }}>Discount ({coupon?.code})</dt>
                    <dd style={{ color: '#16a34a', fontWeight: 600 }}>-{formatPrice(summary.discount)}</dd>
                  </div>
                )}
                <div>
                  <dt>Estimated Tax</dt>
                  <dd>{formatPrice(summary.tax)}</dd>
                </div>
                <div className="summary-total">
                  <dt>Total</dt>
                  <dd>{formatPrice(summary.total)}</dd>
                </div>
              </dl>

              {/* Coupon Input Section */}
              <div className="coupon-section">
                {coupon ? (
                  <div className="coupon-applied">
                    <div className="coupon-applied-info">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <div>
                        <strong>{coupon.code}</strong>
                        <span>
                          {coupon.is_free_shipping
                            ? 'Free shipping applied!'
                            : coupon.type === 'percentage'
                              ? `${coupon.value}% off applied!`
                              : `₹${coupon.discount} off applied!`}
                        </span>
                      </div>
                    </div>
                    <button type="button" className="coupon-remove" onClick={removeCoupon} aria-label="Remove coupon">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      className="coupon-input"
                    />
                    <button
                      type="button"
                      className="coupon-apply-btn"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="coupon-error">{couponError}</p>}
              </div>

              <button className="button primary" type="button" onClick={() => navigate('/checkout', { state: { coupon } })}>
                Proceed to Checkout
              </button>
              <p className="summary-note">Secure checkout with encrypted payment details.</p>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
};

export default Cart;
