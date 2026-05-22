const router = require('express').Router();
const pool = require('../database/connection');
const auth = require('../middleware/auth');

// GET /api/reviews/can-review/:productId
// Returns whether the authenticated user can review this product
router.get('/can-review/:productId', auth, async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const userId = req.user.id;

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    // Check if user already reviewed this product
    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE user_id=? AND product_id=?',
      [userId, productId]
    );
    if (existing.length) {
      return res.json({ success: true, canReview: false, reason: 'already_reviewed', reviewId: existing[0].id });
    }

    // Step 1: Find ALL orders for this user
    const [userOrders] = await pool.query(
      'SELECT id, status FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    if (!userOrders.length) {
      return res.json({ success: true, canReview: false, reason: 'not_purchased' });
    }

    // Step 2: Check if any order contains this product
    const orderIds = userOrders.map(o => o.id);
    const [matchingItems] = await pool.query(
      `SELECT oi.order_id, oi.product_id, o.status
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.order_id IN (?) AND oi.product_id = ?`,
      [orderIds, productId]
    );

    if (!matchingItems.length) {
      // Also check by product name as fallback (in case product_id was SET NULL and product recreated)
      const [product] = await pool.query('SELECT name FROM products WHERE id = ?', [productId]);
      if (product.length) {
        const [nameMatch] = await pool.query(
          `SELECT oi.order_id, oi.product_id, oi.product_name, o.status
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE oi.order_id IN (?) AND oi.product_name = ?`,
          [orderIds, product[0].name]
        );
        if (nameMatch.length) {
          const deliveredNameMatch = nameMatch.find(i => i.status === 'delivered');
          if (deliveredNameMatch) {
            return res.json({ success: true, canReview: true, orderId: deliveredNameMatch.order_id });
          }
          return res.json({ success: true, canReview: false, reason: 'not_delivered', orderStatus: nameMatch[0].status });
        }
      }
      return res.json({ success: true, canReview: false, reason: 'not_purchased' });
    }

    // Step 3: Check if any matching order is delivered
    const deliveredMatch = matchingItems.find(i => i.status === 'delivered');
    if (deliveredMatch) {
      return res.json({ success: true, canReview: true, orderId: deliveredMatch.order_id });
    }

    // User bought it but order isn't delivered yet
    return res.json({ success: true, canReview: false, reason: 'not_delivered', orderStatus: matchingItems[0].status });
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/my/:productId
// Returns the current user's review for a product (if any)
router.get('/my/:productId', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reviews WHERE user_id=? AND product_id=?',
      [req.user.id, req.params.productId]
    );
    res.json({ success: true, review: rows[0] || null });
  } catch (err) { next(err); }
});

// POST /api/reviews
router.post('/', auth, async (req, res, next) => {
  try {
    const { product_id, rating, title, comment } = req.body;
    const parsedProductId = parseInt(product_id, 10);
    if (!parsedProductId || isNaN(parsedProductId) || !rating) {
      return res.status(400).json({ success: false, message: 'product_id and rating required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const userId = req.user.id;

    // Duplicate review check
    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE user_id=? AND product_id=?',
      [userId, parsedProductId]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'You have already submitted a review for this product.' });
    }

    // Purchase verification — find a delivered order containing this product
    const [userOrders] = await pool.query(
      'SELECT id FROM orders WHERE user_id = ?', [userId]
    );
    if (!userOrders.length) {
      return res.status(403).json({ success: false, message: 'Only customers with a delivered order for this product can write a review.' });
    }
    const orderIds = userOrders.map(o => o.id);
    const [matchingItems] = await pool.query(
      `SELECT oi.order_id, o.status
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.order_id IN (?) AND oi.product_id = ? AND o.status = 'delivered'
       LIMIT 1`,
      [orderIds, parsedProductId]
    );

    if (!matchingItems.length) {
      return res.status(403).json({
        success: false,
        message: 'Only customers with a delivered order for this product can write a review.'
      });
    }

    await pool.query(
      'INSERT INTO reviews (product_id, user_id, order_id, rating, title, comment, is_approved) VALUES (?,?,?,?,?,?,0)',
      [parsedProductId, userId, matchingItems[0].order_id, rating, title || null, comment || null]
    );

    res.status(201).json({ success: true, message: 'Review submitted! It will appear after admin approval.' });
  } catch (err) { next(err); }
});

// GET /api/reviews/:productId — public, approved reviews only
router.get('/:productId', async (req, res, next) => {
  try {
    const [reviews] = await pool.query(`
      SELECT r.id, r.rating, r.title, r.comment, r.created_at,
             u.name AS user_name, u.avatar AS user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
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
