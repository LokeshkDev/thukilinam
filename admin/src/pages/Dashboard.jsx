import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, DollarSign, Clock } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) setData(res.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  const COLORS = ['#6A38B6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="admin-dashboard">
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="stat-card bg-white p-4 rounded-4 shadow-sm border-0">
            <div className="d-flex justify-content-between mb-3">
              <div className="icon-wrap bg-primary-soft p-3 rounded-circle text-primary"><DollarSign size={24} /></div>
              <span className="text-success small fw-bold">+12% <TrendingUp size={16} /></span>
            </div>
            <h6 className="text-muted mb-1">Total Revenue</h6>
            <h3 className="fw-bold mb-0">₹{data.stats.total_revenue}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card bg-white p-4 rounded-4 shadow-sm border-0">
            <div className="d-flex justify-content-between mb-3">
              <div className="icon-wrap bg-info-soft p-3 rounded-circle text-info"><ShoppingBag size={24} /></div>
              <span className="text-success small fw-bold">+5% <TrendingUp size={16} /></span>
            </div>
            <h6 className="text-muted mb-1">Total Orders</h6>
            <h3 className="fw-bold mb-0">{data.stats.total_orders}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card bg-white p-4 rounded-4 shadow-sm border-0">
            <div className="d-flex justify-content-between mb-3">
              <div className="icon-wrap bg-warning-soft p-3 rounded-circle text-warning"><Clock size={24} /></div>
              <span className="text-danger small fw-bold">Active</span>
            </div>
            <h6 className="text-muted mb-1">Pending Orders</h6>
            <h3 className="fw-bold mb-0">{data.stats.pending_orders}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card bg-white p-4 rounded-4 shadow-sm border-0">
            <div className="d-flex justify-content-between mb-3">
              <div className="icon-wrap bg-success-soft p-3 rounded-circle text-success"><Users size={24} /></div>
              <span className="text-success small fw-bold">+8% <TrendingUp size={16} /></span>
            </div>
            <h6 className="text-muted mb-1">Total Customers</h6>
            <h3 className="fw-bold mb-0">{data.stats.total_users}</h3>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-lg-8">
          <div className="chart-card bg-white p-4 rounded-4 shadow-sm h-100">
            <h5 className="fw-bold mb-4">Revenue Overview</h5>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#6A38B6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="chart-card bg-white p-4 rounded-4 shadow-sm h-100">
            <h5 className="fw-bold mb-4">Orders by Status</h5>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.status_breakdown} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="status">
                    {data.status_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="recent-orders bg-white p-4 rounded-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">Recent Orders</h5>
          <button className="btn btn-link text-decoration-none">View All</button>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_orders.map((order) => (
                <tr key={order.id}>
                  <td className="fw-bold">{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="fw-bold">₹{order.total}</td>
                  <td>
                    <span className={`badge ${order.status === 'delivered' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td><button className="btn btn-sm btn-outline-dark">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
