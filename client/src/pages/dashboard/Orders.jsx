import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import OrderDetailsModal from '../../components/OrderDetailsModal';

const formatPrice = (value = 0) => `Rs. ${Number(value).toLocaleString('en-IN')}`;

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-page dashboard-page">
      <section className="app-page-head">
        <div>
          <p className="eyebrow">Your Account</p>
          <h1>Orders</h1>
          <p>Track boutique purchases, delivery progress, and payment status.</p>
        </div>
      </section>

      <section className="dashboard-layout">
        <aside className="account-panel">
          <div className="account-avatar">{(user?.name || user?.email || 'T').charAt(0).toUpperCase()}</div>
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>{user?.name || 'My Account'}</h2>
            <p>{user?.email || 'Your order center'}</p>
          </div>
          <nav className="account-nav" aria-label="Account navigation">
            <Link to="/profile">Profile Settings</Link>
            <Link to="/orders" className="is-active">Order History</Link>
            <Link to="/wishlist">My Wishlist</Link>
          </nav>
        </aside>

        <div className="dashboard-content">
          <div className="content-toolbar">
            <div>
              <h2>Order History</h2>
              <p>{orders.length} orders placed</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link to="/track" className="button secondary">Track order</Link>
              <Link to="/shop" className="button secondary">Shop New In</Link>
            </div>
          </div>

          {loading ? (
            <div className="app-empty-state compact">
              <p>Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="app-empty-state compact">
              <span className="app-empty-icon">
                <svg className="icon" aria-hidden="true">
                  <use href="#icon-bag"></use>
                </svg>
              </span>
              <h2>No orders yet</h2>
              <p>Your purchases will appear here with delivery and payment updates.</p>
              <Link to="/shop" className="button primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <article 
                  key={order.id} 
                  className="order-card"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}
                >
                  {/* Order Card Header Section */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <div className="order-main" style={{ flex: '1', minWidth: '200px' }}>
                      <span className={`order-status status-${order.status || 'pending'}`}>
                        {String(order.status || 'pending').replace('_', ' ')}
                      </span>
                      <h3 style={{ margin: '10px 0 5px' }}>Order #{order.order_number}</h3>
                      <p style={{ margin: 0 }}>Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</p>
                    </div>

                    <div className="order-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '100px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>{order.payment_method || 'Payment'}</span>
                      <strong style={{ fontSize: '18px', color: 'var(--ink)' }}>{formatPrice(order.total)}</strong>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => setSelectedOrderId(order.id)} 
                      className="button secondary"
                      style={{ height: 'fit-content' }}
                    >
                      Details
                    </button>
                  </div>

                  {/* Order Items List */}
                  {order.items && order.items.length > 0 && (
                    <div style={{ 
                      marginTop: '4px', 
                      paddingTop: '16px', 
                      borderTop: '1px dashed var(--line)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px' 
                    }}>
                      {order.items.map((item) => (
                        <div key={item.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          gap: '16px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '200px' }}>
                            <img 
                              src={item.product_image} 
                              alt={item.product_name} 
                              style={{ 
                                width: '48px', 
                                height: '48px', 
                                objectFit: 'cover', 
                                borderRadius: '8px', 
                                border: '1px solid var(--line)' 
                              }} 
                            />
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ display: 'block', fontSize: '14px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.product_name}
                              </strong>
                              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                Qty: {item.quantity} &bull; Rs. {Number(item.price).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {order.status === 'delivered' && item.slug && (
                              <Link 
                                to={`/product/${item.slug}#product-reviews`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  color: '#a965cf',
                                  background: 'linear-gradient(135deg, var(--purple-600) 0%, var(--purple-800) 100%)',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  textDecoration: 'none',
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'none';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
                                }}
                              >
                                Write Review →
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {selectedOrderId && (
        <OrderDetailsModal 
          orderId={selectedOrderId} 
          onClose={() => {
            setSelectedOrderId(null);
            fetchOrders(); // Refresh status on close
          }} 
        />
      )}
    </main>
  );
};

export default Orders;
