import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { X, Package, Truck, CreditCard } from 'lucide-react';
import { COURIER_LINKS } from '../constants/couriers';

const formatPrice = (value = 0) => `Rs. ${Number(value).toLocaleString('en-IN')}`;

const OrderDetailsModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(21, 19, 38, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="auth-card" style={{
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        margin: 0,
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        backgroundColor: '#fff'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px', right: '20px',
            background: 'var(--soft)',
            border: 'none',
            borderRadius: '50%',
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ink)'
          }}
        >
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            Loading order details...
          </div>
        ) : !order ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            Order not found.
          </div>
        ) : (
          <div>
            <div className="auth-card-head" style={{ marginBottom: '24px' }}>
              <span className="app-empty-icon small">
                <Package size={24} />
              </span>
              <div>
                <h2>Order #{order.order_number}</h2>
                <p>Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--soft)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  <Truck size={14} /> Status
                </div>
                <strong style={{ fontSize: '16px', textTransform: 'capitalize', color: 'var(--purple-700)' }}>
                  {order.status.replace('_', ' ')}
                </strong>
              </div>
              
              <div style={{ background: 'var(--soft)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  <CreditCard size={14} /> Payment Method
                </div>
                <strong style={{ fontSize: '16px', textTransform: 'uppercase' }}>
                  {order.payment_method}
                </strong>
              </div>
            </div>

            {(order.tracking_number || order.status === 'shipped' || order.status === 'delivered') && (
              <div className="track-inline-panel" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Shipment tracking</h3>
                {order.tracking_number ? (
                  <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '14px' }}>
                    AWB: <strong style={{ color: 'var(--ink)' }}>{order.tracking_number}</strong>
                  </p>
                ) : (
                  <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '14px' }}>
                    Tracking number will be shared once dispatched.
                  </p>
                )}
                <div className="track-courier-links">
                  <a href={COURIER_LINKS.st_courier.url} target="_blank" rel="noopener noreferrer" className={`track-courier-btn${order.courier === 'st_courier' ? ' is-primary' : ''}`}>
                    <span className="track-courier-name">ST Courier</span>
                  </a>
                  <a href={COURIER_LINKS.professional_courier.url} target="_blank" rel="noopener noreferrer" className={`track-courier-btn${order.courier === 'professional_courier' ? ' is-primary' : ''}`}>
                    <span className="track-courier-name">Professional Courier</span>
                  </a>
                </div>
                <Link to={`/track`} className="button secondary" style={{ marginTop: '12px', display: 'inline-flex' }} onClick={onClose}>
                  Open track order page
                </Link>
              </div>
            )}

            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Items</h3>
            <div style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '0 16px', marginBottom: '24px' }}>
              {order.items && order.items.map((item, idx) => (
                <div key={item.id} style={{ 
                  display: 'flex', gap: '16px', padding: '16px 0', 
                  borderBottom: idx === order.items.length - 1 ? 'none' : '1px solid var(--line)' 
                }}>
                  <img src={item.product_image} alt={item.product_name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{item.product_name}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                      {item.attributes ? (() => {
                        try {
                          const attrs = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes;
                          return Object.entries(attrs).map(([k, v]) => {
                            const [valName] = v.includes('|') ? v.split('|') : [v, v];
                            return (
                              <span key={k}>{k}: {valName} &bull; </span>
                            );
                          });
                        } catch (e) {
                          return null;
                        }
                      })() : (
                        <>
                          {item.variant_size && <span>Size: {item.variant_size} &bull; </span>}
                          {item.variant_color && <span>Color: {item.variant_color.split('|')[0]} &bull; </span>}
                        </>
                      )}
                      Qty: {item.quantity}
                    </div>
                    {order.status === 'delivered' && item.slug && (
                      <Link 
                        to={`/product/${item.slug}#product-reviews`}
                        onClick={onClose}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--primary, #6366f1)',
                          fontSize: '12px',
                          fontWeight: '600',
                          textDecoration: 'none',
                          marginTop: '6px'
                        }}
                      >
                        Write a review →
                      </Link>
                    )}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Shipping Address</h3>
                <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6' }}>
                  {(() => {
                    try {
                      const addr = typeof order.shipping_address === 'string' 
                        ? JSON.parse(order.shipping_address) 
                        : (order.shipping_address || {});
                      
                      if (!addr.full_name && !addr.line1) return 'No address provided.';

                      return (
                        <>
                          <strong>{addr.full_name || order.customer_name}</strong><br />
                          {addr.phone}<br />
                          {addr.line1}<br />
                          {addr.city}, {addr.state} - {addr.pincode}
                        </>
                      );
                    } catch(e) {
                      return 'Address unavailable';
                    }
                  })()}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Order Summary</h3>
                <dl className="summary-list" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <dt style={{ color: 'var(--muted)' }}>Subtotal</dt>
                    <dd>{formatPrice(order.subtotal)}</dd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <dt style={{ color: 'var(--muted)' }}>Shipping</dt>
                    <dd>{order.shipping_charge === 0 ? 'Free' : formatPrice(order.shipping_charge)}</dd>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                    <dt>Total</dt>
                    <dd style={{ color: 'var(--purple-700)' }}>{formatPrice(order.total)}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;
