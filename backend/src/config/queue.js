const { Queue, Worker, QueueEvents } = require('bullmq');
const redisClient = require('./redis');
const logger = require('../utils/logger');

/**
 * Queue Configuration
 * Handles BullMQ setup for processing student data
 */
class QueueManager {
  constructor() {
    this.queues = {};
    this.workers = {};
    this.queueEvents = {};
    this.isInitialized = false;
  }

  /**
   * Initialize queue system
   */
  async initialize() {
    try {
      // Wait for Redis connection
      if (!redisClient.isConnected) {
        logger.info('⏳ Waiting for Redis connection...');
        await new Promise((resolve) => {
          const checkConnection = setInterval(() => {
            if (redisClient.isConnected) {
              clearInterval(checkConnection);
              resolve();
            }
          }, 1000);
        });
      }

      const redisConnection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        db: process.env.REDIS_DB || 0,
      };

      if (process.env.REDIS_PASSWORD) {
        redisConnection.password = process.env.REDIS_PASSWORD;
      }

      // Create main processing queue
      this.queues.studentProcessing = new Queue('student-processing', {
        connection: redisConnection,
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
          attempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS) || 3,
          backoff: {
            type: 'exponential',
            delay: parseInt(process.env.QUEUE_RETRY_DELAY) || 5000,
          },
        },
      });

      // Create queue events for monitoring
      this.queueEvents.studentProcessing = new QueueEvents('student-processing', {
        connection: redisConnection,
      });

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info('✅ Queue system initialized successfully');

    } catch (error) {
      logger.error('❌ Queue system initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Set up queue event listeners
   */
  setupEventListeners() {
    const events = this.queueEvents.studentProcessing;

    events.on('completed', ({ jobId, returnvalue }) => {
      logger.info('✅ Job completed', { jobId, returnvalue });
    });

    events.on('failed', ({ jobId, failedReason }) => {
      logger.error('❌ Job failed', { jobId, failedReason });
    });

    events.on('progress', ({ jobId, data }) => {
      logger.debug('📊 Job progress', { jobId, progress: data });
    });

    events.on('stalled', ({ jobId }) => {
      logger.warn('⚠️ Job stalled', { jobId });
    });

    events.on('waiting', ({ jobId }) => {
      logger.debug('⏳ Job waiting', { jobId });
    });

    events.on('active', ({ jobId }) => {
      logger.debug('🔄 Job active', { jobId });
    });
  }

  /**
   * Add student processing job to queue
   */
  async addStudentJob(studentData, uploadJobId, priority = 0) {
    try {
      if (!this.isInitialized) {
        throw new Error('Queue system not initialized');
      }

      const job = await this.queues.studentProcessing.add(
        'process-student',
        {
          student: studentData,
          uploadJobId,
          timestamp: new Date().toISOString(),
        },
        {
          priority, // Higher number = higher priority
          delay: 0, // No delay
          jobId: `${uploadJobId}-${studentData.regNo}`, // Unique job ID
        }
      );

      logger.debug('📤 Student job added to queue', {
        jobId: job.id,
        regNo: studentData.regNo,
        uploadJobId,
        priority
      });

      return job;
    } catch (error) {
      logger.error('❌ Failed to add student job to queue', {
        error: error.message,
        regNo: studentData.regNo,
        uploadJobId
      });
      throw error;
    }
  }

  /**
   * Add multiple student jobs in batch
   */
  async addStudentJobsBatch(studentsData, uploadJobId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Queue system not initialized');
      }

      const jobs = studentsData.map((student, index) => ({
        name: 'process-student',
        data: {
          student,
          uploadJobId,
          timestamp: new Date().toISOString(),
        },
        opts: {
          priority: 0,
          delay: index * 100, // Stagger jobs by 100ms to avoid overwhelming APIs
          jobId: `${uploadJobId}-${student.regNo}`,
        }
      }));

      const addedJobs = await this.queues.studentProcessing.addBulk(jobs);

      logger.info('📤 Batch student jobs added to queue', {
        count: addedJobs.length,
        uploadJobId
      });

      return addedJobs;
    } catch (error) {
      logger.error('❌ Failed to add batch student jobs to queue', {
        error: error.message,
        uploadJobId,
        count: studentsData.length
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      if (!this.isInitialized) {
        return null;
      }

      const queue = this.queues.studentProcessing;
      
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length
      };
    } catch (error) {
      logger.error('❌ Failed to get queue statistics', { error: error.message });
      return null;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    try {
      if (!this.isInitialized) {
        return null;
      }

      return await this.queues.studentProcessing.getJob(jobId);
    } catch (error) {
      logger.error('❌ Failed to get job', { error: error.message, jobId });
      return null;
    }
  }

  /**
   * Get jobs by upload job ID
   */
  async getJobsByUploadId(uploadJobId) {
    try {
      if (!this.isInitialized) {
        return [];
      }

      const [waiting, active, completed, failed] = await Promise.all([
        this.queues.studentProcessing.getWaiting(),
        this.queues.studentProcessing.getActive(),
        this.queues.studentProcessing.getCompleted(),
        this.queues.studentProcessing.getFailed(),
      ]);

      const allJobs = [...waiting, ...active, ...completed, ...failed];
      
      return allJobs.filter(job => 
        job.data && job.data.uploadJobId === uploadJobId
      );
    } catch (error) {
      logger.error('❌ Failed to get jobs by upload ID', { 
        error: error.message, 
        uploadJobId 
      });
      return [];
    }
  }

  /**
   * Cancel jobs by upload job ID
   */
  async cancelJobsByUploadId(uploadJobId) {
    try {
      if (!this.isInitialized) {
        return false;
      }

      const jobs = await this.getJobsByUploadId(uploadJobId);
      
      for (const job of jobs) {
        if (job.opts.delay > 0 || job.processedOn === undefined) {
          await job.remove();
        }
      }

      logger.info('🚫 Jobs cancelled for upload', { 
        uploadJobId, 
        cancelledCount: jobs.length 
      });

      return true;
    } catch (error) {
      logger.error('❌ Failed to cancel jobs', { 
        error: error.message, 
        uploadJobId 
      });
      return false;
    }
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs() {
    try {
      if (!this.isInitialized) {
        return false;
      }

      const queue = this.queues.studentProcessing;
      
      // Clean completed jobs older than 24 hours
      await queue.clean(24 * 60 * 60 * 1000, 100, 'completed');
      
      // Clean failed jobs older than 7 days
      await queue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed');

      logger.info('🧹 Old jobs cleaned from queue');
      return true;
    } catch (error) {
      logger.error('❌ Failed to clean old jobs', { error: error.message });
      return false;
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue() {
    try {
      if (!this.isInitialized) {
        return false;
      }

      await this.queues.studentProcessing.pause();
      logger.info('⏸️ Queue paused');
      return true;
    } catch (error) {
      logger.error('❌ Failed to pause queue', { error: error.message });
      return false;
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue() {
    try {
      if (!this.isInitialized) {
        return false;
      }

      await this.queues.studentProcessing.resume();
      logger.info('▶️ Queue resumed');
      return true;
    } catch (error) {
      logger.error('❌ Failed to resume queue', { error: error.message });
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      logger.info('🔄 Shutting down queue system...');

      // Close workers first
      for (const worker of Object.values(this.workers)) {
        await worker.close();
      }

      // Close queue events
      for (const events of Object.values(this.queueEvents)) {
        await events.close();
      }

      // Close queues
      for (const queue of Object.values(this.queues)) {
        await queue.close();
      }

      this.isInitialized = false;
      logger.info('🔒 Queue system shut down gracefully');
    } catch (error) {
      logger.error('❌ Error during queue shutdown', { error: error.message });
    }
  }
}

// Create singleton instance
const queueManager = new QueueManager();

module.exports = queueManager;