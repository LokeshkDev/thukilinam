const router = require('express').Router();
const pool = require('../database/connection');
const auth = require('../middleware/auth');

// GET /api/wishlist
router.get('/', auth, async (req, res, next) => {
  try {
    const [items] = await pool.query(`
      SELECT w.id, w.product_id, w.added_at, p.name, p.slug, p.price, p.discount_price,
             (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS image
      FROM wishlist w JOIN products p ON w.product_id=p.id
      WHERE w.user_id=? ORDER BY w.added_at DESC
    `, [req.user.id]);
    res.json({ success: true, items });
  } catch (err) { next(err); }
});

// POST /api/wishlist
router.post('/', auth, async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required.' });
    await pool.query('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?,?)', [req.user.id, product_id]);
    res.json({ success: true, message: 'Added to wishlist.' });
  } catch (err) { next(err); }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', auth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM wishlist WHERE user_id=? AND product_id=?', [req.user.id, req.params.productId]);
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) { next(err); }
});

// POST /api/wishlist/:productId/move-to-cart
router.post('/:productId/move-to-cart', auth, async (req, res, next) => {
  try {
    // Get or create cart
    let [carts] = await pool.query('SELECT id FROM cart WHERE user_id=?', [req.user.id]);
    let cartId;
    if (!carts.length) {
      const [r] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [req.user.id]);
      cartId = r.insertId;
    } else { cartId = carts[0].id; }

    const [existing] = await pool.query('SELECT id FROM cart_items WHERE cart_id=? AND product_id=?', [cartId, req.params.productId]);
    if (!existing.length) {
      await pool.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?,?,1)', [cartId, req.params.productId]);
    }
    await pool.query('DELETE FROM wishlist WHERE user_id=? AND product_id=?', [req.user.id, req.params.productId]);
    res.json({ success: true, message: 'Moved to cart.' });
  } catch (err) { next(err); }
});

module.exports = router;
