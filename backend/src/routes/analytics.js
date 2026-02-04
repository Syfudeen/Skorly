const express = require('express');

// Import models
const PerformanceHistory = require('../models/PerformanceHistory');
const Student = require('../models/Student');
const PlatformStats = require('../models/PlatformStats');

// Import services
const comparisonService = require('../services/comparisonService');

// Import middleware
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { readLimiter } = require('../middleware/rateLimiter');
const {
  validateAnalyticsQuery,
  validateDateRange,
  handleValidationErrors
} = require('../middleware/validation');

// Import utilities
const logger = require('../utils/logger');
const { HTTP_STATUS, PLATFORMS } = require('../utils/constants');

const router = express.Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics
 * @access  Public
 */
router.get(
  '/dashboard',
  readLimiter,
  catchAsync(async (req, res) => {
    // Get latest upload job
    const latestHistories = await PerformanceHistory.aggregate([
      {
        $sort: { uploadDate: -1 }
      },
      {
        $limit: 1
      }
    ]);

    if (latestHistories.length === 0) {
      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          message: 'No data available yet. Please upload student data first.',
          hasData: false
        },
        timestamp: new Date().toISOString()
      });
    }

    const latestUploadJobId = latestHistories[0].uploadJobId;

    // Get all students from latest upload
    const currentWeekData = await PerformanceHistory.find({
      uploadJobId: latestUploadJobId
    });

    // Calculate overall statistics
    const totalStudents = currentWeekData.length;
    const averageScore = totalStudents > 0
      ? Math.round(
          currentWeekData.reduce((sum, h) => sum + h.overallScore, 0) / totalStudents
        )
      : 0;

    // Performance level distribution
    const performanceLevels = {
      high: currentWeekData.filter(h => h.performanceLevel === 'high').length,
      medium: currentWeekData.filter(h => h.performanceLevel === 'medium').length,
      low: currentWeekData.filter(h => h.performanceLevel === 'low').length
    };

    // Top performers
    const topPerformers = currentWeekData
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5)
      .map(h => ({
        regNo: h.regNo,
        overallScore: h.overallScore,
        performanceLevel: h.performanceLevel,
        weekLabel: h.weekLabel
      }));

    // Platform-wise statistics
    const platformStats = {};
    Object.values(PLATFORMS).forEach(platform => {
      const platformData = currentWeekData
        .map(h => h.platformStats.find(p => p.platform === platform))
        .filter(Boolean)
        .filter(p => p.fetchStatus === 'success');

      if (platformData.length > 0) {
        platformStats[platform] = {
          totalStudents: platformData.length,
          averageRating: Math.round(
            platformData.reduce((sum, p) => sum + (p.rating || 0), 0) / platformData.length
          ),
          averageProblems: Math.round(
            platformData.reduce((sum, p) => sum + (p.problemsSolved || 0), 0) / platformData.length
          ),
          totalProblems: platformData.reduce((sum, p) => sum + (p.problemsSolved || 0), 0)
        };
      }
    });

    // Get comparison summary
    const comparisonSummary = await comparisonService.generateComparisonSummary(latestUploadJobId);

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        hasData: true,
        overview: {
          totalStudents,
          averageScore,
          weekInfo: {
            weekNumber: latestHistories[0].weekNumber,
            weekLabel: latestHistories[0].weekLabel,
            uploadDate: latestHistories[0].uploadDate
          }
        },
        performanceLevels,
        topPerformers,
        platformStats,
        comparison: {
          improvements: comparisonSummary.improvements,
          declines: comparisonSummary.declines,
          stable: comparisonSummary.stable,
          newStudents: comparisonSummary.newStudents,
          averageScoreChange: comparisonSummary.averageScoreChange,
          topImprovers: comparisonSummary.topImprovers.slice(0, 3),
          topDecliners: comparisonSummary.topDecliners.slice(0, 3)
        }
      },
      timestamp: new Date().toISOString()
    });

    logger.debug('📊 Dashboard analytics retrieved', {
      totalStudents,
      averageScore,
      weekLabel: latestHistories[0].weekLabel
    });
  })
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get performance trends over time
 * @access  Public
 */
router.get(
  '/trends',
  readLimiter,
  validateDateRange(),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { startDate, endDate, limit = 10 } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.uploadDate = {};
      if (startDate) query.uploadDate.$gte = new Date(startDate);
      if (endDate) query.uploadDate.$lte = new Date(endDate);
    }

    // Get weekly aggregated data
    const weeklyData = await PerformanceHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            weekNumber: '$weekNumber',
            weekLabel: '$weekLabel',
            uploadDate: '$uploadDate'
          },
          averageScore: { $avg: '$overallScore' },
          maxScore: { $max: '$overallScore' },
          minScore: { $min: '$overallScore' },
          totalStudents: { $sum: 1 },
          highPerformers: {
            $sum: { $cond: [{ $eq: ['$performanceLevel', 'high'] }, 1, 0] }
          },
          mediumPerformers: {
            $sum: { $cond: [{ $eq: ['$performanceLevel', 'medium'] }, 1, 0] }
          },
          lowPerformers: {
            $sum: { $cond: [{ $eq: ['$performanceLevel', 'low'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.uploadDate': -1 } },
      { $limit: parseInt(limit) }
    ]);

    const trends = weeklyData.reverse().map(week => ({
      weekNumber: week._id.weekNumber,
      weekLabel: week._id.weekLabel,
      uploadDate: week._id.uploadDate,
      averageScore: Math.round(week.averageScore),
      maxScore: week.maxScore,
      minScore: week.minScore,
      totalStudents: week.totalStudents,
      performanceLevels: {
        high: week.highPerformers,
        medium: week.mediumPerformers,
        low: week.lowPerformers
      }
    }));

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        trends,
        summary: {
          totalWeeks: trends.length,
          overallTrend: trends.length >= 2
            ? trends[trends.length - 1].averageScore > trends[0].averageScore
              ? 'improving'
              : trends[trends.length - 1].averageScore < trends[0].averageScore
              ? 'declining'
              : 'stable'
            : 'insufficient_data'
        }
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/analytics/platforms
 * @desc    Get platform-wise analytics
 * @access  Public
 */
router.get(
  '/platforms',
  readLimiter,
  catchAsync(async (req, res) => {
    const { platform } = req.query;

    // Get latest performance histories
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
      }
    ]);

    const platformAnalytics = {};

    // Analyze each platform
    const platforms = platform ? [platform] : Object.values(PLATFORMS);

    platforms.forEach(platformName => {
      const platformData = latestHistories
        .map(h => h.platformStats.find(p => p.platform === platformName))
        .filter(Boolean)
        .filter(p => p.fetchStatus === 'success');

      if (platformData.length > 0) {
        // Calculate statistics
        const ratings = platformData.map(p => p.rating || 0);
        const problems = platformData.map(p => p.problemsSolved || 0);
        const contests = platformData.map(p => p.contestsParticipated || 0);

        platformAnalytics[platformName] = {
          totalStudents: platformData.length,
          rating: {
            average: Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length),
            max: Math.max(...ratings),
            min: Math.min(...ratings),
            median: ratings.sort((a, b) => a - b)[Math.floor(ratings.length / 2)]
          },
          problemsSolved: {
            average: Math.round(problems.reduce((a, b) => a + b, 0) / problems.length),
            total: problems.reduce((a, b) => a + b, 0),
            max: Math.max(...problems),
            min: Math.min(...problems)
          },
          contests: {
            average: Math.round(contests.reduce((a, b) => a + b, 0) / contests.length),
            total: contests.reduce((a, b) => a + b, 0),
            max: Math.max(...contests)
          },
          distribution: {
            expert: platformData.filter(p => (p.rating || 0) >= 2000).length,
            advanced: platformData.filter(p => (p.rating || 0) >= 1600 && (p.rating || 0) < 2000).length,
            intermediate: platformData.filter(p => (p.rating || 0) >= 1200 && (p.rating || 0) < 1600).length,
            beginner: platformData.filter(p => (p.rating || 0) < 1200).length
          }
        };
      }
    });

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        platforms: platformAnalytics,
        summary: {
          totalPlatforms: Object.keys(platformAnalytics).length,
          mostPopular: Object.entries(platformAnalytics)
            .sort((a, b) => b[1].totalStudents - a[1].totalStudents)[0]?.[0] || null
        }
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/analytics/leaderboard
 * @desc    Get leaderboard
 * @access  Public
 */
router.get(
  '/leaderboard',
  readLimiter,
  catchAsync(async (req, res) => {
    const { platform, limit = 20, department, year } = req.query;

    // Get latest performance histories
    let query = {};
    
    if (department) {
      const students = await Student.find({ 
        department: { $regex: department, $options: 'i' } 
      }).select('regNo');
      const regNos = students.map(s => s.regNo);
      query.regNo = { $in: regNos };
    }

    if (year) {
      const students = await Student.find({ 
        year: { $regex: year, $options: 'i' } 
      }).select('regNo');
      const regNos = students.map(s => s.regNo);
      query.regNo = query.regNo 
        ? { $in: query.regNo.$in.filter(r => regNos.includes(r)) }
        : { $in: regNos };
    }

    const latestHistories = await PerformanceHistory.aggregate([
      { $match: query },
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
        $sort: { overallScore: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Get student details
    const leaderboard = await Promise.all(
      latestHistories.map(async (history, index) => {
        const student = await Student.findByRegNo(history.regNo);
        
        let platformScore = null;
        if (platform) {
          const platformStat = history.platformStats.find(p => p.platform === platform);
          if (platformStat) {
            platformScore = {
              rating: platformStat.rating,
              problemsSolved: platformStat.problemsSolved,
              contestsParticipated: platformStat.contestsParticipated
            };
          }
        }

        return {
          rank: index + 1,
          regNo: history.regNo,
          name: student?.name || 'Unknown',
          department: student?.department || 'Unknown',
          year: student?.year || 'Unknown',
          overallScore: history.overallScore,
          performanceLevel: history.performanceLevel,
          activePlatforms: history.activePlatforms,
          platformScore: platform ? platformScore : null,
          weekInfo: {
            weekLabel: history.weekLabel,
            uploadDate: history.uploadDate
          }
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        leaderboard,
        filters: {
          platform: platform || 'overall',
          department: department || 'all',
          year: year || 'all',
          limit: parseInt(limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/analytics/comparison/:uploadJobId
 * @desc    Get comparison analytics for a specific upload
 * @access  Public
 */
router.get(
  '/comparison/:uploadJobId',
  readLimiter,
  catchAsync(async (req, res) => {
    const { uploadJobId } = req.params;

    const comparisonSummary = await comparisonService.generateComparisonSummary(uploadJobId);

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: comparisonSummary,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/analytics/departments
 * @desc    Get department-wise analytics
 * @access  Public
 */
router.get(
  '/departments',
  readLimiter,
  catchAsync(async (req, res) => {
    // Get all departments
    const departments = await Student.distinct('department', { isActive: true });

    const departmentAnalytics = await Promise.all(
      departments.map(async (department) => {
        const students = await Student.find({ 
          department,
          isActive: true 
        }).select('regNo');
        
        const regNos = students.map(s => s.regNo);

        // Get latest performance for department students
        const performances = await PerformanceHistory.aggregate([
          { $match: { regNo: { $in: regNos } } },
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
          }
        ]);

        if (performances.length === 0) {
          return {
            department,
            totalStudents: students.length,
            averageScore: 0,
            performanceLevels: { high: 0, medium: 0, low: 0 }
          };
        }

        const averageScore = Math.round(
          performances.reduce((sum, p) => sum + p.overallScore, 0) / performances.length
        );

        const performanceLevels = {
          high: performances.filter(p => p.performanceLevel === 'high').length,
          medium: performances.filter(p => p.performanceLevel === 'medium').length,
          low: performances.filter(p => p.performanceLevel === 'low').length
        };

        return {
          department,
          totalStudents: students.length,
          averageScore,
          performanceLevels,
          topPerformer: performances.sort((a, b) => b.overallScore - a.overallScore)[0]?.regNo || null
        };
      })
    );

    // Sort by average score
    departmentAnalytics.sort((a, b) => b.averageScore - a.averageScore);

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        departments: departmentAnalytics,
        summary: {
          totalDepartments: departments.length,
          topDepartment: departmentAnalytics[0]?.department || null,
          overallAverage: Math.round(
            departmentAnalytics.reduce((sum, d) => sum + d.averageScore, 0) / 
            departmentAnalytics.length
          )
        }
      },
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;