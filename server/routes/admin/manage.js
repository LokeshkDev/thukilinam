const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');
const upload = require('../../utils/uploadUtils');
const { getPublicUrl } = upload;

// UPLOAD ENDPOINT FOR CMS, CATEGORIES, BANNERS, ETC.
router.post('/upload', adminAuth, upload.any(), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const fileUrl = getPublicUrl(req.files[0]);
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    next(err);
  }
});

// COUPONS
router.get('/coupons', adminAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, coupons: rows });
  } catch (err) { next(err); }
});

router.post('/coupons', adminAuth, async (req, res, next) => {
  try {
    const { code, type, value, min_order_amount, max_discount, max_uses, expiry_date } = req.body;
    const [r] = await pool.query(
      'INSERT INTO coupons (code, type, value, min_order_amount, max_discount, max_uses, expiry_date) VALUES (?,?,?,?,?,?,?)',
      [code.toUpperCase(), type, value, min_order_amount || 0, max_discount || null, max_uses || 0, expiry_date || null]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (err) { next(err); }
});

router.put('/coupons/:id', adminAuth, async (req, res, next) => {
  try {
    const { code, type, value, min_order_amount, max_discount, max_uses, expiry_date, is_active } = req.body;
    await pool.query('UPDATE coupons SET code=?,type=?,value=?,min_order_amount=?,max_discount=?,max_uses=?,expiry_date=?,is_active=? WHERE id=?',
      [code.toUpperCase(), type, value, min_order_amount || 0, max_discount || null, max_uses || 0, expiry_date || null, is_active !== undefined ? is_active : 1, req.params.id]);
    res.json({ success: true, message: 'Coupon updated.' });
  } catch (err) { next(err); }
});

router.delete('/coupons/:id', adminAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) { next(err); }
});

// BANNERS
router.get('/banners', adminAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY sort_order ASC');
    res.json({ success: true, banners: rows });
  } catch (err) { next(err); }
});

router.post('/banners', adminAuth, async (req, res, next) => {
  try {
    const { title, subtitle, image_url, mobile_image_url, link, sort_order } = req.body;
    const [r] = await pool.query(
      'INSERT INTO banners (title, subtitle, image_url, mobile_image_url, link, sort_order) VALUES (?,?,?,?,?,?)',
      [title || null, subtitle || null, image_url, mobile_image_url || null, link || null, sort_order || 0]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (err) { next(err); }
});

router.put('/banners/:id', adminAuth, async (req, res, next) => {
  try {
    const { title, subtitle, image_url, mobile_image_url, link, sort_order, is_active } = req.body;
    await pool.query(
      'UPDATE banners SET title=?,subtitle=?,image_url=?,mobile_image_url=?,link=?,sort_order=?,is_active=? WHERE id=?',
      [title || null, subtitle || null, image_url, mobile_image_url || null, link || null, sort_order || 0, is_active !== undefined ? is_active : 1, req.params.id]
    );
    res.json({ success: true, message: 'Banner updated.' });
  } catch (err) { next(err); }
});

router.delete('/banners/:id', adminAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM banners WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
