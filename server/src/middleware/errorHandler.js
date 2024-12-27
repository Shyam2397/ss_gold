// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Determine the status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    statusCode: statusCode,
    message: err.message || 'Internal Server Error'
  });
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  AppError
};
