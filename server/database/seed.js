const pool = require('./connection');
const fs = require('fs');
const path = require('path');

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    console.log('⏳ Executing schema.sql...');
    const fullSql = `SET FOREIGN_KEY_CHECKS = 0; ${schemaSql} SET FOREIGN_KEY_CHECKS = 1;`;
    await pool.query(fullSql);
    
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
