require('dotenv').config();

const app = require('./app');
const database = require('./config/database');
const redisClient = require('./config/redis');
const queueManager = require('./config/queue');
const logger = require('./utils/logger');

/**
 * Server Entry Point
 * Initializes all services and starts the Express server
 */

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Initialize all services
 */
async function initializeServices() {
  try {
    logger.info('🚀 Starting Skorly Backend Server...');
    logger.info(`📍 Environment: ${NODE_ENV}`);
    logger.info(`📍 Port: ${PORT}`);

    // Connect to MongoDB
    logger.info('🔄 Connecting to MongoDB...');
    await database.connect();

    // Connect to Redis
    logger.info('🔄 Connecting to Redis...');
    await redisClient.connect();

    // Initialize Queue System
    logger.info('🔄 Initializing Queue System...');
    await queueManager.initialize();

    logger.info('✅ All services initialized successfully');

  } catch (error) {
    logger.error('❌ Failed to initialize services', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Start the Express server
 */
async function startServer() {
  try {
    // Initialize services first
    await initializeServices();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('✅ Server started successfully');
      logger.info(`🌐 Server running on http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API endpoint: http://localhost:${PORT}/api`);
      logger.info('');
      logger.info('🎯 Ready to accept requests!');
      logger.info('');
      
      // Log available endpoints
      logger.info('📋 Available Endpoints:');
      logger.info('   POST   /api/upload              - Upload Excel file');
      logger.info('   GET    /api/upload/sample       - Download sample template');
      logger.info('   GET    /api/upload/format       - Get format information');
      logger.info('   GET    /api/jobs/:jobId         - Get job progress');
      logger.info('   GET    /api/jobs                - Get all jobs');
      logger.info('   GET    /api/students            - Get all students');
      logger.info('   GET    /api/students/:regNo     - Get student details');
      logger.info('   GET    /api/analytics/dashboard - Get dashboard analytics');
      logger.info('   GET    /api/analytics/trends    - Get performance trends');
      logger.info('   GET    /api/analytics/leaderboard - Get leaderboard');
      logger.info('');
    });

    // Store server instance for graceful shutdown
    app.server = server;

    // Set server timeout (2 minutes for long-running operations)
    server.timeout = 120000;

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
      } else {
        logger.error('❌ Server error', { error: error.message });
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Display startup banner
 */
function displayBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███████╗██╗  ██╗ ██████╗ ██████╗ ██╗  ██╗   ██╗       ║
║   ██╔════╝██║ ██╔╝██╔═══██╗██╔══██╗██║  ╚██╗ ██╔╝       ║
║   ███████╗█████╔╝ ██║   ██║██████╔╝██║   ╚████╔╝        ║
║   ╚════██║██╔═██╗ ██║   ██║██╔══██╗██║    ╚██╔╝         ║
║   ███████║██║  ██╗╚██████╔╝██║  ██║███████╗██║          ║
║   ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝          ║
║                                                           ║
║        Student Coding Platform Tracker - Backend         ║
║                    Version 1.0.0                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

// Display banner
displayBanner();

// Start the server
startServer().catch((error) => {
  logger.error('💀 Fatal error during server startup', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Export for testing
module.exports = app;