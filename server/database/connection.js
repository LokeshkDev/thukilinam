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
    
    const ensureColumn = async (table, column, definition) => {
      const [columns] = await conn.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );

      if (!columns.length) {
        await conn.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    };

    // Keep older local databases in step with the current order flow.
    try {
      await conn.query('ALTER TABLE orders MODIFY COLUMN payment_method VARCHAR(50) DEFAULT "cashfree"');
      await ensureColumn('orders', 'tracking_number', 'VARCHAR(100)');
      await ensureColumn('orders', 'courier', 'VARCHAR(50)');
      await ensureColumn('orders', 'notes', 'TEXT');
      await ensureColumn('orders', 'customer_name', 'VARCHAR(150)');
      await ensureColumn('orders', 'customer_phone', 'VARCHAR(20)');
      await ensureColumn('orders', 'customer_email', 'VARCHAR(150)');
      await ensureColumn('order_items', 'attributes', 'JSON');
      console.log('✅ Database schema verified: order columns are up to date.');
    } catch (dbErr) {
      console.error('⚠️ Warning: Failed to verify order schema:', dbErr.message);
    }
    
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);

    if (err.code === 'ETIMEDOUT') {
      console.error('\n🔍 Diagnosis for ETIMEDOUT:');
      console.error(`- Could not reach ${process.env.DB_HOST}:${process.env.DB_PORT || 3306} within timeout.`);
      console.error('- Check AWS EC2 Security Groups: inbound rule for MySQL port 3306 must allow your current public IP.');
      console.error('- If your ISP has dynamic IP, update the EC2 Security Group "My IP" rule.');
      console.error('- Or connect via SSH Tunnel: ssh -N -L 3306:localhost:3306 ubuntu@' + (process.env.DB_HOST || '52.66.173.135') + ' and set DB_HOST=127.0.0.1 in .env\n');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\n🔍 Diagnosis for ECONNREFUSED:');
      console.error(`- Port ${process.env.DB_PORT || 3306} on ${process.env.DB_HOST} actively refused connection.`);
      console.error('- Check if MySQL service is running on the host (e.g. sudo systemctl status mysql).\n');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔍 Diagnosis for Access Denied:');
      console.error(`- Check DB_USER (${process.env.DB_USER}) and DB_PASSWORD.\n`);
    }

    process.exit(1);
  }
})();

module.exports = pool;
