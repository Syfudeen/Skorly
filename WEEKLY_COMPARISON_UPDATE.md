# Weekly Comparison Page Update

## Overview
Updated the Weekly Comparison page to fetch and display real data from the Excel uploads and API instead of using mock data.

## Changes Made

### Backend Changes

#### 1. New API Endpoint: `/api/analytics/weekly-comparison`
- **Location**: `Skorly/backend/src/routes/analytics.js`
- **Purpose**: Provides dedicated endpoint for weekly comparison data
- **Features**:
  - Fetches the two most recent upload jobs
  - Compares current week vs previous week performance
  - Returns student data with previous scores
  - Calculates summary statistics (improved, declined, unchanged)
  - Includes week information and upload dates

**Response Format**:
```json
{
  "status": "success",
  "data": {
    "hasData": true,
    "currentWeek": {
      "weekNumber": 12,
      "weekLabel": "Week 12",
      "uploadDate": "2024-01-15"
    },
    "previousWeek": {
      "weekNumber": 11,
      "weekLabel": "Week 11",
      "uploadDate": "2024-01-08"
    },
    "students": [...],
    "summary": {
      "totalStudents": 50,
      "improved": 25,
      "declined": 10,
      "unchanged": 15,
      "averageCurrentScore": 75,
      "averagePreviousScore": 70
    }
  }
}
```

### Frontend Changes

#### 1. Updated WeeklyComparison Component
- **Location**: 
  - `Skorly/src/components/dashboard/WeeklyComparison.tsx`
  - `Product/src/components/dashboard/WeeklyComparison.tsx`

**New Features**:
- Real-time data fetching from API
- Loading state with spinner
- Error handling with retry button
- Empty state when no data available
- Refresh button to reload data
- Dynamic week labels from backend
- Previous score comparison
- Registration number display
- Department information in student rows

**Key Improvements**:
1. **Data Fetching**: Uses `fetch` API to get data from `/api/analytics/weekly-comparison`
2. **State Management**: React hooks for loading, error, and data states
3. **Data Transformation**: Converts backend format to frontend Student type
4. **User Feedback**: Clear loading, error, and empty states
5. **Refresh Capability**: Manual refresh button for latest data

#### 2. Environment Configuration
- **Files**: 
  - `Skorly/.env`
  - `Product/.env`
- **Variable**: `VITE_API_URL=http://localhost:5000`

## Data Flow

1. **Upload Excel File** → Backend processes and stores in MongoDB
2. **PerformanceHistory Model** → Stores weekly snapshots with scores
3. **API Endpoint** → Aggregates and compares data
4. **Frontend Component** → Fetches and displays comparison

## Key Features

### Summary Cards
- **Improved**: Students with higher scores than previous week (green)
- **Unchanged**: Students with same scores (gray)
- **Declined**: Students with lower scores (red)

### Comparison Table
Displays for each student:
- Name with avatar
- Registration number
- Department
- Previous week score
- Current week score
- Change indicator (up/down/stable)
- Performance level badge (high/medium/low)

### Dynamic Week Labels
- Shows actual week numbers from database
- Displays previous → current week transition
- Includes upload dates

## Usage

### Backend
```bash
cd Skorly/backend
npm start
```

### Frontend
```bash
cd Skorly
npm run dev
```

### Access
Navigate to: `http://localhost:5173/comparison`

## API Integration

The component automatically:
1. Fetches data on mount
2. Handles loading states
3. Shows errors with retry option
4. Displays empty state if no data
5. Allows manual refresh

## Error Handling

- Network errors: Shows error message with retry button
- No data: Shows empty state with upload prompt
- API errors: Displays error details

## Future Enhancements

Potential improvements:
1. Date range selector for custom comparisons
2. Export comparison data to CSV/PDF
3. Filter by department or performance level
4. Sort by different columns
5. Pagination for large datasets
6. Real-time updates via WebSocket
7. Detailed drill-down for individual students
8. Trend charts and visualizations

## Testing

To test the feature:
1. Upload an Excel file with student data
2. Wait for processing to complete
3. Navigate to Weekly Comparison page
4. Upload another Excel file (different week)
5. Refresh the comparison page to see changes

## Dependencies

- React hooks (useState, useEffect)
- Framer Motion (animations)
- Lucide React (icons)
- Tailwind CSS (styling)
- shadcn/ui components (Button, Avatar, etc.)
