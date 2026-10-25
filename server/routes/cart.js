const router = require('express').Router();
const pool = require('../database/connection');
const { getShippingSettings, calculateShipping } = require('../utils/shippingUtils');

// GET /api/cart - fallback shipping calculation helper
router.get('/', async (req, res, next) => {
  try {
    const shippingSettings = await getShippingSettings(pool);
    res.json({
      success: true,
      items: [],
      summary: { subtotal: 0, shipping: 0, total: 0, itemCount: 0 },
      shipping_settings: shippingSettings
    });
  } catch (err) { next(err); }
});

module.exports = router;
