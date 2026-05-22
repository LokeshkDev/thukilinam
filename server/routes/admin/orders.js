const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');
const { sendOrderStatusEmail } = require('../../utils/emailUtils');

const notifyOrderStatusChange = async (orderId, status, trackingNumber, courier) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.order_number, o.status, o.total, o.tracking_number,
              o.payment_method, o.shipping_address, o.courier,
              u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.id=?`,
      [orderId]
    );
    if (!rows.length || !rows[0].customer_email) return;

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id=?', [orderId]);

    await sendOrderStatusEmail(rows[0].customer_email, rows[0].customer_name, {
      order_number: rows[0].order_number,
      status: status || rows[0].status,
      total: rows[0].total,
      payment_method: rows[0].payment_method,
      shipping_address: rows[0].shipping_address,
      tracking_number: trackingNumber !== undefined ? trackingNumber : rows[0].tracking_number,
      courier: courier !== undefined ? courier : rows[0].courier,
      items
    });
  } catch (err) {
    console.error('Order status email failed:', err.message);
  }
};

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
    const { status, tracking_number, courier } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const validCouriers = ['st_courier', 'professional_courier', 'other', ''];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    if (courier !== undefined && courier !== null && !validCouriers.includes(courier)) {
      return res.status(400).json({ success: false, message: 'Invalid courier.' });
    }
    const [existing] = await pool.query('SELECT status, tracking_number, courier FROM orders WHERE id=?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Order not found.' });

    const updates = ['status=?'];
    const values = [status];
    if (tracking_number !== undefined) {
      updates.push('tracking_number=?');
      values.push(tracking_number || null);
    }
    if (courier !== undefined) {
      updates.push('courier=?');
      values.push(courier || null);
    }
    values.push(req.params.id);

    await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id=?`, values);
    if (status === 'delivered') await pool.query("UPDATE orders SET payment_status='paid' WHERE id=? AND payment_method='cod'", [req.params.id]);
    if (existing[0].status !== status) {
      notifyOrderStatusChange(
        req.params.id,
        status,
        tracking_number !== undefined ? tracking_number : existing[0].tracking_number,
        courier !== undefined ? courier : existing[0].courier
      );
    }
    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) { next(err); }
});

// PUT /api/admin/orders/:id — update order details
router.put('/:id', adminAuth, async (req, res, next) => {
  try {
    const { status, payment_status, notes, tracking_number, courier } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    const validCouriers = ['st_courier', 'professional_courier', 'other', ''];

    const [existing] = await pool.query('SELECT id, status, tracking_number FROM orders WHERE id=?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    if (payment_status !== undefined && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status.' });
    }
    if (courier !== undefined && courier !== null && !validCouriers.includes(courier)) {
      return res.status(400).json({ success: false, message: 'Invalid courier.' });
    }

    const updates = [];
    const values = [];
    if (status !== undefined) { updates.push('status=?'); values.push(status); }
    if (payment_status !== undefined) { updates.push('payment_status=?'); values.push(payment_status); }
    if (notes !== undefined) { updates.push('notes=?'); values.push(notes || null); }
    if (tracking_number !== undefined) { updates.push('tracking_number=?'); values.push(tracking_number || null); }
    if (courier !== undefined) { updates.push('courier=?'); values.push(courier || null); }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id=?`, values);

    if (status === 'delivered') {
      await pool.query("UPDATE orders SET payment_status='paid' WHERE id=? AND payment_method='cod'", [req.params.id]);
    }
    if (status !== undefined && existing[0].status !== status) {
      notifyOrderStatusChange(req.params.id, status, tracking_number !== undefined ? tracking_number : existing[0].tracking_number);
    }

    res.json({ success: true, message: 'Order updated successfully.' });
  } catch (err) { next(err); }
});

// DELETE /api/admin/orders/:id
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id, order_number FROM orders WHERE id=?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Order not found.' });

    await pool.query('DELETE FROM order_items WHERE order_id=?', [req.params.id]);
    await pool.query('DELETE FROM orders WHERE id=?', [req.params.id]);
    res.json({ success: true, message: `Order ${existing[0].order_number} deleted successfully.` });
  } catch (err) { next(err); }
});

module.exports = router;
