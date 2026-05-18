const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const pool = require('../../database/connection');
const { signAdminToken } = require('../../utils/jwtUtils');
const validate = require('../../middleware/validate');
const adminAuth = require('../../middleware/adminAuth');

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

module.exports = router;
