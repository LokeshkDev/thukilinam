const fs = require('fs');
const path = require('path');

const errorHandler = (err, req, res, next) => {
  const stack = err.stack || err.message;
  console.error('❌ Error:', stack);
  
  try {
    fs.appendFileSync(path.join(__dirname, '../error.log'), `[${new Date().toISOString()}] ${stack}\n`);
  } catch (logErr) {}

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
