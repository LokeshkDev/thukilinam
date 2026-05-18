const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');

function parseSettingValue(value) {
  if (value && typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}

// All routes require admin authentication
router.use(adminAuth);

// GET /api/admin/settings - Fetch all settings
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM cms_settings');
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = parseSettingValue(row.setting_value);
      return acc;
    }, {});
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/settings - Update multiple settings
router.put('/', async (req, res, next) => {
  try {
    const { settings } = req.body; // Expects { header: {...}, footer: {...} }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings data format.' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const [key, value] of Object.entries(settings)) {
        // Upsert logic
        await connection.query(
          'INSERT INTO cms_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, JSON.stringify(value), JSON.stringify(value)]
        );
      }
      await connection.commit();
      res.json({ success: true, message: 'CMS Settings updated successfully.' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
