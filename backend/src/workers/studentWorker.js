const { Worker } = require('bullmq');
const mongoose = require('mongoose');

// Import services and models
const platformService = require('../services/platformService');
const comparisonService = require('../services/comparisonService');
const Student = require('../models/Student');
const PlatformStats = require('../models/PlatformStats');
const PerformanceHistory = require('../models/PerformanceHistory');
const UploadJob = require('../models/UploadJob');

// Import utilities
const logger = require('../utils/logger');
const { QUEUE_CONFIG, JOB_STATUS, FETCH_STATUS } = require('../utils/constants');
const { generateWeekInfo } = require('../utils/helpers');

// Import configurations
const database = require('../config/database');
const redisClient = require('../config/redis');

/**
 * Student Worker
 * Processes individual student jobs from the queue
 */
class StudentWorker {
  constructor() {
    this.worker = null;
    this.isRunning = false;
    this.processedJobs = 0;
    this.failedJobs = 0;
    this.startTime = null;
  }

  /**
   * Initialize and start the worker
   */
  async start() {
    try {
      logger.info('🚀 Starting student worker...');

      // Connect to database and Redis
      await this.initializeConnections();

      // Create worker instance
      this.worker = new Worker(
        'student-processing',
        this.processJob.bind(this),
        {
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            db: process.env.REDIS_DB || 0,
            password: process.env.REDIS_PASSWORD || undefined,
          },
          concurrency: QUEUE_CONFIG.CONCURRENCY,
          stalledInterval: QUEUE_CONFIG.STALLED_INTERVAL,
          maxStalledCount: QUEUE_CONFIG.MAX_STALLED_COUNT,
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      );

      // Set up event listeners
      this.setupEventListeners();

      this.isRunning = true;
      this.startTime = new Date();
      this.processedJobs = 0;
      this.failedJobs = 0;

      logger.info('✅ Student worker started successfully', {
        concurrency: QUEUE_CONFIG.CONCURRENCY,
        stalledInterval: QUEUE_CONFIG.STALLED_INTERVAL,
        maxStalledCount: QUEUE_CONFIG.MAX_STALLED_COUNT
      });

    } catch (error) {
      logger.error('❌ Failed to start student worker', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize database and Redis connections
   */
  async initializeConnections() {
    try {
      // Connect to MongoDB
      if (!database.isHealthy()) {
        await database.connect();
      }

      // Connect to Redis
      if (!redisClient.isConnected) {
        await redisClient.connect();
      }

      logger.info('✅ Worker connections initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize worker connections', { error: error.message });
      throw error;
    }
  }

  /**
   * Set up worker event listeners
   */
  setupEventListeners() {
    this.worker.on('completed', (job, returnvalue) => {
      this.processedJobs++;
      logger.info('✅ Job completed', {
        jobId: job.id,
        regNo: job.data.student?.regNo,
        duration: `${Date.now() - job.processedOn}ms`,
        totalProcessed: this.processedJobs
      });
    });

    this.worker.on('failed', (job, err) => {
      this.failedJobs++;
      logger.error('❌ Job failed', {
        jobId: job.id,
        regNo: job.data.student?.regNo,
        error: err.message,
        attempts: job.attemptsMade,
        totalFailed: this.failedJobs
      });
    });

    this.worker.on('progress', (job, progress) => {
      logger.debug('📊 Job progress', {
        jobId: job.id,
        regNo: job.data.student?.regNo,
        progress: `${progress}%`
      });
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn('⚠️ Job stalled', { jobId });
    });

    this.worker.on('error', (err) => {
      logger.error('❌ Worker error', { error: err.message });
    });

    // Handle graceful shutdown
    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
  }

  /**
   * Process individual student job
   */
  async processJob(job) {
    const startTime = Date.now();
    const { student, uploadJobId, timestamp } = job.data;

    try {
      logger.studentProcessing(student.regNo, 'all', 'started', {
        uploadJobId,
        platforms: Object.keys(student.platformIds).filter(
          key => student.platformIds[key]
        ).length
      });

      // Update job progress
      await job.updateProgress(10);

      // Step 1: Save/Update student in database
      await this.saveStudent(student);
      await job.updateProgress(20);

      // Step 2: Fetch platform stats
      const platformResults = await platformService.fetchStudentStats(student, uploadJobId);
      await job.updateProgress(60);

      // Step 3: Compare with previous data
      const comparison = await comparisonService.compareStudentStats(
        student.regNo,
        platformResults,
        uploadJobId
      );
      await job.updateProgress(80);

      // Step 4: Save platform stats and performance history
      await this.savePlatformStats(student.regNo, platformResults, uploadJobId);
      await this.savePerformanceHistory(student, platformResults, comparison, uploadJobId);
      await job.updateProgress(95);

      // Step 5: Update upload job progress
      await this.updateUploadJobProgress(uploadJobId, platformResults);
      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      
      logger.studentProcessing(student.regNo, 'all', 'completed', {
        duration: `${duration}ms`,
        successfulPlatforms: platformResults.successfulPlatforms,
        failedPlatforms: platformResults.failedPlatforms,
        overallScore: comparison.overallChange.score
      });

      return {
        regNo: student.regNo,
        status: 'success',
        duration,
        platformResults: {
          total: platformResults.totalPlatforms,
          successful: platformResults.successfulPlatforms,
          failed: platformResults.failedPlatforms
        },
        overallScore: comparison.overallChange.score,
        trend: comparison.overallChange.trend
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('❌ Student job processing failed', {
        regNo: student.regNo,
        uploadJobId,
        error: error.message,
        duration: `${duration}ms`
      });

      // Update upload job with error
      await this.updateUploadJobError(uploadJobId, student.regNo, error.message);

      throw error;
    }
  }

  /**
   * Save or update student in database
   */
  async saveStudent(studentData) {
    try {
      const existingStudent = await Student.findByRegNo(studentData.regNo);

      if (existingStudent) {
        // Update existing student
        existingStudent.name = studentData.name;
        existingStudent.department = studentData.department;
        existingStudent.year = studentData.year;
        existingStudent.platformIds = studentData.platformIds;
        existingStudent.lastUpdated = new Date();

        await existingStudent.save();
        logger.debug('📝 Student updated', { regNo: studentData.regNo });
      } else {
        // Create new student
        const newStudent = new Student({
          regNo: studentData.regNo,
          name: studentData.name,
          department: studentData.department,
          year: studentData.year,
          platformIds: studentData.platformIds,
          isActive: true
        });

        await newStudent.save();
        logger.debug('➕ New student created', { regNo: studentData.regNo });
      }

    } catch (error) {
      logger.error('❌ Failed to save student', {
        regNo: studentData.regNo,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save platform statistics
   */
  async savePlatformStats(regNo, platformResults, uploadJobId) {
    try {
      const savePromises = Object.entries(platformResults.platforms).map(
        async ([platform, stats]) => {
          // Find existing platform stats
          let platformStats = await PlatformStats.findOne({
            regNo: regNo.toUpperCase(),
            platform: platform.toLowerCase()
          });

          if (platformStats) {
            // Update existing stats
            platformStats.updateStats(stats);
            platformStats.uploadJobId = uploadJobId;
          } else {
            // Create new platform stats
            platformStats = new PlatformStats({
              regNo: regNo.toUpperCase(),
              platform: platform.toLowerCase(),
              platformUserId: stats.platformUserId || regNo,
              uploadJobId,
              currentStats: {
                rating: stats.rating || 0,
                maxRating: stats.maxRating || stats.rating || 0,
                problemsSolved: stats.problemsSolved || 0,
                contestsParticipated: stats.contestsParticipated || 0,
                rank: stats.rank || null,
                additionalData: stats.additionalData || {}
              },
              fetchStatus: stats.fetchStatus || 'success',
              errorMessage: stats.error || null
            });
          }

          await platformStats.save();
          return platformStats;
        }
      );

      await Promise.all(savePromises);
      
      logger.debug('💾 Platform stats saved', {
        regNo,
        platforms: Object.keys(platformResults.platforms).length
      });

    } catch (error) {
      logger.error('❌ Failed to save platform stats', {
        regNo,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save performance history
   */
  async savePerformanceHistory(student, platformResults, comparison, uploadJobId) {
    try {
      const weekInfo = await generateWeekInfo();
      
      // Create performance history entry
      const performanceHistory = new PerformanceHistory({
        regNo: student.regNo.toUpperCase(),
        uploadJobId,
        weekNumber: weekInfo.weekNumber,
        weekLabel: weekInfo.weekLabel,
        uploadDate: weekInfo.uploadDate,
        platformStats: [],
        overallScore: comparison.overallChange.score,
        performanceLevel: comparison.overallChange.performanceLevel,
        totalPlatforms: platformResults.totalPlatforms,
        activePlatforms: platformResults.successfulPlatforms
      });

      // Add platform stats to history
      Object.entries(platformResults.platforms).forEach(([platform, stats]) => {
        performanceHistory.addPlatformStats(platform, stats);
      });

      // Add errors if any
      platformResults.errors.forEach(error => {
        performanceHistory.addError(error.platform, error.error);
      });

      // Calculate overall score
      performanceHistory.calculateOverallScore();

      await performanceHistory.save();
      
      logger.debug('📊 Performance history saved', {
        regNo: student.regNo,
        overallScore: performanceHistory.overallScore,
        performanceLevel: performanceHistory.performanceLevel
      });

    } catch (error) {
      logger.error('❌ Failed to save performance history', {
        regNo: student.regNo,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update upload job progress
   */
  async updateUploadJobProgress(uploadJobId, platformResults) {
    try {
      const uploadJob = await UploadJob.findOne({ jobId: uploadJobId });
      if (!uploadJob) {
        logger.warn('⚠️ Upload job not found', { uploadJobId });
        return;
      }

      // Update progress counters
      const newProcessed = uploadJob.progress.processed + 1;
      const newSuccessful = uploadJob.progress.successful + 
        (platformResults.failedPlatforms === 0 ? 1 : 0);
      const newFailed = uploadJob.progress.failed + 
        (platformResults.failedPlatforms > 0 ? 1 : 0);

      uploadJob.updateProgress(newProcessed, newSuccessful, newFailed);

      // Update platform statistics
      Object.entries(platformResults.platforms).forEach(([platform, stats]) => {
        const successful = stats.fetchStatus === 'success' ? 1 : 0;
        const failed = stats.fetchStatus === 'failed' ? 1 : 0;
        uploadJob.updatePlatformStats(platform, 1, successful, failed);
      });

      await uploadJob.save();

    } catch (error) {
      logger.error('❌ Failed to update upload job progress', {
        uploadJobId,
        error: error.message
      });
    }
  }

  /**
   * Update upload job with error
   */
  async updateUploadJobError(uploadJobId, regNo, errorMessage) {
    try {
      const uploadJob = await UploadJob.findOne({ jobId: uploadJobId });
      if (!uploadJob) {
        return;
      }

      uploadJob.addError('processing', errorMessage, null, regNo);
      await uploadJob.save();

    } catch (error) {
      logger.error('❌ Failed to update upload job error', {
        uploadJobId,
        regNo,
        error: error.message
      });
    }
  }

  /**
   * Get worker statistics
   */
  getStats() {
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    
    return {
      isRunning: this.isRunning,
      uptime,
      processedJobs: this.processedJobs,
      failedJobs: this.failedJobs,
      successRate: this.processedJobs > 0 
        ? Math.round(((this.processedJobs - this.failedJobs) / this.processedJobs) * 100)
        : 0,
      averageProcessingTime: this.processedJobs > 0 
        ? Math.round(uptime / this.processedJobs)
        : 0,
      concurrency: QUEUE_CONFIG.CONCURRENCY,
      startTime: this.startTime
    };
  }

  /**
   * Pause the worker
   */
  async pause() {
    try {
      if (this.worker) {
        await this.worker.pause();
        logger.info('⏸️ Worker paused');
      }
    } catch (error) {
      logger.error('❌ Failed to pause worker', { error: error.message });
    }
  }

  /**
   * Resume the worker
   */
  async resume() {
    try {
      if (this.worker) {
        await this.worker.resume();
        logger.info('▶️ Worker resumed');
      }
    } catch (error) {
      logger.error('❌ Failed to resume worker', { error: error.message });
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      logger.info('🔄 Shutting down student worker...');
      
      this.isRunning = false;

      if (this.worker) {
        await this.worker.close();
        logger.info('🔒 Worker closed');
      }

      // Close database connection
      if (database.isHealthy()) {
        await database.gracefulShutdown();
      }

      // Close Redis connection
      if (redisClient.isConnected) {
        await redisClient.gracefulShutdown();
      }

      const stats = this.getStats();
      logger.info('📊 Final worker statistics', stats);

      logger.info('✅ Student worker shut down gracefully');
      process.exit(0);

    } catch (error) {
      logger.error('❌ Error during worker shutdown', { error: error.message });
      process.exit(1);
    }
  }
}

// Create and export worker instance
const studentWorker = new StudentWorker();

// Start worker if this file is run directly
if (require.main === module) {
  studentWorker.start().catch(error => {
    logger.error('💀 Failed to start worker', { error: error.message });
    process.exit(1);
  });
}

module.exports = studentWorker;