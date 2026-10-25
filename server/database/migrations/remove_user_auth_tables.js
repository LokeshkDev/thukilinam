const pool = require('../connection');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Starting migration to remove user auth tables and adapt orders...');

    // 1. Add customer columns to orders
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
    `);
    const existingCols = new Set(cols.map(c => c.COLUMN_NAME));

    if (!existingCols.has('customer_name')) {
      await conn.query('ALTER TABLE orders ADD COLUMN customer_name VARCHAR(150) NULL AFTER user_id');
      console.log('✅ Added customer_name to orders');
    }
    if (!existingCols.has('customer_phone')) {
      await conn.query('ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(20) NULL AFTER customer_name');
      console.log('✅ Added customer_phone to orders');
    }
    if (!existingCols.has('customer_email')) {
      await conn.query('ALTER TABLE orders ADD COLUMN customer_email VARCHAR(150) NULL AFTER customer_phone');
      console.log('✅ Added customer_email to orders');
    }

    // 2. Backfill existing orders with customer details from shipping_address
    await conn.query(`
      UPDATE orders SET
        customer_name = COALESCE(customer_name, JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.full_name'))),
        customer_phone = COALESCE(customer_phone, JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.phone'))),
        customer_email = COALESCE(customer_email, JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.email')))
      WHERE customer_name IS NULL OR customer_phone IS NULL
    `);
    console.log('✅ Backfilled existing orders with customer details');

    // 3. Drop foreign keys referencing users
    const dropForeignKeyIfExists = async (table, constraint) => {
      try {
        const [fk] = await conn.query(`
          SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?
        `, [table, constraint]);
        if (fk.length) {
          await conn.query(`ALTER TABLE ${table} DROP FOREIGN KEY ${constraint}`);
          console.log(`✅ Dropped foreign key ${constraint} on ${table}`);
        }
      } catch (e) {
        console.warn(`Note: Could not drop FK ${constraint} on ${table}:`, e.message);
      }
    };

    await dropForeignKeyIfExists('orders', 'orders_ibfk_1');
    await dropForeignKeyIfExists('reviews', 'reviews_ibfk_2');
    await dropForeignKeyIfExists('wishlist', 'wishlist_ibfk_1');
    await dropForeignKeyIfExists('cart', 'cart_ibfk_1');
    await dropForeignKeyIfExists('addresses', 'addresses_ibfk_1');

    // Make orders.user_id NULLABLE
    await conn.query('ALTER TABLE orders MODIFY COLUMN user_id INT NULL DEFAULT NULL');
    console.log('✅ Made orders.user_id nullable');

    // Make reviews.user_id NULLABLE and add customer_name to reviews
    try {
      await conn.query('ALTER TABLE reviews MODIFY COLUMN user_id INT NULL DEFAULT NULL');
      const [reviewCols] = await conn.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'
      `);
      const reviewColSet = new Set(reviewCols.map(c => c.COLUMN_NAME));
      if (!reviewColSet.has('customer_name')) {
        await conn.query('ALTER TABLE reviews ADD COLUMN customer_name VARCHAR(100) NULL AFTER user_id');
      }
      console.log('✅ Updated reviews table');
    } catch (e) {
      console.warn('Note for reviews table:', e.message);
    }

    // 4. Drop users and user-only tables
    await conn.query('DROP TABLE IF EXISTS addresses');
    console.log('✅ Dropped addresses table');

    await conn.query('DROP TABLE IF EXISTS cart_items');
    await conn.query('DROP TABLE IF EXISTS cart');
    console.log('✅ Dropped cart and cart_items tables');

    await conn.query('DROP TABLE IF EXISTS wishlist');
    console.log('✅ Dropped wishlist table');

    await conn.query('DROP TABLE IF EXISTS users');
    console.log('✅ Dropped users table');

    console.log('\n🎉 Successfully migrated database! Customer login/register tables removed.');
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();

