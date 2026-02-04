/**
 * Application Constants
 * Centralized constants for the application
 */

// Supported platforms
const PLATFORMS = {
  CODEFORCES: 'codeforces',
  CODECHEF: 'codechef',
  LEETCODE: 'leetcode',
  ATCODER: 'atcoder',
  CODOLIO: 'codolio',
  GITHUB: 'github',
};

// Platform display names
const PLATFORM_NAMES = {
  [PLATFORMS.CODEFORCES]: 'Codeforces',
  [PLATFORMS.CODECHEF]: 'CodeChef',
  [PLATFORMS.LEETCODE]: 'LeetCode',
  [PLATFORMS.ATCODER]: 'AtCoder',
  [PLATFORMS.CODOLIO]: 'Codolio',
  [PLATFORMS.GITHUB]: 'GitHub',
};

// Platform API endpoints
const PLATFORM_APIS = {
  [PLATFORMS.CODEFORCES]: {
    BASE_URL: 'https://codeforces.com/api',
    USER_INFO: '/user.info',
    USER_STATUS: '/user.status',
    USER_RATING: '/user.rating',
    RATE_LIMIT: 5, // requests per second
    TIMEOUT: 10000, // 10 seconds
  },
  [PLATFORMS.LEETCODE]: {
    BASE_URL: 'https://leetcode.com/graphql',
    TIMEOUT: 15000, // 15 seconds
    RATE_LIMIT: 2, // requests per second
  },
  [PLATFORMS.CODECHEF]: {
    BASE_URL: 'https://www.codechef.com',
    TIMEOUT: 12000, // 12 seconds
    RATE_LIMIT: 1, // requests per second
  },
  [PLATFORMS.ATCODER]: {
    BASE_URL: 'https://atcoder.jp',
    TIMEOUT: 10000, // 10 seconds
    RATE_LIMIT: 2, // requests per second
  },
  [PLATFORMS.CODOLIO]: {
    BASE_URL: 'https://codolio.com',
    TIMEOUT: 10000, // 10 seconds
    RATE_LIMIT: 3, // requests per second
  },
  [PLATFORMS.GITHUB]: {
    BASE_URL: 'https://api.github.com',
    TIMEOUT: 10000, // 10 seconds
    RATE_LIMIT: 10, // requests per second (with auth)
  },
};

// Excel file configuration
const EXCEL_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls'],
  REQUIRED_COLUMNS: [
    'Name',
    'Reg No',
    'Dept',
    'Year',
    'CodeChef ID',
    'LeetCode ID',
    'Codeforces ID',
    'AtCoder ID',
    'Codolio ID',
    'GitHub ID',
  ],
  COLUMN_MAPPING: {
    'Name': 'name',
    'Reg No': 'regNo',
    'Dept': 'department',
    'Year': 'year',
    'CodeChef ID': 'codechef',
    'LeetCode ID': 'leetcode',
    'Codeforces ID': 'codeforces',
    'AtCoder ID': 'atcoder',
    'Codolio ID': 'codolio',
    'GitHub ID': 'github',
  },
  MAX_STUDENTS: 1000, // Maximum students per upload
  MIN_STUDENTS: 1, // Minimum students per upload
};

// Job statuses
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Fetch statuses
const FETCH_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PARTIAL: 'partial',
  PENDING: 'pending',
};

// Performance levels
const PERFORMANCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// Trend directions
const TRENDS = {
  UP: 'up',
  DOWN: 'down',
  STABLE: 'stable',
};

// Error types
const ERROR_TYPES = {
  VALIDATION: 'validation',
  PROCESSING: 'processing',
  API: 'api',
  DATABASE: 'database',
  SYSTEM: 'system',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit',
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// Cache keys
const CACHE_KEYS = {
  STUDENT_STATS: (regNo) => `student:stats:${regNo}`,
  PLATFORM_STATS: (regNo, platform) => `platform:stats:${regNo}:${platform}`,
  JOB_PROGRESS: (jobId) => `job:progress:${jobId}`,
  ANALYTICS: (period) => `analytics:${period}`,
  LEADERBOARD: (platform) => `leaderboard:${platform}`,
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  STUDENT_STATS: 3600, // 1 hour
  PLATFORM_STATS: 1800, // 30 minutes
  JOB_PROGRESS: 300, // 5 minutes
  ANALYTICS: 7200, // 2 hours
  LEADERBOARD: 1800, // 30 minutes
};

// Queue configuration
const QUEUE_CONFIG = {
  CONCURRENCY: parseInt(process.env.QUEUE_CONCURRENCY) || 5,
  RETRY_ATTEMPTS: parseInt(process.env.QUEUE_RETRY_ATTEMPTS) || 3,
  RETRY_DELAY: parseInt(process.env.QUEUE_RETRY_DELAY) || 5000,
  JOB_TIMEOUT: 60000, // 1 minute per job
  STALLED_INTERVAL: 30000, // 30 seconds
  MAX_STALLED_COUNT: 3,
};

// Rate limiting
const RATE_LIMITS = {
  UPLOAD: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5, // 5 uploads per 15 minutes
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // 100 requests per 15 minutes
  },
  PLATFORM_API: {
    [PLATFORMS.CODEFORCES]: {
      REQUESTS_PER_SECOND: 5,
      BURST_LIMIT: 10,
    },
    [PLATFORMS.LEETCODE]: {
      REQUESTS_PER_SECOND: 2,
      BURST_LIMIT: 5,
    },
    [PLATFORMS.CODECHEF]: {
      REQUESTS_PER_SECOND: 1,
      BURST_LIMIT: 3,
    },
  },
};

// Validation rules
const VALIDATION_RULES = {
  REG_NO: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[A-Z0-9]+$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s.'-]+$/,
  },
  DEPARTMENT: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  PLATFORM_ID: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_.-]+$/,
  },
};

// Default values
const DEFAULTS = {
  RATING: 0,
  PROBLEMS_SOLVED: 0,
  CONTESTS_PARTICIPATED: 0,
  RANK: null,
  PERFORMANCE_LEVEL: PERFORMANCE_LEVELS.LOW,
  TREND: TRENDS.STABLE,
};

// File paths
const PATHS = {
  UPLOADS: './uploads',
  LOGS: './logs',
  TEMP: './temp',
};

// Date formats
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  WEEK: 'YYYY-[W]WW',
};

// Scoring weights for overall performance calculation
const SCORING_WEIGHTS = {
  RATING: 0.4, // 40% weight
  PROBLEMS_SOLVED: 0.4, // 40% weight
  CONTESTS: 0.2, // 20% weight
};

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50,
  LOW: 0,
};

// Export all constants
module.exports = {
  PLATFORMS,
  PLATFORM_NAMES,
  PLATFORM_APIS,
  EXCEL_CONFIG,
  JOB_STATUS,
  FETCH_STATUS,
  PERFORMANCE_LEVELS,
  TRENDS,
  ERROR_TYPES,
  HTTP_STATUS,
  CACHE_KEYS,
  CACHE_TTL,
  QUEUE_CONFIG,
  RATE_LIMITS,
  VALIDATION_RULES,
  DEFAULTS,
  PATHS,
  DATE_FORMATS,
  SCORING_WEIGHTS,
  PERFORMANCE_THRESHOLDS,
};