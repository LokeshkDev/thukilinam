const router = require('express').Router();
const pool = require('../database/connection');
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
const requireRecaptcha = require('../middleware/requireRecaptcha');
const { sanitizeString, sanitizeObject, sanitizePhone, sanitizeEmail } = require('../utils/sanitizeUtils');

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
        customer_email: customer.email || 'customer@thukilinam.com',
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

// POST /api/orders — place order (Protected by reCAPTCHA & Sanitization)
router.post('/', requireRecaptcha, async (req, res, next) => {
  try {
    const {
      items: rawItems,
      shipping_address: rawShippingAddress,
      billing_address: rawBillingAddress,
      payment_method = 'cashfree',
      coupon_code: rawCouponCode,
      notes: rawNotes,
      customer_name: rawCustomerName,
      customer_phone: rawCustomerPhone,
      customer_email: rawCustomerEmail
    } = req.body;

    if (!rawShippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required.' });
    }

    // Sanitize objects and strings
    const shipping_address = sanitizeObject(rawShippingAddress);
    const billing_address = rawBillingAddress ? sanitizeObject(rawBillingAddress) : null;
    const coupon_code = rawCouponCode ? sanitizeString(rawCouponCode, 50).toUpperCase() : null;
    const notes = rawNotes ? sanitizeString(rawNotes, 500) : null;

    // Phone number is strictly mandatory
    const rawPhone = shipping_address.phone || rawCustomerPhone || '';
    const phone = sanitizePhone(rawPhone);
    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is mandatory.' });
    }

    // Full name is mandatory
    const rawFullName = shipping_address.full_name || rawCustomerName || '';
    const fullName = sanitizeString(rawFullName, 100);
    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Customer full name is required.' });
    }

    // Email is optional but sanitized
    const rawEmail = shipping_address.email || rawCustomerEmail || '';
    const email = rawEmail ? sanitizeEmail(rawEmail) : null;

    if (!shipping_address.line1 || !shipping_address.city || !shipping_address.state || !shipping_address.pincode) {
      return res.status(400).json({ success: false, message: 'Complete delivery address (Line 1, City, State, Pincode) is required.' });
    }

    if (payment_method !== 'cashfree') {
      return res.status(400).json({ success: false, message: 'Only online payment via Cashfree is supported.' });
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
    }

    // Prepare and verify items from DB
    const validatedItems = [];
    let subtotal = 0;

    for (const item of rawItems) {
      const productId = item.product_id || item.id;
      const quantity = Math.max(1, parseInt(item.quantity) || 1);

      const [pRows] = await pool.query('SELECT * FROM products WHERE id=? AND is_active=1', [productId]);
      if (!pRows.length) {
        return res.status(400).json({ success: false, message: `Product not available (ID: ${productId}).` });
      }
      const prod = pRows[0];

      let price = parseFloat(prod.discount_price || prod.price);
      let variantAttrs = item.attributes || null;
      let variantSize = item.size || null;
      let variantColor = item.color || null;

      if (item.variant_id) {
        const [vRows] = await pool.query('SELECT * FROM product_variants WHERE id=? AND product_id=?', [item.variant_id, productId]);
        if (vRows.length) {
          const v = vRows[0];
          if (v.sale_price || v.price) {
            price = parseFloat(v.sale_price || v.price);
          }
          if (v.attributes) variantAttrs = v.attributes;
          if (v.size) variantSize = v.size;
          if (v.color) variantColor = v.color;
        }
      }

      // Fallback image from DB if not provided
      let itemImage = item.image || null;
      if (!itemImage) {
        const [imgRows] = await pool.query('SELECT image_url FROM product_images WHERE product_id=? AND is_primary=1 LIMIT 1', [productId]);
        if (imgRows.length) itemImage = imgRows[0].image_url;
      }

      subtotal += price * quantity;
      validatedItems.push({
        product_id: prod.id,
        name: prod.name,
        price,
        quantity,
        image: itemImage,
        size: variantSize,
        color: variantColor,
        attributes: variantAttrs
      });
    }

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

    // Create Cashfree session
    const cfCustomer = {
      id: `cust_${phone}`,
      phone: phone,
      email: email || 'customer@thukilinam.com',
      name: fullName
    };

    let paymentSessionId = '';
    try {
      const cfOrder = await createCashfreeOrder(orderNumber, total, cfCustomer);
      paymentSessionId = cfOrder.payment_session_id;
      if (!paymentSessionId) {
        return res.status(500).json({
          success: false,
          message: 'Cashfree did not return a valid payment session. Check API credentials.'
        });
      }
    } catch (cfErr) {
      console.error('Failed to create Cashfree order:', cfErr.message);
      return res.status(500).json({ success: false, message: `Failed to initialize Cashfree payment: ${cfErr.message}` });
    }

    const finalShippingAddress = {
      ...shipping_address,
      full_name: fullName,
      phone: phone,
      email: email
    };

    // Insert order in DB without user_id
    const [orderResult] = await pool.query(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_phone, customer_email,
        status, subtotal, shipping_charge, tax, discount, total,
        coupon_code, payment_method, payment_status, shipping_address, billing_address, notes
      ) VALUES (?, NULL, ?, ?, ?, 'pending', ?, ?, 0, ?, ?, ?, 'cashfree', 'pending', ?, ?, ?)
    `, [
      orderNumber,
      fullName,
      phone,
      email,
      subtotal,
      shipping,
      discount,
      total,
      coupon_code || null,
      JSON.stringify(finalShippingAddress),
      JSON.stringify(billing_address || finalShippingAddress),
      notes || null
    ]);

    const orderId = orderResult.insertId;

    // Insert order items + update stock
    for (const item of validatedItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, variant_size, variant_color, attributes)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          orderId,
          item.product_id,
          item.name,
          item.image,
          item.price,
          item.quantity,
          item.size || null,
          item.color || null,
          typeof item.attributes === 'object' ? JSON.stringify(item.attributes) : item.attributes || null
        ]
      );
      await pool.query('UPDATE products SET stock=GREATEST(0, stock-?) WHERE id=?', [item.quantity, item.product_id]);
    }

    res.status(201).json({
      success: true,
      message: 'Order initiated successfully!',
      payment_session_id: paymentSessionId,
      cashfree_mode: getCashfreeMode(),
      order: {
        id: orderId,
        order_number: orderNumber,
        total,
        status: 'pending',
        payment_method: 'cashfree'
      }
    });
  } catch (err) { next(err); }
});

// POST /api/orders/verify — verify online payment (No login required)
router.post('/verify', async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'Order ID is required.' });

    // Check if order exists in DB
    const [orders] = await pool.query('SELECT * FROM orders WHERE order_number=?', [order_id]);
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

      // Parse address if string
      const shippingAddress = typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address || '{}')
        : (order.shipping_address || {});

      const customerName = order.customer_name || shippingAddress.full_name || 'Customer';
      const customerEmail = order.customer_email || shippingAddress.email;

      // Send emails (non-blocking)
      try {
        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
        const emailOrder = {
          order_number: order_id,
          total: order.total,
          payment_method: 'cashfree',
          status: 'processing',
          shipping_address: shippingAddress,
          customer_name: customerName,
          customer_email: customerEmail || 'N/A',
          items
        };

        if (customerEmail) {
          await sendOrderConfirmationEmail(customerEmail, customerName, emailOrder);
        }
        await sendNewOrderNotificationEmail(emailOrder);
      } catch (e) {
        console.error('Email sending error (ignored):', e.message);
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
    const { order_number, email, phone } = req.query;
    if (!order_number) {
      return res.status(400).json({ success: false, message: 'Order number is required.' });
    }

    const [rows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method, o.total,
              o.tracking_number, o.courier, o.created_at, o.updated_at,
              o.customer_name, o.customer_phone, o.customer_email, o.shipping_address
       FROM orders o
       WHERE o.order_number = ?`,
      [String(order_number).trim()]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = rows[0];

    // Optional verification if email was passed
    if (email && order.customer_email && order.customer_email.toLowerCase() !== String(email).trim().toLowerCase()) {
      return res.status(404).json({ success: false, message: 'Order not found with provided email.' });
    }

    // Optional verification if phone was passed
    if (phone) {
      const cleanPhone = String(phone).replace(/[^0-9]/g, '').slice(-10);
      const cleanOrderPhone = String(order.customer_phone || '').replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone && cleanOrderPhone && cleanPhone !== cleanOrderPhone) {
        return res.status(404).json({ success: false, message: 'Order not found with provided phone number.' });
      }
    }

    // Get order items
    const [items] = await pool.query(
      'SELECT product_name, product_image, price, quantity, variant_size, variant_color FROM order_items WHERE order_id=?',
      [order.id]
    );

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
        updated_at: order.updated_at,
        items
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
