const jwt = require('jsonwebtoken');
require('dotenv').config();

const signUserToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const signAdminToken = (payload) =>
  jwt.sign({ ...payload, isAdmin: true }, process.env.JWT_ADMIN_SECRET, { expiresIn: '1d' });

const verifyUserToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const verifyAdminToken = (token) => jwt.verify(token, process.env.JWT_ADMIN_SECRET);

module.exports = { signUserToken, signAdminToken, verifyUserToken, verifyAdminToken };
