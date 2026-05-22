const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail, sendNewUserNotificationEmail } = require('../../utils/emailUtils');

// GET /api/admin/users
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = []; let params = [];
    if (search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [users] = await pool.query(`
      SELECT id, name, email, phone, is_blocked, created_at,
             (SELECT COUNT(*) FROM orders WHERE user_id=users.id) AS order_count
      FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params);
    res.json({ success: true, users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// POST /api/admin/users
router.post('/', adminAuth, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone) VALUES (?,?,?,?)',
      [name, email, hash, phone || null]
    );
    try {
      await sendWelcomeEmail(email, name);
      await sendNewUserNotificationEmail({ id: result.insertId, name, email, phone });
    } catch (mailErr) {
      console.error('Customer creation email failed:', mailErr.message);
    }
    res.status(201).json({ success: true, message: 'Customer created successfully.', id: result.insertId });
  } catch (err) { next(err); }
});

// PUT /api/admin/users/:id
router.put('/:id', adminAuth, async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    let query = 'UPDATE users SET name=?, email=?, phone=?';
    let params = [name, email, phone || null];
    
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query += ', password_hash=?';
      params.push(hash);
    }
    
    query += ' WHERE id=?';
    params.push(req.params.id);
    
    await pool.query(query, params);
    res.json({ success: true, message: 'Customer updated successfully.' });
  } catch (err) { next(err); }
});

// PUT /api/admin/users/:id/block
router.put('/:id/block', adminAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT is_blocked FROM users WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    const newStatus = rows[0].is_blocked ? 0 : 1;
    await pool.query('UPDATE users SET is_blocked=? WHERE id=?', [newStatus, req.params.id]);
    res.json({ success: true, message: `User ${newStatus ? 'blocked' : 'unblocked'} successfully.`, is_blocked: newStatus });
  } catch (err) { next(err); }
});

// GET /api/admin/users/:id/orders
router.get('/:id/orders', adminAuth, async (req, res, next) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, orders });
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
