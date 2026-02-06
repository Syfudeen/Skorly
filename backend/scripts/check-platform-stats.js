const mongoose = require('mongoose');
require('dotenv').config();

const PlatformStats = require('../src/models/PlatformStats');

async function checkStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skorly');
    
    const stats = await PlatformStats.find();
    console.log(`\n📊 Total Platform Stats: ${stats.length}\n`);

    const platforms = ['codechef', 'leetcode', 'codeforces', 'github'];
    
    for (const platform of platforms) {
      const platformStats = stats.filter(s => s.platform === platform);
      console.log(`${platform.toUpperCase()}:`);
      if (platformStats.length > 0) {
        platformStats.forEach(s => {
          console.log(`  ✅ ${s.regNo} - ${s.platformUserId}`);
          console.log(`     Status: ${s.fetchStatus}`);
          console.log(`     Problems: ${s.currentStats?.problemsSolved || 0}`);
          console.log(`     Rating: ${s.currentStats?.rating || 0}`);
        });
      } else {
        console.log(`  ❌ No stats found`);
      }
      console.log('');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkStats();
