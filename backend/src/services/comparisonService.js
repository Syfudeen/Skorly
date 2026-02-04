const PlatformStats = require('../models/PlatformStats');
const PerformanceHistory = require('../models/PerformanceHistory');
const { calculateTrend, calculatePercentageChange, calculateOverallScore } = require('../utils/helpers');
const { TRENDS, PERFORMANCE_LEVELS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Comparison Service
 * Handles data comparison between current and previous snapshots
 */
class ComparisonService {
  constructor() {
    this.comparisonCache = new Map();
  }

  /**
   * Compare current stats with previous stats for a student
   */
  async compareStudentStats(regNo, currentStats, uploadJobId) {
    try {
      logger.info('🔄 Comparing student stats', { regNo, uploadJobId });

      // Get previous stats from database
      const previousStats = await this.getPreviousStats(regNo);
      
      const comparison = {
        regNo,
        uploadJobId,
        current: currentStats,
        previous: previousStats,
        changes: {},
        trends: {},
        improvements: [],
        declines: [],
        newPlatforms: [],
        overallChange: {
          rating: 0,
          problemsSolved: 0,
          contestsParticipated: 0,
          performanceLevel: PERFORMANCE_LEVELS.LOW,
          trend: TRENDS.STABLE
        }
      };

      // Compare each platform
      Object.entries(currentStats.platforms).forEach(([platform, currentPlatformStats]) => {
        const previousPlatformStats = previousStats.platforms[platform];
        
        const platformComparison = this.comparePlatformStats(
          platform,
          currentPlatformStats,
          previousPlatformStats
        );
        
        comparison.changes[platform] = platformComparison.changes;
        comparison.trends[platform] = platformComparison.trend;
        
        // Track improvements and declines
        if (platformComparison.trend === TRENDS.UP) {
          comparison.improvements.push({
            platform,
            metric: 'overall',
            change: platformComparison.changes.rating + platformComparison.changes.problemsSolved
          });
        } else if (platformComparison.trend === TRENDS.DOWN) {
          comparison.declines.push({
            platform,
            metric: 'overall',
            change: platformComparison.changes.rating + platformComparison.changes.problemsSolved
          });
        }
        
        // Check for new platforms
        if (!previousPlatformStats || previousPlatformStats.fetchStatus !== 'success') {
          comparison.newPlatforms.push(platform);
        }
      });

      // Calculate overall changes
      comparison.overallChange = this.calculateOverallChange(
        currentStats,
        previousStats
      );

      logger.info('✅ Student stats comparison completed', {
        regNo,
        improvements: comparison.improvements.length,
        declines: comparison.declines.length,
        newPlatforms: comparison.newPlatforms.length,
        overallTrend: comparison.overallChange.trend
      });

      return comparison;

    } catch (error) {
      logger.error('❌ Student stats comparison failed', {
        regNo,
        uploadJobId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Compare stats for a specific platform
   */
  comparePlatformStats(platform, currentStats, previousStats) {
    const comparison = {
      platform,
      changes: {
        rating: 0,
        maxRating: 0,
        problemsSolved: 0,
        contestsParticipated: 0,
        rank: 0
      },
      percentageChanges: {
        rating: 0,
        problemsSolved: 0,
        contestsParticipated: 0
      },
      trend: TRENDS.STABLE,
      isNewPlatform: false,
      hasImproved: false,
      hasDeclined: false
    };

    // If no previous stats, this is a new platform
    if (!previousStats || previousStats.fetchStatus !== 'success') {
      comparison.isNewPlatform = true;
      comparison.changes = {
        rating: currentStats.rating || 0,
        maxRating: currentStats.maxRating || 0,
        problemsSolved: currentStats.problemsSolved || 0,
        contestsParticipated: currentStats.contestsParticipated || 0,
        rank: 0
      };
      comparison.trend = currentStats.rating > 0 || currentStats.problemsSolved > 0 
        ? TRENDS.UP 
        : TRENDS.STABLE;
      return comparison;
    }

    // Calculate changes
    comparison.changes = {
      rating: (currentStats.rating || 0) - (previousStats.rating || 0),
      maxRating: (currentStats.maxRating || 0) - (previousStats.maxRating || 0),
      problemsSolved: (currentStats.problemsSolved || 0) - (previousStats.problemsSolved || 0),
      contestsParticipated: (currentStats.contestsParticipated || 0) - (previousStats.contestsParticipated || 0),
      rank: previousStats.rank && currentStats.rank 
        ? previousStats.rank - currentStats.rank // Positive means rank improved (lower number)
        : 0
    };

    // Calculate percentage changes
    comparison.percentageChanges = {
      rating: calculatePercentageChange(currentStats.rating, previousStats.rating),
      problemsSolved: calculatePercentageChange(currentStats.problemsSolved, previousStats.problemsSolved),
      contestsParticipated: calculatePercentageChange(currentStats.contestsParticipated, previousStats.contestsParticipated)
    };

    // Determine overall trend for this platform
    const ratingTrend = calculateTrend(currentStats.rating, previousStats.rating, 10);
    const problemsTrend = calculateTrend(currentStats.problemsSolved, previousStats.problemsSolved, 1);
    
    // Platform trend is positive if either rating or problems improved significantly
    if (ratingTrend === TRENDS.UP || problemsTrend === TRENDS.UP) {
      comparison.trend = TRENDS.UP;
      comparison.hasImproved = true;
    } else if (ratingTrend === TRENDS.DOWN && problemsTrend === TRENDS.DOWN) {
      comparison.trend = TRENDS.DOWN;
      comparison.hasDeclined = true;
    } else {
      comparison.trend = TRENDS.STABLE;
    }

    return comparison;
  }

  /**
   * Calculate overall change across all platforms
   */
  calculateOverallChange(currentStats, previousStats) {
    const overallChange = {
      rating: 0,
      problemsSolved: 0,
      contestsParticipated: 0,
      performanceLevel: PERFORMANCE_LEVELS.LOW,
      trend: TRENDS.STABLE,
      score: 0,
      previousScore: 0,
      scoreChange: 0
    };

    let totalCurrentRating = 0;
    let totalPreviousRating = 0;
    let totalCurrentProblems = 0;
    let totalPreviousProblems = 0;
    let totalCurrentContests = 0;
    let totalPreviousContests = 0;
    let activePlatforms = 0;

    // Sum up stats from all platforms
    Object.entries(currentStats.platforms).forEach(([platform, stats]) => {
      if (stats.fetchStatus === 'success') {
        totalCurrentRating += stats.rating || 0;
        totalCurrentProblems += stats.problemsSolved || 0;
        totalCurrentContests += stats.contestsParticipated || 0;
        activePlatforms++;
      }
    });

    Object.entries(previousStats.platforms).forEach(([platform, stats]) => {
      if (stats && stats.fetchStatus === 'success') {
        totalPreviousRating += stats.rating || 0;
        totalPreviousProblems += stats.problemsSolved || 0;
        totalPreviousContests += stats.contestsParticipated || 0;
      }
    });

    // Calculate changes
    overallChange.rating = totalCurrentRating - totalPreviousRating;
    overallChange.problemsSolved = totalCurrentProblems - totalPreviousProblems;
    overallChange.contestsParticipated = totalCurrentContests - totalPreviousContests;

    // Calculate overall scores
    overallChange.score = this.calculateStudentScore({
      platforms: currentStats.platforms
    });
    
    overallChange.previousScore = this.calculateStudentScore({
      platforms: previousStats.platforms
    });
    
    overallChange.scoreChange = overallChange.score - overallChange.previousScore;

    // Determine performance level
    overallChange.performanceLevel = this.getPerformanceLevel(overallChange.score);

    // Determine overall trend
    if (overallChange.scoreChange > 5) {
      overallChange.trend = TRENDS.UP;
    } else if (overallChange.scoreChange < -5) {
      overallChange.trend = TRENDS.DOWN;
    } else {
      overallChange.trend = TRENDS.STABLE;
    }

    return overallChange;
  }

  /**
   * Get previous stats for a student
   */
  async getPreviousStats(regNo) {
    try {
      // Get the most recent performance history (excluding current upload)
      const previousHistory = await PerformanceHistory.findOne({
        regNo: regNo.toUpperCase()
      })
      .sort({ uploadDate: -1 })
      .skip(1); // Skip the most recent (current) entry

      if (!previousHistory) {
        return {
          platforms: {},
          overallScore: 0,
          performanceLevel: PERFORMANCE_LEVELS.LOW
        };
      }

      // Convert performance history to stats format
      const platforms = {};
      previousHistory.platformStats.forEach(platformStat => {
        platforms[platformStat.platform] = {
          rating: platformStat.rating,
          maxRating: platformStat.maxRating,
          problemsSolved: platformStat.problemsSolved,
          contestsParticipated: platformStat.contestsParticipated,
          rank: platformStat.rank,
          fetchStatus: platformStat.fetchStatus
        };
      });

      return {
        platforms,
        overallScore: previousHistory.overallScore,
        performanceLevel: previousHistory.performanceLevel,
        uploadDate: previousHistory.uploadDate
      };

    } catch (error) {
      logger.error('❌ Failed to get previous stats', {
        regNo,
        error: error.message
      });
      
      // Return empty previous stats if error occurs
      return {
        platforms: {},
        overallScore: 0,
        performanceLevel: PERFORMANCE_LEVELS.LOW
      };
    }
  }

  /**
   * Calculate student score based on platform performance
   */
  calculateStudentScore(studentStats) {
    if (!studentStats.platforms || Object.keys(studentStats.platforms).length === 0) {
      return 0;
    }

    let totalScore = 0;
    let validPlatforms = 0;

    Object.values(studentStats.platforms).forEach(platform => {
      if (platform.fetchStatus === 'success') {
        // Weighted scoring
        const ratingScore = Math.min((platform.rating || 0) / 20, 40); // Max 40 points
        const problemsScore = Math.min((platform.problemsSolved || 0) / 5, 40); // Max 40 points
        const contestScore = Math.min((platform.contestsParticipated || 0) * 2, 20); // Max 20 points
        
        const platformScore = ratingScore + problemsScore + contestScore;
        totalScore += platformScore;
        validPlatforms++;
      }
    });

    return validPlatforms > 0 ? Math.round(totalScore / validPlatforms) : 0;
  }

  /**
   * Get performance level based on score
   */
  getPerformanceLevel(score) {
    if (score >= 80) {
      return PERFORMANCE_LEVELS.HIGH;
    } else if (score >= 50) {
      return PERFORMANCE_LEVELS.MEDIUM;
    } else {
      return PERFORMANCE_LEVELS.LOW;
    }
  }

  /**
   * Generate comparison summary for multiple students
   */
  async generateComparisonSummary(uploadJobId) {
    try {
      logger.info('📊 Generating comparison summary', { uploadJobId });

      const currentHistory = await PerformanceHistory.find({ uploadJobId });
      
      if (currentHistory.length === 0) {
        throw new Error('No performance history found for upload job');
      }

      const summary = {
        uploadJobId,
        totalStudents: currentHistory.length,
        improvements: 0,
        declines: 0,
        stable: 0,
        newStudents: 0,
        platformSummary: {},
        performanceLevelDistribution: {
          high: 0,
          medium: 0,
          low: 0
        },
        topImprovers: [],
        topDecliners: [],
        averageScoreChange: 0,
        totalScoreChange: 0
      };

      const scoreChanges = [];

      // Analyze each student
      for (const history of currentHistory) {
        const previousHistory = await PerformanceHistory.findOne({
          regNo: history.regNo,
          uploadJobId: { $ne: uploadJobId }
        }).sort({ uploadDate: -1 });

        let scoreChange = 0;
        let trend = TRENDS.STABLE;

        if (previousHistory) {
          scoreChange = history.overallScore - previousHistory.overallScore;
          trend = calculateTrend(history.overallScore, previousHistory.overallScore, 5);
        } else {
          summary.newStudents++;
          trend = TRENDS.UP; // New students are considered improvements
        }

        scoreChanges.push({
          regNo: history.regNo,
          name: history.regNo, // You might want to get actual name from Student model
          scoreChange,
          currentScore: history.overallScore,
          previousScore: previousHistory?.overallScore || 0,
          trend
        });

        // Count trends
        switch (trend) {
          case TRENDS.UP:
            summary.improvements++;
            break;
          case TRENDS.DOWN:
            summary.declines++;
            break;
          default:
            summary.stable++;
        }

        // Count performance levels
        summary.performanceLevelDistribution[history.performanceLevel]++;

        // Analyze platform performance
        history.platformStats.forEach(platformStat => {
          if (!summary.platformSummary[platformStat.platform]) {
            summary.platformSummary[platformStat.platform] = {
              totalStudents: 0,
              successfulFetches: 0,
              averageRating: 0,
              averageProblems: 0,
              totalRating: 0,
              totalProblems: 0
            };
          }

          const platformSummary = summary.platformSummary[platformStat.platform];
          platformSummary.totalStudents++;

          if (platformStat.fetchStatus === 'success') {
            platformSummary.successfulFetches++;
            platformSummary.totalRating += platformStat.rating || 0;
            platformSummary.totalProblems += platformStat.problemsSolved || 0;
          }
        });
      }

      // Calculate averages for platforms
      Object.values(summary.platformSummary).forEach(platformSummary => {
        if (platformSummary.successfulFetches > 0) {
          platformSummary.averageRating = Math.round(
            platformSummary.totalRating / platformSummary.successfulFetches
          );
          platformSummary.averageProblems = Math.round(
            platformSummary.totalProblems / platformSummary.successfulFetches
          );
        }
      });

      // Calculate overall score changes
      summary.totalScoreChange = scoreChanges.reduce((sum, change) => sum + change.scoreChange, 0);
      summary.averageScoreChange = summary.totalStudents > 0 
        ? Math.round(summary.totalScoreChange / summary.totalStudents) 
        : 0;

      // Get top improvers and decliners
      const sortedByChange = scoreChanges.sort((a, b) => b.scoreChange - a.scoreChange);
      summary.topImprovers = sortedByChange.slice(0, 5).filter(s => s.scoreChange > 0);
      summary.topDecliners = sortedByChange.slice(-5).filter(s => s.scoreChange < 0).reverse();

      logger.info('✅ Comparison summary generated', {
        uploadJobId,
        totalStudents: summary.totalStudents,
        improvements: summary.improvements,
        declines: summary.declines,
        averageScoreChange: summary.averageScoreChange
      });

      return summary;

    } catch (error) {
      logger.error('❌ Failed to generate comparison summary', {
        uploadJobId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get detailed comparison for a specific student
   */
  async getStudentDetailedComparison(regNo, limit = 5) {
    try {
      const histories = await PerformanceHistory.find({
        regNo: regNo.toUpperCase()
      })
      .sort({ uploadDate: -1 })
      .limit(limit);

      if (histories.length === 0) {
        return null;
      }

      const comparison = {
        regNo,
        currentPerformance: histories[0],
        historicalData: histories,
        trends: {},
        progressAnalysis: {
          overallTrend: TRENDS.STABLE,
          consistentImprovement: false,
          bestPerformancePeriod: null,
          worstPerformancePeriod: null,
          averageScore: 0,
          scoreVariation: 0
        }
      };

      // Analyze trends for each platform
      const platformTrends = {};
      
      histories[0].platformStats.forEach(platformStat => {
        const platform = platformStat.platform;
        const platformHistory = histories.map(h => 
          h.platformStats.find(p => p.platform === platform)
        ).filter(Boolean);

        if (platformHistory.length > 1) {
          const ratingTrend = this.analyzeTrend(
            platformHistory.map(p => p.rating || 0)
          );
          const problemsTrend = this.analyzeTrend(
            platformHistory.map(p => p.problemsSolved || 0)
          );

          platformTrends[platform] = {
            ratingTrend,
            problemsTrend,
            overallTrend: ratingTrend === TRENDS.UP || problemsTrend === TRENDS.UP 
              ? TRENDS.UP 
              : (ratingTrend === TRENDS.DOWN && problemsTrend === TRENDS.DOWN)
                ? TRENDS.DOWN 
                : TRENDS.STABLE
          };
        }
      });

      comparison.trends = platformTrends;

      // Analyze overall progress
      const scores = histories.map(h => h.overallScore);
      comparison.progressAnalysis.averageScore = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );
      
      comparison.progressAnalysis.overallTrend = this.analyzeTrend(scores);
      comparison.progressAnalysis.consistentImprovement = this.isConsistentImprovement(scores);
      
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      comparison.progressAnalysis.scoreVariation = maxScore - minScore;
      
      comparison.progressAnalysis.bestPerformancePeriod = histories.find(h => h.overallScore === maxScore);
      comparison.progressAnalysis.worstPerformancePeriod = histories.find(h => h.overallScore === minScore);

      return comparison;

    } catch (error) {
      logger.error('❌ Failed to get detailed student comparison', {
        regNo,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Analyze trend from array of values
   */
  analyzeTrend(values) {
    if (values.length < 2) return TRENDS.STABLE;

    let increases = 0;
    let decreases = 0;

    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) increases++;
      else if (values[i] < values[i - 1]) decreases++;
    }

    if (increases > decreases) return TRENDS.UP;
    if (decreases > increases) return TRENDS.DOWN;
    return TRENDS.STABLE;
  }

  /**
   * Check if there's consistent improvement
   */
  isConsistentImprovement(scores) {
    if (scores.length < 3) return false;

    for (let i = 1; i < scores.length; i++) {
      if (scores[i] <= scores[i - 1]) return false;
    }

    return true;
  }

  /**
   * Clear comparison cache
   */
  clearCache() {
    this.comparisonCache.clear();
    logger.info('🧹 Comparison cache cleared');
  }
}

module.exports = new ComparisonService();