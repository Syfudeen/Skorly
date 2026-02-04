const express = require('express');

// Import models
const Student = require('../models/Student');
const PlatformStats = require('../models/PlatformStats');
const PerformanceHistory = require('../models/PerformanceHistory');

// Import services
const comparisonService = require('../services/comparisonService');

// Import middleware
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { readLimiter } = require('../middleware/rateLimiter');
const {
  validatePagination,
  validateSearch,
  validatePlatformFilter,
  validatePerformanceLevelFilter,
  validateTrendFilter,
  handleValidationErrors
} = require('../middleware/validation');

// Import utilities
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

const router = express.Router();

/**
 * @route   GET /api/students
 * @desc    Get all students with filtering and pagination
 * @access  Public
 */
router.get(
  '/',
  readLimiter,
  validatePagination(),
  validateSearch(),
  validatePlatformFilter(),
  validatePerformanceLevelFilter(),
  validateTrendFilter(),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      sort = '-lastUpdated',
      search,
      department,
      year,
      platforms,
      isActive = 'true'
    } = req.query;

    // Build query
    const query = {};

    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { regNo: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    if (year) {
      query.year = { $regex: year, $options: 'i' };
    }

    if (platforms) {
      const platformArray = Array.isArray(platforms) ? platforms : [platforms];
      const platformQueries = platformArray.map(platform => ({
        [`platformIds.${platform}`]: { $ne: null, $ne: '' }
      }));
      query.$and = platformQueries;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [students, total] = await Promise.all([
      Student.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Student.countDocuments(query)
    ]);

    // Get latest performance data for each student
    const studentsWithPerformance = await Promise.all(
      students.map(async (student) => {
        const latestPerformance = await PerformanceHistory.findLatestByRegNo(student.regNo);
        
        return {
          ...student,
          performance: latestPerformance ? {
            overallScore: latestPerformance.overallScore,
            performanceLevel: latestPerformance.performanceLevel,
            platformStats: latestPerformance.platformStats,
            weekInfo: {
              weekNumber: latestPerformance.weekNumber,
              weekLabel: latestPerformance.weekLabel,
              uploadDate: latestPerformance.uploadDate
            },
            lastUpdated: latestPerformance.updatedAt
          } : null
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        students: studentsWithPerformance,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      timestamp: new Date().toISOString()
    });

    logger.debug('📋 Students list retrieved', {
      count: students.length,
      total,
      page,
      filters: { search, department, year, platforms }
    });
  })
);

/**
 * @route   GET /api/students/:regNo
 * @desc    Get specific student details
 * @access  Public
 */
router.get(
  '/:regNo',
  readLimiter,
  catchAsync(async (req, res) => {
    const { regNo } = req.params;

    const student = await Student.findByRegNo(regNo);

    if (!student) {
      throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get platform stats
    const platformStats = await PlatformStats.findByRegNo(regNo);

    // Get performance history (last 10 entries)
    const performanceHistory = await PerformanceHistory.findByRegNo(regNo, 10);

    // Get detailed comparison
    const detailedComparison = await comparisonService.getStudentDetailedComparison(regNo, 5);

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        student: {
          ...student.toObject(),
          activePlatformCount: student.activePlatformCount
        },
        platformStats: platformStats.map(stat => ({
          platform: stat.platform,
          platformUserId: stat.platformUserId,
          currentStats: stat.currentStats,
          previousStats: stat.previousStats,
          changes: stat.changes,
          trend: stat.trend,
          performanceLevel: stat.performanceLevel,
          lastFetched: stat.lastFetched,
          fetchStatus: stat.fetchStatus
        })),
        performanceHistory: performanceHistory.map(history => ({
          weekNumber: history.weekNumber,
          weekLabel: history.weekLabel,
          uploadDate: history.uploadDate,
          overallScore: history.overallScore,
          performanceLevel: history.performanceLevel,
          platformStats: history.platformStats,
          activePlatforms: history.activePlatforms,
          totalPlatforms: history.totalPlatforms
        })),
        analysis: detailedComparison ? {
          trends: detailedComparison.trends,
          progressAnalysis: detailedComparison.progressAnalysis
        } : null
      },
      timestamp: new Date().toISOString()
    });

    logger.debug('👤 Student details retrieved', { regNo });
  })
);

/**
 * @route   GET /api/students/:regNo/platforms/:platform
 * @desc    Get specific platform stats for a student
 * @access  Public
 */
router.get(
  '/:regNo/platforms/:platform',
  readLimiter,
  catchAsync(async (req, res) => {
    const { regNo, platform } = req.params;

    const student = await Student.findByRegNo(regNo);
    if (!student) {
      throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
    }

    const platformStats = await PlatformStats.findOne({
      regNo: regNo.toUpperCase(),
      platform: platform.toLowerCase()
    });

    if (!platformStats) {
      throw new AppError(`No stats found for ${platform}`, HTTP_STATUS.NOT_FOUND);
    }

    // Get historical data for this platform
    const histories = await PerformanceHistory.find({
      regNo: regNo.toUpperCase()
    })
    .sort({ uploadDate: -1 })
    .limit(10);

    const platformHistory = histories
      .map(h => {
        const platformStat = h.platformStats.find(p => p.platform === platform.toLowerCase());
        return platformStat ? {
          weekNumber: h.weekNumber,
          weekLabel: h.weekLabel,
          uploadDate: h.uploadDate,
          ...platformStat.toObject()
        } : null;
      })
      .filter(Boolean);

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        student: {
          regNo: student.regNo,
          name: student.name,
          platformId: student.platformIds[platform]
        },
        currentStats: {
          platform: platformStats.platform,
          platformUserId: platformStats.platformUserId,
          currentStats: platformStats.currentStats,
          previousStats: platformStats.previousStats,
          changes: platformStats.changes,
          trend: platformStats.trend,
          performanceLevel: platformStats.performanceLevel,
          lastFetched: platformStats.lastFetched,
          fetchStatus: platformStats.fetchStatus
        },
        history: platformHistory
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/students/:regNo/comparison
 * @desc    Get comparison data for a student
 * @access  Public
 */
router.get(
  '/:regNo/comparison',
  readLimiter,
  catchAsync(async (req, res) => {
    const { regNo } = req.params;
    const { limit = 5 } = req.query;

    const student = await Student.findByRegNo(regNo);
    if (!student) {
      throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
    }

    const comparison = await comparisonService.getStudentDetailedComparison(
      regNo,
      parseInt(limit)
    );

    if (!comparison) {
      throw new AppError('No comparison data available', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: comparison,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/students/department/:department
 * @desc    Get students by department
 * @access  Public
 */
router.get(
  '/department/:department',
  readLimiter,
  validatePagination(),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { department } = req.params;
    const { page = 1, limit = 20, sort = '-lastUpdated' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, total] = await Promise.all([
      Student.find({ 
        department: { $regex: department, $options: 'i' },
        isActive: true
      })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Student.countDocuments({ 
        department: { $regex: department, $options: 'i' },
        isActive: true
      })
    ]);

    // Get latest performance for each student
    const studentsWithPerformance = await Promise.all(
      students.map(async (student) => {
        const latestPerformance = await PerformanceHistory.findLatestByRegNo(student.regNo);
        return {
          ...student,
          performance: latestPerformance ? {
            overallScore: latestPerformance.overallScore,
            performanceLevel: latestPerformance.performanceLevel
          } : null
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        department,
        students: studentsWithPerformance,
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
 * @route   GET /api/students/stats/summary
 * @desc    Get overall student statistics
 * @access  Public
 */
router.get(
  '/stats/summary',
  readLimiter,
  catchAsync(async (req, res) => {
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalInactive = await Student.countDocuments({ isActive: false });

    // Get department distribution
    const departmentStats = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get year distribution
    const yearStats = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get platform distribution
    const platformStats = {};
    const platforms = ['codeforces', 'codechef', 'leetcode', 'atcoder', 'codolio', 'github'];
    
    for (const platform of platforms) {
      const count = await Student.countDocuments({
        [`platformIds.${platform}`]: { $ne: null, $ne: '' },
        isActive: true
      });
      platformStats[platform] = count;
    }

    // Get performance level distribution
    const latestHistories = await PerformanceHistory.aggregate([
      {
        $sort: { regNo: 1, uploadDate: -1 }
      },
      {
        $group: {
          _id: '$regNo',
          latestHistory: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestHistory' }
      },
      {
        $group: {
          _id: '$performanceLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const performanceLevelStats = {
      high: 0,
      medium: 0,
      low: 0
    };

    latestHistories.forEach(stat => {
      performanceLevelStats[stat._id] = stat.count;
    });

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        overview: {
          totalStudents,
          activeStudents: totalStudents,
          inactiveStudents: totalInactive
        },
        departments: departmentStats.map(d => ({
          department: d._id,
          count: d.count,
          percentage: ((d.count / totalStudents) * 100).toFixed(2)
        })),
        years: yearStats.map(y => ({
          year: y._id,
          count: y.count,
          percentage: ((y.count / totalStudents) * 100).toFixed(2)
        })),
        platforms: Object.entries(platformStats).map(([platform, count]) => ({
          platform,
          count,
          percentage: ((count / totalStudents) * 100).toFixed(2)
        })),
        performanceLevels: Object.entries(performanceLevelStats).map(([level, count]) => ({
          level,
          count,
          percentage: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(2) : '0.00'
        }))
      },
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;