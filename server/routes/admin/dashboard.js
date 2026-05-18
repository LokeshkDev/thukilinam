const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');

// GET /api/admin/dashboard
router.get('/', adminAuth, async (req, res, next) => {
  try {
    let total_orders = 0, total_revenue = 0, total_users = 0, total_products = 0, pending_orders = 0;
    
    try {
      const [res1] = await pool.query('SELECT COUNT(*) AS count FROM orders');
      total_orders = res1[0]?.count || 0;
      
      const [res2] = await pool.query("SELECT SUM(total) AS sum FROM orders WHERE status NOT IN ('cancelled','refunded')");
      total_revenue = res2[0]?.sum || 0;
      
      const [res3] = await pool.query('SELECT COUNT(*) AS count FROM users');
      total_users = res3[0]?.count || 0;
      
      const [res4] = await pool.query('SELECT COUNT(*) AS count FROM products WHERE is_active=1');
      total_products = res4[0]?.count || 0;
      
      const [res5] = await pool.query("SELECT COUNT(*) AS count FROM orders WHERE status='pending'");
      pending_orders = res5[0]?.count || 0;
    } catch (dbErr) {
      console.error('Error fetching basic stats:', dbErr);
    }

    // Monthly revenue (last 6 months)
    let monthly = [];
    try {
      [monthly] = await pool.query(`
        SELECT ANY_VALUE(DATE_FORMAT(created_at, '%b %Y')) AS month, SUM(total) AS revenue, COUNT(*) AS orders
        FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND status NOT IN ('cancelled','refunded')
        GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
      `);
    } catch (dbErr) {
      console.error('Error fetching monthly stats:', dbErr);
    }

    // Recent orders
    let recent_orders = [];
    try {
      [recent_orders] = await pool.query(`
        SELECT o.id, o.order_number, o.total, o.status, o.payment_method, o.created_at, u.name AS customer_name
        FROM orders o LEFT JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC LIMIT 10
      `);
    } catch (dbErr) {
      console.error('Error fetching recent orders:', dbErr);
    }

    // Top products
    let top_products = [];
    try {
      [top_products] = await pool.query(`
        SELECT p.name, SUM(oi.quantity) AS sold, SUM(oi.price * oi.quantity) AS revenue
        FROM order_items oi JOIN products p ON oi.product_id=p.id
        GROUP BY oi.product_id ORDER BY sold DESC LIMIT 5
      `);
    } catch (dbErr) {
      console.error('Error fetching top products:', dbErr);
    }

    // Order status breakdown
    let status_breakdown = [];
    try {
      [status_breakdown] = await pool.query(`
        SELECT status, COUNT(*) AS count FROM orders GROUP BY status
      `);
    } catch (dbErr) {
      console.error('Error fetching status breakdown:', dbErr);
    }

    res.json({
      success: true,
      stats: { total_orders, total_revenue, total_users, total_products, pending_orders },
      monthly, recent_orders, top_products, status_breakdown
    });
  } catch (err) {
    console.error('Dashboard Route Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
