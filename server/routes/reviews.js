const router = require('express').Router();
const pool = require('../database/connection');
const auth = require('../middleware/auth');

// POST /api/reviews
router.post('/', auth, async (req, res, next) => {
  try {
    const { product_id, rating, title, comment } = req.body;
    if (!product_id || !rating) return res.status(400).json({ success: false, message: 'product_id and rating required.' });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

    await pool.query(
      'INSERT INTO reviews (product_id, user_id, rating, title, comment) VALUES (?,?,?,?,?)',
      [product_id, req.user.id, rating, title || null, comment || null]
    );
    res.status(201).json({ success: true, message: 'Review submitted! It will appear after approval.' });
  } catch (err) { next(err); }
});

// GET /api/reviews/:productId
router.get('/:productId', async (req, res, next) => {
  try {
    const [reviews] = await pool.query(`
      SELECT r.id, r.rating, r.title, r.comment, r.created_at, u.name AS user_name, u.avatar AS user_avatar
      FROM reviews r JOIN users u ON r.user_id=u.id
      WHERE r.product_id=? AND r.is_approved=1 ORDER BY r.created_at DESC
    `, [req.params.productId]);
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
});

module.exports = router;
