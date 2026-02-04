# Quick Start Guide - Skorly Platform Tracker

## 🚀 Getting Started

### Prerequisites
- ✅ MongoDB running on localhost:27017
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:8080

### Step 1: Access the Dashboard
Open your browser and go to: **http://localhost:8080**

---

## 📤 Upload Student Data

### Step 2: Prepare Your Excel File

Your Excel file should have these columns:
- **Reg No** - Student registration number (e.g., 711523BCB036)
- **Name** - Student full name
- **Dept** - Department (e.g., BCB, CSE, IT)
- **Year** - Year of study (optional)
- **CodeChef** - CodeChef username
- **LeetCode** - LeetCode username
- **Codeforces** - Codeforces handle
- **GitHub** - GitHub username
- **AtCoder** - AtCoder username (optional)
- **Codolio** - Codolio username (optional)

**Example**:
```
Reg No          | Name                | Dept | Year    | CodeChef    | LeetCode  | Codeforces | GitHub
711523BCB036    | Mohammed Syfudeen S | BCB  | 3rd Year| syfudeen_s  | syfudeen  | syfudeen   | syfudeen
711523BCB037    | John Doe           | BCB  | 3rd Year| johndoe     | johndoe   | johndoe    | johndoe
```

### Step 3: Upload the File

1. Click the **"Upload Data"** button or drag & drop your Excel file
2. Wait for the upload to complete
3. Backend will start processing students in the background
4. You'll see a progress indicator

**Processing Time**:
- ~2-5 seconds per student per platform
- For 50 students with 3 platforms each: ~5-10 minutes
- For 300 students with 3 platforms each: ~30-45 minutes

---

## 📊 View Overall Performance

### Step 4: See All Students (Default View)

After upload completes, you'll see:

**Platform Selector**: Shows "Overall Performance" by default

**Student Rankings**:
```
Rank | Name                | Reg No       | Dept | Performance | Stats
-----|---------------------|--------------|------|-------------|------------------
1    | Mohammed Syfudeen S | 711523BCB036 | BCB  | High        | 538 problems
     |                     |              |      |             | Rating: 1036
     |                     |              |      |             | Contests: 23
     |                     |              |      |             | 3 platforms
```

**Summary Stats** (at bottom):
- Total Students: 50
- Avg Problems Solved: 245
- Highest Problems: 538
- Avg Rating: 1200

---

## 🎯 Filter by Specific Platform

### Step 5: Select a Platform

Click the **"Select Platform"** dropdown and choose:
- **CodeChef** - See CodeChef-only performance
- **LeetCode** - See LeetCode-only performance
- **Codeforces** - See Codeforces-only performance
- **GitHub** - See GitHub-only performance

### What Changes When You Select a Platform?

#### Example: Selecting "CodeChef"

**Student Rankings** (now shows CodeChef-specific data):
```
Rank | Name                | Reg No       | Dept | Stats
-----|---------------------|--------------|------|---------------------------
1    | Mohammed Syfudeen S | 711523BCB036 | BCB  | 156 problems
     |                     |              |      | Rating: 1542 (+50) ↑
     |                     |              |      | Contests: 12
     |                     |              |      | Rank: #45678
     |                     |              |      | +15 problems ↑
```

**What You See**:
- ✅ Only students who have CodeChef accounts
- ✅ CodeChef-specific problems solved
- ✅ CodeChef rating (not average across platforms)
- ✅ Rating change from previous upload (+50 means rating increased by 50)
- ✅ Problems solved change (+15 means solved 15 more problems)
- ✅ Global rank on CodeChef
- ✅ Trend indicators (↑ improving, ↓ declining)

**Summary Stats** (adapted to CodeChef):
- Students on Platform: 35 (only those with CodeChef)
- Avg Problems Solved: 120 (on CodeChef only)
- Highest Problems: 156 (top CodeChef performer)
- Avg Rating: 1400 (CodeChef ratings only)

---

## 🔄 Compare Across Platforms

### Step 6: Switch Between Platforms

Try switching between different platforms to see:

**CodeChef View**:
- Student A: 156 problems, Rating 1542, Rank #45678
- Student B: 89 problems, Rating 1200, Rank #120000

**LeetCode View**:
- Student A: 245 problems, Rating 1800, Rank #12000
- Student B: 320 problems, Rating 2100, Rank #5000

**Insights**:
- Student A is better at CodeChef
- Student B is better at LeetCode
- Both have different strengths on different platforms

---

## 📈 Understanding the Data

### Performance Badges (Overall View Only)
- **High** (Green) - 200+ problems solved across all platforms
- **Medium** (Yellow) - 100-199 problems solved
- **Low** (Red) - 0-99 problems solved

### Trend Indicators (Platform-Specific View)
- **↑ Green** - Improvement (rating up, problems up)
- **↓ Red** - Decline (rating down)
- **—** - No change

### Change Values
- **+50** - Increased by 50 (rating, problems, etc.)
- **-20** - Decreased by 20
- Shown in parentheses next to current value

---

## 🔍 Real-Time Data Sources

### Where Does the Data Come From?

| Platform | Source | Update Frequency |
|----------|--------|------------------|
| **Codeforces** | Official API | Real-time on upload |
| **LeetCode** | GraphQL API | Real-time on upload |
| **CodeChef** | Web Scraping | Real-time on upload |
| **GitHub** | REST API | Real-time on upload |

**Note**: Data is fetched fresh every time you upload an Excel file.

---

## 🎓 Use Cases

### For Faculty/Mentors

1. **Track Overall Progress**
   - View "Overall Performance" to see combined stats
   - Identify top performers and those needing help
   - Monitor average problems solved across class

2. **Platform-Specific Analysis**
   - See which students are active on CodeChef
   - Check LeetCode participation for interview prep
   - Monitor GitHub activity for project work

3. **Identify Trends**
   - See who's improving (↑ indicators)
   - Spot declining performance (↓ indicators)
   - Track rating changes over time

4. **Compare Uploads**
   - Upload weekly/monthly to track progress
   - Changes show improvement from last upload
   - Historical data stored in database

### For Students

1. **See Your Ranking**
   - Find your position in overall rankings
   - Check your rank on specific platforms
   - Compare with peers

2. **Track Your Progress**
   - See your rating changes (+50, -20, etc.)
   - Monitor problems solved increase
   - View contest participation

3. **Identify Strengths**
   - See which platform you perform best on
   - Focus on platforms where you need improvement
   - Set goals based on rankings

---

## 🛠️ Troubleshooting

### No Students Showing?
- Check if upload completed successfully
- Verify Excel file format matches template
- Check backend logs for errors
- Ensure MongoDB is running

### Wrong Data Displayed?
- Verify platform usernames in Excel are correct
- Check if platforms are accessible (not blocked)
- Look for API errors in backend logs
- Try re-uploading the file

### Platform Filter Not Working?
- Ensure students have that platform in Excel
- Check if platform data was fetched successfully
- Look for "fetchStatus: success" in backend logs
- Verify platform usernames are valid

### Slow Upload?
- Normal for large files (300+ students)
- Each student takes 2-5 seconds per platform
- Monitor progress via backend logs
- Don't refresh page during upload

---

## 📝 Tips & Best Practices

### Excel File Preparation
- ✅ Use correct column names (case-insensitive)
- ✅ Verify platform usernames are accurate
- ✅ Remove empty rows
- ✅ Use .xlsx or .xls format
- ✅ Keep file size under 10MB

### Data Accuracy
- ✅ Double-check usernames before upload
- ✅ Test with 1-2 students first
- ✅ Verify data on platform websites
- ✅ Re-upload if data looks wrong

### Performance Monitoring
- ✅ Upload weekly for trend tracking
- ✅ Compare changes between uploads
- ✅ Focus on improvement indicators
- ✅ Use platform filters for targeted analysis

### Platform Selection
- **Overall Performance** - Best for general overview
- **CodeChef** - Best for competitive programming
- **LeetCode** - Best for interview preparation
- **GitHub** - Best for project/contribution tracking
- **Codeforces** - Best for algorithmic contests

---

## 🎯 Next Steps

1. **Upload Your First File** - Start with a small batch (5-10 students)
2. **Verify Data Accuracy** - Check if numbers match platform profiles
3. **Explore Platform Filters** - Try different platform views
4. **Upload Regularly** - Weekly/monthly for progress tracking
5. **Analyze Trends** - Look for improvement patterns

---

## 📞 Support

If you encounter issues:
1. Check backend logs in terminal
2. Check browser console for errors
3. Verify all services are running
4. Try the health check: http://localhost:5000/health

---

**Happy Tracking! 🚀**

*Last Updated: February 4, 2026*
