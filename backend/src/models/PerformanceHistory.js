const mongoose = require('mongoose');

/**
 * PerformanceHistory Model
 * Stores historical snapshots of student performance
 */
const performanceHistorySchema = new mongoose.Schema({
  regNo: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  uploadJobId: {
    type: String,
    required: true
  },
  weekNumber: {
    type: Number,
    required: true
  },
  weekLabel: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    required: true
  },
  platformStats: [{
    platform: {
      type: String,
      required: true,
      enum: ['codeforces', 'codechef', 'leetcode', 'atcoder', 'codolio', 'github']
    },
    rating: {
      type: Number,
      default: 0
    },
    maxRating: {
      type: Number,
      default: 0
    },
    problemsSolved: {
      type: Number,
      default: 0
    },
    contestsParticipated: {
      type: Number,
      default: 0
    },
    rank: {
      type: Number,
      default: null
    },
    fetchStatus: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      default: 'success'
    }
  }],
  overallScore: {
    type: Number,
    default: 0
  },
  performanceLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'low'
  },
  totalPlatforms: {
    type: Number,
    default: 0
  },
  activePlatforms: {
    type: Number,
    default: 0
  },
  metadata: {
    processingTime: {
      type: Number, // in milliseconds
      default: 0
    },
    errors: [{
      platform: String,
      error: String,
      timestamp: Date
    }]
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
performanceHistorySchema.index({ regNo: 1, uploadDate: -1 });
performanceHistorySchema.index({ uploadJobId: 1 });
performanceHistorySchema.index({ weekNumber: 1 });
performanceHistorySchema.index({ uploadDate: -1 });
performanceHistorySchema.index({ performanceLevel: 1 });

// Virtual for getting platform count
performanceHistorySchema.virtual('platformCount').get(function() {
  return this.platformStats.length;
});

// Virtual for getting successful platforms
performanceHistorySchema.virtual('successfulPlatforms').get(function() {
  return this.platformStats.filter(p => p.fetchStatus === 'success').length;
});

// Method to calculate overall score
performanceHistorySchema.methods.calculateOverallScore = function() {
  if (this.platformStats.length === 0) {
    this.overallScore = 0;
    return 0;
  }

  let totalScore = 0;
  let validPlatforms = 0;

  this.platformStats.forEach(platform => {
    if (platform.fetchStatus === 'success') {
      // Weighted scoring based on platform
      let platformScore = 0;
      
      // Rating component (40% weight)
      const ratingScore = Math.min(platform.rating / 20, 40); // Max 40 points
      
      // Problems solved component (40% weight)
      const problemsScore = Math.min(platform.problemsSolved / 5, 40); // Max 40 points
      
      // Contest participation component (20% weight)
      const contestScore = Math.min(platform.contestsParticipated * 2, 20); // Max 20 points
      
      platformScore = ratingScore + problemsScore + contestScore;
      totalScore += platformScore;
      validPlatforms++;
    }
  });

  this.overallScore = validPlatforms > 0 ? Math.round(totalScore / validPlatforms) : 0;
  
  // Determine performance level
  if (this.overallScore >= 80) {
    this.performanceLevel = 'high';
  } else if (this.overallScore >= 50) {
    this.performanceLevel = 'medium';
  } else {
    this.performanceLevel = 'low';
  }

  return this.overallScore;
};

// Method to add platform stats
performanceHistorySchema.methods.addPlatformStats = function(platform, stats) {
  const existingIndex = this.platformStats.findIndex(p => p.platform === platform);
  
  const platformData = {
    platform,
    rating: stats.rating || 0,
    maxRating: stats.maxRating || stats.rating || 0,
    problemsSolved: stats.problemsSolved || 0,
    contestsParticipated: stats.contestsParticipated || 0,
    rank: stats.rank || null,
    fetchStatus: stats.fetchStatus || 'success'
  };

  if (existingIndex >= 0) {
    this.platformStats[existingIndex] = platformData;
  } else {
    this.platformStats.push(platformData);
  }

  this.activePlatforms = this.platformStats.filter(p => p.fetchStatus === 'success').length;
  this.totalPlatforms = this.platformStats.length;
};

// Method to add error
performanceHistorySchema.methods.addError = function(platform, error) {
  this.metadata.errors.push({
    platform,
    error,
    timestamp: new Date()
  });
};

// Static method to get history by registration number
performanceHistorySchema.statics.findByRegNo = function(regNo, limit = 10) {
  return this.find({ regNo: regNo.toUpperCase() })
    .sort({ uploadDate: -1 })
    .limit(limit);
};

// Static method to get latest history for a student
performanceHistorySchema.statics.findLatestByRegNo = function(regNo) {
  return this.findOne({ regNo: regNo.toUpperCase() })
    .sort({ uploadDate: -1 });
};

// Static method to get history by job ID
performanceHistorySchema.statics.findByJobId = function(jobId) {
  return this.find({ uploadJobId: jobId });
};

// Static method to get comparison data
performanceHistorySchema.statics.getComparisonData = function(regNo, currentJobId, previousJobId) {
  return Promise.all([
    this.findOne({ regNo: regNo.toUpperCase(), uploadJobId: currentJobId }),
    this.findOne({ regNo: regNo.toUpperCase(), uploadJobId: previousJobId })
  ]);
};

module.exports = mongoose.model('PerformanceHistory', performanceHistorySchema);