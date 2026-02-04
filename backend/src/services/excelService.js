const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;
const { EXCEL_CONFIG, ERROR_TYPES } = require('../utils/constants');
const { validateRegNo, validateName, validatePlatformId, sanitizeString } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Excel Service
 * Handles Excel file parsing, validation, and data extraction
 */
class ExcelService {
  constructor() {
    this.supportedFormats = EXCEL_CONFIG.ALLOWED_EXTENSIONS;
    this.maxFileSize = EXCEL_CONFIG.MAX_FILE_SIZE;
    this.requiredColumns = EXCEL_CONFIG.REQUIRED_COLUMNS;
    this.columnMapping = EXCEL_CONFIG.COLUMN_MAPPING;
  }

  /**
   * Validate uploaded file
   */
  validateFile(file) {
    const errors = [];

    // Check if file exists
    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!this.supportedFormats.includes(fileExtension)) {
      errors.push(`Unsupported file format. Allowed formats: ${this.supportedFormats.join(', ')}`);
    }

    // Check MIME type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push('Invalid file type');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse Excel file and extract data
   */
  async parseExcelFile(filePath) {
    try {
      logger.info('📊 Starting Excel file parsing', { filePath });

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error('File not found or inaccessible');
      }

      // Read the Excel file
      const workbook = XLSX.readFile(filePath);
      
      // Get the first worksheet
      const sheetNames = workbook.SheetNames;
      if (sheetNames.length === 0) {
        throw new Error('No worksheets found in the Excel file');
      }

      const worksheet = workbook.Sheets[sheetNames[0]];
      
      // Convert worksheet to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Use array of arrays format
        defval: '', // Default value for empty cells
        blankrows: false // Skip blank rows
      });

      if (rawData.length === 0) {
        throw new Error('Excel file is empty');
      }

      // Extract headers and data
      const headers = rawData[0];
      const dataRows = rawData.slice(1);

      logger.info('📊 Excel file parsed successfully', {
        headers: headers.length,
        dataRows: dataRows.length
      });

      return {
        headers,
        dataRows,
        totalRows: dataRows.length
      };

    } catch (error) {
      logger.error('❌ Excel parsing failed', { 
        error: error.message,
        filePath 
      });
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Validate Excel headers
   */
  validateHeaders(headers) {
    const errors = [];
    const normalizedHeaders = headers.map(h => h.toString().trim());

    // Check if all required columns are present
    for (const requiredColumn of this.requiredColumns) {
      if (!normalizedHeaders.includes(requiredColumn)) {
        errors.push(`Missing required column: ${requiredColumn}`);
      }
    }

    // Check for duplicate headers
    const duplicates = normalizedHeaders.filter((header, index) => 
      normalizedHeaders.indexOf(header) !== index
    );
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate columns found: ${duplicates.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      normalizedHeaders
    };
  }

  /**
   * Process and validate student data
   */
  async processStudentData(headers, dataRows) {
    try {
      logger.info('🔄 Processing student data', { totalRows: dataRows.length });

      const headerValidation = this.validateHeaders(headers);
      if (!headerValidation.isValid) {
        throw new Error(`Header validation failed: ${headerValidation.errors.join(', ')}`);
      }

      const students = [];
      const errors = [];
      const duplicateRegNos = new Set();
      const seenRegNos = new Set();

      // Create header index mapping
      const headerIndexMap = {};
      headers.forEach((header, index) => {
        const normalizedHeader = header.toString().trim();
        headerIndexMap[normalizedHeader] = index;
      });

      // Process each row
      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        const row = dataRows[rowIndex];
        const rowNumber = rowIndex + 2; // +2 because Excel rows start at 1 and we skip header

        try {
          // Skip empty rows
          if (row.every(cell => !cell || cell.toString().trim() === '')) {
            continue;
          }

          const studentData = this.extractStudentFromRow(row, headerIndexMap, rowNumber);
          
          // Check for duplicate registration numbers
          if (seenRegNos.has(studentData.regNo)) {
            duplicateRegNos.add(studentData.regNo);
            errors.push({
              row: rowNumber,
              type: ERROR_TYPES.VALIDATION,
              message: `Duplicate registration number: ${studentData.regNo}`,
              regNo: studentData.regNo
            });
            continue;
          }

          seenRegNos.add(studentData.regNo);
          students.push(studentData);

        } catch (error) {
          errors.push({
            row: rowNumber,
            type: ERROR_TYPES.VALIDATION,
            message: error.message,
            regNo: row[headerIndexMap['Reg No']] || 'Unknown'
          });
        }
      }

      const result = {
        students,
        errors,
        statistics: {
          totalRows: dataRows.length,
          validStudents: students.length,
          invalidRows: errors.length,
          duplicates: duplicateRegNos.size,
          processingRate: students.length > 0 ? (students.length / dataRows.length) * 100 : 0
        }
      };

      logger.info('✅ Student data processing completed', result.statistics);

      return result;

    } catch (error) {
      logger.error('❌ Student data processing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract student data from a single row
   */
  extractStudentFromRow(row, headerIndexMap, rowNumber) {
    // Extract basic information
    const name = this.getCellValue(row, headerIndexMap['Name']);
    const regNo = this.getCellValue(row, headerIndexMap['Reg No']);
    const department = this.getCellValue(row, headerIndexMap['Dept']);
    const year = this.getCellValue(row, headerIndexMap['Year']);

    // Validate required fields
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      throw new Error(`Row ${rowNumber}: ${nameValidation.error}`);
    }

    const regNoValidation = validateRegNo(regNo);
    if (!regNoValidation.isValid) {
      throw new Error(`Row ${rowNumber}: ${regNoValidation.error}`);
    }

    // Extract platform IDs
    const platformIds = {};
    const platformColumns = {
      'CodeChef ID': 'codechef',
      'LeetCode ID': 'leetcode',
      'Codeforces ID': 'codeforces',
      'AtCoder ID': 'atcoder',
      'Codolio ID': 'codolio',
      'GitHub ID': 'github'
    };

    for (const [columnName, platformKey] of Object.entries(platformColumns)) {
      const platformId = this.getCellValue(row, headerIndexMap[columnName]);
      const validation = validatePlatformId(platformId, columnName);
      
      if (!validation.isValid) {
        throw new Error(`Row ${rowNumber}: ${validation.error}`);
      }
      
      platformIds[platformKey] = validation.value;
    }

    // Check if student has at least one platform ID
    const hasAnyPlatform = Object.values(platformIds).some(id => id !== null && id !== '');
    if (!hasAnyPlatform) {
      throw new Error(`Row ${rowNumber}: Student must have at least one platform ID`);
    }

    return {
      name: nameValidation.value,
      regNo: regNoValidation.value,
      department: sanitizeString(department),
      year: sanitizeString(year),
      platformIds,
      rowNumber
    };
  }

  /**
   * Get cell value safely
   */
  getCellValue(row, columnIndex) {
    if (columnIndex === undefined || columnIndex < 0 || columnIndex >= row.length) {
      return '';
    }
    
    const value = row[columnIndex];
    return value ? value.toString().trim() : '';
  }

  /**
   * Generate sample Excel file
   */
  async generateSampleExcel() {
    try {
      const sampleData = [
        // Headers
        this.requiredColumns,
        // Sample data
        [
          'John Doe',
          '21CS001',
          'Computer Science',
          '3rd Year',
          'john_codechef',
          'john_leetcode',
          'john_cf',
          'john_atcoder',
          'john_codolio',
          'john-github'
        ],
        [
          'Jane Smith',
          '21IT002',
          'Information Technology',
          '2nd Year',
          'jane_codechef',
          'jane_leetcode',
          'jane_cf',
          '',
          'jane_codolio',
          'jane-github'
        ],
        [
          'Bob Johnson',
          '21ECE003',
          'Electronics',
          '4th Year',
          '',
          'bob_leetcode',
          'bob_cf',
          'bob_atcoder',
          '',
          'bob-github'
        ]
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Name
        { wch: 12 }, // Reg No
        { wch: 20 }, // Dept
        { wch: 10 }, // Year
        { wch: 15 }, // CodeChef ID
        { wch: 15 }, // LeetCode ID
        { wch: 15 }, // Codeforces ID
        { wch: 15 }, // AtCoder ID
        { wch: 15 }, // Codolio ID
        { wch: 15 }, // GitHub ID
      ];
      
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      // Generate buffer
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });

      return buffer;

    } catch (error) {
      logger.error('❌ Sample Excel generation failed', { error: error.message });
      throw new Error('Failed to generate sample Excel file');
    }
  }

  /**
   * Clean up uploaded file
   */
  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info('🧹 Uploaded file cleaned up', { filePath });
    } catch (error) {
      logger.warn('⚠️ Failed to cleanup uploaded file', { 
        filePath, 
        error: error.message 
      });
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile()
      };
    } catch (error) {
      logger.error('❌ Failed to get file stats', { 
        filePath, 
        error: error.message 
      });
      return null;
    }
  }
}

module.exports = new ExcelService();