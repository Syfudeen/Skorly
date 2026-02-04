const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import middleware
const { globalErrorHandler, handleNotFound } = require('./middleware/errorHandler');
const { apiLimiter, rateLimitInfo } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Import routes
const uploadRoutes = require('./routes/upload');
const progressRoutes = require('./routes/progress');
const studentsRoutes = require('./routes/students');
const analyticsRoutes = require('./routes/analytics');

// Import utilities
const { HTTP_STATUS } = require('./utils/constants');

/**
 * Express Application Setup
 */
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS - Enable Cross-Origin Resource Sharing
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// Body parser - Parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression - Compress response bodies
app.use(compression());

// HTTP request logging
app.use(logger.httpMiddleware);

// Rate limit info
app.use(rateLimitInfo);

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route   GET /api/health
 * @desc    Detailed health check with service status
 * @access  Public
 */
app.get('/api/health', async (req, res) => {
  const database = require('./config/database');
  const redisClient = require('./config/redis');
  const queueManager = require('./config/queue');

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: database.isHealthy() ? 'connected' : 'disconnected',
        details: database.getStatus()
      },
      redis: {
        status: redisClient.isConnected ? 'connected' : 'disconnected',
        details: redisClient.getStatus()
      },
      queue: {
        status: queueManager.isInitialized ? 'initialized' : 'not_initialized',
        stats: await queueManager.getQueueStats()
      }
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
    },
    cpu: {
      usage: process.cpuUsage()
    }
  };

  // Determine overall health status
  const servicesHealthy = 
    health.services.database.status === 'connected' &&
    health.services.redis.status === 'connected' &&
    health.services.queue.status === 'initialized';

  if (!servicesHealthy) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' 
    ? HTTP_STATUS.OK 
    : HTTP_STATUS.SERVICE_UNAVAILABLE;

  res.status(statusCode).json(health);
});

// ============================================
// API ROUTES
// ============================================

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Mount routes
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', progressRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/analytics', analyticsRoutes);

// API root endpoint
app.get('/api', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Skorly API v1.0',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      upload: '/api/upload',
      jobs: '/api/jobs',
      students: '/api/students',
      analytics: '/api/analytics',
      health: '/api/health'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// Handle 404 - Route not found
app.use(handleNotFound);

// Global error handler
app.use(globalErrorHandler);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal) => {
  logger.info(`🔄 ${signal} received. Starting graceful shutdown...`);

  try {
    // Close server
    if (app.server) {
      await new Promise((resolve) => {
        app.server.close(resolve);
      });
      logger.info('🔒 HTTP server closed');
    }

    // Close database connection
    const database = require('./config/database');
    if (database.isHealthy()) {
      await database.gracefulShutdown();
    }

    // Close Redis connection
    const redisClient = require('./config/redis');
    if (redisClient.isConnected) {
      await redisClient.gracefulShutdown();
    }

    // Close queue
    const queueManager = require('./config/queue');
    if (queueManager.isInitialized) {
      await queueManager.shutdown();
    }

    logger.info('✅ Graceful shutdown completed');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💀 Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('💀 Unhandled Rejection', {
    reason,
    promise
  });
  
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;