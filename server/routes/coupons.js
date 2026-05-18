const router = require('express').Router();
const pool = require('../database/connection');
const auth = require('../middleware/auth');

// POST /api/coupons/apply
router.post('/apply', auth, async (req, res, next) => {
  try {
    const { code, subtotal: rawSubtotal } = req.body;
    const subtotal = Number(rawSubtotal) || 0;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required.' });

    const [rows] = await pool.query(
      `SELECT * FROM coupons WHERE code=? AND is_active=1 AND (expiry_date IS NULL OR expiry_date >= CURDATE())`, [code.toUpperCase()]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });

    const coupon = rows[0];
    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
    }
    if (subtotal < Number(coupon.min_order_amount || 0)) {
      return res.status(400).json({ success: false, message: `Minimum order amount for this coupon is ₹${coupon.min_order_amount}.` });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * Number(coupon.value)) / 100;
    } else if (coupon.type === 'fixed') {
      discount = Number(coupon.value);
    }
    // free_shipping type: discount stays 0, flag is set below

    if (coupon.max_discount && discount > Number(coupon.max_discount)) {
      discount = Number(coupon.max_discount);
    }

    res.json({
      success: true,
      message: coupon.type === 'free_shipping' ? 'Free shipping applied!' : 'Coupon applied successfully!',
      coupon: { 
        code: coupon.code, 
        type: coupon.type, 
        value: Number(coupon.value) || 0, 
        discount: parseFloat(Number(discount).toFixed(2)),
        is_free_shipping: coupon.type === 'free_shipping'
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
