const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');

// GET /api/admin/orders
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = []; let params = [];
    if (status) { where.push('o.status=?'); params.push(status); }
    if (search) { where.push('(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [orders] = await pool.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email
      FROM orders o JOIN users u ON o.user_id=u.id
      ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders o JOIN users u ON o.user_id=u.id ${whereClause}`, params);
    res.json({ success: true, orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// GET /api/admin/orders/:id
router.get('/:id', adminAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      FROM orders o JOIN users u ON o.user_id=u.id WHERE o.id=?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found.' });
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id=?', [req.params.id]);
    res.json({ success: true, order: { ...rows[0], items } });
  } catch (err) { next(err); }
});

// PUT /api/admin/orders/:id/status
router.put('/:id/status', adminAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    await pool.query('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);
    // If delivered → mark payment as paid for COD
    if (status === 'delivered') await pool.query("UPDATE orders SET payment_status='paid' WHERE id=? AND payment_method='cod'", [req.params.id]);
    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) { next(err); }
});

module.exports = router;
