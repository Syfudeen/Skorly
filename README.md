# Skorly - Student Coding Platform Tracker

<div align="center">

![Skorly Logo](https://img.shields.io/badge/Skorly-Platform%20Tracker-blue?style=for-the-badge)

**Track, Analyze, and Monitor Student Performance Across Multiple Coding Platforms**

[![GitHub](https://img.shields.io/badge/GitHub-Syfudeen%2FSkorly-181717?style=flat&logo=github)](https://github.com/Syfudeen/Skorly)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)

</div>

---

## 🎯 Overview

Skorly is a comprehensive platform tracker that helps educators and mentors monitor student progress across multiple coding platforms including **Codeforces**, **LeetCode**, **CodeChef**, **GitHub**, and more. It fetches real-time data from platform APIs, tracks changes over time, and provides insightful analytics.

### ✨ Key Features

- 📊 **Real-Time Data Fetching** - Automatically fetch latest stats from platform APIs
- 🎯 **Platform-Specific Filtering** - View performance on individual platforms
- 📈 **Change Tracking** - Monitor rating changes, problems solved, and contest participation
- 🔄 **Bulk Upload** - Upload Excel files with 300+ students
- 📉 **Performance Analytics** - Identify top performers and those needing help
- 🎨 **Beautiful UI** - Modern, responsive interface with smooth animations
- 🚀 **Production Ready** - Scalable architecture with error handling

---

## 🖼️ Screenshots

### Dashboard Overview
![Dashboard](docs/screenshots/dashboard.png)

### Platform Filtering
![Platform Filter](docs/screenshots/platform-filter.png)

### Student Rankings
![Rankings](docs/screenshots/rankings.png)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 4.4+ ([Download](https://www.mongodb.com/try/download/community))
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Configuration

1. **Backend Environment Variables**

```bash
# Create backend/.env file
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skorly
CORS_ORIGIN=http://localhost:8080,http://10.180.36.154:8080
NODE_ENV=development
```

2. **Frontend Environment Variables**

```bash
# Create .env file in root
echo "VITE_API_URL=http://localhost:5000" > .env
```

### Running the Application

**Terminal 1 - Start MongoDB:**
```bash
# If using Docker
docker-compose -f backend/docker-compose.yml up -d mongodb

# Or start MongoDB service
mongod
```

**Terminal 2 - Start Backend:**
```bash
cd backend
node src/server-working.js
```

**Terminal 3 - Start Frontend:**
```bash
npm run dev
```

**Access the Application:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

---

## 📖 Documentation

- **[Setup Guide](backend/SETUP.md)** - Detailed setup instructions
- **[Architecture](backend/ARCHITECTURE.md)** - System architecture overview
- **[Quick Reference](backend/QUICK_REFERENCE.md)** - Command reference
- **[Platform Filtering](PLATFORM_FILTERING_FEATURE.md)** - Platform filter guide
- **[Quick Start Guide](QUICK_START_GUIDE.md)** - User guide
- **[Changelog](CHANGELOG.md)** - Version history

---

## 🎓 Usage

### 1. Prepare Excel File

Create an Excel file with the following columns:

| Reg No | Name | Dept | Year | CodeChef | LeetCode | Codeforces | GitHub | AtCoder | Codolio |
|--------|------|------|------|----------|----------|------------|--------|---------|---------|
| 711523BCB036 | Mohammed Syfudeen S | BCB | 3rd Year | syfudeen | Syfudeen_17 | syfudeen | Syfudeen | - | - |

### 2. Upload File

1. Go to http://localhost:8080
2. Click "Upload Data" or drag & drop your Excel file
3. Wait for processing (2-5 seconds per student per platform)
4. View results on dashboard

### 3. Filter by Platform

1. Click the "Select Platform" dropdown
2. Choose a platform (CodeChef, LeetCode, Codeforces, etc.)
3. View platform-specific rankings and stats
4. See rating changes, problems solved, and trends

### 4. Analyze Performance

- **Overall Performance** - Combined stats from all platforms
- **Platform-Specific** - Individual platform performance
- **Change Tracking** - Rating changes (+50, -20, etc.)
- **Trend Indicators** - Up/down arrows for improvement
- **Summary Stats** - Average problems, highest score, etc.

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui components
- Lucide React icons

**Backend:**
- Node.js + Express
- MongoDB with Mongoose
- Axios for API calls
- Cheerio for web scraping
- Winston for logging
- Multer for file uploads

**Platform APIs:**
- Codeforces Official API
- LeetCode GraphQL API
- CodeChef Web Scraping
- GitHub REST API

### System Flow

```
Excel Upload → Backend Processing → Platform APIs → Database → Frontend Display
     ↓              ↓                    ↓              ↓            ↓
  Validation    Parse Data         Fetch Stats      Save Data   Show Results
```

---

## 🔌 API Endpoints

### Upload & Jobs
- `POST /api/upload` - Upload Excel file
- `GET /api/jobs/:jobId` - Get job progress
- `GET /api/upload/sample` - Download sample template

### Students
- `GET /api/students` - Get all students
- `GET /api/students?platform=codechef` - Filter by platform
- `GET /api/students/:regNo` - Get student details

### Analytics
- `GET /api/analytics/leaderboard` - Get top performers

### Health
- `GET /health` - Health check

---

## 🌐 Supported Platforms

| Platform | Status | Method | Data Fetched |
|----------|--------|--------|--------------|
| **Codeforces** | ✅ Working | Official API | Rating, problems, contests, rank |
| **LeetCode** | ✅ Working | GraphQL API | Rating, problems, contests, rank |
| **CodeChef** | ✅ Working | Web Scraping | Rating, problems, contests, rank |
| **GitHub** | ✅ Working | REST API | Repos, stars, followers, contributions |
| **AtCoder** | ⚠️ Placeholder | - | Returns 0 values |
| **Codolio** | ⚠️ Placeholder | - | Returns 0 values |

---

## 📊 Features in Detail

### Real-Time Data Fetching
- Fetches latest data from platform APIs on every upload
- Respects rate limits with exponential backoff
- Retry logic for failed requests
- Parallel processing for multiple platforms

### Platform Filtering
- Filter students by specific platform
- Shows only students with that platform
- Platform-specific stats (rating, problems, contests)
- Change indicators from previous upload

### Change Tracking
- Compares current vs previous upload
- Shows rating changes (+50, -20, etc.)
- Problems solved delta (+15 problems)
- Visual trend indicators (↑ up, ↓ down)

### Performance Analytics
- Overall performance rankings
- Platform-specific rankings
- Summary statistics
- Performance level badges (High/Medium/Low)

### Bulk Processing
- Upload 300+ students at once
- Background processing
- Progress tracking
- Error handling and reporting

---

## 🛠️ Development

### Project Structure

```
Skorly/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, Redis, Queue config
│   │   ├── middleware/     # Error handling, validation
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers, constants, logger
│   │   └── workers/        # Background workers
│   ├── scripts/            # Utility scripts
│   └── uploads/            # Uploaded files
├── src/
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── types/              # TypeScript types
│   └── lib/                # Utilities
└── public/                 # Static assets
```

### Scripts

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend:**
```bash
node src/server-working.js              # Start server (no Redis)
node src/server.js                      # Start server (with Redis)
node scripts/clear-database.js          # Clear database
node scripts/generate-sample-data.js    # Generate sample data
```

### Environment Variables

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skorly
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:8080
NODE_ENV=development
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

---

## 🧪 Testing

### Manual Testing

1. **Upload Test File:**
   ```bash
   # Use the sample file
   backend/test-students-multi-platform.xlsx
   ```

2. **Check Platform Coverage:**
   ```bash
   cd backend
   node scripts/check-platform-coverage.js
   ```

3. **Test API Endpoints:**
   ```bash
   # Health check
   curl http://localhost:5000/health
   
   # Get students
   curl http://localhost:5000/api/students
   
   # Filter by platform
   curl http://localhost:5000/api/students?platform=codechef
   ```

---

## 🐛 Troubleshooting

### Students Disappear When Filtering
**Cause:** Students don't have that platform in Excel
**Solution:** Add platform usernames to Excel and re-upload

### Upload Fails
**Cause:** Invalid Excel format or missing columns
**Solution:** Use the sample template and verify column names

### API Errors
**Cause:** Platform API rate limits or invalid usernames
**Solution:** Check backend logs, verify usernames, wait and retry

### Slow Performance
**Cause:** Large file with many students
**Solution:** Normal for 300+ students (30-45 minutes processing time)

See [Troubleshooting Guide](PLATFORM_FILTER_TROUBLESHOOTING.md) for more details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation
- Test thoroughly before submitting

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Mohammed Syfudeen S** - *Initial work* - [@Syfudeen](https://github.com/Syfudeen)

---

## 🙏 Acknowledgments

- Codeforces for their official API
- LeetCode for GraphQL API access
- CodeChef for platform data
- GitHub for REST API
- shadcn/ui for beautiful components
- All contributors and testers

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Syfudeen/Skorly/issues)
- **Email:** syfudeen@example.com
- **Documentation:** See [docs](backend/) folder

---

## 🗺️ Roadmap

### v2.1 (Planned)
- [ ] AtCoder API integration
- [ ] Codolio API integration
- [ ] Real-time updates with WebSockets
- [ ] Email notifications

### v2.2 (Planned)
- [ ] Multi-platform comparison view
- [ ] Platform activity timeline
- [ ] Export reports (PDF, CSV)
- [ ] Student dashboard

### v3.0 (Future)
- [ ] Mobile app (React Native)
- [ ] Admin panel
- [ ] Achievement badges
- [ ] Gamification features

---

## 📈 Statistics

- **46 Files** in latest release
- **12,913 Lines** of code added
- **4 Major Features** implemented
- **6 Platforms** supported
- **300+ Students** capacity

---

<div align="center">

**Made with ❤️ by Mohammed Syfudeen S**

[⭐ Star this repo](https://github.com/Syfudeen/Skorly) | [🐛 Report Bug](https://github.com/Syfudeen/Skorly/issues) | [✨ Request Feature](https://github.com/Syfudeen/Skorly/issues)

</div>
