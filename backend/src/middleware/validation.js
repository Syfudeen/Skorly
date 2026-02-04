const { body, param, query, validationResult } = require('express-validator');
const { AppError, createValidationError } = require('./errorHandler');
const { HTTP_STATUS, VALIDATION_RULES } = require('../utils/constants');

/**
 * Validation Middleware
 * Provides validation rules and error handling for API endpoints
 */

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    const error = createValidationError(
      `Validation failed: ${errorMessages.map(e => e.message).join(', ')}`
    );
    error.validationErrors = errorMessages;
    
    return next(error);
  }
  
  next();
};

/**
 * Registration number validation
 */
const validateRegNo = () => [
  body('regNo')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required')
    .isLength({ 
      min: VALIDATION_RULES.REG_NO.MIN_LENGTH, 
      max: VALIDATION_RULES.REG_NO.MAX_LENGTH 
    })
    .withMessage(`Registration number must be between ${VALIDATION_RULES.REG_NO.MIN_LENGTH} and ${VALIDATION_RULES.REG_NO.MAX_LENGTH} characters`)
    .matches(VALIDATION_RULES.REG_NO.PATTERN)
    .withMessage('Registration number can only contain letters and numbers')
    .toUpperCase()
];

/**
 * Student name validation
 */
const validateName = () => [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ 
      min: VALIDATION_RULES.NAME.MIN_LENGTH, 
      max: VALIDATION_RULES.NAME.MAX_LENGTH 
    })
    .withMessage(`Name must be between ${VALIDATION_RULES.NAME.MIN_LENGTH} and ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`)
    .matches(VALIDATION_RULES.NAME.PATTERN)
    .withMessage('Name can only contain letters, spaces, dots, hyphens, and apostrophes')
];

/**
 * Department validation
 */
const validateDepartment = () => [
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ 
      min: VALIDATION_RULES.DEPARTMENT.MIN_LENGTH, 
      max: VALIDATION_RULES.DEPARTMENT.MAX_LENGTH 
    })
    .withMessage(`Department must be between ${VALIDATION_RULES.DEPARTMENT.MIN_LENGTH} and ${VALIDATION_RULES.DEPARTMENT.MAX_LENGTH} characters`)
];

/**
 * Platform ID validation
 */
const validatePlatformId = (platform) => [
  body(`platformIds.${platform}`)
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ 
      min: VALIDATION_RULES.PLATFORM_ID.MIN_LENGTH, 
      max: VALIDATION_RULES.PLATFORM_ID.MAX_LENGTH 
    })
    .withMessage(`${platform} ID must be between ${VALIDATION_RULES.PLATFORM_ID.MIN_LENGTH} and ${VALIDATION_RULES.PLATFORM_ID.MAX_LENGTH} characters`)
    .matches(VALIDATION_RULES.PLATFORM_ID.PATTERN)
    .withMessage(`${platform} ID can only contain letters, numbers, dots, hyphens, and underscores`)
];

/**
 * File upload validation
 */
const validateFileUpload = () => [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('Excel file is required');
      }
      
      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed');
      }
      
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB');
      }
      
      return true;
    })
];

/**
 * Job ID validation
 */
const validateJobId = () => [
  param('jobId')
    .trim()
    .notEmpty()
    .withMessage('Job ID is required')
    .isLength({ min: 10, max: 50 })
    .withMessage('Invalid job ID format')
    .matches(/^job_\d+_[a-z0-9]+$/)
    .withMessage('Invalid job ID format')
];

/**
 * Pagination validation
 */
const validatePagination = () => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sort')
    .optional()
    .isIn(['name', 'regNo', 'department', 'overallScore', 'createdAt', '-name', '-regNo', '-department', '-overallScore', '-createdAt'])
    .withMessage('Invalid sort field')
];

/**
 * Search validation
 */
const validateSearch = () => [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .escape() // Sanitize for security
];

/**
 * Date range validation
 */
const validateDateRange = () => [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .toDate()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

/**
 * Platform filter validation
 */
const validatePlatformFilter = () => [
  query('platforms')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        value = [value];
      }
      
      if (!Array.isArray(value)) {
        throw new Error('Platforms must be an array');
      }
      
      const validPlatforms = ['codeforces', 'codechef', 'leetcode', 'atcoder', 'codolio', 'github'];
      const invalidPlatforms = value.filter(platform => !validPlatforms.includes(platform));
      
      if (invalidPlatforms.length > 0) {
        throw new Error(`Invalid platforms: ${invalidPlatforms.join(', ')}`);
      }
      
      return true;
    })
];

/**
 * Performance level filter validation
 */
const validatePerformanceLevelFilter = () => [
  query('performanceLevel')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Performance level must be high, medium, or low')
];

/**
 * Trend filter validation
 */
const validateTrendFilter = () => [
  query('trend')
    .optional()
    .isIn(['up', 'down', 'stable'])
    .withMessage('Trend must be up, down, or stable')
];

/**
 * Student creation validation
 */
const validateStudentCreation = () => [
  ...validateRegNo(),
  ...validateName(),
  ...validateDepartment(),
  body('year')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Year must be less than 20 characters'),
  body('platformIds')
    .optional()
    .isObject()
    .withMessage('Platform IDs must be an object'),
  ...validatePlatformId('codeforces'),
  ...validatePlatformId('codechef'),
  ...validatePlatformId('leetcode'),
  ...validatePlatformId('atcoder'),
  ...validatePlatformId('codolio'),
  ...validatePlatformId('github'),
  body('platformIds')
    .custom((platformIds) => {
      if (!platformIds || typeof platformIds !== 'object') {
        return true; // Will be caught by previous validation
      }
      
      const hasAnyPlatform = Object.values(platformIds).some(
        id => id && id.toString().trim() !== ''
      );
      
      if (!hasAnyPlatform) {
        throw new Error('At least one platform ID is required');
      }
      
      return true;
    })
];

/**
 * Student update validation
 */
const validateStudentUpdate = () => [
  param('regNo')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required')
    .matches(VALIDATION_RULES.REG_NO.PATTERN)
    .withMessage('Invalid registration number format')
    .toUpperCase(),
  body('name')
    .optional()
    .trim()
    .isLength({ 
      min: VALIDATION_RULES.NAME.MIN_LENGTH, 
      max: VALIDATION_RULES.NAME.MAX_LENGTH 
    })
    .withMessage(`Name must be between ${VALIDATION_RULES.NAME.MIN_LENGTH} and ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`)
    .matches(VALIDATION_RULES.NAME.PATTERN)
    .withMessage('Name can only contain letters, spaces, dots, hyphens, and apostrophes'),
  body('department')
    .optional()
    .trim()
    .isLength({ 
      min: VALIDATION_RULES.DEPARTMENT.MIN_LENGTH, 
      max: VALIDATION_RULES.DEPARTMENT.MAX_LENGTH 
    })
    .withMessage(`Department must be between ${VALIDATION_RULES.DEPARTMENT.MIN_LENGTH} and ${VALIDATION_RULES.DEPARTMENT.MAX_LENGTH} characters`),
  body('year')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Year must be less than 20 characters'),
  body('platformIds')
    .optional()
    .isObject()
    .withMessage('Platform IDs must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

/**
 * Bulk operation validation
 */
const validateBulkOperation = () => [
  body('regNos')
    .isArray({ min: 1, max: 100 })
    .withMessage('regNos must be an array with 1-100 items'),
  body('regNos.*')
    .trim()
    .matches(VALIDATION_RULES.REG_NO.PATTERN)
    .withMessage('Invalid registration number format')
    .toUpperCase(),
  body('operation')
    .isIn(['activate', 'deactivate', 'delete'])
    .withMessage('Operation must be activate, deactivate, or delete')
];

/**
 * Analytics query validation
 */
const validateAnalyticsQuery = () => [
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year'),
  query('groupBy')
    .optional()
    .isIn(['department', 'year', 'platform', 'performanceLevel'])
    .withMessage('GroupBy must be department, year, platform, or performanceLevel'),
  ...validateDateRange(),
  ...validatePlatformFilter(),
  ...validatePerformanceLevelFilter()
];

/**
 * Export validation middleware
 */
const validateExport = () => [
  query('format')
    .optional()
    .isIn(['json', 'csv', 'xlsx'])
    .withMessage('Format must be json, csv, or xlsx'),
  query('fields')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        value = value.split(',');
      }
      
      if (!Array.isArray(value)) {
        throw new Error('Fields must be a comma-separated string or array');
      }
      
      const validFields = [
        'regNo', 'name', 'department', 'year', 'overallScore', 
        'performanceLevel', 'trend', 'platformScores', 'createdAt', 'lastUpdated'
      ];
      
      const invalidFields = value.filter(field => !validFields.includes(field.trim()));
      
      if (invalidFields.length > 0) {
        throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
      }
      
      return true;
    })
];

module.exports = {
  handleValidationErrors,
  validateRegNo,
  validateName,
  validateDepartment,
  validatePlatformId,
  validateFileUpload,
  validateJobId,
  validatePagination,
  validateSearch,
  validateDateRange,
  validatePlatformFilter,
  validatePerformanceLevelFilter,
  validateTrendFilter,
  validateStudentCreation,
  validateStudentUpdate,
  validateBulkOperation,
  validateAnalyticsQuery,
  validateExport
};