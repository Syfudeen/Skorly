/**
 * Test script to verify weekly comparison works
 * This shows how the system compares current vs previous uploads
 */

const mongoose = require('mongoose');
require('dotenv').config();

const PerformanceHistory = require('../src/models/PerformanceHistory');

async function testComparison() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skorly');
    console.log('✅ Connected to database\n');

    // Get all uploads sorted by date
    const allUploads = await PerformanceHistory.aggregate([
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

    console.log('📊 Available Uploads in Database:');
    console.log('================================\n');
    
    if (allUploads.length === 0) {
      console.log('❌ No uploads found in database!');
      console.log('   Please upload an Excel file first.\n');
      process.exit(0);
    }

    allUploads.forEach((upload, index) => {
      console.log(`${index + 1}. ${upload.weekLabel}`);
      console.log(`   Upload ID: ${upload._id}`);
      console.log(`   Date: ${upload.uploadDate.toLocaleString()}`);
      console.log(`   Students: ${upload.studentCount}`);
      console.log('');
    });

    // Test comparison logic
    if (allUploads.length >= 2) {
      console.log('✅ Comparison Available!');
      console.log(`   Current Week: ${allUploads[0].weekLabel}`);
      console.log(`   Previous Week: ${allUploads[1].weekLabel}`);
      console.log('');

      // Get sample student from both weeks
      const currentWeekData = await PerformanceHistory.findOne({
        uploadJobId: allUploads[0]._id
      });

      const previousWeekData = await PerformanceHistory.findOne({
        uploadJobId: allUploads[1]._id,
        regNo: currentWeekData.regNo
      });

      if (previousWeekData) {
        console.log(`📈 Sample Comparison for ${currentWeekData.regNo}:`);
        console.log('   Platform Stats:');
        
        currentWeekData.platformStats.forEach(ps => {
          const prevPs = previousWeekData.platformStats.find(p => p.platform === ps.platform);
          if (prevPs) {
            const change = ps.rating - prevPs.rating;
            const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
            console.log(`   ${ps.platform}: ${prevPs.rating} → ${ps.rating} ${arrow} ${change > 0 ? '+' : ''}${change}`);
          }
        });
      }
    } else {
      console.log('⚠️  Only 1 upload found - Need at least 2 uploads for comparison');
      console.log('');
      console.log('💡 To test comparison:');
      console.log('   1. Upload the same Excel file again (or a new one)');
      console.log('   2. The system will compare the new upload with the current one');
      console.log('   3. You will see rating changes in the Weekly Comparison page');
    }

    console.log('');
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testComparison();
