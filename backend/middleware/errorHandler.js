const fs = require('fs');
const path = require('path');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Log errors to file in production
function logError(error, req) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode
    }
  };

  if (process.env.NODE_ENV === 'production') {
    const logPath = path.join(__dirname, '..', 'logs', 'error.log');
    const logDir = path.dirname(logPath);
    
    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  } else {
    console.error('🚨 Error Details:', logEntry);
  }
}

// Handle different types of errors
function handleCastErrorDB(err) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_DATA');
}

function handleDuplicateFieldsDB(err) {
  const value = err.errmsg ? err.errmsg.match(/(["'])((?:(?!\1)[^\\]|\\.)*)\1/)[2] : 'duplicate value';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
}

function handleValidationErrorDB(err) {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
}

function handleJWTError() {
  return new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');
}

function handleJWTExpiredError() {
  return new AppError('Your token has expired! Please log in again.', 401, 'EXPIRED_TOKEN');
}

function handleMulterError(err) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Maximum size allowed is 5MB.', 400, 'FILE_TOO_LARGE');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files. Maximum 5 files allowed.', 400, 'TOO_MANY_FILES');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field.', 400, 'UNEXPECTED_FILE');
  }
  return new AppError('File upload error.', 400, 'UPLOAD_ERROR');
}

// Send error response in development
function sendErrorDev(err, req, res) {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    code: err.code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
}

// Send error response in production
function sendErrorProd(err, req, res) {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error('💥 ERROR:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong! Please try again later.',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
}

// Main error handling middleware
function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logError(err, req);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, req, res);
  }
}

// Async error wrapper
function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// Validation error handler
function handleValidationErrors(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errorMessages,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  handleValidationErrors
};