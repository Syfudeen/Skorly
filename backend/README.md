# Skorly Backend - Student Coding Platform Tracker

<div align="center">

![Skorly Logo](https://via.placeholder.com/150x150?text=SKORLY)

**Production-Ready Backend for Student Coding Platform Performance Tracking**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-6.0+-red.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API](#-api-endpoints) • [Architecture](#-architecture)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [API Endpoints](#-api-endpoints)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Platform Integration](#-platform-integration)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

Skorly Backend is a scalable, production-ready system designed to track and analyze student performance across multiple coding platforms. It handles bulk data processing for 300-1000+ students efficiently using a queue-based architecture.

### Key Capabilities

- **Bulk Processing**: Upload Excel files with 300+ students at once
- **Multi-Platform Support**: Codeforces, LeetCode, CodeChef, AtCoder, GitHub, and more
- **Real-Time Tracking**: Monitor processing progress in real-time
- **Historical Comparison**: Compare current vs previous performance
- **Analytics Dashboard**: Comprehensive analytics and insights
- **Production Ready**: Built with scalability, security, and reliability in mind

## ✨ Features

### Core Features

- ✅ **Excel Upload & Validation**
  - Support for .xlsx, .xls, .csv formats
  - Automatic data validation and error reporting
  - Duplicate detection
  - Sample template generation

- ✅ **Queue-Based Processing**
  - BullMQ for reliable job processing
  - Configurable concurrency (default: 5 workers)
  - Automatic retry with exponential backoff
  - Progress tracking and monitoring

- ✅ **Multi-Platform API Integration**
  - Codeforces (Official API)
  - LeetCode (GraphQL API)
  - CodeChef (Controlled scraping)
  - GitHub (REST API)
  - AtCoder, Codolio (Extensible)

- ✅ **Data Comparison & Analytics**
  - Automatic comparison with previous snapshots
  - Performance trend analysis
  - Rating and problem-solving tracking
  - Department-wise analytics
  - Leaderboard generation

- ✅ **Production Features**
  - Rate limiting (API & Platform)
  - Comprehensive error handling
  - Detailed logging (Winston)
  - Health check endpoints
  - Docker support
  - Graceful shutdown

## 🛠️ Tech Stack

### Core Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB 5.0+ (Mongoose ODM)
- **Cache/Queue**: Redis 6.0+ (BullMQ)
- **Excel Processing**: xlsx library
- **HTTP Client**: Axios
- **Logging**: Winston
- **Validation**: express-validator, Joi

### Development Tools

- **Process Manager**: PM2 / Nodemon
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest, Supertest
- **Linting**: ESLint
- **Version Control**: Git

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB 5.0+ running
- Redis 6.0+ running
- npm or yarn package manager

### Installation

```bash
# 1. Navigate to backend directory
cd Skorly/backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Test setup
npm run setup:test

# 5. Generate sample data (optional)
npm run setup:sample

# 6. Start the server
npm run dev

# 7. Start the worker (in a new terminal)
npm run worker
```

### Docker Setup (Recommended)

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

### Verify Installation

```bash
# Check health
curl http://localhost:5000/health

# Download sample template
curl http://localhost:5000/api/upload/sample -o sample.xlsx

# Upload sample file
curl -F "file=@sample.xlsx" http://localhost:5000/api/upload
```

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[API Documentation](#-api-endpoints)** - Complete API reference

## 🌐 API Endpoints

### Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload Excel file |
| GET | `/api/upload/sample` | Download sample template |
| GET | `/api/upload/format` | Get format information |
| GET | `/api/upload/history` | Get upload history |

### Job/Progress Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/:jobId` | Get job progress |
| GET | `/api/jobs/:jobId/detailed` | Get detailed job info |
| GET | `/api/jobs/:jobId/errors` | Get job errors |
| POST | `/api/jobs/:jobId/cancel` | Cancel a job |
| GET | `/api/jobs` | Get all jobs |
| GET | `/api/jobs/stats/overview` | Get job statistics |

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students (with filters) |
| GET | `/api/students/:regNo` | Get student details |
| GET | `/api/students/:regNo/platforms/:platform` | Get platform stats |
| GET | `/api/students/:regNo/comparison` | Get comparison data |
| GET | `/api/students/department/:department` | Get students by department |
| GET | `/api/students/stats/summary` | Get student statistics |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Get dashboard analytics |
| GET | `/api/analytics/trends` | Get performance trends |
| GET | `/api/analytics/platforms` | Get platform analytics |
| GET | `/api/analytics/leaderboard` | Get leaderboard |
| GET | `/api/analytics/comparison/:uploadJobId` | Get comparison analytics |
| GET | `/api/analytics/departments` | Get department analytics |

### Example Requests

```bash
# Upload Excel file
curl -X POST http://localhost:5000/api/upload \
  -F "file=@students.xlsx"

# Get job progress
curl http://localhost:5000/api/jobs/job_123456_abc

# Get student details
curl http://localhost:5000/api/students/21CS001

# Get dashboard analytics
curl http://localhost:5000/api/analytics/dashboard

# Get leaderboard
curl http://localhost:5000/api/analytics/leaderboard?limit=10
```

## 🏗️ Architecture

### System Flow

```
Excel Upload → Validation → Queue → Workers → Platform APIs → Comparison → Storage → Analytics
```

### Components

1. **API Server** (Express)
   - Handles HTTP requests
   - Validates input
   - Manages file uploads
   - Serves analytics

2. **Queue System** (BullMQ + Redis)
   - Manages job distribution
   - Handles retries
   - Tracks progress
   - Ensures reliability

3. **Worker Process**
   - Processes student jobs
   - Fetches platform data
   - Compares with history
   - Stores results

4. **Database** (MongoDB)
   - Stores student data
   - Maintains platform stats
   - Tracks performance history
   - Logs upload jobs

5. **Platform Services**
   - Codeforces API client
   - LeetCode GraphQL client
   - CodeChef scraper
   - GitHub API client

### Data Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ Upload Excel
       ▼
┌─────────────┐
│  API Server │
└──────┬──────┘
       │ Validate & Parse
       ▼
┌─────────────┐
│ Queue (Redis)│
└──────┬──────┘
       │ Distribute Jobs
       ▼
┌─────────────┐
│   Workers   │
└──────┬──────┘
       │ Fetch Platform Data
       ▼
┌─────────────┐
│  MongoDB    │
└─────────────┘
```

## 💾 Database Schema

### Collections

1. **students** - Student basic information
2. **platformstats** - Current platform statistics
3. **performancehistories** - Historical snapshots
4. **uploadjobs** - Upload job tracking

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed schema documentation.

## 🔌 Platform Integration

### Supported Platforms

| Platform | Method | Rate Limit | Status |
|----------|--------|------------|--------|
| Codeforces | Official API | 5 req/sec | ✅ Active |
| LeetCode | GraphQL API | 2 req/sec | ✅ Active |
| CodeChef | Web Scraping | 1 req/sec | ⚠️ Limited |
| GitHub | REST API | 10 req/sec | ✅ Active |
| AtCoder | - | - | 🔄 Planned |
| Codolio | - | - | 🔄 Planned |

### Adding New Platforms

1. Add platform to `PLATFORMS` constant
2. Implement fetch method in `platformService.js`
3. Update database models
4. Add rate limiting configuration

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Test setup
npm run setup:test

# Generate sample data
npm run setup:sample
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set up Redis with password
- [ ] Configure CORS for production domain
- [ ] Set secure JWT secret
- [ ] Enable HTTPS
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Configure firewall rules

### Docker Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### PM2 Deployment

```bash
pm2 start src/server.js --name skorly-api
pm2 start src/workers/studentWorker.js --name skorly-worker
pm2 save
pm2 startup
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Follow the existing code style
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 📞 Support

For issues and questions:
- Check [SETUP.md](SETUP.md) for setup help
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system details
- Check application logs in `logs/` directory

---

<div align="center">

**Built with ❤️ for tracking student coding excellence**

[⬆ Back to Top](#skorly-backend---student-coding-platform-tracker)

</div>