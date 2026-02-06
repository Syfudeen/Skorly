# Weekly Comparison Fix

## Issue
The Weekly Comparison page was showing "Failed to load comparison data" error with message "Failed to fetch weekly comparison data".

## Root Cause
1. The backend server was running `server-working.js` instead of `server.js`
2. The `server-working.js` file didn't have the `/api/analytics/weekly-comparison` endpoint
3. The PerformanceHistory records had `overallScore` set to 0 because the `calculateOverallScore()` method wasn't being called

## Solution

### 1. Added Weekly Comparison Endpoint to server-working.js
Added the `/api/analytics/weekly-comparison` endpoint to `Skorly/backend/src/server-working.js`:

```javascript
app.get('/api/analytics/weekly-comparison', async (req, res) => {
  // Fetches the two most recent upload jobs
  // Compares current week vs previous week
  // Returns student data with performance comparison
  // Calculates improved, declined, unchanged counts
});
```

**Features:**
- Fetches the two most recent upload jobs from PerformanceHistory
- Compares current week data with previous week data
- Returns student details with performance metrics
- Calculates summary statistics (improved, declined, unchanged)
- Handles cases where there's no previous data

### 2. Fixed Score Calculation in processStudent Function
Updated the `processStudent` function in `server-working.js` to calculate overall scores:

**Before:**
```javascript
await PerformanceHistory.create({
  // ... other fields
  overallScore: 0, // Always 0!
  performanceLevel: 'low',
});
```

**After:**
```javascript
const performanceHistory = await PerformanceHistory.create({
  // ... other fields
  overallScore: 0,
  performanceLevel: 'low',
});

// Calculate overall score using the model method
performanceHistory.calculateOverallScore();
await performanceHistory.save();
```

### 3. Created Score Recalculation Script
Created `Skorly/backend/scripts/recalculate-scores.js` to fix existing records:

```bash
node scripts/recalculate-scores.js
```

This script:
- Connects to MongoDB
- Fetches all PerformanceHistory records
- Recalculates overall scores using the model method
- Updates performance levels (high/medium/low)
- Saves the updated records

**Results:**
- Updated 39 performance history records
- Scores now range from 60-93 (previously all 0)
- Performance levels properly assigned

### 4. Restarted Backend Server
Stopped and restarted the backend server to load the new endpoint:

```bash
# Stop old process
# Start new process
node src/server-working.js
```

## Verification

### API Test
```bash
curl http://localhost:5000/api/analytics/weekly-comparison
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "hasData": true,
    "currentWeek": {
      "weekNumber": 6,
      "weekLabel": "Week 6",
      "uploadDate": "2026-02-05T09:58:09.315Z"
    },
    "previousWeek": {
      "weekNumber": 1,
      "weekLabel": "Week 1",
      "uploadDate": "2026-02-05T09:46:04.011Z"
    },
    "students": [...],
    "summary": {
      "totalStudents": 3,
      "improved": 0,
      "declined": 0,
      "unchanged": 3,
      "averageCurrentScore": 70,
      "averagePreviousScore": 70
    }
  }
}
```

### Frontend Test
The Weekly Comparison page now:
- ✅ Loads without errors
- ✅ Displays student data with real scores
- ✅ Shows week labels (Week 1 → Week 6)
- ✅ Displays comparison statistics
- ✅ Shows performance levels (high/medium/low)
- ✅ Includes refresh button

## Files Modified

1. **Skorly/backend/src/server-working.js**
   - Added `/api/analytics/weekly-comparison` endpoint
   - Fixed score calculation in `processStudent` function
   - Updated startup message to include new endpoint

2. **Skorly/backend/scripts/recalculate-scores.js** (NEW)
   - Script to recalculate scores for existing records

## Current Status

✅ **FIXED** - The Weekly Comparison page now works correctly with real data from the database.

## Data Flow

1. **Upload Excel** → Backend processes and stores in MongoDB
2. **PerformanceHistory** → Stores weekly snapshots with calculated scores
3. **API Endpoint** → Aggregates and compares data between weeks
4. **Frontend Component** → Fetches and displays comparison

## Next Steps

For future uploads:
1. Upload new Excel file with updated student data
2. Backend will automatically calculate scores
3. Weekly Comparison page will show the comparison
4. Improved/Declined counts will be accurate

## Notes

- The comparison works by comparing the two most recent upload jobs
- If there's only one upload, all students show as "unchanged"
- Scores are calculated based on:
  - Rating (40% weight)
  - Problems solved (40% weight)
  - Contest participation (20% weight)
- Performance levels:
  - High: Score ≥ 80
  - Medium: Score ≥ 50
  - Low: Score < 50
