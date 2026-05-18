const router = require('express').Router();
const pool = require('../database/connection');

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE is_active=1 ORDER BY sort_order ASC, name ASC'
    );
    res.json({ success: true, categories: rows });
  } catch (err) { next(err); }
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories WHERE slug=? AND is_active=1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, category: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
