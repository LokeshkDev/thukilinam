const router = require('express').Router();
const pool = require('../database/connection');
const auth = require('../middleware/auth');
const { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } = require('../utils/emailUtils');
const { getShippingSettings, calculateShipping } = require('../utils/shippingUtils');
const { getClientUrl } = require('../utils/urlUtils');
const {
  getCashfreeMode,
  getCashfreeApiHost,
  getCashfreeCredentials,
  assertCashfreeConfigured,
  extractPaymentSessionId
} = require('../utils/cashfreeUtils');
const https = require('https');

// Helper: generate order number
function genOrderNumber() {
  return 'THK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
}

// Cashfree Helper: Create Order Session
function createCashfreeOrder(orderNumber, total, customer) {
  return new Promise((resolve, reject) => {
    try {
      assertCashfreeConfigured();
    } catch (configErr) {
      reject(configErr);
      return;
    }

    const host = getCashfreeApiHost();
    const { appId, secret } = getCashfreeCredentials();

    const postData = JSON.stringify({
      order_id: orderNumber,
      order_amount: parseFloat(total.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: String(customer.id),
        customer_phone: customer.phone ? customer.phone.replace(/[^0-9]/g, '').slice(-10) : '9999999999',
        customer_email: customer.email || 'customer@example.com',
        customer_name: customer.name || 'Customer'
      },
      order_meta: {
        return_url: `${getClientUrl()}/payment-callback?order_id=${orderNumber}`
      }
    });

    const options = {
      hostname: host,
      port: 443,
      path: '/pg/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secret,
        'x-api-version': '2023-08-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const sessionId = extractPaymentSessionId(parsed);
            if (!sessionId) {
              reject(new Error('Cashfree order created but payment_session_id was missing in the response.'));
              return;
            }
            resolve({ ...parsed, payment_session_id: sessionId });
          } else {
            const detail = parsed.message || parsed.code || JSON.stringify(parsed);
            reject(new Error(`Cashfree API error (${res.statusCode}): ${detail}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Cashfree response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.write(postData);
    req.end();
  });
}

// Cashfree Helper: Verify Payment
function verifyCashfreePayment(orderNumber) {
  return new Promise((resolve, reject) => {
    const host = getCashfreeApiHost();
    const { appId, secret } = getCashfreeCredentials();

    const options = {
      hostname: host,
      port: 443,
      path: `/pg/orders/${orderNumber}`,
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secret,
        'x-api-version': '2023-08-01'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || `Cashfree returned status code ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Cashfree response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.end();
  });
}

// POST /api/orders — place order
router.post('/', auth, async (req, res, next) => {
  try {
    const { shipping_address, billing_address, payment_method = 'cashfree', coupon_code, notes } = req.body;
    if (!shipping_address) return res.status(400).json({ success: false, message: 'Shipping address required.' });

    if (payment_method !== 'cashfree') {
      return res.status(400).json({ success: false, message: 'Only online payment via Cashfree is supported. COD is disabled.' });
    }

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
    const shippingSettings = await getShippingSettings(pool);
    let shipping = calculateShipping(subtotal, shippingSettings);
    let discount = 0;

    if (coupon_code) {
      const [coupons] = await pool.query(
        `SELECT * FROM coupons WHERE code=? AND is_active=1 AND (expiry_date IS NULL OR expiry_date >= CURDATE())`,
        [coupon_code.toUpperCase()]
      );
      if (coupons.length) {
        const c = coupons[0];
        if (c.type === 'percentage') {
          discount = (subtotal * c.value) / 100;
        } else if (c.type === 'fixed') {
          discount = c.value;
        } else if (c.type === 'free_shipping') {
          shipping = 0;
        }
        if (c.max_discount && discount > c.max_discount) discount = c.max_discount;
        await pool.query('UPDATE coupons SET used_count=used_count+1 WHERE id=?', [c.id]);
      }
    }

    const total = Math.max(0, subtotal + shipping - discount);
    const orderNumber = genOrderNumber();

    // Fetch user details for Cashfree
    const [userRows] = await pool.query('SELECT email, name, phone FROM users WHERE id=?', [req.user.id]);
    const userObj = userRows[0] || {};

    // Create Cashfree session first to verify details and get session ID
    const cfCustomer = {
      id: req.user.id,
      phone: shipping_address.phone || userObj.phone || '9999999999',
      email: userObj.email || 'customer@example.com',
      name: shipping_address.full_name || userObj.name || 'Customer'
    };

    let paymentSessionId = '';
    try {
      const cfOrder = await createCashfreeOrder(orderNumber, total, cfCustomer);
      paymentSessionId = cfOrder.payment_session_id;
      if (!paymentSessionId) {
        return res.status(500).json({
          success: false,
          message: 'Cashfree did not return a valid payment session. Check API keys and CASHFREE_ENV.'
        });
      }
    } catch (cfErr) {
      console.error('Failed to create Cashfree order:', cfErr.message);
      return res.status(500).json({ success: false, message: `Failed to initialize Cashfree payment: ${cfErr.message}` });
    }

    // Insert order in DB
    const [orderResult] = await pool.query(`
      INSERT INTO orders (order_number, user_id, status, subtotal, shipping_charge, tax, discount, total, coupon_code, payment_method, payment_status, shipping_address, billing_address, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      orderNumber, req.user.id, 'pending', subtotal, shipping, 0, discount, total,
      coupon_code || null, 'cashfree', 'pending',
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

    // Note: We don't send confirmation email here since payment is pending. 
    // It will be sent inside /verify upon successful completion!

    res.status(201).json({
      success: true,
      message: 'Order initiated successfully!',
      payment_session_id: paymentSessionId,
      cashfree_mode: getCashfreeMode(),
      order: { id: orderId, order_number: orderNumber, total, status: 'pending', payment_method: 'cashfree' }
    });
  } catch (err) { next(err); }
});

// POST /api/orders/verify — verify online payment
router.post('/verify', auth, async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'Order ID is required.' });

    // Check if order exists in DB
    const [orders] = await pool.query('SELECT * FROM orders WHERE order_number=? AND user_id=?', [order_id, req.user.id]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });
    
    const order = orders[0];
    if (order.payment_status === 'paid') {
      return res.json({ success: true, message: 'Payment already verified.', status: 'paid' });
    }

    // Verify on Cashfree
    let cfOrder;
    try {
      cfOrder = await verifyCashfreePayment(order_id);
    } catch (cfErr) {
      console.error('Payment verification failed on Cashfree:', cfErr.message);
      return res.status(500).json({ success: false, message: `Failed to verify payment with gateway: ${cfErr.message}` });
    }

    if (cfOrder.order_status === 'PAID') {
      // Update DB
      await pool.query(
        'UPDATE orders SET payment_status=?, status=?, payment_id=? WHERE id=?',
        ['paid', 'processing', cfOrder.cf_order_id || null, order.id]
      );

      // Send confirmation email (non-blocking)
      try {
        const [userRows] = await pool.query('SELECT email, name FROM users WHERE id=?', [req.user.id]);
        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
        if (userRows.length) {
          const emailOrder = {
            order_number: order_id,
            total: order.total,
            payment_method: 'cashfree',
            status: 'processing',
            shipping_address: order.shipping_address,
            customer_name: userRows[0].name,
            customer_email: userRows[0].email,
            items
          };
          await sendOrderConfirmationEmail(userRows[0].email, userRows[0].name, {
            ...emailOrder
          });
          await sendNewOrderNotificationEmail(emailOrder);
        }
      } catch (e) {
        console.error('Email sending failed:', e.message);
      }

      return res.json({ success: true, message: 'Payment verified and order is being processed!', status: 'paid' });
    } else {
      // Update payment status to failed in DB
      await pool.query('UPDATE orders SET payment_status=? WHERE id=?', ['failed', order.id]);
      return res.json({ success: false, message: `Payment not completed. Status: ${cfOrder.order_status}`, status: cfOrder.order_status.toLowerCase() });
    }
  } catch (err) { next(err); }
});

// GET /api/orders/track — public order tracking lookup
router.get('/track', async (req, res, next) => {
  try {
    const { order_number, email } = req.query;
    if (!order_number) {
      return res.status(400).json({ success: false, message: 'Order number is required.' });
    }

    const [rows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method, o.total,
              o.tracking_number, o.courier, o.created_at, o.updated_at, u.email AS customer_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.order_number = ?`,
      [String(order_number).trim()]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = rows[0];
    if (email && order.customer_email.toLowerCase() !== String(email).trim().toLowerCase()) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({
      success: true,
      order: {
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total: order.total,
        tracking_number: order.tracking_number,
        courier: order.courier,
        created_at: order.created_at,
        updated_at: order.updated_at
      }
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
    
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const [items] = await pool.query(
        'SELECT oi.*, p.slug FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id IN (?)',
        [orderIds]
      );
      orders.forEach(order => {
        order.items = items.filter(item => item.order_id === order.id);
      });
    }

    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM orders WHERE user_id=?', [req.user.id]);
    res.json({ success: true, orders, total: countRows[0].total });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found.' });
    const [items] = await pool.query(
      'SELECT oi.*, p.slug FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id=?',
      [req.params.id]
    );
    res.json({ success: true, order: { ...rows[0], items } });
  } catch (err) { next(err); }
});

module.exports = router;
