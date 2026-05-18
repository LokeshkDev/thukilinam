const router = require('express').Router();
const pool = require('../database/connection');

// GET /api/banners
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners WHERE is_active=1 ORDER BY sort_order ASC');
    res.json({ success: true, banners: rows });
  } catch (err) { next(err); }
});

module.exports = router;
