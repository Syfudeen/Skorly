const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Database Configuration
 * Handles MongoDB connection with proper error handling and reconnection logic
 */
class Database {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      const mongoUri = process.env.NODE_ENV === 'test' 
        ? process.env.MONGODB_TEST_URI 
        : process.env.MONGODB_URI;

      if (!mongoUri) {
        throw new Error('MongoDB URI not provided in environment variables');
      }

      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
      };

      await mongoose.connect(mongoUri, options);
      
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      logger.info('✅ MongoDB connected successfully', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name
      });

      // Set up connection event listeners
      this.setupEventListeners();

    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;
      
      logger.error('❌ MongoDB connection failed', {
        error: error.message,
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries
      });

      // Retry connection if under max retries
      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`🔄 Retrying MongoDB connection in ${this.retryDelay / 1000} seconds...`);
        setTimeout(() => this.connect(), this.retryDelay);
      } else {
        logger.error('💀 Max MongoDB connection retries exceeded. Exiting...');
        process.exit(1);
      }
    }
  }

  /**
   * Set up MongoDB connection event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      logger.info('🔗 MongoDB connection established');
    });

    mongoose.connection.on('error', (error) => {
      this.isConnected = false;
      logger.error('❌ MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      logger.info('🔄 MongoDB reconnected');
    });

    // Handle application termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Graceful shutdown of database connection
   */
  async gracefulShutdown() {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('🔒 MongoDB connection closed gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during MongoDB shutdown', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Check if database is connected
   */
  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection status
   */
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      status: states[mongoose.connection.readyState],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name
    };
  }

  /**
   * Clear database (for testing purposes)
   */
  async clearDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Database clearing is only allowed in test environment');
    }

    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    logger.info('🧹 Test database cleared');
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;