require('dotenv').config();
const database = require('../src/config/database');
const PerformanceHistory = require('../src/models/PerformanceHistory');
const logger = require('../src/utils/logger');

/**
 * Recalculate overall scores for all performance history records
 */
async function recalculateScores() {
  try {
    console.log('🔄 Starting score recalculation...');
    
    // Connect to database
    await database.connect();
    console.log('✅ Connected to database');
    
    // Get all performance history records
    const histories = await PerformanceHistory.find({});
    console.log(`📊 Found ${histories.length} performance history records`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const history of histories) {
      const oldScore = history.overallScore;
      
      // Calculate new score
      history.calculateOverallScore();
      
      if (oldScore !== history.overallScore) {
        await history.save();
        updated++;
        console.log(`✅ Updated ${history.regNo}: ${oldScore} → ${history.overallScore} (${history.performanceLevel})`);
      } else {
        skipped++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Total records: ${histories.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (no change): ${skipped}`);
    console.log('');
    console.log('✅ Score recalculation completed!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

recalculateScores();
