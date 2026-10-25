import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  CheckCircle, Search, Filter, Edit2, Trash2, Download, 
  FileSpreadsheet, FileText, RefreshCw, Package, Clock, 
  Truck, CheckCircle2, XCircle, MapPin, Phone, Mail, ChevronLeft, ChevronRight
} from 'lucide-react';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { exportOrdersToExcel, exportOrdersToPdf, getOrderLocation, formatAddress } from '../utils/exportUtils';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Modals & prompts
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [shippingPrompt, setShippingPrompt] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('');

  // Stats calculation
  const [stats, setStats] = useState({
    total: 0,
    revenue: 0,
    pending: 0,
    delivered: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [status, searchTerm, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders', { 
        params: { 
          status, 
          search: searchTerm,
          page,
          limit: 20
        } 
      });

      if (res.data.success) {
        setOrders(res.data.orders || []);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);

        // Calculate quick summary metrics
        const currentOrders = res.data.orders || [];
        const rev = currentOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        const pend = currentOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
        const deliv = currentOrders.filter(o => o.status === 'delivered').length;

        setStats({
          total: res.data.total || currentOrders.length,
          revenue: rev,
          pending: pend,
          delivered: deliv
        });
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all orders for full dataset export
  const fetchAllOrdersForExport = async () => {
    try {
      const res = await api.get('/orders', { 
        params: { 
          status, 
          search: searchTerm,
          all: 'true' 
        } 
      });
      if (res.data.success && res.data.orders) {
        return res.data.orders;
      }
      return orders;
    } catch (e) {
      console.warn('Failed to fetch all orders for export, falling back to current page:', e);
      return orders;
    }
  };

  const handleExportExcel = async (exportAll = true) => {
    setExporting(true);
    try {
      const dataToExport = exportAll ? await fetchAllOrdersForExport() : orders;
      await exportOrdersToExcel(dataToExport, `Thukilinam_Orders_${status || 'All'}`);
    } catch (err) {
      alert('Failed to generate Excel export.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async (exportAll = true) => {
    setExporting(true);
    try {
      const dataToExport = exportAll ? await fetchAllOrdersForExport() : orders;
      await exportOrdersToPdf(dataToExport, `Thukilinam Orders Report (${status ? status.toUpperCase() : 'ALL'})`);
    } catch (err) {
      alert('Failed to generate PDF report.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id, orderNumber) => {
    if (!window.confirm(`Delete order #${orderNumber}? This will remove it permanently.`)) return;
    try {
      const res = await api.delete(`/orders/${id}`);
      if (res.data.success) {
        alert(res.data.message || 'Order deleted successfully.');
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete order.');
    }
  };

  const updateStatus = async (id, newStatus, extra = {}) => {
    try {
      const res = await api.put(`/orders/${id}/status`, { status: newStatus, ...extra });
      if (res.data.success) {
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  const handleStatusClick = (order, newStatus) => {
    if (newStatus === 'shipped') {
      setShippingPrompt(order);
      setTrackingNumber(order.tracking_number || '');
      setSelectedCourier(order.courier || '');
      return;
    }
    updateStatus(order.id, newStatus);
  };

  const submitShippingStatus = async (e) => {
    e.preventDefault();
    if (!shippingPrompt) return;
    await updateStatus(shippingPrompt.id, 'shipped', {
      tracking_number: trackingNumber.trim(),
      courier: selectedCourier
    });
    setShippingPrompt(null);
    setTrackingNumber('');
    setSelectedCourier('');
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'delivered':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'shipped':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'processing':
        return 'bg-info-subtle text-info border border-info-subtle';
      case 'cancelled':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:
        return 'bg-warning-subtle text-warning border border-warning-subtle';
    }
  };

  return (
    <div className="admin-orders p-2 p-md-3">
      {/* ─── HEADER & EXPORT ACTIONS ────────────────────────────────────────── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h3 className="fw-bold text-dark mb-0">Order Management</h3>
            <span className="badge bg-secondary-subtle text-secondary px-2.5 py-1.5 rounded-pill fs-7">
              {totalCount} Total
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Track dispatches, customer contact info, locations, and download order sheets.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button 
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 rounded-3 px-3 shadow-2xs"
            onClick={fetchOrders}
            title="Refresh Orders"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span className="d-none d-sm-inline">Refresh</span>
          </button>

          {/* Export to Excel Dropdown */}
          <div className="dropdown">
            <button 
              className="btn btn-success btn-sm d-flex align-items-center gap-2 rounded-3 px-3 shadow-2xs dropdown-toggle" 
              data-bs-toggle="dropdown"
              disabled={exporting || loading}
            >
              <FileSpreadsheet size={16} />
              <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 p-2 rounded-3">
              <li>
                <button className="dropdown-item rounded-2 py-2" onClick={() => handleExportExcel(true)}>
                  <div className="fw-semibold">Export All Orders ({totalCount})</div>
                  <small className="text-muted">Includes customer names, phone, email, place, AWB</small>
                </button>
              </li>
              <li><hr className="dropdown-divider my-1" /></li>
              <li>
                <button className="dropdown-item rounded-2 py-2" onClick={() => handleExportExcel(false)}>
                  <div className="fw-semibold">Export Current Page ({orders.length})</div>
                  <small className="text-muted">Filtered view only</small>
                </button>
              </li>
            </ul>
          </div>

          {/* Export to PDF Button */}
          <div className="dropdown">
            <button 
              className="btn btn-danger btn-sm d-flex align-items-center gap-2 rounded-3 px-3 shadow-2xs dropdown-toggle" 
              data-bs-toggle="dropdown"
              disabled={exporting || loading}
            >
              <FileText size={16} />
              <span>Export PDF</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 p-2 rounded-3">
              <li>
                <button className="dropdown-item rounded-2 py-2" onClick={() => handleExportPdf(true)}>
                  <div className="fw-semibold">Print / Save All Orders ({totalCount})</div>
                  <small className="text-muted">Clean styled manifest with customer & location columns</small>
                </button>
              </li>
              <li><hr className="dropdown-divider my-1" /></li>
              <li>
                <button className="dropdown-item rounded-2 py-2" onClick={() => handleExportPdf(false)}>
                  <div className="fw-semibold">Print Current Page ({orders.length})</div>
                  <small className="text-muted">Print filtered records</small>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─── QUICK METRICS KPI CARDS ────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-2xs rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Total Orders</span>
                <h4 className="fw-bold mb-0 mt-1 text-dark">{totalCount}</h4>
              </div>
              <div className="rounded-3 p-2 bg-primary-subtle text-primary">
                <Package size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-2xs rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Total Value</span>
                <h4 className="fw-bold mb-0 mt-1 text-dark">₹{stats.revenue.toLocaleString('en-IN')}</h4>
              </div>
              <div className="rounded-3 p-2 bg-success-subtle text-success">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-2xs rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Pending / To Pack</span>
                <h4 className="fw-bold mb-0 mt-1 text-warning">{stats.pending}</h4>
              </div>
              <div className="rounded-3 p-2 bg-warning-subtle text-warning">
                <Clock size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-2xs rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Delivered</span>
                <h4 className="fw-bold mb-0 mt-1 text-success">{stats.delivered}</h4>
              </div>
              <div className="rounded-3 p-2 bg-info-subtle text-info">
                <Truck size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER PILLS CARD ─────────────────────────────────────── */}
      <div className="card border-0 shadow-2xs rounded-4 p-3 bg-white mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-lg-5 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 rounded-start-3">
                <Search size={16} className="text-muted" />
              </span>
              <input 
                type="text" 
                className="form-control bg-light border-start-0 rounded-end-3 fs-7" 
                placeholder="Search by Order #, Name, Phone, Email or Place..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              {searchTerm && (
                <button 
                  className="btn btn-light border-start-0 text-muted" 
                  onClick={() => setSearchTerm('')}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="col-lg-7 col-md-6">
            <div className="d-flex gap-1 flex-wrap justify-content-md-end">
              {[
                { label: 'All', val: '' },
                { label: 'Pending', val: 'pending' },
                { label: 'Processing', val: 'processing' },
                { label: 'Shipped', val: 'shipped' },
                { label: 'Delivered', val: 'delivered' },
                { label: 'Cancelled', val: 'cancelled' }
              ].map(item => (
                <button 
                  key={item.val} 
                  className={`btn btn-sm rounded-pill px-3 py-1.5 transition-all ${
                    status === item.val 
                      ? 'btn-dark fw-bold shadow-2xs' 
                      : 'btn-outline-secondary border-0 bg-light text-muted'
                  }`}
                  onClick={() => {
                    setStatus(item.val);
                    setPage(1);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ORDERS TABLE ───────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-2xs rounded-4 bg-white overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table align-middle mb-0 table-hover">
            <thead className="table-light text-uppercase fs-8 text-secondary">
              <tr>
                <th className="ps-4 py-3">Order # / Date</th>
                <th className="py-3">Customer Details</th>
                <th className="py-3">Place / Destination</th>
                <th className="py-3">Payment</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
                <th className="py-3">Courier / AWB</th>
                <th className="text-end pe-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    <span className="text-muted">Loading orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="text-muted mb-2"><Package size={36} /></div>
                    <h6 className="fw-bold mb-1">No orders found</h6>
                    <small className="text-muted">Try adjusting your search terms or status filters.</small>
                  </td>
                </tr>
              ) : orders.map((order) => {
                const place = getOrderLocation(order);
                const fullAddr = formatAddress(order);

                return (
                  <tr key={order.id}>
                    {/* Order ID & Placed Date */}
                    <td className="ps-4">
                      <div 
                        className="fw-bold text-primary cursor-pointer hover-underline"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        {order.order_number}
                      </div>
                      <small className="text-muted fs-8">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </small>
                    </td>

                    {/* Customer Info (Name, Phone, Email) */}
                    <td>
                      <div>
                        <div className="fw-semibold text-dark">{order.customer_name || 'Guest'}</div>
                        {order.customer_phone && order.customer_phone !== 'N/A' && (
                          <div className="small text-muted d-flex align-items-center gap-1">
                            <Phone size={11} className="text-primary" />
                            <a href={`tel:${order.customer_phone}`} className="text-decoration-none text-muted">
                              {order.customer_phone}
                            </a>
                          </div>
                        )}
                        {order.customer_email && order.customer_email !== 'N/A' && (
                          <div className="fs-8 text-secondary text-truncate" style={{ maxWidth: '170px' }} title={order.customer_email}>
                            <Mail size={10} className="me-1" />
                            {order.customer_email}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Place & Location */}
                    <td>
                      <div className="d-flex align-items-start gap-1">
                        <MapPin size={13} className="text-danger mt-1 flex-shrink-0" />
                        <div>
                          <div className="fw-semibold text-dark fs-7">{place}</div>
                          {fullAddr && (
                            <div 
                              className="text-muted fs-8 text-truncate" 
                              style={{ maxWidth: '180px' }} 
                              title={fullAddr}
                            >
                              {fullAddr}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td>
                      <div className="small fw-semibold text-uppercase">{order.payment_method}</div>
                      <span className={`badge px-2 py-1 rounded-pill fs-8 fw-semibold ${
                        order.payment_status === 'paid' 
                          ? 'bg-success-subtle text-success' 
                          : 'bg-warning-subtle text-warning'
                      }`}>
                        {(order.payment_status || 'Pending').toUpperCase()}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td>
                      <span className="fw-bold text-dark fs-6">
                        ₹{Number(order.total || 0).toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Order Status Badge */}
                    <td>
                      <span className={`badge px-3 py-1.5 rounded-pill text-uppercase fs-8 fw-bold ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Courier & Tracking */}
                    <td>
                      {order.tracking_number ? (
                        <div>
                          <div className="small fw-semibold text-dark text-truncate" style={{ maxWidth: '130px' }}>
                            {order.courier ? order.courier.replace(/_/g, ' ').toUpperCase() : 'AWB'}
                          </div>
                          <span className="badge bg-light text-secondary border font-monospace fs-8">
                            {order.tracking_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted fs-8 fst-italic">Not assigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-1.5">
                        <button 
                          className="btn btn-sm btn-outline-primary border-0 rounded-2 p-1.5" 
                          title="View / Manage Order" 
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <Edit2 size={15} />
                        </button>

                        <button 
                          className="btn btn-sm btn-outline-danger border-0 rounded-2 p-1.5" 
                          title="Delete Order" 
                          onClick={() => handleDelete(order.id, order.order_number)}
                        >
                          <Trash2 size={15} />
                        </button>

                        {/* Status Change Dropdown */}
                        <div className="dropdown">
                          <button 
                            className="btn btn-sm btn-light border-0 rounded-2 p-1.5 dropdown-toggle no-caret" 
                            data-bs-toggle="dropdown"
                            title="Quick Status Update"
                          >
                            <CheckCircle size={15} className="text-muted" />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow border-0 p-2 rounded-3 fs-7">
                            <li><h6 className="dropdown-header text-uppercase fs-8">Update Status</h6></li>
                            <li>
                              <button className="dropdown-item rounded-2 py-1.5" onClick={() => handleStatusClick(order, 'pending')}>
                                ⏳ Mark Pending
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item rounded-2 py-1.5" onClick={() => handleStatusClick(order, 'processing')}>
                                ⚙ Mark Processing
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item rounded-2 py-1.5 text-primary fw-semibold" onClick={() => handleStatusClick(order, 'shipped')}>
                                🚚 Mark Shipped (Add Tracking)
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item rounded-2 py-1.5 text-success fw-semibold" onClick={() => handleStatusClick(order, 'delivered')}>
                                ✓ Mark Delivered
                              </button>
                            </li>
                            <li><hr className="dropdown-divider my-1" /></li>
                            <li>
                              <button className="dropdown-item rounded-2 py-1.5 text-danger" onClick={() => handleStatusClick(order, 'cancelled')}>
                                ✕ Cancel Order
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── PAGINATION BAR ──────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <span className="text-muted fs-8">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} orders total)
            </span>
            <div className="d-flex align-items-center gap-1">
              <button 
                className="btn btn-sm btn-outline-secondary rounded-2 px-2.5" 
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={15} /> Prev
              </button>
              
              <span className="px-2 small fw-semibold text-dark">
                {page} / {totalPages}
              </span>

              <button 
                className="btn btn-sm btn-outline-secondary rounded-2 px-2.5" 
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── ORDER DETAILS DRAWER / MODAL ───────────────────────────────────── */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdate={fetchOrders}
          onDelete={fetchOrders}
        />
      )}

      {/* ─── MARK SHIPPED PROMPT MODAL ─────────────────────────────────────── */}
      {shippingPrompt && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" onSubmit={submitShippingStatus}>
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold fs-6">
                  🚚 Mark Order Shipped & Dispatch
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShippingPrompt(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded-3">
                  <span className="fw-semibold text-dark">Order #{shippingPrompt.order_number}</span>
                  <span className="text-muted small">Customer: {shippingPrompt.customer_name}</span>
                </div>

                <label className="form-label small fw-bold text-dark">Tracking / AWB Number</label>
                <input
                  className="form-control rounded-3 py-2"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. ST123456789 or TPC98765432"
                  autoFocus
                  required
                />

                <label className="form-label small fw-bold text-dark mt-3">Courier Service</label>
                <select
                  className="form-select rounded-3 py-2"
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  required
                >
                  <option value="">Choose courier service...</option>
                  <option value="st_courier">ST Courier</option>
                  <option value="professional_courier">The Professional Couriers (TPC)</option>
                  <option value="other">Other Courier</option>
                </select>
                <small className="text-muted d-block mt-2">
                  An automatic email notification with this tracking number will be sent to the customer if an email was provided.
                </small>
              </div>
              <div className="modal-footer bg-light py-2.5">
                <button type="button" className="btn btn-light rounded-3 px-3" onClick={() => setShippingPrompt(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold">Save &amp; Notify</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
