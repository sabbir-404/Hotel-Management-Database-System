function errorHandler(err, req, res, next) {
  console.error('API Error:', err.stack || err.message || err);
  
  // Mysql trigger or custom signal error
  if (err.sqlState === '45000') {
    return res.status(400).json({ error: err.message });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
