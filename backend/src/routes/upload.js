const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Import services
const excelService = require('../services/excelService');
const queueManager = require('../config/queue');

// Import models
const UploadJob = require('../models/UploadJob');

// Import middleware
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { handleValidationErrors } = require('../middleware/validation');

// Import utilities
const logger = require('../utils/logger');
const { generateJobId, generateWeekInfo, formatFileSize } = require('../utils/helpers');
const { HTTP_STATUS, EXCEL_CONFIG, JOB_STATUS } = require('../utils/constants');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: EXCEL_CONFIG.MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = EXCEL_CONFIG.ALLOWED_EXTENSIONS;
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError(
        `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      ));
    }
  }
});

/**
 * @route   POST /api/upload
 * @desc    Upload Excel file and process student data
 * @access  Public
 */
router.post(
  '/',
  uploadLimiter,
  upload.single('file'),
  catchAsync(async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      // Validate file upload
      if (!req.file) {
        throw new AppError('No file uploaded', HTTP_STATUS.BAD_REQUEST);
      }

      logger.info('📤 File upload received', {
        originalName: req.file.originalname,
        size: formatFileSize(req.file.size),
        mimetype: req.file.mimetype
      });

      // Validate file
      const fileValidation = excelService.validateFile(req.file);
      if (!fileValidation.isValid) {
        // Clean up uploaded file
        await excelService.cleanupFile(req.file.path);
        throw new AppError(
          fileValidation.errors.join(', '),
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Parse Excel file
      const { headers, dataRows, totalRows } = await excelService.parseExcelFile(req.file.path);

      // Process and validate student data
      const { students, errors, statistics } = await excelService.processStudentData(
        headers,
        dataRows
      );

      // Check if we have valid students
      if (students.length === 0) {
        await excelService.cleanupFile(req.file.path);
        throw new AppError(
          'No valid students found in the Excel file',
          HTTP_STATUS.UNPROCESSABLE_ENTITY
        );
      }

      // Check minimum and maximum students
      if (students.length < EXCEL_CONFIG.MIN_STUDENTS) {
        await excelService.cleanupFile(req.file.path);
        throw new AppError(
          `Minimum ${EXCEL_CONFIG.MIN_STUDENTS} student(s) required`,
          HTTP_STATUS.UNPROCESSABLE_ENTITY
        );
      }

      if (students.length > EXCEL_CONFIG.MAX_STUDENTS) {
        await excelService.cleanupFile(req.file.path);
        throw new AppError(
          `Maximum ${EXCEL_CONFIG.MAX_STUDENTS} students allowed per upload`,
          HTTP_STATUS.UNPROCESSABLE_ENTITY
        );
      }

      // Generate job ID and week info
      const jobId = generateJobId();
      const weekInfo = await generateWeekInfo();

      // Create upload job record
      const uploadJob = new UploadJob({
        jobId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        status: JOB_STATUS.PENDING,
        progress: {
          total: students.length,
          processed: 0,
          successful: 0,
          failed: 0,
          percentage: 0
        },
        studentsData: {
          total: totalRows,
          valid: students.length,
          invalid: errors.length,
          duplicates: statistics.duplicates || 0
        },
        weekInfo: {
          weekNumber: weekInfo.weekNumber,
          weekLabel: weekInfo.weekLabel,
          uploadDate: weekInfo.uploadDate
        },
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          uploadSource: 'web'
        }
      });

      // Add validation errors to job
      errors.forEach(error => {
        uploadJob.addError(
          'validation',
          error.message,
          { row: error.row },
          error.regNo
        );
      });

      await uploadJob.save();

      logger.info('📋 Upload job created', {
        jobId,
        totalStudents: students.length,
        validStudents: students.length,
        invalidRows: errors.length
      });

      // Add students to queue
      try {
        await queueManager.addStudentJobsBatch(students, jobId);
        
        uploadJob.startProcessing();
        await uploadJob.save();

        logger.info('✅ Students added to processing queue', {
          jobId,
          count: students.length
        });

      } catch (queueError) {
        logger.error('❌ Failed to add students to queue', {
          jobId,
          error: queueError.message
        });
        
        uploadJob.failProcessing('Failed to queue students for processing');
        await uploadJob.save();
        
        throw new AppError(
          'Failed to start processing. Please try again.',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }

      // Clean up uploaded file (optional - keep for debugging)
      // await excelService.cleanupFile(req.file.path);

      const duration = Date.now() - startTime;

      // Send response
      res.status(HTTP_STATUS.ACCEPTED).json({
        status: 'success',
        message: 'File uploaded successfully. Processing started.',
        data: {
          jobId,
          uploadJob: {
            id: uploadJob._id,
            jobId: uploadJob.jobId,
            status: uploadJob.status,
            fileName: uploadJob.originalName,
            fileSize: formatFileSize(uploadJob.fileSize),
            weekInfo: uploadJob.weekInfo,
            progress: uploadJob.progress,
            studentsData: uploadJob.studentsData
          },
          statistics: {
            totalRows: totalRows,
            validStudents: students.length,
            invalidRows: errors.length,
            duplicates: statistics.duplicates || 0,
            processingRate: statistics.processingRate.toFixed(2) + '%'
          },
          processingInfo: {
            estimatedTime: `${Math.ceil(students.length * 2 / 60)} minutes`,
            queuePosition: 'Processing started',
            statusEndpoint: `/api/jobs/${jobId}`
          }
        },
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      // Clean up file on error
      if (req.file) {
        await excelService.cleanupFile(req.file.path).catch(() => {});
      }
      throw error;
    }
  })
);

/**
 * @route   GET /api/upload/sample
 * @desc    Download sample Excel template
 * @access  Public
 */
router.get(
  '/sample',
  catchAsync(async (req, res) => {
    logger.info('📥 Sample Excel template requested');

    const buffer = await excelService.generateSampleExcel();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=student-data-template.xlsx');
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

    logger.info('✅ Sample Excel template sent');
  })
);

/**
 * @route   GET /api/upload/format
 * @desc    Get expected Excel format information
 * @access  Public
 */
router.get('/format', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: {
      requiredColumns: EXCEL_CONFIG.REQUIRED_COLUMNS,
      columnMapping: EXCEL_CONFIG.COLUMN_MAPPING,
      fileRequirements: {
        maxFileSize: formatFileSize(EXCEL_CONFIG.MAX_FILE_SIZE),
        allowedExtensions: EXCEL_CONFIG.ALLOWED_EXTENSIONS,
        maxStudents: EXCEL_CONFIG.MAX_STUDENTS,
        minStudents: EXCEL_CONFIG.MIN_STUDENTS
      },
      columnDescriptions: {
        'Name': 'Full name of the student',
        'Reg No': 'Unique registration number (alphanumeric)',
        'Dept': 'Department name',
        'Year': 'Academic year (e.g., 1st Year, 2nd Year)',
        'CodeChef ID': 'CodeChef username (optional)',
        'LeetCode ID': 'LeetCode username (optional)',
        'Codeforces ID': 'Codeforces handle (optional)',
        'AtCoder ID': 'AtCoder username (optional)',
        'Codolio ID': 'Codolio username (optional)',
        'GitHub ID': 'GitHub username (optional)'
      },
      notes: [
        'At least one platform ID is required per student',
        'Registration numbers must be unique',
        'Empty cells are allowed for optional platform IDs',
        'First row must contain column headers exactly as specified'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/upload/history
 * @desc    Get upload history
 * @access  Public
 */
router.get(
  '/history',
  catchAsync(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [uploads, total] = await Promise.all([
      UploadJob.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-errors -metadata'),
      UploadJob.countDocuments(query)
    ]);

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        uploads: uploads.map(upload => ({
          id: upload._id,
          jobId: upload.jobId,
          fileName: upload.originalName,
          fileSize: formatFileSize(upload.fileSize),
          status: upload.status,
          progress: upload.progress,
          studentsData: upload.studentsData,
          weekInfo: upload.weekInfo,
          processingStats: upload.processingStats,
          createdAt: upload.createdAt,
          completionPercentage: upload.completionPercentage,
          successRate: upload.successRate
        })),
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

module.exports = router;