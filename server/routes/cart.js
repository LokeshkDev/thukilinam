const router = require('express').Router();
const pool = require('../database/connection');
const auth = require('../middleware/auth');
const { getShippingSettings, calculateShipping } = require('../utils/shippingUtils');

// Helper: get or create cart for user
async function getOrCreateCart(userId) {
  let [carts] = await pool.query('SELECT id FROM cart WHERE user_id=?', [userId]);
  if (!carts.length) {
    const [result] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
    return result.insertId;
  }
  return carts[0].id;
}

// GET /api/cart
router.get('/', auth, async (req, res, next) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const [items] = await pool.query(`
      SELECT ci.id, ci.quantity, ci.product_id, ci.variant_id,
             p.name, p.slug, p.price, p.discount_price, p.stock,
             pv.attributes, pv.price AS variant_price, pv.sale_price AS variant_sale_price,
             COALESCE(pv.image_url, (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1)) AS image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.cart_id=?
    `, [cartId]);

    const subtotal = items.reduce((sum, i) => {
      const price = i.variant_sale_price || i.variant_price || i.discount_price || i.price;
      return sum + price * i.quantity;
    }, 0);
    const shippingSettings = await getShippingSettings(pool);
    const shipping = calculateShipping(subtotal, shippingSettings);
    const total = subtotal + shipping;

    res.json({
      success: true,
      items,
      summary: { subtotal, shipping, total, itemCount: items.length },
      shipping_settings: shippingSettings
    });
  } catch (err) { next(err); }
});

// POST /api/cart — add item
router.post('/', auth, async (req, res, next) => {
  try {
    const { product_id, variant_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required.' });

    const cartId = await getOrCreateCart(req.user.id);

    // Check if already in cart
    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id=? AND product_id=? AND (variant_id=? OR (variant_id IS NULL AND ? IS NULL))',
      [cartId, product_id, variant_id || null, variant_id || null]
    );

    if (existing.length) {
      await pool.query('UPDATE cart_items SET quantity=quantity+? WHERE id=?', [quantity, existing[0].id]);
    } else {
      await pool.query('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?,?,?,?)',
        [cartId, product_id, variant_id || null, quantity]);
    }

    res.json({ success: true, message: 'Item added to cart.' });
  } catch (err) { next(err); }
});

// PUT /api/cart/:itemId — update quantity
router.put('/:itemId', auth, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    const cartId = await getOrCreateCart(req.user.id);
    await pool.query('UPDATE cart_items SET quantity=? WHERE id=? AND cart_id=?', [quantity, req.params.itemId, cartId]);
    res.json({ success: true, message: 'Quantity updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', auth, async (req, res, next) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await pool.query('DELETE FROM cart_items WHERE id=? AND cart_id=?', [req.params.itemId, cartId]);
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) { next(err); }
});

// DELETE /api/cart — clear cart
router.delete('/', auth, async (req, res, next) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await pool.query('DELETE FROM cart_items WHERE cart_id=?', [cartId]);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) { next(err); }
});

module.exports = router;
