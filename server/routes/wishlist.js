const router = require('express').Router();

// GET /api/wishlist — client uses localStorage; safe stub for backward compatibility
router.get('/', (req, res) => {
  res.json({ success: true, items: [] });
});

// POST /api/wishlist
router.post('/', (req, res) => {
  res.json({ success: true, message: 'Added to wishlist.' });
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', (req, res) => {
  res.json({ success: true, message: 'Removed from wishlist.' });
});

// POST /api/wishlist/:productId/move-to-cart
router.post('/:productId/move-to-cart', (req, res) => {
  res.json({ success: true, message: 'Moved to cart.' });
});

module.exports = router;
