const logger = require('../utils/logger');
const { formatError } = require('../utils/responseFormatter');

module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Log the error
  logger.error('Request error:', {
    method: req.method,
    url: req.url,
    status,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't expose detailed error information in production
  const response = process.env.NODE_ENV === 'development' 
    ? { ...err, stack: err.stack }
    : { message: 'Internal server error' };

  res.status(status).json(formatError(response, status));
};