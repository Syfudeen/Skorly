const winston = require('winston');
const path = require('path');

/**
 * Logger Configuration
 * Centralized logging system with different levels and formats
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Define file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: format,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Ensure logs directory exists
  const fs = require('fs');
  const logsDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Add file transports
  transports.push(
    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // HTTP logs
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 3,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Add request logging middleware
logger.httpMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    };

    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });

  next();
};

// Add custom methods for specific use cases
logger.apiCall = (platform, endpoint, status, duration, error = null) => {
  const logData = {
    platform,
    endpoint,
    status,
    duration: `${duration}ms`,
  };

  if (error) {
    logData.error = error;
    logger.error('API Call Failed', logData);
  } else {
    logger.info('API Call Success', logData);
  }
};

logger.jobProgress = (jobId, progress, total, status = 'processing') => {
  logger.info('Job Progress', {
    jobId,
    progress,
    total,
    percentage: total > 0 ? Math.round((progress / total) * 100) : 0,
    status,
  });
};

logger.studentProcessing = (regNo, platform, status, data = {}) => {
  logger.info('Student Processing', {
    regNo,
    platform,
    status,
    ...data,
  });
};

logger.queueStats = (stats) => {
  logger.info('Queue Statistics', stats);
};

logger.dbOperation = (operation, collection, status, duration, error = null) => {
  const logData = {
    operation,
    collection,
    status,
    duration: `${duration}ms`,
  };

  if (error) {
    logData.error = error;
    logger.error('Database Operation Failed', logData);
  } else {
    logger.debug('Database Operation Success', logData);
  }
};

// Handle uncaught exceptions and unhandled rejections
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log'),
      format: fileFormat,
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log'),
      format: fileFormat,
    })
  );
}

module.exports = logger;