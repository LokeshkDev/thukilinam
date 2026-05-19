const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'thukilinam_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+05:30',
  multipleStatements: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully to:', process.env.DB_NAME, 'at', process.env.DB_HOST);
    
    // Dynamically alter orders.payment_method to accept cashfree
    try {
      await conn.query(`
        ALTER TABLE orders MODIFY COLUMN payment_method VARCHAR(50) DEFAULT 'cashfree'
      `);
      console.log('✅ Database schema verified: payment_method column modified to VARCHAR(50).');
    } catch (dbErr) {
      console.error('⚠️ Warning: Failed to alter payment_method column:', dbErr.message);
    }
    
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;
