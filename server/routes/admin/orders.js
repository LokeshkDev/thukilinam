const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');
const { sendOrderStatusEmail } = require('../../utils/emailUtils');

const notifyOrderStatusChange = async (orderId, status, trackingNumber, courier) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.order_number, o.status, o.total, o.tracking_number,
              o.payment_method, o.shipping_address, o.courier,
              COALESCE(o.customer_name, JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.full_name'))) AS customer_name,
              COALESCE(o.customer_email, JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.email'))) AS customer_email
       FROM orders o
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
    const isAll = req.query.all === 'true' || limit === 'all';
    const parsedLimit = isAll ? 10000 : Math.min(10000, parseInt(limit) || 20);
    const offset = isAll ? 0 : (parseInt(page) - 1) * parsedLimit;
    let where = []; let params = [];
    if (status) { where.push('o.status=?'); params.push(status); }
    if (search) {
      where.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.customer_email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [orders] = await pool.query(`
      SELECT o.*,
             COALESCE(o.customer_name, JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.full_name'))) AS customer_name,
             COALESCE(o.customer_email, JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.email'))) AS customer_email,
             COALESCE(o.customer_phone, JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.phone'))) AS customer_phone
      FROM orders o
      ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
    `, [...params, parsedLimit, offset]);

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${whereClause}`, params);
    const enhancedOrders = orders.map(order => {
      let ship = {};
      try {
        ship = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {});
      } catch (e) { ship = {}; }
      return {
        ...order,
        customer_name: order.customer_name || ship.full_name || 'Guest',
        customer_phone: order.customer_phone || ship.phone || 'N/A',
        customer_email: order.customer_email || ship.email || 'N/A',
        delivery_city: ship.city || '',
        delivery_state: ship.state || '',
        delivery_pincode: ship.pincode || '',
        delivery_address: [ship.line1, ship.city, ship.state, ship.pincode].filter(Boolean).join(', ')
      };
    });
    res.json({ success: true, orders: enhancedOrders, total, page: isAll ? 1 : parseInt(page), pages: isAll ? 1 : Math.ceil(total / parsedLimit) });
  } catch (err) { next(err); }
});

// GET /api/admin/orders/:id
router.get('/:id', adminAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*,
             COALESCE(o.customer_name, JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.full_name'))) AS customer_name,
             COALESCE(o.customer_email, JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.email'))) AS customer_email,
             COALESCE(o.customer_phone, JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.phone'))) AS customer_phone
      FROM orders o WHERE o.id=?
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

    res.json({ success: true, message: 'Order status updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/admin/orders/:id
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM orders WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Order deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
