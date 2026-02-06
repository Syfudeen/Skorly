const moment = require('moment');
const { VALIDATION_RULES, PERFORMANCE_THRESHOLDS, TRENDS } = require('./constants');

/**
 * Helper Functions
 * Utility functions used across the application
 */

/**
 * Validate registration number format
 */
const validateRegNo = (regNo) => {
  if (!regNo || typeof regNo !== 'string') {
    return { isValid: false, error: 'Registration number is required' };
  }

  const trimmed = regNo.trim().toUpperCase();
  
  if (trimmed.length < VALIDATION_RULES.REG_NO.MIN_LENGTH) {
    return { isValid: false, error: 'Registration number too short' };
  }
  
  if (trimmed.length > VALIDATION_RULES.REG_NO.MAX_LENGTH) {
    return { isValid: false, error: 'Registration number too long' };
  }
  
  if (!VALIDATION_RULES.REG_NO.PATTERN.test(trimmed)) {
    return { isValid: false, error: 'Registration number contains invalid characters' };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Validate student name
 */
const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
    return { isValid: false, error: 'Name too short' };
  }
  
  if (trimmed.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
    return { isValid: false, error: 'Name too long' };
  }
  
  if (!VALIDATION_RULES.NAME.PATTERN.test(trimmed)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Validate platform ID
 */
const validatePlatformId = (platformId, platform) => {
  if (!platformId || typeof platformId !== 'string') {
    return { isValid: true, value: null }; // Platform IDs are optional
  }

  const trimmed = platformId.trim();
  
  if (trimmed === '') {
    return { isValid: true, value: null };
  }
  
  if (trimmed.length < VALIDATION_RULES.PLATFORM_ID.MIN_LENGTH) {
    return { isValid: false, error: `${platform} ID too short` };
  }
  
  if (trimmed.length > VALIDATION_RULES.PLATFORM_ID.MAX_LENGTH) {
    return { isValid: false, error: `${platform} ID too long` };
  }
  
  if (!VALIDATION_RULES.PLATFORM_ID.PATTERN.test(trimmed)) {
    return { isValid: false, error: `${platform} ID contains invalid characters` };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str.trim().replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

/**
 * Calculate performance level based on score
 */
const calculatePerformanceLevel = (score) => {
  if (score >= PERFORMANCE_THRESHOLDS.HIGH) {
    return 'high';
  } else if (score >= PERFORMANCE_THRESHOLDS.MEDIUM) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Calculate trend based on current and previous values
 */
const calculateTrend = (current, previous, threshold = 0) => {
  if (previous === null || previous === undefined) {
    return TRENDS.STABLE;
  }
  
  const difference = current - previous;
  
  if (difference > threshold) {
    return TRENDS.UP;
  } else if (difference < -threshold) {
    return TRENDS.DOWN;
  } else {
    return TRENDS.STABLE;
  }
};

/**
 * Calculate percentage change
 */
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * Generate unique job ID
 */
const generateJobId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `job_${timestamp}_${random}`;
};

/**
 * Generate week information
 * Auto-increments based on existing uploads instead of calendar week
 */
const generateWeekInfo = async (date = new Date()) => {
  const momentDate = moment(date);
  
  // Try to get the latest week number from database
  try {
    const PerformanceHistory = require('../models/PerformanceHistory');
    const latestUpload = await PerformanceHistory.findOne()
      .sort({ uploadDate: -1 })
      .select('weekNumber weekLabel')
      .lean();
    
    if (latestUpload) {
      // Increment from the last upload
      const nextWeekNumber = latestUpload.weekNumber + 1;
      return {
        weekNumber: nextWeekNumber,
        weekLabel: `Week ${nextWeekNumber}`,
        uploadDate: momentDate.toDate(),
        year: momentDate.year(),
        month: momentDate.month() + 1,
      };
    }
  } catch (error) {
    // If database query fails, fall back to Week 1
    console.log('Could not fetch latest week, starting from Week 1');
  }
  
  // First upload - start with Week 1
  return {
    weekNumber: 1,
    weekLabel: 'Week 1',
    uploadDate: momentDate.toDate(),
    year: momentDate.year(),
    month: momentDate.month() + 1,
  };
};

/**
 * Format duration in human readable format
 */
const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) {
    return '0ms';
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else if (seconds > 0) {
    return `${seconds}s`;
  } else {
    return `${milliseconds}ms`;
  }
};

/**
 * Format file size in human readable format
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) {
    return '0 B';
  }
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * Check if object is empty
 */
const isEmpty = (obj) => {
  if (obj === null || obj === undefined) {
    return true;
  }
  
  if (typeof obj === 'string' || Array.isArray(obj)) {
    return obj.length === 0;
  }
  
  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0;
  }
  
  return false;
};

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Chunk array into smaller arrays
 */
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Get safe property from object
 */
const safeGet = (obj, path, defaultValue = null) => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || !current.hasOwnProperty(key)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current;
};

/**
 * Remove undefined and null values from object
 */
const cleanObject = (obj) => {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const cleanedNested = cleanObject(value);
        if (!isEmpty(cleanedNested)) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
};

/**
 * Generate random string
 */
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate overall score from platform scores
 */
const calculateOverallScore = (platformScores) => {
  if (!platformScores || platformScores.length === 0) {
    return 0;
  }
  
  let totalScore = 0;
  let validPlatforms = 0;
  
  platformScores.forEach(platform => {
    if (platform.fetchStatus === 'success') {
      // Weighted scoring
      const ratingScore = Math.min(platform.rating / 20, 40); // Max 40 points
      const problemsScore = Math.min(platform.problemsSolved / 5, 40); // Max 40 points
      const contestScore = Math.min(platform.contestsParticipated * 2, 20); // Max 20 points
      
      const platformScore = ratingScore + problemsScore + contestScore;
      totalScore += platformScore;
      validPlatforms++;
    }
  });
  
  return validPlatforms > 0 ? Math.round(totalScore / validPlatforms) : 0;
};

module.exports = {
  validateRegNo,
  validateName,
  validatePlatformId,
  sanitizeString,
  calculatePerformanceLevel,
  calculateTrend,
  calculatePercentageChange,
  generateJobId,
  generateWeekInfo,
  formatDuration,
  formatFileSize,
  deepClone,
  isEmpty,
  retryWithBackoff,
  chunkArray,
  sleep,
  safeGet,
  cleanObject,
  generateRandomString,
  validateEmail,
  calculateOverallScore,
};