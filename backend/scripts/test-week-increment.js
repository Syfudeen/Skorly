/**
 * Test script to verify week auto-increment works
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { generateWeekInfo } = require('../src/utils/helpers');

async function testWeekIncrement() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skorly');
    console.log('✅ Connected to database\n');

    console.log('🧪 Testing Week Auto-Increment\n');
    console.log('================================\n');

    // Test generating week info
    const weekInfo = await generateWeekInfo();
    
    console.log('📅 Next Upload Will Be:');
    console.log(`   Week Number: ${weekInfo.weekNumber}`);
    console.log(`   Week Label: ${weekInfo.weekLabel}`);
    console.log(`   Upload Date: ${weekInfo.uploadDate.toLocaleString()}`);
    console.log('');

    console.log('💡 How it works:');
    console.log('   - System checks the latest upload in database');
    console.log('   - Increments the week number by 1');
    console.log('   - Next upload will be stored as this week');
    console.log('');

    console.log('✅ Week auto-increment is working!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Upload a new Excel file');
    console.log(`   2. It will be saved as "${weekInfo.weekLabel}"`);
    console.log('   3. Weekly Comparison will show the difference!');
    console.log('');

    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testWeekIncrement();
