require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Import services
const excelService = require('./services/excelService');
const platformService = require('./services/platformService');

// Import models
const database = require('./config/database');
const Student = require('./models/Student');
const PlatformStats = require('./models/PlatformStats');
const PerformanceHistory = require('./models/PerformanceHistory');
const UploadJob = require('./models/UploadJob');

// Import utilities
const logger = require('./utils/logger');
const { generateJobId, generateWeekInfo, formatFileSize } = require('./utils/helpers');
const { HTTP_STATUS, EXCEL_CONFIG, JOB_STATUS, PLATFORMS } = require('./utils/constants');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));

// CORS - allow multiple origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8080').split(',');
app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(compression());

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
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
    
    // Check extension
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      // Also check MIME type as fallback
      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream' // Sometimes Excel files are sent as this
      ];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Please upload .xlsx or .xls files. Got: ${ext} (${file.mimetype})`));
      }
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running (Working Mode - No Redis Required)',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Running in working mode with synchronous processing',
    services: {
      database: 'connected',
      redis: 'not required',
      queue: 'synchronous processing'
    }
  });
});

/**
 * Process a single student - fetch data from all platforms
 */
async function processStudent(studentData, jobId, uploadJob) {
  const { regNo, name, dept, year, platformIds } = studentData;
  
  try {
    logger.info(`Processing student: ${regNo} - ${name}`);
    
    // Find previous data for comparison
    const previousStudent = await Student.findOne({ regNo });
    
    // Fetch data from all platforms
    const platformResults = {};
    const platformStats = [];
    
    for (const [platform, username] of Object.entries(platformIds)) {
      if (!username) continue;
      
      try {
        logger.info(`Fetching ${platform} data for ${username}`);
        const data = await platformService.fetchPlatformStats(platform, username);
        
        if (data) {
          platformResults[platform] = data;
          
          // Find previous stats for comparison
          const previousStats = previousStudent 
            ? await PlatformStats.findOne({ regNo, platform })
            : null;
          
          platformStats.push({
            regNo,
            platform,
            platformUserId: username,
            currentStats: {
              rating: data.rating || 0,
              maxRating: data.maxRating || data.rating || 0,
              problemsSolved: data.problemsSolved || 0,
              contestsParticipated: data.contestsParticipated || 0,
              rank: data.rank || null,
              additionalData: data.additionalData || {}
            },
            previousStats: previousStats ? {
              rating: previousStats.currentStats?.rating || 0,
              maxRating: previousStats.currentStats?.maxRating || 0,
              problemsSolved: previousStats.currentStats?.problemsSolved || 0,
              contestsParticipated: previousStats.currentStats?.contestsParticipated || 0,
              rank: previousStats.currentStats?.rank || null,
              additionalData: previousStats.currentStats?.additionalData || {}
            } : {
              rating: 0,
              maxRating: 0,
              problemsSolved: 0,
              contestsParticipated: 0,
              rank: null,
              additionalData: {}
            },
            changes: {
              rating: previousStats ? (data.rating || 0) - (previousStats.currentStats?.rating || 0) : 0,
              maxRating: previousStats ? (data.maxRating || data.rating || 0) - (previousStats.currentStats?.maxRating || 0) : 0,
              problemsSolved: previousStats ? (data.problemsSolved || 0) - (previousStats.currentStats?.problemsSolved || 0) : 0,
              contestsParticipated: previousStats ? (data.contestsParticipated || 0) - (previousStats.currentStats?.contestsParticipated || 0) : 0,
              rank: 0
            },
            lastFetched: new Date(),
            fetchStatus: 'success',
            errorMessage: null,
            uploadJobId: jobId
          });
        }
      } catch (error) {
        logger.error(`Failed to fetch ${platform} data for ${username}:`, error.message);
        uploadJob.addError('api', `Failed to fetch ${platform} data`, { platform, username }, regNo);
      }
    }
    
    // Calculate total stats
    const totalStats = {
      totalProblems: platformStats.reduce((sum, p) => sum + p.currentStats.problemsSolved, 0),
      totalContests: platformStats.reduce((sum, p) => sum + p.currentStats.contestsParticipated, 0),
      averageRating: platformStats.length > 0 
        ? platformStats.reduce((sum, p) => sum + p.currentStats.rating, 0) / platformStats.length 
        : 0,
      activePlatforms: platformStats.length
    };
    
    // Update or create student record
    const student = await Student.findOneAndUpdate(
      { regNo },
      {
        regNo,
        name,
        dept,
        year,
        platformIds,
        totalStats,
        lastUpdated: new Date(),
        uploadJobId: jobId
      },
      { upsert: true, new: true }
    );
    
    // Save platform stats
    for (const stats of platformStats) {
      await PlatformStats.findOneAndUpdate(
        { regNo: stats.regNo, platform: stats.platform },
        {
          regNo: stats.regNo,
          platform: stats.platform,
          platformUserId: stats.platformUserId,
          currentStats: stats.currentStats,
          previousStats: stats.previousStats,
          changes: stats.changes,
          lastFetched: stats.lastFetched,
          fetchStatus: stats.fetchStatus,
          errorMessage: stats.errorMessage,
          uploadJobId: stats.uploadJobId
        },
        { upsert: true, new: true }
      );
    }
    
    // Create performance history entry
    const performanceHistory = await PerformanceHistory.create({
      regNo,
      uploadJobId: jobId,
      weekNumber: uploadJob.weekInfo?.weekNumber || 1,
      weekLabel: uploadJob.weekInfo?.weekLabel || 'Week 1',
      uploadDate: new Date(),
      platformStats: platformStats.map(p => ({
        platform: p.platform,
        rating: p.currentStats.rating,
        maxRating: p.currentStats.maxRating,
        problemsSolved: p.currentStats.problemsSolved,
        contestsParticipated: p.currentStats.contestsParticipated,
        rank: p.currentStats.rank,
        fetchStatus: p.fetchStatus
      })),
      overallScore: 0, // Will be calculated by the model method
      performanceLevel: 'low',
      totalPlatforms: platformStats.length,
      activePlatforms: platformStats.length,
      metadata: {
        processingTime: 0,
        errors: []
      }
    });
    
    // Calculate overall score
    performanceHistory.calculateOverallScore();
    await performanceHistory.save();
    
    logger.info(`✅ Successfully processed: ${regNo}`);
    return { success: true, regNo };
    
  } catch (error) {
    logger.error(`❌ Failed to process student ${regNo}:`, error.message);
    console.error('Full error:', error);
    uploadJob.addError('processing', error.message, {}, regNo);
    return { success: false, regNo, error: error.message };
  }
}

/**
 * Upload Excel and process students
 */
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    // Handle multer errors
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        status: 'error', 
        message: err.message || 'File upload failed'
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No file uploaded' });
      }

      logger.info('📤 File upload received:', req.file.originalname);

    // Parse Excel file
    const { headers, dataRows, totalRows } = await excelService.parseExcelFile(req.file.path);
    const { students, errors, statistics } = await excelService.processStudentData(headers, dataRows);

    if (students.length === 0) {
      await excelService.cleanupFile(req.file.path);
      
      // Provide detailed error message
      let errorMsg = 'No valid students found in Excel file.';
      if (errors.length > 0) {
        errorMsg += ` Errors: ${errors.slice(0, 3).map(e => e.message).join('; ')}`;
        if (errors.length > 3) {
          errorMsg += ` (and ${errors.length - 3} more errors)`;
        }
      }
      
      return res.status(400).json({ status: 'error', message: errorMsg, errors: errors.slice(0, 10) });
    }

    // Create upload job
    const jobId = generateJobId();
    const weekInfo = await generateWeekInfo();
    
    const uploadJob = new UploadJob({
      jobId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      status: JOB_STATUS.PROCESSING,
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
      weekInfo
    });

    await uploadJob.save();

    // Process students synchronously (in background)
    res.status(202).json({
      status: 'success',
      message: 'File uploaded. Processing started.',
      data: {
        jobId,
        totalStudents: students.length,
        statusEndpoint: `/api/jobs/${jobId}`
      }
    });

    // Process in background
    (async () => {
      for (let i = 0; i < students.length; i++) {
        const result = await processStudent(students[i], jobId, uploadJob);
        
        uploadJob.progress.processed = i + 1;
        if (result.success) {
          uploadJob.progress.successful++;
        } else {
          uploadJob.progress.failed++;
        }
        uploadJob.progress.percentage = Math.round((i + 1) / students.length * 100);
        
        await uploadJob.save();
      }
      
      uploadJob.completeProcessing();
      await uploadJob.save();
      logger.info(`✅ Job ${jobId} completed`);
    })();

    } catch (error) {
      logger.error('Upload error:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
});

// Get job status
app.get('/api/jobs/:jobId', async (req, res) => {
  try {
    const job = await UploadJob.findOne({ jobId: req.params.jobId });
    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }
    res.json({ status: 'success', data: { job } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get all students with sorting
app.get('/api/students', async (req, res) => {
  try {
    const { sort, order = 'asc', limit = 500, platform } = req.query;
    
    // Default: sort by creation time (Excel sheet order)
    let sortOptions = { createdAt: 1 }; // Ascending order (first uploaded first)
    
    // Only apply custom sorting if explicitly requested
    if (sort) {
      let sortField = 'totalStats.totalProblems';
      if (sort === 'rating') sortField = 'totalStats.averageRating';
      if (sort === 'contests') sortField = 'totalStats.totalContests';
      sortOptions = { [sortField]: order === 'desc' ? -1 : 1 };
    }
    
    const students = await Student.find()
      .sort(sortOptions)
      .limit(parseInt(limit));
    
    // If platform filter is specified, fetch platform-specific stats
    if (platform && platform !== 'all') {
      const studentsWithPlatformStats = await Promise.all(
        students.map(async (student) => {
          const platformStat = await PlatformStats.findOne({ 
            regNo: student.regNo, 
            platform: platform.toLowerCase() 
          });
          
          return {
            ...student.toObject(),
            platformStats: platformStat ? {
              platform: platformStat.platform,
              rating: platformStat.currentStats?.rating || 0,
              maxRating: platformStat.currentStats?.maxRating || 0,
              problemsSolved: platformStat.currentStats?.problemsSolved || 0,
              contestsParticipated: platformStat.currentStats?.contestsParticipated || 0,
              rank: platformStat.currentStats?.rank || null,
              changes: platformStat.changes || {},
              fetchStatus: platformStat.fetchStatus,
              additionalData: platformStat.currentStats?.additionalData || {}
            } : null
          };
        })
      );
      
      // Return ALL students, even those without platform data
      return res.json({ 
        status: 'success', 
        data: { 
          students: studentsWithPlatformStats, 
          total: studentsWithPlatformStats.length,
          platform 
        } 
      });
    }
    
    res.json({ status: 'success', data: { students, total: students.length } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get student details
app.get('/api/students/:regNo', async (req, res) => {
  try {
    const student = await Student.findOne({ regNo: req.params.regNo });
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }
    
    const platformStats = await PlatformStats.find({ regNo: req.params.regNo });
    const history = await PerformanceHistory.find({ regNo: req.params.regNo }).sort({ uploadDate: -1 });
    
    res.json({ status: 'success', data: { student, platformStats, history } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get leaderboard
app.get('/api/analytics/leaderboard', async (req, res) => {
  try {
    const { limit = 10, metric = 'totalProblems' } = req.query;
    
    let sortField = 'totalStats.totalProblems';
    if (metric === 'rating') sortField = 'totalStats.averageRating';
    if (metric === 'contests') sortField = 'totalStats.totalContests';
    
    const students = await Student.find()
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));
    
    res.json({ 
      status: 'success', 
      data: { 
        leaderboard: students.map((s, idx) => ({
          rank: idx + 1,
          regNo: s.regNo,
          name: s.name,
          dept: s.dept,
          totalProblems: s.totalStats.totalProblems,
          averageRating: Math.round(s.totalStats.averageRating),
          totalContests: s.totalStats.totalContests,
          activePlatforms: s.totalStats.activePlatforms
        }))
      } 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get weekly comparison
app.get('/api/analytics/weekly-comparison', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Get the two most recent upload jobs
    const recentUploads = await PerformanceHistory.aggregate([
      {
        $group: {
          _id: '$uploadJobId',
          uploadDate: { $first: '$uploadDate' },
          weekNumber: { $first: '$weekNumber' },
          weekLabel: { $first: '$weekLabel' }
        }
      },
      { $sort: { uploadDate: -1 } },
      { $limit: 2 }
    ]);

    if (recentUploads.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          hasData: false,
          message: 'No data available. Please upload student data first.'
        },
        timestamp: new Date().toISOString()
      });
    }

    const currentUploadJobId = recentUploads[0]._id;
    const previousUploadJobId = recentUploads.length > 1 ? recentUploads[1]._id : null;

    // Get current week data
    const currentWeekData = await PerformanceHistory.find({
      uploadJobId: currentUploadJobId
    }).limit(parseInt(limit));

    // Get previous week data if available
    let previousWeekData = [];
    if (previousUploadJobId) {
      previousWeekData = await PerformanceHistory.find({
        uploadJobId: previousUploadJobId
      });
    }

    // Create a map of previous scores
    const previousScoresMap = new Map();
    previousWeekData.forEach(history => {
      previousScoresMap.set(history.regNo, history.overallScore);
    });

    // Get student details and calculate comparison
    const studentsWithComparison = await Promise.all(
      currentWeekData.map(async (history) => {
        const student = await Student.findOne({ regNo: history.regNo });
        const previousScore = previousScoresMap.get(history.regNo);

        return {
          _id: student?._id || history.regNo,
          regNo: history.regNo,
          name: student?.name || 'Unknown',
          department: student?.dept || 'Unknown',
          year: student?.year || 'N/A',
          platformIds: student?.platformIds || {},
          performance: {
            overallScore: history.overallScore,
            previousScore: previousScore,
            performanceLevel: history.performanceLevel,
            platformStats: history.platformStats.map(ps => ({
              platform: ps.platform,
              rating: ps.rating,
              problemsSolved: ps.problemsSolved,
              contestsParticipated: ps.contestsParticipated,
              rank: ps.rank,
              fetchStatus: ps.fetchStatus
            })),
            weekInfo: {
              weekNumber: history.weekNumber,
              weekLabel: history.weekLabel,
              uploadDate: history.uploadDate
            }
          }
        };
      })
    );

    // Calculate summary statistics
    let improved = 0;
    let declined = 0;
    let unchanged = 0;

    studentsWithComparison.forEach(student => {
      const current = student.performance.overallScore;
      const previous = student.performance.previousScore;

      if (previous !== undefined) {
        if (current > previous) improved++;
        else if (current < previous) declined++;
        else unchanged++;
      } else {
        unchanged++;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        hasData: true,
        currentWeek: {
          weekNumber: recentUploads[0].weekNumber,
          weekLabel: recentUploads[0].weekLabel,
          uploadDate: recentUploads[0].uploadDate
        },
        previousWeek: previousUploadJobId ? {
          weekNumber: recentUploads[1].weekNumber,
          weekLabel: recentUploads[1].weekLabel,
          uploadDate: recentUploads[1].uploadDate
        } : null,
        students: studentsWithComparison,
        summary: {
          totalStudents: studentsWithComparison.length,
          improved,
          declined,
          unchanged,
          averageCurrentScore: Math.round(
            studentsWithComparison.reduce((sum, s) => sum + s.performance.overallScore, 0) / 
            studentsWithComparison.length
          ),
          averagePreviousScore: previousWeekData.length > 0 ? Math.round(
            previousWeekData.reduce((sum, h) => sum + h.overallScore, 0) / 
            previousWeekData.length
          ) : null
        }
      },
      timestamp: new Date().toISOString()
    });

    logger.debug('📊 Weekly comparison data retrieved', {
      currentWeek: recentUploads[0].weekLabel,
      previousWeek: previousUploadJobId ? recentUploads[1].weekLabel : 'none',
      totalStudents: studentsWithComparison.length,
      improved,
      declined
    });
  } catch (error) {
    logger.error('Weekly comparison error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Trigger manual scrape
app.post('/api/scraper/trigger', async (req, res) => {
  try {
    logger.info('Manual scrape triggered via API');
    const scheduledScraper = require('./services/scheduledScraper');
    
    // Trigger scrape in background
    scheduledScraper.triggerManualScrape().catch(error => {
      logger.error('Manual scrape failed:', error);
    });

    res.status(202).json({
      status: 'success',
      message: 'Weekly scraping started. This will take a few minutes.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to trigger scrape:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start scraping',
      error: error.message
    });
  }
});

// Get scraper status
app.get('/api/scraper/status', async (req, res) => {
  try {
    const scheduledScraper = require('./services/scheduledScraper');
    res.status(200).json({
      status: 'success',
      data: {
        isRunning: scheduledScraper.isRunning,
        message: scheduledScraper.isRunning 
          ? 'Scraping in progress...' 
          : 'Scraper is idle. Scheduled to run every Sunday at 11:59 PM'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get scraper status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get status',
      error: error.message
    });
  }
});

// Get available weeks
app.get('/api/analytics/available-weeks', async (req, res) => {
  try {
    const availableWeeks = await PerformanceHistory.aggregate([
      {
        $group: {
          _id: '$uploadJobId',
          uploadDate: { $first: '$uploadDate' },
          weekNumber: { $first: '$weekNumber' },
          weekLabel: { $first: '$weekLabel' },
          studentCount: { $sum: 1 }
        }
      },
      { $sort: { uploadDate: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        weeks: availableWeeks.map(week => ({
          uploadJobId: week._id,
          weekNumber: week.weekNumber,
          weekLabel: week.weekLabel,
          uploadDate: week.uploadDate,
          studentCount: week.studentCount
        })),
        totalWeeks: availableWeeks.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get available weeks:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get weeks',
      error: error.message
    });
  }
});

// Refresh data - Re-fetch platform data for all students
app.post('/api/refresh-data', async (req, res) => {
  try {
    logger.info('🔄 Data refresh requested');
    
    // Get all students
    const students = await Student.find().sort({ createdAt: 1 });
    
    if (students.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No students found. Please upload an Excel file first.' 
      });
    }

    // Create a temporary job ID for this refresh
    const jobId = generateJobId();
    const weekInfo = await generateWeekInfo();
    
    // Process in background
    res.status(202).json({
      status: 'success',
      message: 'Data refresh started. This may take a few minutes.',
      data: {
        jobId,
        totalStudents: students.length
      }
    });

    // Process students in background
    (async () => {
      logger.info(`🔄 Refreshing data for ${students.length} students`);
      
      for (const student of students) {
        try {
          const studentData = {
            regNo: student.regNo,
            name: student.name,
            dept: student.dept,
            year: student.year,
            platformIds: student.platformIds
          };
          
          // Create a minimal upload job object for logging
          const mockUploadJob = {
            addError: (type, message, data, regNo) => {
              logger.error(`Error processing ${regNo}: ${message}`);
            }
          };
          
          await processStudent(studentData, jobId, mockUploadJob);
          
        } catch (error) {
          logger.error(`Failed to refresh data for ${student.regNo}:`, error.message);
        }
      }
      
      logger.info(`✅ Data refresh completed for ${students.length} students`);
    })();

  } catch (error) {
    logger.error('Refresh error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Download sample Excel
app.get('/api/upload/sample', async (req, res) => {
  try {
    const buffer = await excelService.generateSampleExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=student-template.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Skorly Backend (Working Mode)...');
    
    // Connect to MongoDB
    await database.connect();
    console.log('✅ MongoDB connected');
    
    // Initialize Scheduled Scraper
    console.log('🔄 Initializing Scheduled Scraper...');
    const scheduledScraper = require('./services/scheduledScraper');
    scheduledScraper.start();
    
    app.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║         Skorly Backend - Working Mode (No Redis)         ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📋 Available Endpoints:');
      console.log('   POST   /api/upload              - Upload Excel file');
      console.log('   GET    /api/upload/sample       - Download sample template');
      console.log('   GET    /api/jobs/:jobId         - Get job progress');
      console.log('   GET    /api/students            - Get all students (sorted)');
      console.log('   GET    /api/students/:regNo     - Get student details');
      console.log('   GET    /api/analytics/leaderboard - Get top performers');
      console.log('   GET    /api/analytics/weekly-comparison - Get weekly comparison');
      console.log('   POST   /api/scraper/trigger     - Trigger manual scrape');
      console.log('   GET    /api/scraper/status      - Get scraper status');
      console.log('');
      console.log('⚡ Processing Mode: Synchronous (no queue)');
      console.log('📈 Fetches real data from Codeforces, LeetCode, CodeChef');
      console.log('🎯 Analyzes and sorts by performance');
      console.log('📅 Auto-scrapes every Sunday at 11:59 PM');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
