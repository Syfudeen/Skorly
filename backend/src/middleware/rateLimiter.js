const rateLimit = require('express-rate-limit');
const { RATE_LIMITS, HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Rate Limiter Middleware
 * Protects API endpoints from abuse and excessive requests
 */

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMITS.API.WINDOW_MS,
  max: RATE_LIMITS.API.MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(RATE_LIMITS.API.WINDOW_MS / 1000 / 60) + ' minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('⚠️ Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(RATE_LIMITS.API.WINDOW_MS / 1000 / 60) + ' minutes',
      timestamp: new Date().toISOString()
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * Upload endpoint rate limiter (stricter)
 */
const uploadLimiter = rateLimit({
  windowMs: RATE_LIMITS.UPLOAD.WINDOW_MS,
  max: RATE_LIMITS.UPLOAD.MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many upload requests. Please wait before uploading again.',
    retryAfter: Math.ceil(RATE_LIMITS.UPLOAD.WINDOW_MS / 1000 / 60) + ' minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('⚠️ Upload rate limit exceeded', {
      ip: req.ip,
      fileName: req.file?.originalname,
      fileSize: req.file?.size
    });
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      status: 'error',
      message: 'Too many upload requests. Please wait before uploading again.',
      retryAfter: Math.ceil(RATE_LIMITS.UPLOAD.WINDOW_MS / 1000 / 60) + ' minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Strict rate limiter for sensitive operations
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    status: 'error',
    message: 'Too many requests for this operation. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('⚠️ Strict rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      status: 'error',
      message: 'Too many requests for this operation. Please try again later.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Lenient rate limiter for read operations
 */
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    status: 'error',
    message: 'Too many read requests. Please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * Custom rate limiter with Redis store (for production)
 */
const createRedisRateLimiter = (redisClient, options = {}) => {
  const RedisStore = require('rate-limit-redis');
  
  return rateLimit({
    windowMs: options.windowMs || RATE_LIMITS.API.WINDOW_MS,
    max: options.max || RATE_LIMITS.API.MAX_REQUESTS,
    message: options.message || {
      status: 'error',
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      client: redisClient.getClient(),
      prefix: 'rate_limit:',
      sendCommand: (...args) => redisClient.getClient().sendCommand(args)
    }),
    handler: (req, res) => {
      logger.warn('⚠️ Redis rate limit exceeded', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method
      });
      
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        status: 'error',
        message: options.message?.message || 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString()
      });
    }
  });
};

/**
 * Dynamic rate limiter based on user type
 */
const dynamicRateLimiter = (getUserType) => {
  return async (req, res, next) => {
    try {
      const userType = await getUserType(req);
      
      let maxRequests = RATE_LIMITS.API.MAX_REQUESTS;
      let windowMs = RATE_LIMITS.API.WINDOW_MS;
      
      // Adjust limits based on user type
      switch (userType) {
        case 'admin':
          maxRequests = 500;
          break;
        case 'premium':
          maxRequests = 200;
          break;
        case 'free':
        default:
          maxRequests = 100;
          break;
      }
      
      const limiter = rateLimit({
        windowMs,
        max: maxRequests,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
          return req.ip + ':' + userType;
        }
      });
      
      return limiter(req, res, next);
      
    } catch (error) {
      logger.error('❌ Dynamic rate limiter error', { error: error.message });
      next();
    }
  };
};

/**
 * Rate limit info middleware
 */
const rateLimitInfo = (req, res, next) => {
  // Add rate limit info to response headers
  res.on('finish', () => {
    if (res.getHeader('RateLimit-Limit')) {
      logger.debug('📊 Rate limit info', {
        ip: req.ip,
        limit: res.getHeader('RateLimit-Limit'),
        remaining: res.getHeader('RateLimit-Remaining'),
        reset: res.getHeader('RateLimit-Reset')
      });
    }
  });
  
  next();
};

module.exports = {
  apiLimiter,
  uploadLimiter,
  strictLimiter,
  readLimiter,
  createRedisRateLimiter,
  dynamicRateLimiter,
  rateLimitInfo
};