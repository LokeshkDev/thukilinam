const router = require('express').Router();
const pool = require('../database/connection');
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const bcrypt = require('bcryptjs');

// GET /api/users/profile
router.get('/profile', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, avatar, created_at FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
});

// PUT /api/users/profile
router.put('/profile', auth, [
  body('name').trim().notEmpty().withMessage('Name required'),
  validate
], async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    await pool.query('UPDATE users SET name=?, phone=? WHERE id=?', [name, phone || null, req.user.id]);
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) { next(err); }
});

// PUT /api/users/change-password
router.put('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validate
], async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash=? WHERE id=?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

// GET /api/users/addresses
router.get('/addresses', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC', [req.user.id]);
    res.json({ success: true, addresses: rows });
  } catch (err) { next(err); }
});

// POST /api/users/addresses
router.post('/addresses', auth, [
  body('full_name').notEmpty(), body('phone').notEmpty(),
  body('line1').notEmpty(), body('city').notEmpty(),
  body('state').notEmpty(), body('pincode').notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const { type, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
    if (is_default) await pool.query('UPDATE addresses SET is_default=0 WHERE user_id=?', [req.user.id]);
    const [result] = await pool.query(
      'INSERT INTO addresses (user_id, type, full_name, phone, line1, line2, city, state, pincode, country, is_default) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [req.user.id, type || 'home', full_name, phone, line1, line2 || null, city, state, pincode, country || 'India', is_default ? 1 : 0]
    );
    res.status(201).json({ success: true, message: 'Address added.', id: result.insertId });
  } catch (err) { next(err); }
});

// PUT /api/users/addresses/:id
router.put('/addresses/:id', auth, async (req, res, next) => {
  try {
    const { type, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
    if (is_default) await pool.query('UPDATE addresses SET is_default=0 WHERE user_id=?', [req.user.id]);
    await pool.query(
      'UPDATE addresses SET type=?, full_name=?, phone=?, line1=?, line2=?, city=?, state=?, pincode=?, country=?, is_default=? WHERE id=? AND user_id=?',
      [type, full_name, phone, line1, line2 || null, city, state, pincode, country || 'India', is_default ? 1 : 0, req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Address updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/users/addresses/:id
router.delete('/addresses/:id', auth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Address removed.' });
  } catch (err) { next(err); }
});

module.exports = router;
