const router = require('express').Router();
const pool = require('../../database/connection');
const adminAuth = require('../../middleware/adminAuth');
const upload = require('../../utils/uploadUtils');
const path = require('path');

// GET /api/admin/products
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = []; let params = [];
    if (search) { where.push('(p.name LIKE ? OR p.sku LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (category) { where.push('p.category_id=?'); params.push(category); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [products] = await pool.query(`
      SELECT p.*, c.name AS category_name, b.name AS brand_name,
             (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id=c.id
      LEFT JOIN brands b ON p.brand_id=b.id
      ${whereClause} ORDER BY p.id DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${whereClause}`, params);
    res.json({ success: true, products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// GET /api/admin/products/:id/variants
router.get('/:id/variants', adminAuth, async (req, res, next) => {
  try {
    const [variants] = await pool.query('SELECT * FROM product_variants WHERE product_id=?', [req.params.id]);
    res.json({ success: true, variants });
  } catch (err) { next(err); }
});

// POST /api/admin/products
router.post('/', adminAuth, upload.any(), async (req, res, next) => {
  try {
    const { name, slug, description, short_description, price, discount_price, stock, sku, category_id, brand_id, is_featured, is_bestseller, is_new_arrival, badge, variants, specs } = req.body;
    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, short_description, price, discount_price, stock, sku, category_id, brand_id, is_featured, is_bestseller, is_new_arrival, badge)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, slug, description || null, short_description || null, price, discount_price || null, stock || 0, sku || null, category_id || null, brand_id || null,
       is_featured ? 1 : 0, is_bestseller ? 1 : 0, is_new_arrival ? 1 : 0, badge || null]
    );
    const productId = result.insertId;

    // Save uploaded images
    if (req.files && req.files.length) {
      for (let i = 0; i < req.files.length; i++) {
        const imageUrl = `/uploads/${req.files[i].filename}`;
        await pool.query('INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?,?,?,?)',
          [productId, imageUrl, i === 0 ? 1 : 0, i]);
      }
    }

    // Variants
    if (variants) {
      const varList = typeof variants === 'string' ? JSON.parse(variants) : variants;
      for (let i = 0; i < varList.length; i++) {
        const v = varList[i];
        let imageUrl = v.image_url || null;
        
        const file = req.files?.find(f => f.fieldname === `variant_image_${i}`);
        if (file) {
          imageUrl = `/uploads/${file.filename}`;
        }
        
        await pool.query('INSERT INTO product_variants (product_id, sku, price, sale_price, barcode, weight, image_url, is_active, attributes, stock) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [productId, v.sku || null, v.price || null, v.sale_price || null, v.barcode || null, v.weight || null, imageUrl, v.is_active !== undefined ? v.is_active : 1, typeof v.attributes === 'object' ? JSON.stringify(v.attributes) : v.attributes || '{}', v.stock || 0]);
      }
    }

    // Specs
    if (specs) {
      const specList = typeof specs === 'string' ? JSON.parse(specs) : specs;
      for (const s of specList) {
        await pool.query('INSERT INTO product_specs (product_id, spec_key, spec_value) VALUES (?,?,?)', [productId, s.key, s.value]);
      }
    }

    res.status(201).json({ success: true, message: 'Product created.', id: productId });
  } catch (err) { next(err); }
});

// PUT /api/admin/products/:id
router.put('/:id', adminAuth, upload.any(), async (req, res, next) => {
  try {
    const { name, slug, description, short_description, price, discount_price, stock, sku, category_id, brand_id, is_featured, is_bestseller, is_new_arrival, badge, is_active, variants } = req.body;
    await pool.query(
      `UPDATE products SET name=?,slug=?,description=?,short_description=?,price=?,discount_price=?,stock=?,sku=?,category_id=?,brand_id=?,is_featured=?,is_bestseller=?,is_new_arrival=?,badge=?,is_active=? WHERE id=?`,
      [name, slug, description || null, short_description || null, price, discount_price || null, stock || 0, sku || null, category_id || null, brand_id || null,
       (is_featured === '1' || is_featured === 1 || is_featured === true) ? 1 : 0,
       (is_bestseller === '1' || is_bestseller === 1 || is_bestseller === true) ? 1 : 0,
       (is_new_arrival === '1' || is_new_arrival === 1 || is_new_arrival === true) ? 1 : 0,
       badge || null,
       is_active !== undefined ? (is_active === '1' || is_active === 1 || is_active === true ? 1 : 0) : 1,
       req.params.id]
    );

    if (req.files && req.files.length) {
      for (let i = 0; i < req.files.length; i++) {
        const imageUrl = `/uploads/${req.files[i].filename}`;
        await pool.query('INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?,?,?,?)',
          [req.params.id, imageUrl, 0, i]);
      }
    }

    // Variants
    if (variants) {
      console.log('Received variants to save:', variants);
      const varList = typeof variants === 'string' ? JSON.parse(variants) : variants;
      // Delete existing variants for this product
      await pool.query('DELETE FROM product_variants WHERE product_id=?', [req.params.id]);
      // Insert new variants
      for (let i = 0; i < varList.length; i++) {
        const v = varList[i];
        let imageUrl = v.image_url || null;
        
        const file = req.files?.find(f => f.fieldname === `variant_image_${i}`);
        if (file) {
          imageUrl = `/uploads/${file.filename}`;
        }
        
        await pool.query('INSERT INTO product_variants (product_id, sku, price, sale_price, barcode, weight, image_url, is_active, attributes, stock) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [req.params.id, v.sku || null, v.price || null, v.sale_price || null, v.barcode || null, v.weight || null, imageUrl, v.is_active !== undefined ? v.is_active : 1, typeof v.attributes === 'object' ? JSON.stringify(v.attributes) : v.attributes || '{}', v.stock || 0]);
      }
    }

    res.json({ success: true, message: 'Product updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/admin/products/:id
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    await pool.query('UPDATE products SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (err) { next(err); }
});

// DELETE /api/admin/products/:id/images/:imgId
router.delete('/:id/images/:imgId', adminAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM product_images WHERE id=? AND product_id=?', [req.params.imgId, req.params.id]);
    res.json({ success: true, message: 'Image deleted.' });
  } catch (err) { next(err); }
});

// GET /api/admin/products/:id/variants
router.get('/:id/variants', adminAuth, async (req, res, next) => {
  try {
    const [variants] = await pool.query('SELECT * FROM product_variants WHERE product_id=?', [req.params.id]);
    res.json({ success: true, variants });
  } catch (err) { next(err); }
});

module.exports = router;
