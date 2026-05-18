const router = require('express').Router();
const pool = require('../database/connection');

// GET /api/products  — with filters, sorting, pagination
router.get('/', async (req, res, next) => {
  try {
    const {
      category, brand, min_price, max_price, sort = 'id',
      order = 'DESC', page = 1, limit = 12,
      featured, bestseller, new_arrival, search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['p.is_active = 1'];
    let params = [];

    if (category) {
      const categories = category.split(',');
      where.push(`c.slug IN (${categories.map(() => '?').join(',')})`);
      params.push(...categories);
    }
    if (brand) { where.push('b.slug = ?'); params.push(brand); }
    if (min_price) { where.push('COALESCE(p.discount_price, p.price) >= ?'); params.push(min_price); }
    if (max_price) { where.push('COALESCE(p.discount_price, p.price) <= ?'); params.push(max_price); }
    if (featured === '1') { where.push('p.is_featured = 1'); }
    if (bestseller === '1') { where.push('p.is_bestseller = 1'); }
    if (new_arrival === '1') { where.push('p.is_new_arrival = 1'); }
    if (search) { where.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sortMap = {
      price_asc: 'COALESCE(p.discount_price, p.price) ASC',
      price_desc: 'COALESCE(p.discount_price, p.price) DESC',
      newest: 'p.created_at DESC',
      popular: 'p.avg_rating DESC',
      name: 'p.name ASC'
    };
    const sortClause = sortMap[sort] || 'p.id DESC';

    const baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
    `;

    const [countRows] = await pool.query(`SELECT COUNT(DISTINCT p.id) AS total ${baseQuery}`, params);
    const total = countRows[0].total;

    const [products] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.stock,
             p.badge, p.avg_rating, p.review_count, p.is_featured, p.is_bestseller, p.is_new_arrival,
             c.name AS category_name, c.slug AS category_slug,
             b.name AS brand_name,
             (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image,
             (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=0 LIMIT 1) AS hover_image
      ${baseQuery}
      ORDER BY ${sortClause}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      products,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
});

// GET /api/products/colors
router.get('/colors', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(attributes, "$.Color")) AS color FROM product_variants WHERE attributes IS NOT NULL');
    const colors = rows.map(r => r.color).filter(Boolean);
    res.json({ success: true, colors });
  } catch (err) { next(err); }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug, b.name AS brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.slug=? AND p.is_active=1
    `, [req.params.slug]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found.' });
    const product = rows[0];

    const [images] = await pool.query('SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order', [product.id]);
    const [variants] = await pool.query('SELECT * FROM product_variants WHERE product_id=?', [product.id]);
    const [specs] = await pool.query('SELECT * FROM product_specs WHERE product_id=?', [product.id]);
    const [reviews] = await pool.query(`
      SELECT r.*, u.name AS user_name, u.avatar AS user_avatar
      FROM reviews r JOIN users u ON r.user_id=u.id
      WHERE r.product_id=? AND r.is_approved=1 ORDER BY r.created_at DESC LIMIT 10
    `, [product.id]);

    // Related products
    const [related] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.badge, p.avg_rating,
             (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image
      FROM products p WHERE p.category_id=? AND p.id!=? AND p.is_active=1 LIMIT 4
    `, [product.category_id, product.id]);

    res.json({ success: true, product: { ...product, images, variants, specs, reviews }, related });
  } catch (err) { next(err); }
});

module.exports = router;
