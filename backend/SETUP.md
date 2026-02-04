# Skorly Backend - Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Redis** (v6.0 or higher) - [Download](https://redis.io/download)
- **npm** or **yarn** package manager

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd Skorly/backend
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skorly
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:3000
```

### 3. Start MongoDB

**Windows:**
```bash
mongod --dbpath C:\data\db
```

**macOS/Linux:**
```bash
mongod --dbpath /data/db
```

Or use MongoDB as a service:
```bash
# macOS
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows (as service)
net start MongoDB
```

### 4. Start Redis

**Windows:**
```bash
redis-server
```

**macOS:**
```bash
brew services start redis
```

**Linux:**
```bash
sudo systemctl start redis
```

### 5. Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 6. Start the Worker Process (in a new terminal)

```bash
npm run worker
```

## 🐳 Docker Setup (Recommended for Development)

### 1. Install Docker

- **Windows/Mac:** [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** [Docker Engine](https://docs.docker.com/engine/install/)

### 2. Start All Services

```bash
cd Skorly/backend
docker-compose up -d
```

This will start:
- MongoDB (port 27017)
- Redis (port 6379)
- Backend API (port 5000)
- Worker Process
- Mongo Express (port 8081) - Database UI
- Redis Commander (port 8082) - Redis UI

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f worker
```

### 4. Stop All Services

```bash
docker-compose down
```

### 5. Stop and Remove Volumes (Clean Start)

```bash
docker-compose down -v
```

## 📊 Verify Installation

### 1. Check Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2026-02-04T...",
  "uptime": 123.456,
  "environment": "development"
}
```

### 2. Check Detailed Health

```bash
curl http://localhost:5000/api/health
```

This should show the status of all services (MongoDB, Redis, Queue).

### 3. Test File Upload

Download the sample template:
```bash
curl http://localhost:5000/api/upload/sample -o sample.xlsx
```

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── config/                # Configuration files
│   │   ├── database.js        # MongoDB connection
│   │   ├── redis.js           # Redis connection
│   │   └── queue.js           # BullMQ setup
│   ├── models/                # Mongoose models
│   │   ├── Student.js
│   │   ├── PlatformStats.js
│   │   ├── PerformanceHistory.js
│   │   └── UploadJob.js
│   ├── routes/                # API routes
│   │   ├── upload.js
│   │   ├── progress.js
│   │   ├── students.js
│   │   └── analytics.js
│   ├── services/              # Business logic
│   │   ├── excelService.js
│   │   ├── platformService.js
│   │   └── comparisonService.js
│   ├── workers/               # Queue workers
│   │   └── studentWorker.js
│   ├── middleware/            # Express middleware
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── rateLimiter.js
│   └── utils/                 # Utility functions
│       ├── logger.js
│       ├── constants.js
│       └── helpers.js
├── uploads/                   # Uploaded files
├── logs/                      # Application logs
├── package.json
├── .env                       # Environment variables
├── .env.example               # Environment template
├── docker-compose.yml         # Docker configuration
└── Dockerfile                 # Docker image
```

## 🔧 Configuration

### MongoDB Configuration

Default connection string:
```
mongodb://localhost:27017/skorly
```

For authentication:
```
mongodb://username:password@localhost:27017/skorly?authSource=admin
```

### Redis Configuration

Default configuration:
```
Host: localhost
Port: 6379
Password: (none)
DB: 0
```

### Queue Configuration

Adjust concurrency in `.env`:
```env
QUEUE_CONCURRENCY=5          # Number of parallel workers
QUEUE_RETRY_ATTEMPTS=3       # Retry failed jobs
QUEUE_RETRY_DELAY=5000       # Delay between retries (ms)
```

## 📝 API Endpoints

### Upload Endpoints
- `POST /api/upload` - Upload Excel file
- `GET /api/upload/sample` - Download sample template
- `GET /api/upload/format` - Get format information
- `GET /api/upload/history` - Get upload history

### Job/Progress Endpoints
- `GET /api/jobs/:jobId` - Get job progress
- `GET /api/jobs/:jobId/detailed` - Get detailed job info
- `GET /api/jobs/:jobId/errors` - Get job errors
- `POST /api/jobs/:jobId/cancel` - Cancel a job
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/stats/overview` - Get job statistics

### Student Endpoints
- `GET /api/students` - Get all students (with filters)
- `GET /api/students/:regNo` - Get student details
- `GET /api/students/:regNo/platforms/:platform` - Get platform stats
- `GET /api/students/:regNo/comparison` - Get comparison data
- `GET /api/students/department/:department` - Get students by department
- `GET /api/students/stats/summary` - Get student statistics

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/trends` - Get performance trends
- `GET /api/analytics/platforms` - Get platform analytics
- `GET /api/analytics/leaderboard` - Get leaderboard
- `GET /api/analytics/comparison/:uploadJobId` - Get comparison analytics
- `GET /api/analytics/departments` - Get department analytics

## 🔐 Security

### Rate Limiting

The API implements rate limiting:
- General API: 100 requests per 15 minutes
- Upload endpoint: 5 uploads per 15 minutes

### CORS

Configure allowed origins in `.env`:
```env
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

### File Upload Security

- Maximum file size: 10MB
- Allowed formats: .xlsx, .xls, .csv
- File validation before processing

## 🐛 Troubleshooting

### MongoDB Connection Error

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**
1. Ensure MongoDB is running
2. Check connection string in `.env`
3. Verify MongoDB port (default: 27017)

### Redis Connection Error

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
1. Ensure Redis is running
2. Check Redis configuration in `.env`
3. Verify Redis port (default: 6379)

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
1. Change PORT in `.env`
2. Or kill the process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   ```

### Worker Not Processing Jobs

**Solution:**
1. Ensure Redis is running
2. Check worker logs: `npm run worker`
3. Verify queue configuration in `.env`

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs in `logs/` directory
3. Check Docker logs: `docker-compose logs`

## 📄 License

MIT License - See LICENSE file for details