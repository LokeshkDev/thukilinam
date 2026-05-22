const jwt = require('jsonwebtoken');
const pool = require('../database/connection');
require('dotenv').config();

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, avatar, is_blocked FROM users WHERE id=?',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Account no longer exists. Please login again.' });
    }

    if (rows[0].is_blocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = auth;
