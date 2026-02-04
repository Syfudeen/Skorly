const Redis = require('redis');
const logger = require('../utils/logger');

/**
 * Redis Configuration
 * Handles Redis connection for queue management and caching
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 3000; // 3 seconds
  }

  /**
   * Connect to Redis
   */
  async connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      };

      // Add password if provided
      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }

      // Create Redis client
      this.client = Redis.createClient(redisConfig);

      // Set up event listeners
      this.setupEventListeners();

      // Connect to Redis
      await this.client.connect();
      
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      logger.info('✅ Redis connected successfully', {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db
      });

    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;
      
      logger.error('❌ Redis connection failed', {
        error: error.message,
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries
      });

      // Retry connection if under max retries
      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`🔄 Retrying Redis connection in ${this.retryDelay / 1000} seconds...`);
        setTimeout(() => this.connect(), this.retryDelay);
      } else {
        logger.error('💀 Max Redis connection retries exceeded. Continuing without Redis...');
        // Don't exit process, continue without Redis (degraded mode)
      }
    }
  }

  /**
   * Set up Redis event listeners
   */
  setupEventListeners() {
    this.client.on('connect', () => {
      logger.info('🔗 Redis connection established');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('✅ Redis client ready');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('❌ Redis client error', { error: error.message });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.warn('⚠️ Redis connection ended');
    });

    this.client.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });

    // Handle application termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Graceful shutdown of Redis connection
   */
  async gracefulShutdown() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('🔒 Redis connection closed gracefully');
      }
    } catch (error) {
      logger.error('❌ Error during Redis shutdown', { error: error.message });
    }
  }

  /**
   * Get Redis client instance
   */
  getClient() {
    if (!this.isConnected || !this.client) {
      logger.warn('⚠️ Redis client not available, operations will be skipped');
      return null;
    }
    return this.client;
  }

  /**
   * Check if Redis is connected and healthy
   */
  async isHealthy() {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }
      
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      logger.error('❌ Redis health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get Redis connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      client: this.client ? 'initialized' : 'not initialized',
      connectionAttempts: this.connectionAttempts
    };
  }

  /**
   * Cache operations
   */
  async set(key, value, expireInSeconds = 3600) {
    try {
      const client = this.getClient();
      if (!client) return false;

      const serializedValue = JSON.stringify(value);
      await client.setEx(key, expireInSeconds, serializedValue);
      return true;
    } catch (error) {
      logger.error('❌ Redis SET operation failed', { 
        key, 
        error: error.message 
      });
      return false;
    }
  }

  async get(key) {
    try {
      const client = this.getClient();
      if (!client) return null;

      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('❌ Redis GET operation failed', { 
        key, 
        error: error.message 
      });
      return null;
    }
  }

  async del(key) {
    try {
      const client = this.getClient();
      if (!client) return false;

      await client.del(key);
      return true;
    } catch (error) {
      logger.error('❌ Redis DEL operation failed', { 
        key, 
        error: error.message 
      });
      return false;
    }
  }

  async exists(key) {
    try {
      const client = this.getClient();
      if (!client) return false;

      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('❌ Redis EXISTS operation failed', { 
        key, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Clear all Redis data (for testing purposes)
   */
  async flushAll() {
    try {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error('Redis flush is only allowed in test environment');
      }

      const client = this.getClient();
      if (!client) return false;

      await client.flushAll();
      logger.info('🧹 Redis cache cleared');
      return true;
    } catch (error) {
      logger.error('❌ Redis FLUSHALL operation failed', { error: error.message });
      return false;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;