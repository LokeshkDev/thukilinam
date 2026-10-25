const router = require('express').Router();
const pool = require('../database/connection');

// GET /api/products — public catalog with filters, search, pagination
router.get('/', async (req, res, next) => {
  try {
    const {
      category, brand, search, min_price, max_price,
      sort = 'newest', page = 1, limit = 12,
      featured, bestseller, new_arrival, color, size
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['p.is_active = 1'];
    let params = [];

    if (category) {
      where.push('(c.slug = ? OR c.id = ?)');
      params.push(category, category);
    }
    if (brand) {
      where.push('(b.slug = ? OR b.id = ?)');
      params.push(brand, brand);
    }
    if (search) {
      where.push('(p.name LIKE ? OR p.description LIKE ? OR p.short_description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (min_price) {
      where.push('(COALESCE(p.discount_price, p.price) >= ?)');
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      where.push('(COALESCE(p.discount_price, p.price) <= ?)');
      params.push(parseFloat(max_price));
    }
    if (featured === '1' || featured === 'true') where.push('p.is_featured = 1');
    if (bestseller === '1' || bestseller === 'true') where.push('p.is_bestseller = 1');
    if (new_arrival === '1' || new_arrival === 'true') where.push('p.is_new_arrival = 1');

    if (color || size) {
      let variantWhere = [];
      if (color) { variantWhere.push('pv.color = ?'); params.push(color); }
      if (size) { variantWhere.push('pv.size = ?'); params.push(size); }
      where.push(`p.id IN (SELECT pv.product_id FROM product_variants pv WHERE ${variantWhere.join(' AND ')})`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // Sort order
    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'COALESCE(p.discount_price, p.price) ASC';
    if (sort === 'price_desc') orderBy = 'COALESCE(p.discount_price, p.price) DESC';
    if (sort === 'rating') orderBy = 'p.avg_rating DESC';
    if (sort === 'popular') orderBy = 'p.review_count DESC';

    const [products] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.short_description, p.price, p.discount_price,
             p.stock, p.sku, p.is_featured, p.is_bestseller, p.is_new_arrival,
             p.badge, p.avg_rating, p.review_count, p.created_at,
             c.name AS category_name, c.slug AS category_slug,
             b.name AS brand_name, b.slug AS brand_slug,
             (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
    `, params);

    res.json({
      success: true,
      products,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) { next(err); }
});

// GET /api/products/colors — list unique colors
router.get('/colors', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT color FROM product_variants WHERE color IS NOT NULL');
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

    const [images] = await pool.query('SELECT * FROM product_images WHERE product_id=? ORDER BY is_primary DESC, sort_order ASC', [product.id]);
    const [variants] = await pool.query('SELECT * FROM product_variants WHERE product_id=?', [product.id]);
    const [specs] = await pool.query('SELECT * FROM product_specs WHERE product_id=?', [product.id]);

    // Related products
    const [related] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.badge,
             (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image
      FROM products p WHERE p.category_id=? AND p.id!=? AND p.is_active=1 LIMIT 4
    `, [product.category_id, product.id]);

    res.json({ success: true, product: { ...product, images, variants, specs }, related });
  } catch (err) { next(err); }
});

module.exports = router;
