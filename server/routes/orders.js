const router = require('express').Router();
const pool = require('../database/connection');
const auth = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../utils/emailUtils');

// Helper: generate order number
function genOrderNumber() {
  return 'THK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
}

// POST /api/orders — place order
router.post('/', auth, async (req, res, next) => {
  try {
    const { shipping_address, billing_address, payment_method = 'cod', coupon_code, notes } = req.body;
    if (!shipping_address) return res.status(400).json({ success: false, message: 'Shipping address required.' });

    // Get cart items
    const [carts] = await pool.query('SELECT id FROM cart WHERE user_id=?', [req.user.id]);
    if (!carts.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });
    const cartId = carts[0].id;

    const [items] = await pool.query(`
      SELECT ci.*, p.name, p.price, p.discount_price, p.stock,
             pv.attributes, pv.price AS variant_price, pv.sale_price AS variant_sale_price,
             (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS image
      FROM cart_items ci JOIN products p ON ci.product_id=p.id
      LEFT JOIN product_variants pv ON ci.variant_id=pv.id
      WHERE ci.cart_id=?
    `, [cartId]);

    if (!items.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });

    // Calculate totals
    let subtotal = items.reduce((sum, i) => {
      const price = parseFloat(i.variant_sale_price || i.variant_price || i.discount_price || i.price || 0);
      return sum + price * i.quantity;
    }, 0);
    const shipping = subtotal >= 2999 ? 0 : 149;
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    let discount = 0;

    if (coupon_code) {
      const [coupons] = await pool.query(
        `SELECT * FROM coupons WHERE code=? AND is_active=1 AND (expiry_date IS NULL OR expiry_date >= CURDATE())`,
        [coupon_code.toUpperCase()]
      );
      if (coupons.length) {
        const c = coupons[0];
        discount = c.type === 'percentage' ? (subtotal * c.value) / 100 : c.value;
        if (c.max_discount && discount > c.max_discount) discount = c.max_discount;
        await pool.query('UPDATE coupons SET used_count=used_count+1 WHERE id=?', [c.id]);
      }
    }

    const total = subtotal + shipping + tax - discount;
    const orderNumber = genOrderNumber();

    const [orderResult] = await pool.query(`
      INSERT INTO orders (order_number, user_id, status, subtotal, shipping_charge, tax, discount, total, coupon_code, payment_method, payment_status, shipping_address, billing_address, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      orderNumber, req.user.id, 'pending', subtotal, shipping, tax, discount, total,
      coupon_code || null, payment_method, payment_method === 'cod' ? 'pending' : 'pending',
      JSON.stringify(shipping_address), JSON.stringify(billing_address || shipping_address), notes || null
    ]);

    const orderId = orderResult.insertId;

    // Insert order items + update stock
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, variant_size, variant_color, attributes) VALUES (?,?,?,?,?,?,?,?,?)',
        [orderId, item.product_id, item.name, item.image, item.variant_sale_price || item.variant_price || item.discount_price || item.price, item.quantity, item.size || null, item.color || null, typeof item.attributes === 'object' ? JSON.stringify(item.attributes) : item.attributes || null]
      );
      await pool.query('UPDATE products SET stock=stock-? WHERE id=? AND stock > 0', [item.quantity, item.product_id]);
    }

    // Clear cart
    await pool.query('DELETE FROM cart_items WHERE cart_id=?', [cartId]);

    // Send confirmation email (non-blocking)
    try {
      const [userRows] = await pool.query('SELECT email, name FROM users WHERE id=?', [req.user.id]);
      if (userRows.length) {
        await sendOrderConfirmationEmail(userRows[0].email, userRows[0].name, { order_number: orderNumber, total, payment_method, status: 'pending' });
      }
    } catch (e) { 
      console.error('Email sending failed:', e.message); 
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: { id: orderId, order_number: orderNumber, total, status: 'pending', payment_method }
    });
  } catch (err) { next(err); }
});

// GET /api/orders — user's orders
router.get('/', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), offset]
    );
    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM orders WHERE user_id=?', [req.user.id]);
    res.json({ success: true, orders, total: countRows[0].total });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found.' });
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id=?', [req.params.id]);
    res.json({ success: true, order: { ...rows[0], items } });
  } catch (err) { next(err); }
});

module.exports = router;
