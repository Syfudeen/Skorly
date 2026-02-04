const mongoose = require('mongoose');

/**
 * UploadJob Model
 * Tracks Excel upload jobs and their processing status
 */
const uploadJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    total: {
      type: Number,
      default: 0
    },
    processed: {
      type: Number,
      default: 0
    },
    successful: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  studentsData: {
    total: {
      type: Number,
      default: 0
    },
    valid: {
      type: Number,
      default: 0
    },
    invalid: {
      type: Number,
      default: 0
    },
    duplicates: {
      type: Number,
      default: 0
    }
  },
  weekInfo: {
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
      default: Date.now
    }
  },
  processingStats: {
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    duration: {
      type: Number, // in milliseconds
      default: 0
    },
    averageProcessingTime: {
      type: Number, // per student in milliseconds
      default: 0
    }
  },
  platformStats: {
    codeforces: {
      attempted: { type: Number, default: 0 },
      successful: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    codechef: {
      attempted: { type: Number, default: 0 },
      successful: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    leetcode: {
      attempted: { type: Number, default: 0 },
      successful: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    atcoder: {
      attempted: { type: Number, default: 0 },
      successful: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    codolio: {
      attempted: { type: Number, default: 0 },
      successful: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    github: {
      attempted: { type: Number, default: 0 },
      successful: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    }
  },
  errors: [{
    type: {
      type: String,
      enum: ['validation', 'processing', 'api', 'database', 'system']
    },
    message: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    },
    regNo: String, // Optional: if error is related to specific student
    platform: String // Optional: if error is related to specific platform
  }],
  metadata: {
    userAgent: String,
    ipAddress: String,
    uploadSource: {
      type: String,
      default: 'web'
    },
    retryCount: {
      type: Number,
      default: 0
    },
    queuePriority: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
uploadJobSchema.index({ jobId: 1 }, { unique: true });
uploadJobSchema.index({ status: 1 });
uploadJobSchema.index({ createdAt: -1 });
uploadJobSchema.index({ 'weekInfo.weekNumber': 1 });
uploadJobSchema.index({ 'weekInfo.uploadDate': -1 });

// Virtual for completion percentage
uploadJobSchema.virtual('completionPercentage').get(function() {
  if (this.progress.total === 0) return 0;
  return Math.round((this.progress.processed / this.progress.total) * 100);
});

// Virtual for success rate
uploadJobSchema.virtual('successRate').get(function() {
  if (this.progress.processed === 0) return 0;
  return Math.round((this.progress.successful / this.progress.processed) * 100);
});

// Virtual for processing duration in human readable format
uploadJobSchema.virtual('processingDurationFormatted').get(function() {
  if (!this.processingStats.duration) return 'N/A';
  
  const seconds = Math.floor(this.processingStats.duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
});

// Method to update progress
uploadJobSchema.methods.updateProgress = function(processed, successful, failed) {
  this.progress.processed = processed;
  this.progress.successful = successful;
  this.progress.failed = failed;
  this.progress.percentage = this.progress.total > 0 
    ? Math.round((processed / this.progress.total) * 100) 
    : 0;
  
  // Update status based on progress
  if (this.progress.processed === this.progress.total) {
    this.status = this.progress.failed === 0 ? 'completed' : 'completed';
    this.processingStats.endTime = new Date();
    this.processingStats.duration = this.processingStats.endTime - this.processingStats.startTime;
    this.processingStats.averageProcessingTime = this.processingStats.duration / this.progress.total;
  }
};

// Method to add error
uploadJobSchema.methods.addError = function(type, message, details = null, regNo = null, platform = null) {
  this.errors.push({
    type,
    message,
    details,
    regNo,
    platform,
    timestamp: new Date()
  });
};

// Method to start processing
uploadJobSchema.methods.startProcessing = function() {
  this.status = 'processing';
  this.processingStats.startTime = new Date();
};

// Method to complete processing
uploadJobSchema.methods.completeProcessing = function() {
  this.status = 'completed';
  this.processingStats.endTime = new Date();
  if (this.processingStats.startTime) {
    this.processingStats.duration = this.processingStats.endTime - this.processingStats.startTime;
    this.processingStats.averageProcessingTime = this.progress.total > 0 
      ? this.processingStats.duration / this.progress.total 
      : 0;
  }
};

// Method to fail processing
uploadJobSchema.methods.failProcessing = function(errorMessage) {
  this.status = 'failed';
  this.processingStats.endTime = new Date();
  if (this.processingStats.startTime) {
    this.processingStats.duration = this.processingStats.endTime - this.processingStats.startTime;
  }
  this.addError('system', errorMessage);
};

// Method to update platform stats
uploadJobSchema.methods.updatePlatformStats = function(platform, attempted, successful, failed) {
  if (this.platformStats[platform]) {
    this.platformStats[platform].attempted += attempted;
    this.platformStats[platform].successful += successful;
    this.platformStats[platform].failed += failed;
  }
};

// Static method to find active jobs
uploadJobSchema.statics.findActiveJobs = function() {
  return this.find({ status: { $in: ['pending', 'processing'] } });
};

// Static method to find recent jobs
uploadJobSchema.statics.findRecentJobs = function(limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get job statistics
uploadJobSchema.statics.getJobStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalStudents: { $sum: '$studentsData.total' },
        avgDuration: { $avg: '$processingStats.duration' }
      }
    }
  ]);
};

module.exports = mongoose.model('UploadJob', uploadJobSchema);