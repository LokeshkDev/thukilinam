const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body } = require('express-validator');
const pool = require('../database/connection');
const { signUserToken } = require('../utils/jwtUtils');
const { sendResetEmail, sendWelcomeEmail, sendNewUserNotificationEmail } = require('../utils/emailUtils');
const { getClientUrl } = require('../utils/urlUtils');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

const createResetToken = () => {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
};

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone) VALUES (?,?,?,?)',
      [name, email, hash, phone || null]
    );
    const token = signUserToken({ id: result.insertId, name, email });
    try {
      await sendWelcomeEmail(email, name);
      await sendNewUserNotificationEmail({ id: result.insertId, name, email, phone });
    } catch (mailErr) {
      console.error('Registration email failed:', mailErr.message);
    }
    res.status(201).json({ success: true, message: 'Registration successful!', token, user: { id: result.insertId, name, email, phone } });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    const user = rows[0];
    if (user.is_blocked) return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = signUserToken({ id: user.id, name: user.name, email: user.email });
    res.json({ success: true, message: 'Login successful!', token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, avatar, created_at FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required'), validate
], async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length) return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });

    const { token, tokenHash } = createResetToken();
    const expiry = new Date(Date.now() + 3600000); // 1 hour
    await pool.query('UPDATE users SET reset_token=?, reset_token_expiry=? WHERE id=?', [tokenHash, expiry, rows[0].id]);

    const resetLink = `${getClientUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    sendResetEmail(email, rows[0].name, resetLink, { accountLabel: 'Thukilinam customer account' })
      .catch(mailErr => console.error('Customer reset email failed:', mailErr.message));
    res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE reset_token=? AND reset_token_expiry > NOW()', [tokenHash]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash=?, reset_token=NULL, reset_token_expiry=NULL WHERE id=?', [hash, rows[0].id]);
    res.json({ success: true, message: 'Password reset successfully!' });
  } catch (err) { next(err); }
});

module.exports = router;
