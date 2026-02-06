/**
 * Manually trigger a scrape to create Week 7
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function triggerScrape() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skorly');
    console.log('✅ Connected to database\n');

    const scheduledScraper = require('../src/services/scheduledScraper');

    console.log('🚀 Triggering manual scrape...');
    console.log('This will create Week 7 with fresh data from platforms\n');

    await scheduledScraper.runWeeklyScrape();

    console.log('\n✅ Scrape completed!');
    console.log('📊 Go to Weekly Comparison page and select Week 7');
    console.log('You should now see: Week 6 → Week 7 with rating changes\n');

    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

triggerScrape();
