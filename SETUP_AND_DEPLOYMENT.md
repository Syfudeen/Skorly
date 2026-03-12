# Skorly - Complete Setup & Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)
7. [Deployment](#deployment)
8. [API Documentation](#api-documentation)

---

## 🔧 Prerequisites

Before cloning and running Skorly, ensure you have the following installed:

### Required Software

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| **Node.js** | 18+ | https://nodejs.org/ | JavaScript runtime |
| **npm** | 8+ | Included with Node.js | Package manager |
| **MongoDB** | 4.4+ | https://www.mongodb.com/try/download/community | Database |
| **Git** | Latest | https://git-scm.com/ | Version control |

### Optional (for Docker setup)
- **Docker** - https://www.docker.com/products/docker-desktop
- **Docker Compose** - Included with Docker Desktop

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 2GB free space
- **OS**: Windows, macOS, or Linux

---

## 📁 Project Structure

```
Skorly/
├── backend/                          # Node.js + Express backend
│   ├── src/
│   │   ├── config/                  # Database, Redis, Queue config
│   │   ├── middleware/              # Error handling, validation
│   │   ├── models/                  # Mongoose schemas
│   │   ├── routes/                  # API routes
│   │   ├── services/                # Business logic
│   │   ├── utils/                   # Helpers, constants, logger
│   │   ├── workers/                 # Background workers
│   │   ├── app.js                   # Express app setup
│   │   ├── server.js                # Main server (with Redis)
│   │   └── server-working.js        # Alternative server (no Redis)
│   ├── scripts/                     # Utility scripts
│   ├── uploads/                     # Uploaded Excel files
│   ├── logs/                        # Application logs
│   ├── package.json                 # Backend dependencies
│   ├── .env.example                 # Environment template
│   ├── docker-compose.yml           # Docker services
│   └── README.md                    # Backend documentation
│
├── src/                             # React + TypeScript frontend
│   ├── components/
│   │   ├── dashboard/              # Dashboard components
│   │   ├── layout/                 # Layout components
│   │   └── ui/                     # shadcn/ui components
│   ├── pages/                      # Page components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility functions
│   ├── types/                      # TypeScript types
│   ├── App.tsx                     # Main app component
│   └── main.tsx                    # Entry point
│
├── public/                         # Static assets
├── package.json                    # Frontend dependencies
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── .env                            # Frontend environment variables
├── .gitignore                      # Git ignore rules
└── README.md                       # Project README
```

---

## 🚀 Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Syfudeen/Skorly.git

# Navigate to project directory
cd Skorly
```

### Step 2: Install Frontend Dependencies

```bash
# Install dependencies
npm install

# Verify installation
npm list
```

### Step 3: Install Backend Dependencies

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Verify installation
npm list

# Return to root
cd ..
```

### Step 4: Verify Node Modules

```bash
# Check if node_modules exist in both directories
ls -la node_modules/          # Frontend modules
ls -la backend/node_modules/  # Backend modules
```

---

## ⚙️ Configuration

### Step 1: Frontend Environment Setup

Create `.env` file in the root directory:

```bash
# Create .env file
echo "VITE_API_URL=http://localhost:5000" > .env
```

**File: `.env`**
```env
# Frontend API Configuration
VITE_API_URL=http://localhost:5000
```

### Step 2: Backend Environment Setup

```bash
# Navigate to backend
cd backend

# Copy example to .env
cp .env.example .env

# Edit .env with your configuration
# (Use your preferred editor: nano, vim, VS Code, etc.)
```

**File: `backend/.env`**
```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/skorly
MONGODB_TEST_URI=mongodb://localhost:27017/skorly_test

# Redis Configuration (Optional - only if using server.js)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Queue Configuration
QUEUE_CONCURRENCY=5
QUEUE_RETRY_ATTEMPTS=3
QUEUE_RETRY_DELAY=5000

# Platform API Configuration
CODEFORCES_API_BASE=https://codeforces.com/api
LEETCODE_API_BASE=https://leetcode.com/graphql
LEETCODE_API_TIMEOUT=10000
CODECHEF_API_BASE=https://www.codechef.com

# Rate Limiting
API_RATE_LIMIT_WINDOW=15
API_RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.xlsx,.xls

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Security
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
BCRYPT_ROUNDS=12

# CORS - Allow multiple origins
CORS_ORIGIN=http://localhost:8080,http://127.0.0.1:8080,http://10.159.80.154:8080

# GitHub API (Optional)
GITHUB_TOKEN=
```

---

## ▶️ Running the Application

### Option 1: Local Development (Recommended)

#### Prerequisites
- MongoDB running locally or via Docker
- Node.js 18+ installed

#### Terminal 1: Start MongoDB

```bash
# Option A: Using Docker (Recommended)
docker-compose -f backend/docker-compose.yml up -d mongodb

# Option B: Using local MongoDB service
mongod

# Option C: Using MongoDB Atlas (Cloud)
# Update MONGODB_URI in backend/.env with your connection string
```

#### Terminal 2: Start Backend

```bash
# Navigate to backend
cd backend

# Start backend server (no Redis required)
node src/server-working.js

# OR with auto-reload (requires nodemon)
npm run dev

# Expected output:
# ✅ Server running on http://localhost:5000
# 📊 Health check: http://localhost:5000/health
```

#### Terminal 3: Start Frontend

```bash
# From root directory
npm run dev

# Expected output:
# ➜  Local:   http://localhost:8080/
# ➜  Network: http://10.159.80.154:8080/
```

#### Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

### Option 2: Docker Deployment

#### Prerequisites
- Docker and Docker Compose installed

#### Start All Services

```bash
# Navigate to backend
cd backend

# Start all services (MongoDB, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000

---

### Option 3: Production Deployment

#### Build Frontend

```bash
# Build for production
npm run build

# Output: dist/ folder with optimized files
```

#### Start Backend in Production

```bash
cd backend

# Set production environment
export NODE_ENV=production

# Start server
node src/server-working.js
```

#### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
pm2 start backend/src/server-working.js --name "skorly-api"

# Start frontend (if serving static files)
pm2 start "npm run preview" --name "skorly-frontend"

# Save PM2 configuration
pm2 save

# Enable auto-start on system reboot
pm2 startup
```

---

## 🧪 Testing & Verification

### Health Check

```bash
# Check if backend is running
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-12T15:00:00Z"}
```

### Download Sample Template

```bash
# Download sample Excel template
curl http://localhost:5000/api/upload/sample -o sample.xlsx
```

### Test Upload

```bash
# Upload sample file
curl -X POST http://localhost:5000/api/upload \
  -F "file=@sample.xlsx"
```

### Get Students

```bash
# Get all students
curl http://localhost:5000/api/students

# Get specific student
curl http://localhost:5000/api/students/21CS001

# Filter by platform
curl http://localhost:5000/api/students?platform=codechef
```

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" Error

**Cause**: CORS configuration mismatch

**Solution**:
```bash
# Update backend/.env with your IP address
CORS_ORIGIN=http://localhost:8080,http://YOUR_IP:8080

# Restart backend
node backend/src/server-working.js
```

### Issue: MongoDB Connection Error

**Cause**: MongoDB not running

**Solution**:
```bash
# Option 1: Start MongoDB locally
mongod

# Option 2: Start via Docker
docker-compose -f backend/docker-compose.yml up -d mongodb

# Option 3: Use MongoDB Atlas
# Update MONGODB_URI in backend/.env
```

### Issue: Port Already in Use

**Cause**: Another process using port 5000 or 8080

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 node backend/src/server-working.js
```

### Issue: Module Not Found

**Cause**: Dependencies not installed

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Excel Upload Fails

**Cause**: Invalid file format or missing columns

**Solution**:
1. Download sample template: `curl http://localhost:5000/api/upload/sample -o sample.xlsx`
2. Use the template format
3. Ensure all required columns are present
4. Save as .xlsx format

---

## 📊 API Endpoints

### Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload Excel file |
| GET | `/api/upload/sample` | Download sample template |
| GET | `/api/upload/format` | Get format information |

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students |
| GET | `/api/students/:regNo` | Get student details |
| GET | `/api/students?platform=codechef` | Filter by platform |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/leaderboard` | Get top performers |
| GET | `/api/analytics/weekly-comparison` | Get weekly comparison |

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## 📝 Excel File Format

### Required Columns

| Column | Type | Example | Required |
|--------|------|---------|----------|
| Reg No | Text | 21CS001 | ✅ Yes |
| Name | Text | John Doe | ✅ Yes |
| Dept | Text | CSE | ✅ Yes |
| Year | Text | 3rd Year | ✅ Yes |
| CodeChef | Text | codechef_username | ❌ No |
| LeetCode | Text | leetcode_username | ❌ No |
| Codeforces | Text | codeforces_username | ❌ No |
| GitHub | Text | github_username | ❌ No |
| AtCoder | Text | atcoder_username | ❌ No |
| Codolio | Text | codolio_username | ❌ No |

### Sample Data

```
Reg No,Name,Dept,Year,CodeChef,LeetCode,Codeforces,GitHub,AtCoder,Codolio
21CS001,Mohammed Syfudeen,CSE,3rd Year,syfudeen,Syfudeen_17,syfudeen,Syfudeen,-,-
21CS002,John Doe,CSE,3rd Year,johndoe,john_doe,johndoe,johndoe,-,-
21CS003,Jane Smith,CSE,3rd Year,janesmith,jane_smith,janesmith,janesmith,-,-
```

---

## 🚀 Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] MongoDB 4.4+ running
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend `.env` configured
- [ ] Backend `.env` configured
- [ ] MongoDB connection verified
- [ ] Backend health check passing
- [ ] Frontend accessible at http://localhost:8080
- [ ] Backend accessible at http://localhost:5000
- [ ] Sample Excel file downloaded and tested
- [ ] Upload functionality working

---

## 📚 Additional Resources

- **Frontend README**: See `README.md`
- **Backend README**: See `backend/README.md`
- **Backend Setup**: See `backend/SETUP.md`
- **Architecture**: See `backend/ARCHITECTURE.md`
- **Quick Reference**: See `backend/QUICK_REFERENCE.md`
- **Platform Filtering**: See `PLATFORM_FILTERING_FEATURE.md`

---

## 🤝 Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review backend logs: `backend/logs/app.log`
3. Check browser console for frontend errors
4. Open an issue on GitHub: https://github.com/Syfudeen/Skorly/issues

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated**: March 12, 2026
**Version**: 1.0.0
