const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_TYPES } = require('../utils/constants');

/**
 * Global Error Handler Middleware
 * Handles all errors in the application with proper logging and response formatting
 */

/**
 * Development error response
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

/**
 * Production error response
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('💀 Unknown error occurred', {
      error: err.message,
      stack: err.stack
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Handle MongoDB cast errors
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

/**
 * Handle MongoDB duplicate field errors
 */
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, HTTP_STATUS.CONFLICT);
};

/**
 * Handle MongoDB validation errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', HTTP_STATUS.UNAUTHORIZED);

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', HTTP_STATUS.UNAUTHORIZED);

/**
 * Handle file upload errors
 */
const handleMulterError = (err) => {
  let message = 'File upload error';
  
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'File too large. Maximum size is 10MB.';
      break;
    case 'LIMIT_FILE_COUNT':
      message = 'Too many files. Only one file is allowed.';
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Unexpected file field.';
      break;
    case 'LIMIT_FIELD_KEY':
      message = 'Field name too long.';
      break;
    case 'LIMIT_FIELD_VALUE':
      message = 'Field value too long.';
      break;
    case 'LIMIT_FIELD_COUNT':
      message = 'Too many fields.';
      break;
    case 'LIMIT_PART_COUNT':
      message = 'Too many parts.';
      break;
    default:
      message = err.message || 'File upload error';
  }
  
  return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

/**
 * Handle rate limit errors
 */
const handleRateLimitError = () =>
  new AppError('Too many requests from this IP, please try again later.', HTTP_STATUS.TOO_MANY_REQUESTS);

/**
 * Handle Redis connection errors
 */
const handleRedisError = (err) => {
  logger.warn('⚠️ Redis connection error, continuing without cache', {
    error: err.message
  });
  
  return new AppError('Cache service temporarily unavailable', HTTP_STATUS.SERVICE_UNAVAILABLE);
};

/**
 * Handle platform API errors
 */
const handlePlatformAPIError = (err) => {
  let message = 'Platform API error';
  let statusCode = HTTP_STATUS.BAD_GATEWAY;
  
  if (err.message.includes('timeout')) {
    message = 'Platform API request timed out';
    statusCode = HTTP_STATUS.GATEWAY_TIMEOUT;
  } else if (err.message.includes('rate limit')) {
    message = 'Platform API rate limit exceeded';
    statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
  } else if (err.message.includes('not found')) {
    message = 'User not found on platform';
    statusCode = HTTP_STATUS.NOT_FOUND;
  } else if (err.message.includes('forbidden')) {
    message = 'Platform API access forbidden';
    statusCode = HTTP_STATUS.FORBIDDEN;
  }
  
  return new AppError(message, statusCode);
};

/**
 * Custom Application Error class
 */
class AppError extends Error {
  constructor(message, statusCode, errorType = ERROR_TYPES.SYSTEM) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorType = errorType;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Global error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  // Log error details
  logger.error('🚨 Error occurred', {
    error: err.message,
    statusCode: err.statusCode,
    status: err.status,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
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
    if (error.message && error.message.includes('redis')) error = handleRedisError(error);
    if (error.message && (
      error.message.includes('API') || 
      error.message.includes('platform') ||
      error.message.includes('timeout') ||
      error.message.includes('rate limit')
    )) {
      error = handlePlatformAPIError(error);
    }

    sendErrorProd(error, res);
  }
};

/**
 * Handle unhandled routes
 */
const handleNotFound = (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_TYPES.VALIDATION
  );
  next(err);
};

/**
 * Validation error helper
 */
const createValidationError = (message, field = null) => {
  const error = new AppError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_TYPES.VALIDATION);
  if (field) {
    error.field = field;
  }
  return error;
};

/**
 * API error helper
 */
const createAPIError = (message, statusCode = HTTP_STATUS.BAD_GATEWAY) => {
  return new AppError(message, statusCode, ERROR_TYPES.API);
};

/**
 * Database error helper
 */
const createDatabaseError = (message) => {
  return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_TYPES.DATABASE);
};

/**
 * Network error helper
 */
const createNetworkError = (message) => {
  return new AppError(message, HTTP_STATUS.BAD_GATEWAY, ERROR_TYPES.NETWORK);
};

module.exports = {
  AppError,
  catchAsync,
  globalErrorHandler,
  handleNotFound,
  createValidationError,
  createAPIError,
  createDatabaseError,
  createNetworkError
};