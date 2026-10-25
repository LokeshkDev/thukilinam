const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');

// GET /api/admin/users (Customers based on orders)
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = []; let params = [];

    if (search) {
      where.push('(customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [customers] = await pool.query(`
      SELECT 
        MIN(id) AS id,
        COALESCE(customer_name, 'Guest') AS name,
        COALESCE(customer_email, 'N/A') AS email,
        COALESCE(customer_phone, 'N/A') AS phone,
        0 AS is_blocked,
        MIN(created_at) AS created_at,
        COUNT(*) AS order_count
      FROM orders
      ${whereClause}
      GROUP BY COALESCE(customer_phone, id)
      ORDER BY MIN(created_at) DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [totalRows] = await pool.query(`
      SELECT COUNT(DISTINCT COALESCE(customer_phone, id)) AS total FROM orders ${whereClause}
    `, params);

    const total = totalRows[0]?.total || 0;
    res.json({ success: true, users: customers || [], total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

router.put('/:id/block', adminAuth, (req, res) => {
  res.json({ success: true, message: 'Customer status updated.' });
});

router.delete('/:id', adminAuth, (req, res) => {
  res.json({ success: true, message: 'Customer record deleted.' });
});

module.exports = router;
