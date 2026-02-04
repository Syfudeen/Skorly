const mongoose = require('mongoose');

/**
 * Student Model
 * Stores basic student information and platform IDs
 */
const studentSchema = new mongoose.Schema({
  regNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: false,
    trim: true
  },
  platformIds: {
    codeforces: {
      type: String,
      trim: true,
      default: null
    },
    codechef: {
      type: String,
      trim: true,
      default: null
    },
    leetcode: {
      type: String,
      trim: true,
      default: null
    },
    atcoder: {
      type: String,
      trim: true,
      default: null
    },
    codolio: {
      type: String,
      trim: true,
      default: null
    },
    github: {
      type: String,
      trim: true,
      default: null
    }
  },
  totalStats: {
    totalProblems: {
      type: Number,
      default: 0
    },
    totalContests: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    activePlatforms: {
      type: Number,
      default: 0
    }
  },
  uploadJobId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
studentSchema.index({ regNo: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ 'platformIds.codeforces': 1 });
studentSchema.index({ 'platformIds.codechef': 1 });
studentSchema.index({ 'platformIds.leetcode': 1 });
studentSchema.index({ createdAt: -1 });

// Virtual for getting active platform count
studentSchema.virtual('activePlatformCount').get(function() {
  const platforms = this.platformIds;
  return Object.values(platforms).filter(id => id && id.trim() !== '').length;
});

// Method to get platform IDs as array
studentSchema.methods.getPlatformIds = function() {
  const platforms = [];
  Object.entries(this.platformIds).forEach(([platform, id]) => {
    if (id && id.trim() !== '') {
      platforms.push({ platform, id: id.trim() });
    }
  });
  return platforms;
};

// Static method to find by registration number
studentSchema.statics.findByRegNo = function(regNo) {
  return this.findOne({ regNo: regNo.toUpperCase() });
};

// Static method to get students with specific platform
studentSchema.statics.findByPlatform = function(platform) {
  const query = {};
  query[`platformIds.${platform}`] = { $ne: null, $ne: '' };
  return this.find(query);
};

module.exports = mongoose.model('Student', studentSchema);