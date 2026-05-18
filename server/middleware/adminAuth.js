const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Admin access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    if (!process.env.JWT_ADMIN_SECRET) {
      console.error('JWT_ADMIN_SECRET is not defined in .env');
      return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    if (!decoded.isAdmin) {
      console.warn('Token verified but isAdmin flag is missing');
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token.' });
  }
};

module.exports = adminAuth;
