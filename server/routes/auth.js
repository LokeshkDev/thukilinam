const router = require('express').Router();

router.get('/me', (req, res) => {
  res.json({ success: false, user: null });
});

router.post('/login', (req, res) => {
  res.status(400).json({ success: false, message: 'Customer login is disabled. You can checkout directly.' });
});

router.post('/register', (req, res) => {
  res.status(400).json({ success: false, message: 'Registration is disabled. You can checkout directly.' });
});

router.post('/forgot-password', (req, res) => {
  res.status(400).json({ success: false, message: 'Password reset is disabled.' });
});

router.post('/reset-password', (req, res) => {
  res.status(400).json({ success: false, message: 'Password reset is disabled.' });
});

module.exports = router;
