const express = require('express');

// Import models
const UploadJob = require('../models/UploadJob');

// Import middleware
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { readLimiter } = require('../middleware/rateLimiter');
const { validateJobId, handleValidationErrors } = require('../middleware/validation');

// Import utilities
const logger = require('../utils/logger');
const { formatFileSize, formatDuration } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');
const queueManager = require('../config/queue');

const router = express.Router();

/**
 * @route   GET /api/jobs/:jobId
 * @desc    Get job progress and status
 * @access  Public
 */
router.get(
  '/:jobId',
  readLimiter,
  validateJobId(),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { jobId } = req.params;

    const uploadJob = await UploadJob.findOne({ jobId });

    if (!uploadJob) {
      throw new AppError('Job not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get queue statistics for this job
    const queueJobs = await queueManager.getJobsByUploadId(jobId);
    const queueStats = {
      total: queueJobs.length,
      waiting: queueJobs.filter(j => j.processedOn === undefined).length,
      active: queueJobs.filter(j => j.processedOn && !j.finishedOn).length,
      completed: queueJobs.filter(j => j.finishedOn && !j.failedReason).length,
      failed: queueJobs.filter(j => j.failedReason).length
    };

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        job: {
          id: uploadJob._id,
          jobId: uploadJob.jobId,
          fileName: uploadJob.originalName,
          fileSize: formatFileSize(uploadJob.fileSize),
          status: uploadJob.status,
          progress: {
            ...uploadJob.progress,
            percentage: uploadJob.completionPercentage
          },
          studentsData: uploadJob.studentsData,
          weekInfo: uploadJob.weekInfo,
          processingStats: {
            ...uploadJob.processingStats,
            duration: uploadJob.processingStats.duration 
              ? formatDuration(uploadJob.processingStats.duration)
              : null,
            averageProcessingTime: uploadJob.processingStats.averageProcessingTime
              ? formatDuration(uploadJob.processingStats.averageProcessingTime)
              : null
          },
          platformStats: uploadJob.platformStats,
          successRate: uploadJob.successRate,
          createdAt: uploadJob.createdAt,
          updatedAt: uploadJob.updatedAt
        },
        queue: queueStats,
        errors: uploadJob.errors.slice(-10), // Last 10 errors
        isComplete: uploadJob.status === 'completed' || uploadJob.status === 'failed',
        estimatedTimeRemaining: uploadJob.status === 'processing' && uploadJob.progress.processed > 0
          ? formatDuration(
              (uploadJob.processingStats.averageProcessingTime || 2000) * 
              (uploadJob.progress.total - uploadJob.progress.processed)
            )
          : null
      },
      timestamp: new Date().toISOString()
    });

    logger.debug('📊 Job progress retrieved', { jobId, status: uploadJob.status });
  })
);

/**
 * @route   GET /api/jobs/:jobId/detailed
 * @desc    Get detailed job information including all errors
 * @access  Public
 */
router.get(
  '/:jobId/detailed',
  readLimiter,
  validateJobId(),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { jobId } = req.params;

    const uploadJob = await UploadJob.findOne({ jobId });

    if (!uploadJob) {
      throw new AppError('Job not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        job: {
          id: uploadJob._id,
          jobId: uploadJob.jobId,
          fileName: uploadJob.originalName,
          fileSize: formatFileSize(uploadJob.fileSize),
          status: uploadJob.status,
          progress: uploadJob.progress,
          studentsData: uploadJob.studentsData,
          weekInfo: uploadJob.weekInfo,
          processingStats: {
            ...uploadJob.processingStats,
            duration: uploadJob.processingStats.duration 
              ? formatDuration(uploadJob.processingStats.duration)
              : null,
            durationFormatted: uploadJob.processingDurationFormatted
          },
          platformStats: uploadJob.platformStats,
          errors: uploadJob.errors,
          metadata: uploadJob.metadata,
          createdAt: uploadJob.createdAt,
          updatedAt: uploadJob.updatedAt
        }
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/jobs/:jobId/errors
 * @desc    Get all errors for a job
 * @access  Public
 */
router.get(
  '/:jobId/errors',
  readLimiter,
  validateJobId(),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { jobId } = req.params;
    const { type, platform, page = 1, limit = 20 } = req.query;

    const uploadJob = await UploadJob.findOne({ jobId });

    if (!uploadJob) {
      throw new AppError('Job not found', HTTP_STATUS.NOT_FOUND);
    }

    let errors = uploadJob.errors;

    // Filter by type
    if (type) {
      errors = errors.filter(error => error.type === type);
    }

    // Filter by platform
    if (platform) {
      errors = errors.filter(error => error.platform === platform);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedErrors = errors.slice(skip, skip + parseInt(limit));

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        errors: paginatedErrors,
        summary: {
          total: errors.length,
          byType: uploadJob.errors.reduce((acc, error) => {
            acc[error.type] = (acc[error.type] || 0) + 1;
            return acc;
          }, {}),
          byPlatform: uploadJob.errors
            .filter(e => e.platform)
            .reduce((acc, error) => {
              acc[error.platform] = (acc[error.platform] || 0) + 1;
              return acc;
            }, {})
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: errors.length,
          pages: Math.ceil(errors.length / parseInt(limit))
        }
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   POST /api/jobs/:jobId/cancel
 * @desc    Cancel a running job
 * @access  Public
 */
router.post(
  '/:jobId/cancel',
  validateJobId(),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { jobId } = req.params;

    const uploadJob = await UploadJob.findOne({ jobId });

    if (!uploadJob) {
      throw new AppError('Job not found', HTTP_STATUS.NOT_FOUND);
    }

    if (uploadJob.status === 'completed' || uploadJob.status === 'failed') {
      throw new AppError('Cannot cancel a completed or failed job', HTTP_STATUS.BAD_REQUEST);
    }

    // Cancel queue jobs
    await queueManager.cancelJobsByUploadId(jobId);

    // Update job status
    uploadJob.status = 'cancelled';
    uploadJob.processingStats.endTime = new Date();
    if (uploadJob.processingStats.startTime) {
      uploadJob.processingStats.duration = 
        uploadJob.processingStats.endTime - uploadJob.processingStats.startTime;
    }
    await uploadJob.save();

    logger.info('🚫 Job cancelled', { jobId });

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      message: 'Job cancelled successfully',
      data: {
        jobId: uploadJob.jobId,
        status: uploadJob.status,
        progress: uploadJob.progress
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering
 * @access  Public
 */
router.get(
  '/',
  readLimiter,
  catchAsync(async (req, res) => {
    const { 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const [jobs, total] = await Promise.all([
      UploadJob.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-errors -metadata'),
      UploadJob.countDocuments(query)
    ]);

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        jobs: jobs.map(job => ({
          id: job._id,
          jobId: job.jobId,
          fileName: job.originalName,
          fileSize: formatFileSize(job.fileSize),
          status: job.status,
          progress: job.progress,
          studentsData: job.studentsData,
          weekInfo: job.weekInfo,
          processingStats: {
            ...job.processingStats,
            duration: job.processingStats.duration 
              ? formatDuration(job.processingStats.duration)
              : null
          },
          successRate: job.successRate,
          completionPercentage: job.completionPercentage,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/jobs/stats
 * @desc    Get overall job statistics
 * @access  Public
 */
router.get(
  '/stats/overview',
  readLimiter,
  catchAsync(async (req, res) => {
    const stats = await UploadJob.getJobStatistics();
    const queueStats = await queueManager.getQueueStats();

    const totalJobs = await UploadJob.countDocuments();
    const activeJobs = await UploadJob.countDocuments({ 
      status: { $in: ['pending', 'processing'] } 
    });
    const completedJobs = await UploadJob.countDocuments({ status: 'completed' });
    const failedJobs = await UploadJob.countDocuments({ status: 'failed' });

    // Calculate average success rate
    const jobsWithProgress = await UploadJob.find({ 
      'progress.processed': { $gt: 0 } 
    }).select('progress');
    
    const avgSuccessRate = jobsWithProgress.length > 0
      ? Math.round(
          jobsWithProgress.reduce((sum, job) => {
            return sum + (job.progress.successful / job.progress.processed) * 100;
          }, 0) / jobsWithProgress.length
        )
      : 0;

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        jobs: {
          total: totalJobs,
          active: activeJobs,
          completed: completedJobs,
          failed: failedJobs,
          averageSuccessRate: avgSuccessRate
        },
        queue: queueStats,
        statistics: stats
      },
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;