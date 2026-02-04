const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('../src/models/Student');
const PlatformStats = require('../src/models/PlatformStats');
const PerformanceHistory = require('../src/models/PerformanceHistory');
const UploadJob = require('../src/models/UploadJob');

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skorly');
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing collections...');
    
    const studentCount = await Student.countDocuments();
    const platformStatsCount = await PlatformStats.countDocuments();
    const historyCount = await PerformanceHistory.countDocuments();
    const jobCount = await UploadJob.countDocuments();
    
    console.log(`\nCurrent records:`);
    console.log(`  - Students: ${studentCount}`);
    console.log(`  - Platform Stats: ${platformStatsCount}`);
    console.log(`  - Performance History: ${historyCount}`);
    console.log(`  - Upload Jobs: ${jobCount}`);
    
    await Student.deleteMany({});
    await PlatformStats.deleteMany({});
    await PerformanceHistory.deleteMany({});
    await UploadJob.deleteMany({});
    
    console.log('\n✅ All collections cleared!');
    console.log('You can now upload a new Excel file with fresh data.');
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearDatabase();
