const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { id: 1, name: 'Guest Customer' };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded || { id: 1, name: 'Guest Customer' };
    next();
  } catch (err) {
    req.user = { id: 1, name: 'Guest Customer' };
    next();
  }
};

module.exports = auth;
