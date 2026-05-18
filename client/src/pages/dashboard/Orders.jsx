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
            <Link to="/shop" className="button secondary">Shop New In</Link>
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
                <article key={order.id} className="order-card">
                  <div className="order-main">
                    <span className={`order-status status-${order.status || 'pending'}`}>
                      {String(order.status || 'pending').replace('_', ' ')}
                    </span>
                    <h3>Order #{order.order_number}</h3>
                    <p>Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</p>
                  </div>

                  <div className="order-meta">
                    <span>{order.payment_method || 'Payment'}</span>
                    <strong>{formatPrice(order.total)}</strong>
                  </div>

                  <button type="button" onClick={() => setSelectedOrderId(order.id)} className="button secondary">Details</button>
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
