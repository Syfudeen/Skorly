const express = require('express');
const router = express.Router();

const scheduledScraper = require('../services/scheduledScraper');
const { catchAsync } = require('../middleware/errorHandler');
const { readLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * @route   POST /api/scraper/trigger
 * @desc    Manually trigger weekly scraping
 * @access  Public (should be protected in production)
 */
router.post(
  '/trigger',
  readLimiter,
  catchAsync(async (req, res) => {
    logger.info('Manual scrape triggered via API');

    // Trigger scrape in background
    scheduledScraper.triggerManualScrape().catch(error => {
      logger.error('Manual scrape failed:', error);
    });

    res.status(HTTP_STATUS.ACCEPTED).json({
      status: 'success',
      message: 'Weekly scraping started. This will take a few minutes.',
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/scraper/status
 * @desc    Get scraper status
 * @access  Public
 */
router.get(
  '/status',
  readLimiter,
  catchAsync(async (req, res) => {
    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        isRunning: scheduledScraper.isRunning,
        message: scheduledScraper.isRunning 
          ? 'Scraping in progress...' 
          : 'Scraper is idle. Scheduled to run every Sunday at 11:59 PM'
      },
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;
