const router = require('express').Router();
const pool = require('../database/connection');

// GET /api/brands
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM brands WHERE is_active=1 ORDER BY name ASC');
    res.json({ success: true, brands: rows });
  } catch (err) { next(err); }
});

module.exports = router;
