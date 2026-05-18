import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Eye, CheckCircle, Truck, XCircle, Search, Filter } from 'lucide-react';
import OrderDetailsModal from '../components/OrderDetailsModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [status, searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders', { params: { status, search: searchTerm } });
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/orders/${id}/status`, { status: newStatus });
      if (res.data.success) {
        alert(res.data.message);
        fetchOrders();
      }
    } catch (err) {
      alert('Failed to update order status.');
    }
  };

  const getStatusBadge = (s) => {
    const map = {
      pending: 'bg-warning-soft text-warning',
      processing: 'bg-info-soft text-info',
      shipped: 'bg-primary-soft text-primary',
      delivered: 'bg-success-soft text-success',
      cancelled: 'bg-danger-soft text-danger'
    };
    return `badge ${map[s] || 'bg-secondary-soft text-secondary'} px-3 py-2 rounded-pill`;
  };

  return (
    <div className="admin-orders">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Order Management</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-dark d-flex align-items-center gap-2 rounded-pill px-4">
            <Filter size={18} /> Filters
          </button>
        </div>
      </div>

      <div className="filters-card bg-white p-3 rounded-4 shadow-sm mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0"><Search size={18} className="text-muted" /></span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Search by order #, customer name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="btn-group rounded-pill overflow-hidden border">
              {['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                <button 
                  key={s} 
                  className={`btn btn-sm px-3 ${status === s ? 'btn-primary' : 'btn-white'}`}
                  onClick={() => setStatus(s)}
                >
                  {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="orders-table bg-white rounded-4 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-5">No orders found.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td className="ps-4 fw-bold text-primary">{order.order_number}</td>
                  <td>
                    <div>
                      <div className="fw-bold">{order.customer_name}</div>
                      <small className="text-muted">{order.customer_email}</small>
                    </div>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="small fw-bold">{order.payment_method.toUpperCase()}</div>
                    <small className={order.payment_status === 'paid' ? 'text-success' : 'text-warning'}>{order.payment_status.toUpperCase()}</small>
                  </td>
                  <td className="fw-bold">₹{order.total}</td>
                  <td><span className={getStatusBadge(order.status)}>{order.status.toUpperCase()}</span></td>
                  <td className="text-end pe-4">
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-sm btn-icon border" title="View Details" onClick={() => setSelectedOrderId(order.id)}><Eye size={16} /></button>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-icon border dropdown-toggle no-caret" data-bs-toggle="dropdown">
                          <CheckCircle size={16} />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 p-2">
                          <li><button className="dropdown-item rounded-2" onClick={() => updateStatus(order.id, 'processing')}>Mark Processing</button></li>
                          <li><button className="dropdown-item rounded-2" onClick={() => updateStatus(order.id, 'shipped')}>Mark Shipped</button></li>
                          <li><button className="dropdown-item rounded-2 text-success" onClick={() => updateStatus(order.id, 'delivered')}>Mark Delivered</button></li>
                          <li><hr className="dropdown-divider" /></li>
                          <li><button className="dropdown-item rounded-2 text-danger" onClick={() => updateStatus(order.id, 'cancelled')}>Cancel Order</button></li>
                        </ul>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrderId && (
        <OrderDetailsModal 
          orderId={selectedOrderId} 
          onClose={() => setSelectedOrderId(null)} 
          onStatusUpdate={fetchOrders}
        />
      )}
    </div>
  );
};

export default Orders;
