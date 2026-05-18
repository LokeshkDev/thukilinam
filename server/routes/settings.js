const router = require('express').Router();
const pool = require('../database/connection');

function parseSettingValue(value) {
  if (value && typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}

// GET /api/settings - Fetch all public CMS settings
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM cms_settings');
    
    // Convert array of key-value rows to a single object
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = parseSettingValue(row.setting_value);
      return acc;
    }, {});

    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
