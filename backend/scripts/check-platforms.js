const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('../src/models/Student');

async function checkPlatforms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skorly');
    
    const students = await Student.find();
    console.log(`\n📊 Total Students: ${students.length}\n`);

    if (students.length === 0) {
      console.log('⚠️  No students found. Upload an Excel file first.\n');
      process.exit(0);
    }

    console.log('Platform Coverage:\n');
    const platforms = ['codechef', 'leetcode', 'codeforces', 'github', 'atcoder', 'codolio'];
    
    platforms.forEach(platform => {
      const count = students.filter(s => s.platformIds[platform]).length;
      console.log(`  ${platform.padEnd(12)}: ${count} students`);
    });

    console.log('\n📝 Sample Student:');
    const sample = students[0];
    console.log(`  Name: ${sample.name}`);
    console.log(`  Reg No: ${sample.regNo}`);
    console.log(`  Platforms:`);
    Object.entries(sample.platformIds).forEach(([platform, username]) => {
      if (username) {
        console.log(`    - ${platform}: ${username}`);
      }
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPlatforms();
