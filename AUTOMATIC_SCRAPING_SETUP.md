# Automatic Weekly Scraping Setup

## Overview

The system now supports **automatic weekly data scraping**. You only need to upload the Excel file **once** with student IDs and platform usernames. The system will automatically scrape fresh data every week and store it for comparison.

## How It Works

```
┌─────────────────┐
│  Upload Excel   │  ← One-time upload with student IDs
│   (Week 0)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auto Scrape    │  ← System scrapes every Sunday 11:59 PM
│   (Week 1)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auto Scrape    │  ← Automatic weekly scraping
│   (Week 2)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Comparison    │  ← Compare Week 2 vs Week 1
│  Week 1 → 2     │
└─────────────────┘
```

## Installation

### 1. Install node-cron Package

```bash
cd Skorly/backend
npm install node-cron
```

### 2. Start the Backend Server

```bash
npm start
```

The scheduler will automatically start and log:
```
📅 Scheduled scraper started - Will run every Sunday at 11:59 PM
```

## Features

### Automatic Scheduling
- **Frequency**: Every Sunday at 11:59 PM IST
- **Action**: Scrapes all students' data from all platforms
- **Storage**: Saves as a new week in PerformanceHistory
- **Comparison**: Enables week-to-week comparison

### Manual Trigger
You can manually trigger scraping anytime:

**Via UI:**
1. Go to "Auto Scraper" page in the sidebar
2. Click "Trigger Manual Scrape" button

**Via API:**
```bash
curl -X POST http://localhost:5000/api/scraper/trigger
```

### Check Status
**Via UI:**
- Visit the "Auto Scraper" page to see current status

**Via API:**
```bash
curl http://localhost:5000/api/scraper/status
```

## API Endpoints

### POST /api/scraper/trigger
Manually trigger weekly scraping

**Response:**
```json
{
  "status": "success",
  "message": "Weekly scraping started. This will take a few minutes.",
  "timestamp": "2026-02-06T14:09:11.000Z"
}
```

### GET /api/scraper/status
Get current scraper status

**Response:**
```json
{
  "status": "success",
  "data": {
    "isRunning": false,
    "message": "Scraper is idle. Scheduled to run every Sunday at 11:59 PM"
  },
  "timestamp": "2026-02-06T14:09:11.000Z"
}
```

## Workflow

### Initial Setup (One Time)

1. **Upload Excel File** with student data:
   - Student Name
   - Registration Number
   - Department
   - Year
   - Platform IDs (CodeChef, LeetCode, Codeforces, etc.)

2. **System Stores** student information in database

3. **First Scrape** happens automatically on next Sunday at 11:59 PM
   - Or trigger manually via UI/API

### Weekly Automatic Process

Every Sunday at 11:59 PM:

1. **System fetches** all students from database
2. **Scrapes data** from each platform:
   - CodeChef
   - LeetCode
   - Codeforces
   - AtCoder
   - GitHub
3. **Calculates** overall scores and performance levels
4. **Stores** as new week in PerformanceHistory
5. **Enables** comparison with previous weeks

### Viewing Comparisons

1. Go to **Weekly Comparison** page
2. Select any week from dropdown
3. System shows comparison with previous week:
   - Previous Rating
   - Current Rating
   - Rating Change
   - Problems Solved Change

## Configuration

### Change Schedule Time

Edit `Skorly/backend/src/services/scheduledScraper.js`:

```javascript
// Current: Every Sunday at 11:59 PM
this.cronJob = cron.schedule('59 23 * * 0', async () => {
  // ...
});

// Examples:
// Every day at midnight: '0 0 * * *'
// Every Monday at 9 AM: '0 9 * * 1'
// Every hour: '0 * * * *'
```

### Change Timezone

```javascript
this.cronJob = cron.schedule('59 23 * * 0', async () => {
  // ...
}, {
  scheduled: true,
  timezone: "America/New_York" // Change this
});
```

## Benefits

✅ **No Repeated Uploads**: Upload Excel once, system handles the rest  
✅ **Automatic Tracking**: Weekly data captured automatically  
✅ **Historical Comparison**: Compare any week with its previous week  
✅ **Platform Coverage**: Scrapes all configured platforms  
✅ **Manual Control**: Trigger scraping anytime via UI or API  
✅ **Status Monitoring**: Check if scraping is running  

## Troubleshooting

### Scraper Not Running

1. Check if backend server is running
2. Check logs for errors:
   ```bash
   tail -f Skorly/backend/logs/combined.log
   ```

### No Data After Scraping

1. Verify students exist in database
2. Check platform IDs are correct
3. Check platform APIs are accessible
4. Review logs for scraping errors

### Manual Trigger Not Working

1. Ensure backend is running
2. Check API endpoint is accessible
3. Verify no scraping is already in progress

## Logs

Scraping logs are stored in:
- `Skorly/backend/logs/combined.log`
- `Skorly/backend/logs/error.log`

Example log output:
```
🚀 Starting weekly automatic scrape...
Found 3 students to scrape
Starting scrape for Week 7 (Job: job_1770364015156_tmu98v)
Scraping data for Mohammed Syfudeen S (711523BCB036)...
Saved performance history for 711523BCB036 - Week 7
✅ Weekly scrape completed!
   Week: Week 7
   Success: 3/3
   Failed: 0
   Duration: 45.23s
```

## Next Steps

1. Install `node-cron`: `npm install node-cron`
2. Restart backend server
3. Upload student Excel file (if not already done)
4. Wait for Sunday 11:59 PM, or trigger manually
5. View comparisons in Weekly Comparison page

That's it! The system will now automatically track student progress week by week.
