const mongoose = require('mongoose');

/**
 * PlatformStats Model
 * Stores current platform statistics for each student
 */
const platformStatsSchema = new mongoose.Schema({
  regNo: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['codeforces', 'codechef', 'leetcode', 'atcoder', 'codolio', 'github'],
    lowercase: true
  },
  platformUserId: {
    type: String,
    required: true,
    trim: true
  },
  currentStats: {
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
    // Platform-specific additional data
    additionalData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  previousStats: {
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
    additionalData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  changes: {
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
      default: 0
    }
  },
  lastFetched: {
    type: Date,
    default: Date.now
  },
  fetchStatus: {
    type: String,
    enum: ['success', 'failed', 'partial', 'pending'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    default: null
  },
  uploadJobId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
platformStatsSchema.index({ regNo: 1, platform: 1 }, { unique: true });
platformStatsSchema.index({ uploadJobId: 1 });
platformStatsSchema.index({ platform: 1, fetchStatus: 1 });
platformStatsSchema.index({ lastFetched: -1 });

// Virtual for performance level based on rating
platformStatsSchema.virtual('performanceLevel').get(function() {
  const rating = this.currentStats.rating;
  if (rating >= 2000) return 'expert';
  if (rating >= 1600) return 'advanced';
  if (rating >= 1200) return 'intermediate';
  if (rating >= 800) return 'beginner';
  return 'newbie';
});

// Virtual for trend based on rating change
platformStatsSchema.virtual('trend').get(function() {
  const ratingChange = this.changes.rating;
  if (ratingChange > 0) return 'up';
  if (ratingChange < 0) return 'down';
  return 'stable';
});

// Method to calculate changes
platformStatsSchema.methods.calculateChanges = function() {
  this.changes.rating = this.currentStats.rating - this.previousStats.rating;
  this.changes.maxRating = this.currentStats.maxRating - this.previousStats.maxRating;
  this.changes.problemsSolved = this.currentStats.problemsSolved - this.previousStats.problemsSolved;
  this.changes.contestsParticipated = this.currentStats.contestsParticipated - this.previousStats.contestsParticipated;
  this.changes.rank = this.previousStats.rank && this.currentStats.rank 
    ? this.previousStats.rank - this.currentStats.rank 
    : 0;
};

// Method to update stats
platformStatsSchema.methods.updateStats = function(newStats) {
  // Move current to previous
  this.previousStats = { ...this.currentStats };
  
  // Update current stats
  this.currentStats = {
    rating: newStats.rating || 0,
    maxRating: newStats.maxRating || newStats.rating || 0,
    problemsSolved: newStats.problemsSolved || 0,
    contestsParticipated: newStats.contestsParticipated || 0,
    rank: newStats.rank || null,
    additionalData: newStats.additionalData || {}
  };
  
  // Calculate changes
  this.calculateChanges();
  
  this.lastFetched = new Date();
  this.fetchStatus = 'success';
  this.errorMessage = null;
};

// Static method to get stats by registration number
platformStatsSchema.statics.findByRegNo = function(regNo) {
  return this.find({ regNo: regNo.toUpperCase() });
};

// Static method to get stats by platform
platformStatsSchema.statics.findByPlatform = function(platform) {
  return this.find({ platform: platform.toLowerCase() });
};

// Static method to get latest stats for a job
platformStatsSchema.statics.findByJobId = function(jobId) {
  return this.find({ uploadJobId: jobId });
};

module.exports = mongoose.model('PlatformStats', platformStatsSchema);