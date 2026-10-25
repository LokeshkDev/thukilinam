const router = require('express').Router();
const pool = require('../database/connection');

// GET /api/reviews/can-review/:productId
router.get('/can-review/:productId', (req, res) => {
  res.json({ success: true, canReview: true });
});

// POST /api/reviews
router.post('/', async (req, res, next) => {
  try {
    const { product_id, rating, title, comment, customer_name, order_number } = req.body;
    const parsedProductId = parseInt(product_id, 10);
    if (!parsedProductId || isNaN(parsedProductId) || !rating) {
      return res.status(400).json({ success: false, message: 'product_id and rating required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    let orderId = null;
    if (order_number) {
      const [orders] = await pool.query('SELECT id FROM orders WHERE order_number=?', [order_number]);
      if (orders.length) orderId = orders[0].id;
    }

    await pool.query(
      'INSERT INTO reviews (product_id, user_id, customer_name, order_id, rating, title, comment, is_approved) VALUES (?, NULL, ?, ?, ?, ?, ?, 0)',
      [parsedProductId, customer_name || 'Customer', orderId, rating, title || null, comment || null]
    );

    res.status(201).json({ success: true, message: 'Review submitted! It will appear after admin approval.' });
  } catch (err) { next(err); }
});

// GET /api/reviews/:productId — public, approved reviews only
router.get('/:productId', async (req, res, next) => {
  try {
    const [reviews] = await pool.query(`
      SELECT r.id, r.rating, r.title, r.comment, r.created_at,
             COALESCE(r.customer_name, 'Verified Customer') AS user_name
      FROM reviews r
      WHERE r.product_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
    `, [req.params.productId]);

    // Compute rating breakdown
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });
    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ success: true, reviews, avgRating: parseFloat(avgRating), breakdown, total: reviews.length });
  } catch (err) { next(err); }
});

module.exports = router;
