require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const normalizeOrigin = (origin) => origin && origin.replace(/\/$/, '');

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000'
];

const envOrigins = [
  ...(process.env.CLIENT_URL || '').split(','),
  ...(process.env.ADMIN_URL || '').split(','),
  ...(process.env.PUBLIC_CLIENT_URL || '').split(','),
  ...(process.env.PUBLIC_ADMIN_URL || '').split(',')
];

const allowedOrigins = Array.from(
  new Set(
    [...defaultDevOrigins, ...envOrigins]
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter(Boolean)
  )
);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // allow non-browser requests (Postman, curl, server-to-server)
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) return true;
  // Automatically allow apex and all subdomains of thukilinam.com
  if (/^https?:\/\/([a-z0-9-]+\.)*thukilinam\.com$/i.test(normalized)) {
    return true;
  }
  return false;
};

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Disallowed origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-recaptcha-token']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting & Abuse Prevention ─────────────────────────────────────────
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many admin login attempts from this IP. Please try again after 15 minutes.' }
});

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 order requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many order requests submitted. Please wait a moment and try again.' }
});

app.use('/api/admin/auth/login', adminAuthLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: 'Too many requests, please try again later.' } }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300 }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Public Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/settings', require('./routes/settings'));

// ─── Admin Routes ─────────────────────────────────────────────────────────────
app.use('/api/admin/auth', require('./routes/admin/auth'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));
app.use('/api/admin/products', require('./routes/admin/products'));
app.use('/api/admin/orders', require('./routes/admin/orders'));
app.use('/api/admin', require('./routes/admin/catalog'));
app.use('/api/admin', require('./routes/admin/manage'));
app.use('/api/admin/settings', require('./routes/admin/settings'));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Thukilinam API is running 🚀', time: new Date().toISOString() }));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` }));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Thukilinam Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`🗄️ Database Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
