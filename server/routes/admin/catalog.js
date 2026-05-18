const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');

// CATEGORIES
router.get('/categories', adminAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
    res.json({ success: true, categories: rows });
  } catch (err) { next(err); }
});

router.post('/categories', adminAuth, async (req, res, next) => {
  try {
    const { name, slug, image, parent_id, sort_order } = req.body;
    const [r] = await pool.query('INSERT INTO categories (name, slug, image, parent_id, sort_order) VALUES (?,?,?,?,?)',
      [name, slug, image || null, parent_id || null, sort_order || 0]);
    res.status(201).json({ success: true, id: r.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A category with this name or slug already exists.' });
    }
    next(err);
  }
});

router.put('/categories/:id', adminAuth, async (req, res, next) => {
  try {
    const { name, slug, image, parent_id, sort_order, is_active } = req.body;
    await pool.query('UPDATE categories SET name=?,slug=?,image=?,parent_id=?,sort_order=?,is_active=? WHERE id=?',
      [name, slug, image || null, parent_id || null, sort_order || 0, is_active !== undefined ? is_active : 1, req.params.id]);
    res.json({ success: true, message: 'Category updated.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A category with this name or slug already exists.' });
    }
    next(err);
  }
});

router.delete('/categories/:id', adminAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) { next(err); }
});

// BRANDS
router.get('/brands', adminAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM brands ORDER BY name ASC');
    res.json({ success: true, brands: rows });
  } catch (err) { next(err); }
});

router.post('/brands', adminAuth, async (req, res, next) => {
  try {
    const { name, slug, logo } = req.body;
    const [r] = await pool.query('INSERT INTO brands (name, slug, logo) VALUES (?,?,?)', [name, slug, logo || null]);
    res.status(201).json({ success: true, id: r.insertId });
  } catch (err) { next(err); }
});

router.put('/brands/:id', adminAuth, async (req, res, next) => {
  try {
    const { name, slug, logo, is_active } = req.body;
    await pool.query('UPDATE brands SET name=?,slug=?,logo=?,is_active=? WHERE id=?',
      [name, slug, logo || null, is_active !== undefined ? is_active : 1, req.params.id]);
    res.json({ success: true, message: 'Brand updated.' });
  } catch (err) { next(err); }
});

router.delete('/brands/:id', adminAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM brands WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Brand deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
