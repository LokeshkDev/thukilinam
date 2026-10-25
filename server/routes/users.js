const router = require('express').Router();

router.get('/addresses', (req, res) => {
  res.json({ success: true, addresses: [] });
});

router.post('/addresses', (req, res) => {
  res.json({ success: true, message: 'Address received.' });
});

router.get('/profile', (req, res) => {
  res.status(404).json({ success: false, message: 'User profiles are disabled.' });
});

module.exports = router;
