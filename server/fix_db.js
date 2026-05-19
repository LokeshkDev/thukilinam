const db = require('./database/connection');

async function fix() {
  try {
    await db.query("ALTER TABLE orders MODIFY COLUMN payment_method VARCHAR(50) DEFAULT 'cashfree'");
    console.log('Successfully updated orders.payment_method to VARCHAR(50)');
  } catch (err) {
    console.error('Error updating DB:', err);
  } finally {
    process.exit(0);
  }
}

fix();
