/**
 * Scheduled Scraper Service
 * Automatically scrapes student data weekly for comparison
 */

const cron = require('node-cron');
const Student = require('../models/Student');
const PerformanceHistory = require('../models/PerformanceHistory');
const logger = require('../utils/logger');
const { generateJobId } = require('../utils/helpers');
const { generateWeekInfo } = require('../utils/helpers');
const platformService = require('./platformService');
const { PLATFORMS } = require('../utils/constants');

class ScheduledScraperService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Scrape data for a single student
   */
  async scrapeStudentData(student) {
    const platformResults = {};

    // Scrape each platform if student has an ID
    const platforms = [
      { key: 'codechef', id: student.platformIds.codechef, platform: PLATFORMS.CODECHEF },
      { key: 'leetcode', id: student.platformIds.leetcode, platform: PLATFORMS.LEETCODE },
      { key: 'codeforces', id: student.platformIds.codeforces, platform: PLATFORMS.CODEFORCES },
      { key: 'atcoder', id: student.platformIds.atcoder, platform: PLATFORMS.ATCODER },
      { key: 'github', id: student.platformIds.github, platform: PLATFORMS.GITHUB }
    ];

    for (const { key, id, platform } of platforms) {
      if (id) {
        try {
          const stats = await platformService.fetchPlatformStats(platform, id);
          platformResults[key] = stats;
        } catch (error) {
          logger.error(`Failed to scrape ${platform} for ${student.regNo}:`, error.message);
          platformResults[key] = null;
        }
      }
    }

    return platformResults;
  }

  /**
   * Calculate overall score from platform results
   */
  calculateOverallScore(platformResults) {
    let totalScore = 0;
    let platformCount = 0;

    Object.entries(platformResults).forEach(([platform, data]) => {
      if (data && data.rating) {
        totalScore += data.rating;
        platformCount++;
      }
    });

    return platformCount > 0 ? Math.round(totalScore / platformCount) : 0;
  }

  /**
   * Determine performance level
   */
  getPerformanceLevel(overallScore) {
    if (overallScore >= 1500) return 'high';
    if (overallScore >= 1000) return 'medium';
    return 'low';
  }

  /**
   * Save scraped data to performance history
   */
  async savePerformanceHistory(student, platformResults, uploadJobId, weekInfo) {
    const platformStats = [];

    Object.entries(platformResults).forEach(([platform, data]) => {
      if (data) {
        platformStats.push({
          platform,
          rating: data.rating || 0,
          maxRating: data.maxRating || data.rating || 0,
          problemsSolved: data.problemsSolved || 0,
          contestsParticipated: data.contestsParticipated || 0,
          rank: data.rank || null,
          fetchStatus: 'success'
        });
      }
    });

    const overallScore = this.calculateOverallScore(platformResults);
    const performanceLevel = this.getPerformanceLevel(overallScore);

    const performanceHistory = new PerformanceHistory({
      regNo: student.regNo,
      uploadJobId,
      weekNumber: weekInfo.weekNumber,
      weekLabel: weekInfo.weekLabel,
      uploadDate: weekInfo.uploadDate,
      platformStats,
      overallScore,
      performanceLevel,
      totalPlatforms: Object.keys(student.platformIds).length,
      activePlatforms: platformStats.length
    });

    await performanceHistory.save();
    logger.info(`Saved performance history for ${student.regNo} - Week ${weekInfo.weekNumber}`);
  }

  /**
   * Run weekly scraping for all students
   */
  async runWeeklyScrape() {
    if (this.isRunning) {
      logger.warn('Weekly scrape already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('🚀 Starting weekly automatic scrape...');

      // Get all students from database
      const students = await Student.find({});
      
      if (students.length === 0) {
        logger.warn('No students found in database. Please upload student data first.');
        this.isRunning = false;
        return;
      }

      logger.info(`Found ${students.length} students to scrape`);

      // Generate job ID and week info
      const jobId = generateJobId();
      const weekInfo = await generateWeekInfo();

      logger.info(`Starting scrape for ${weekInfo.weekLabel} (Job: ${jobId})`);

      let successCount = 0;
      let failCount = 0;

      // Scrape each student
      for (const student of students) {
        try {
          logger.info(`Scraping data for ${student.name} (${student.regNo})...`);
          
          const platformResults = await this.scrapeStudentData(student);
          await this.savePerformanceHistory(student, platformResults, jobId, weekInfo);
          
          successCount++;
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          logger.error(`Failed to process ${student.regNo}:`, error.message);
          failCount++;
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      logger.info(`✅ Weekly scrape completed!`);
      logger.info(`   Week: ${weekInfo.weekLabel}`);
      logger.info(`   Success: ${successCount}/${students.length}`);
      logger.info(`   Failed: ${failCount}`);
      logger.info(`   Duration: ${duration}s`);

    } catch (error) {
      logger.error('❌ Weekly scrape failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the scheduled scraper
   * Runs every Sunday at 11:59 PM
   */
  start() {
    // Run every Sunday at 11:59 PM
    // Cron format: second minute hour day month weekday
    this.cronJob = cron.schedule('59 23 * * 0', async () => {
      logger.info('⏰ Scheduled weekly scrape triggered');
      await this.runWeeklyScrape();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // Adjust to your timezone
    });

    logger.info('📅 Scheduled scraper started - Will run every Sunday at 11:59 PM');
  }

  /**
   * Stop the scheduled scraper
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Scheduled scraper stopped');
    }
  }

  /**
   * Manually trigger a scrape (for testing or manual refresh)
   */
  async triggerManualScrape() {
    logger.info('🔄 Manual scrape triggered');
    await this.runWeeklyScrape();
  }
}

module.exports = new ScheduledScraperService();
