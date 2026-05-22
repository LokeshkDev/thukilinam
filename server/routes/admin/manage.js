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

// REVIEWS
router.get('/reviews', adminAuth, async (req, res, next) => {
  try {
    const { approved } = req.query;
    let where = approved !== undefined ? `WHERE r.is_approved=${approved}` : '';
    const [reviews] = await pool.query(`
      SELECT r.*, p.name AS product_name, u.name AS user_name
      FROM reviews r JOIN products p ON r.product_id=p.id JOIN users u ON r.user_id=u.id
      ${where} ORDER BY r.created_at DESC
    `);
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
});

router.put('/reviews/:id/approve', adminAuth, async (req, res, next) => {
  try {
    await pool.query('UPDATE reviews SET is_approved=1 WHERE id=?', [req.params.id]);
    // Update product avg_rating and review_count
    const [rev] = await pool.query('SELECT product_id FROM reviews WHERE id=?', [req.params.id]);
    if (rev.length) {
      await pool.query(`
        UPDATE products p SET
          avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id=p.id AND is_approved=1),
          review_count = (SELECT COUNT(*) FROM reviews WHERE product_id=p.id AND is_approved=1)
        WHERE p.id=?
      `, [rev[0].product_id]);
    }
    res.json({ success: true, message: 'Review approved.' });
  } catch (err) { next(err); }
});

// Decline (reject) a review — sets is_approved=0, keeps it in DB as declined
router.put('/reviews/:id/decline', adminAuth, async (req, res, next) => {
  try {
    await pool.query('UPDATE reviews SET is_approved=0 WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Review declined.' });
  } catch (err) { next(err); }
});

router.delete('/reviews/:id', adminAuth, async (req, res, next) => {
  try {
    const [rev] = await pool.query('SELECT product_id FROM reviews WHERE id=?', [req.params.id]);
    await pool.query('DELETE FROM reviews WHERE id=?', [req.params.id]);
    // Recalculate product rating after deletion
    if (rev.length) {
      await pool.query(`
        UPDATE products p SET
          avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id=p.id AND is_approved=1),
          review_count = (SELECT COUNT(*) FROM reviews WHERE product_id=p.id AND is_approved=1)
        WHERE p.id=?
      `, [rev[0].product_id]);
    }
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
