# Platform-Specific Filtering Feature

## Overview

The dashboard now supports **dynamic platform filtering** that shows real-time, platform-specific performance data for each coding platform (Codeforces, LeetCode, CodeChef, GitHub, etc.).

## How It Works

### 1. Platform Selector
- Located at the top of the dashboard
- Dropdown menu with all available platforms:
  - **Overall Performance** - Shows combined stats from all platforms
  - **CodeChef** - Shows only CodeChef data
  - **LeetCode** - Shows only LeetCode data
  - **Codeforces** - Shows only Codeforces data
  - **AtCoder** - Shows only AtCoder data
  - **Codolio** - Shows only Codolio data
  - **GitHub** - Shows only GitHub data

### 2. Dynamic Data Fetching
When you select a platform:
- Frontend sends API request with platform filter: `/api/students?platform=leetcode`
- Backend fetches platform-specific stats from `PlatformStats` collection
- Only students who have that platform are shown
- Data is sorted by platform-specific problems solved

### 3. Platform-Specific Display

#### Overall Performance (All Platforms)
Shows:
- Total problems solved across all platforms
- Average rating across all platforms
- Total contests participated
- Number of active platforms
- Performance badge (High/Medium/Low)

#### Individual Platform View (e.g., CodeChef)
Shows:
- Problems solved on that specific platform
- Current rating on that platform
- Rating change from previous upload (e.g., +50, -20)
- Contests participated on that platform
- Global rank on that platform (if available)
- Problems solved change (e.g., +15 problems)
- Trend indicators (↑ up, ↓ down)

## API Endpoints

### Get Students with Platform Filter

**Endpoint**: `GET /api/students`

**Query Parameters**:
- `platform` (optional) - Filter by specific platform (codechef, leetcode, codeforces, etc.)
- `sort` (optional) - Sort field (performance, rating, contests)
- `order` (optional) - Sort order (asc, desc)
- `limit` (optional) - Maximum number of results

**Examples**:

```bash
# Get all students (overall performance)
GET /api/students?sort=performance&order=desc&limit=500

# Get students with CodeChef data only
GET /api/students?platform=codechef&sort=performance&order=desc&limit=500

# Get students with LeetCode data only
GET /api/students?platform=leetcode&sort=performance&order=desc&limit=500
```

**Response Format**:

```json
{
  "status": "success",
  "data": {
    "students": [
      {
        "regNo": "711523BCB036",
        "name": "Mohammed Syfudeen S",
        "dept": "BCB",
        "year": "3rd Year",
        "platformIds": {
          "codechef": "syfudeen_s",
          "leetcode": "syfudeen",
          "github": "syfudeen"
        },
        "totalStats": {
          "totalProblems": 538,
          "totalContests": 23,
          "averageRating": 1036,
          "activePlatforms": 3
        },
        "platformStats": {
          "platform": "codechef",
          "rating": 1542,
          "maxRating": 1600,
          "problemsSolved": 156,
          "contestsParticipated": 12,
          "rank": 45678,
          "changes": {
            "rating": 50,
            "problemsSolved": 15,
            "contestsParticipated": 2
          },
          "fetchStatus": "success"
        }
      }
    ],
    "total": 1,
    "platform": "codechef"
  }
}
```

## Frontend Implementation

### State Management

```typescript
const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
```

### Automatic Data Refresh

When platform changes, data is automatically fetched:

```typescript
useEffect(() => {
  fetchStudents(selectedPlatform);
}, [selectedPlatform]);
```

### Platform-Specific Stats Functions

```typescript
// Get problems solved for selected platform
const getStudentScore = (student: any) => {
  if (selectedPlatform === "all") {
    return student.totalStats?.totalProblems || 0;
  }
  return student.platformStats?.problemsSolved || 0;
};

// Get rating for selected platform
const getStudentRating = (student: any) => {
  if (selectedPlatform === "all") {
    return Math.round(student.totalStats?.averageRating || 0);
  }
  return student.platformStats?.rating || 0;
};

// Get contests for selected platform
const getStudentContests = (student: any) => {
  if (selectedPlatform === "all") {
    return student.totalStats?.totalContests || 0;
  }
  return student.platformStats?.contestsParticipated || 0;
};

// Get rank for selected platform
const getStudentRank = (student: any) => {
  if (selectedPlatform === "all") {
    return null;
  }
  return student.platformStats?.rank || null;
};

// Get changes from previous upload
const getStudentChanges = (student: any) => {
  if (selectedPlatform === "all") {
    return null;
  }
  return student.platformStats?.changes || null;
};
```

## Visual Indicators

### Trend Indicators
- **↑ Green** - Positive change (rating increased, problems solved increased)
- **↓ Red** - Negative change (rating decreased)
- **—** - No change

### Performance Badges (Overall View Only)
- **High** - 200+ problems solved
- **Medium** - 100-199 problems solved
- **Low** - 0-99 problems solved

### Change Display
Shows changes from previous upload:
- Rating: `1542 (+50)` - Rating increased by 50
- Problems: `+15` with ↑ icon - Solved 15 more problems

## Data Sources

### Real-Time API Integration

Each platform uses its respective API/scraping method:

| Platform | Method | Data Fetched |
|----------|--------|--------------|
| **Codeforces** | Official API | Rating, max rating, problems solved, contests, rank |
| **LeetCode** | GraphQL API | Rating, problems solved, contests, global ranking |
| **CodeChef** | Web Scraping | Rating, max rating, problems solved, contests, rank |
| **GitHub** | REST API | Public repos, stars, followers, contributions |
| **AtCoder** | Placeholder | Not yet implemented |
| **Codolio** | Placeholder | Not yet implemented |

## Usage Example

### Step 1: Upload Excel File
Upload your Excel file with student platform IDs.

### Step 2: View Overall Performance
By default, shows "Overall Performance" with combined stats from all platforms.

### Step 3: Filter by Platform
Click the platform selector and choose a specific platform (e.g., "CodeChef").

### Step 4: View Platform-Specific Rankings
- See only students who have CodeChef accounts
- Rankings based on CodeChef problems solved
- Shows CodeChef-specific rating, contests, rank
- Displays changes from previous upload

### Step 5: Compare Across Platforms
Switch between platforms to see how students perform on different platforms:
- Some students may excel on LeetCode but not on CodeChef
- Some may have high GitHub activity but low contest participation
- Identify platform-specific strengths and weaknesses

## Summary Statistics

At the bottom of the rankings, summary stats adapt to the selected platform:

### Overall Performance
- Total Students
- Avg Problems Solved (across all platforms)
- Highest Problems (top performer)
- Avg Rating (across all platforms)

### Platform-Specific
- Students on Platform (only those with this platform)
- Avg Problems Solved (on this platform only)
- Highest Problems (top performer on this platform)
- Avg Rating (on this platform only)

## Benefits

1. **Targeted Analysis** - See performance on specific platforms
2. **Real-Time Data** - Always shows latest data from platform APIs
3. **Change Tracking** - Monitor improvement over time
4. **Platform Comparison** - Identify which platforms students use most
5. **Accurate Rankings** - Sort by actual platform-specific performance
6. **Trend Visualization** - See who's improving and who needs help

## Technical Details

### Backend Logic

```javascript
// Filter students by platform
if (platform && platform !== 'all') {
  const studentsWithPlatformStats = await Promise.all(
    students.map(async (student) => {
      const platformStat = await PlatformStats.findOne({ 
        regNo: student.regNo, 
        platform: platform.toLowerCase() 
      });
      
      return {
        ...student.toObject(),
        platformStats: platformStat ? {
          platform: platformStat.platform,
          rating: platformStat.currentStats?.rating || 0,
          problemsSolved: platformStat.currentStats?.problemsSolved || 0,
          changes: platformStat.changes || {}
        } : null
      };
    })
  );
  
  // Filter out students without this platform
  const filteredStudents = studentsWithPlatformStats.filter(s => s.platformStats !== null);
  
  // Sort by platform-specific stats
  filteredStudents.sort((a, b) => {
    const aScore = a.platformStats?.problemsSolved || 0;
    const bScore = b.platformStats?.problemsSolved || 0;
    return order === 'desc' ? bScore - aScore : aScore - bScore;
  });
}
```

### Frontend Logic

```typescript
// Fetch data when platform changes
useEffect(() => {
  fetchStudents(selectedPlatform);
}, [selectedPlatform]);

// Build URL with platform filter
const url = platform === 'all' 
  ? `${API_URL}/api/students?sort=performance&order=desc&limit=500`
  : `${API_URL}/api/students?sort=performance&order=desc&limit=500&platform=${platform}`;
```

## Future Enhancements

1. **Multi-Platform Comparison** - Compare 2-3 platforms side by side
2. **Platform Activity Timeline** - Show when students were active on each platform
3. **Platform Recommendations** - Suggest which platform to focus on
4. **Export Platform Reports** - Download platform-specific performance reports
5. **Platform Leaderboards** - Separate leaderboards for each platform
6. **Platform Badges** - Award badges for platform-specific achievements

---

**Status**: ✅ Fully Implemented and Working
**Last Updated**: February 4, 2026
