import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { X, Package, Truck, CreditCard } from 'lucide-react';

const formatPrice = (value = 0) => `₹${Number(value).toLocaleString('en-IN')}`;

const OrderDetailsModal = ({ orderId, onClose, onStatusUpdate }) => {
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

  const handleStatusUpdate = async (newStatus) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchOrderDetails();
        if (onStatusUpdate) onStatusUpdate();
      }
    } catch (err) {
      alert('Failed to update status.');
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
          <button className="btn btn-light rounded-circle p-2" onClick={onClose}><X size={20} /></button>
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
                      } catch(e) { return <span className="text-muted">No address provided.</span> }
                    })()}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><CreditCard size={16} /> Payment Info</h6>
                    <div className="small mb-3">
                      <div>Method: <strong className="text-uppercase">{order.payment_method}</strong></div>
                      <div>Status: <span className={order.payment_status === 'paid' ? 'text-success fw-bold' : 'text-warning fw-bold'}>{order.payment_status.toUpperCase()}</span></div>
                    </div>
                    
                    <h6 className="fw-bold mb-2">Order Status</h6>
                    <div className="dropdown w-100">
                      <button className="btn btn-white border w-100 text-start d-flex justify-content-between align-items-center" data-bs-toggle="dropdown">
                        <span className="text-capitalize">{order.status.replace('_', ' ')}</span>
                        <span className="caret"></span>
                      </button>
                      <ul className="dropdown-menu w-100 shadow-sm border-0">
                        <li><button className="dropdown-item" onClick={() => handleStatusUpdate('pending')}>Pending</button></li>
                        <li><button className="dropdown-item" onClick={() => handleStatusUpdate('processing')}>Processing</button></li>
                        <li><button className="dropdown-item" onClick={() => handleStatusUpdate('shipped')}>Shipped</button></li>
                        <li><button className="dropdown-item text-success" onClick={() => handleStatusUpdate('delivered')}>Delivered</button></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item text-danger" onClick={() => handleStatusUpdate('cancelled')}>Cancelled</button></li>
                      </ul>
                    </div>
                  </div>
                </div>
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
                            <div>
                              <div className="fw-bold small">{item.product_name}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>
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
                                    {item.variant_size && <span className="me-2">Size: {item.variant_size} </span>}
                                    {item.variant_color && <span>Color: {item.variant_color.split('|')[0]}</span>}
                                  </>
                                )}
                              </div>
                            </div>
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
                    <div className="d-flex justify-content-between mb-2 small">
                      <span className="text-muted">Tax</span>
                      <span>{formatPrice(order.tax)}</span>
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
