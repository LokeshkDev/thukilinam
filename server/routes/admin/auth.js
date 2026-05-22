const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body } = require('express-validator');
const pool = require('../../database/connection');
const { signAdminToken } = require('../../utils/jwtUtils');
const { sendResetEmail } = require('../../utils/emailUtils');
const validate = require('../../middleware/validate');
const adminAuth = require('../../middleware/adminAuth');

let resetColumnsReady = false;

const createResetToken = () => {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
};

const ensureAdminResetColumns = async () => {
  if (resetColumnsReady) return;

  const [columns] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'admin_users'
       AND COLUMN_NAME IN ('reset_token', 'reset_token_expiry')`
  );
  const existing = new Set(columns.map(col => col.COLUMN_NAME));

  if (!existing.has('reset_token')) {
    await pool.query('ALTER TABLE admin_users ADD COLUMN reset_token VARCHAR(255) NULL');
  }
  if (!existing.has('reset_token_expiry')) {
    await pool.query('ALTER TABLE admin_users ADD COLUMN reset_token_expiry DATETIME NULL');
  }

  resetColumnsReady = true;
};

// POST /api/admin/auth/login
router.post('/login', [
  body('email').isEmail(), body('password').notEmpty(), validate
], async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE email=?', [email]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = signAdminToken({ id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role });
    res.json({ success: true, token, admin: { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role } });
  } catch (err) { next(err); }
});

// GET /api/admin/auth/me
router.get('/me', adminAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role FROM admin_users WHERE id=?', [req.admin.id]);
    if (!rows || rows.length === 0) {
      console.error(`Admin with ID ${req.admin.id} not found in database.`);
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    res.json({ success: true, admin: rows[0] });
  } catch (err) {
    console.error('Error in /api/admin/auth/me:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/admin/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required'),
  validate
], async (req, res, next) => {
  try {
    await ensureAdminResetColumns();

    const { email } = req.body;
    const [rows] = await pool.query('SELECT id, name, email FROM admin_users WHERE email=?', [email]);
    if (!rows.length) {
      return res.json({ success: true, message: 'If this admin email exists, a reset link has been sent.' });
    }

    const { token, tokenHash } = createResetToken();
    const expiry = new Date(Date.now() + 3600000);
    await pool.query('UPDATE admin_users SET reset_token=?, reset_token_expiry=? WHERE id=?', [tokenHash, expiry, rows[0].id]);

    const resetLink = `${process.env.ADMIN_URL || 'http://localhost:5174'}/reset-password?token=${encodeURIComponent(token)}`;
    await sendResetEmail(rows[0].email, rows[0].name, resetLink, { accountLabel: 'Thukilinam admin account' });

    res.json({ success: true, message: 'If this admin email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
});

// POST /api/admin/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate
], async (req, res, next) => {
  try {
    await ensureAdminResetColumns();

    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query(
      'SELECT id FROM admin_users WHERE reset_token=? AND reset_token_expiry > NOW()',
      [tokenHash]
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE admin_users SET password_hash=?, reset_token=NULL, reset_token_expiry=NULL WHERE id=?',
      [hash, rows[0].id]
    );

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
