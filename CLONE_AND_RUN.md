# 🚀 Skorly - Clone & Run Guide

**Quick start guide for cloning and running Skorly from GitHub**

---

## ⚡ 5-Minute Quick Start

### Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check npm (need 8+)
npm --version

# Check MongoDB is running
# (Start MongoDB before proceeding)
```

### Clone & Install

```bash
# 1. Clone repository
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend
npm install
cd ..

# 4. Setup environment files
echo "VITE_API_URL=http://localhost:5000" > .env
cd backend
cp .env.example .env
cd ..
```

### Run Application

**Terminal 1 - MongoDB** (if not already running)
```bash
# Option A: Docker
docker-compose -f backend/docker-compose.yml up -d mongodb

# Option B: Local MongoDB
mongod
```

**Terminal 2 - Backend**
```bash
cd backend
node src/server-working.js
```

**Terminal 3 - Frontend**
```bash
npm run dev
```

### Access Application

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## 📋 Complete Installation Guide

### Step 1: Prerequisites

#### Required Software

| Software | Version | How to Install |
|----------|---------|----------------|
| **Node.js** | 18+ | https://nodejs.org/ |
| **npm** | 8+ | Included with Node.js |
| **MongoDB** | 4.4+ | https://www.mongodb.com/try/download/community |
| **Git** | Latest | https://git-scm.com/ |

#### Verify Installation

```bash
# Check all versions
node --version    # v18.x.x or higher
npm --version     # 8.x.x or higher
git --version     # 2.x.x or higher
```

---

### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/Syfudeen/Skorly.git

# Navigate to project
cd Skorly

# Verify you're in the right directory
ls -la
# Should see: backend/, src/, package.json, README.md, etc.
```

---

### Step 3: Install Dependencies

#### Frontend Dependencies

```bash
# From root directory
npm install

# This will install:
# - React 18
# - TypeScript
# - Tailwind CSS
# - shadcn/ui components
# - Vite build tool
# - And 40+ other packages

# Verify installation
npm list
# Should show tree of installed packages
```

#### Backend Dependencies

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# This will install:
# - Express.js
# - MongoDB/Mongoose
# - Axios
# - Cheerio (web scraping)
# - Winston (logging)
# - And 20+ other packages

# Verify installation
npm list

# Return to root
cd ..
```

---

### Step 4: Configure Environment

#### Frontend Configuration

Create `.env` file in root directory:

```bash
# Create file
echo "VITE_API_URL=http://localhost:5000" > .env

# Verify file was created
cat .env
```

**File: `.env`**
```env
VITE_API_URL=http://localhost:5000
```

#### Backend Configuration

```bash
# Navigate to backend
cd backend

# Copy example to .env
cp .env.example .env

# Edit .env file with your settings
# (Use nano, vim, or VS Code)
nano .env
```

**File: `backend/.env`** (Key settings)
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/skorly

# CORS - Allow frontend
CORS_ORIGIN=http://localhost:8080,http://127.0.0.1:8080

# Logging
LOG_LEVEL=info
```

---

### Step 5: Start MongoDB

Choose one option:

#### Option A: Docker (Recommended)

```bash
# Start MongoDB in Docker
docker-compose -f backend/docker-compose.yml up -d mongodb

# Verify it's running
docker-compose -f backend/docker-compose.yml ps

# View logs
docker-compose -f backend/docker-compose.yml logs mongodb

# Stop when done
docker-compose -f backend/docker-compose.yml down
```

#### Option B: Local MongoDB

```bash
# Start MongoDB service
mongod

# Should show: "waiting for connections on port 27017"
```

#### Option C: MongoDB Atlas (Cloud)

```bash
# Get connection string from MongoDB Atlas
# Update backend/.env:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skorly
```

---

### Step 6: Start Backend

```bash
# Navigate to backend
cd backend

# Start server (no Redis required)
node src/server-working.js

# Expected output:
# 🚀 Starting Skorly Backend (Working Mode)...
# ✅ MongoDB connected successfully
# ✅ Server running on http://localhost:5000
# 📊 Health check: http://localhost:5000/health
```

**Keep this terminal open!**

---

### Step 7: Start Frontend

Open a **new terminal** and run:

```bash
# From root directory (not backend)
npm run dev

# Expected output:
# ➜  Local:   http://localhost:8080/
# ➜  Network: http://10.x.x.x:8080/
# ➜  press h + enter to show help
```

**Keep this terminal open!**

---

### Step 8: Access Application

Open your browser and go to:

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## ✅ Verification Steps

### 1. Check Backend Health

```bash
# In a new terminal
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-12T15:00:00Z"}
```

### 2. Download Sample Template

```bash
# Download sample Excel file
curl http://localhost:5000/api/upload/sample -o sample.xlsx

# File should be created: sample.xlsx
```

### 3. Test Frontend

```bash
# Open in browser
http://localhost:8080

# You should see:
# - Dashboard with charts
# - Upload section
# - Student data (if any)
```

### 4. Test Upload

```bash
# Upload the sample file
curl -X POST http://localhost:5000/api/upload \
  -F "file=@sample.xlsx"

# Should return job ID and status
```

---

## 📁 Project Structure

```
Skorly/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── server-working.js  # Main server (use this!)
│   │   ├── app.js             # Express app
│   │   ├── config/            # Database config
│   │   ├── models/            # Data models
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helpers
│   ├── .env                   # Backend config (create this)
│   ├── .env.example           # Config template
│   ├── package.json           # Dependencies
│   └── README.md              # Backend docs
│
├── src/                       # React + TypeScript frontend
│   ├── components/            # React components
│   ├── pages/                 # Page components
│   ├── App.tsx                # Main app
│   └── main.tsx               # Entry point
│
├── .env                       # Frontend config (create this)
├── package.json               # Frontend dependencies
├── vite.config.ts             # Build config
├── README.md                  # Project docs
└── SETUP_AND_DEPLOYMENT.md    # Detailed setup guide
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to fetch" Error

**Problem**: Frontend can't reach backend

**Solution**:
```bash
# 1. Check backend is running
curl http://localhost:5000/health

# 2. Check CORS in backend/.env
CORS_ORIGIN=http://localhost:8080

# 3. Restart backend
# Stop current backend (Ctrl+C)
# Start again: node backend/src/server-working.js
```

### Issue 2: MongoDB Connection Error

**Problem**: Backend can't connect to MongoDB

**Solution**:
```bash
# 1. Check MongoDB is running
# For Docker:
docker-compose -f backend/docker-compose.yml ps

# For local:
mongod

# 2. Check connection string in backend/.env
MONGODB_URI=mongodb://localhost:27017/skorly

# 3. Restart backend after MongoDB is running
```

### Issue 3: Port Already in Use

**Problem**: Port 5000 or 8080 is already in use

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 node backend/src/server-working.js
```

### Issue 4: Module Not Found

**Problem**: Dependencies not installed

**Solution**:
```bash
# Reinstall frontend dependencies
rm -rf node_modules package-lock.json
npm install

# Reinstall backend dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Issue 5: Excel Upload Fails

**Problem**: Can't upload Excel file

**Solution**:
```bash
# 1. Download sample template
curl http://localhost:5000/api/upload/sample -o sample.xlsx

# 2. Use the template format
# 3. Ensure columns: Reg No, Name, Dept, Year, CodeChef, LeetCode, etc.
# 4. Save as .xlsx format
# 5. Try uploading again
```

---

## 📊 API Endpoints

### Quick Reference

```bash
# Health check
curl http://localhost:5000/health

# Get all students
curl http://localhost:5000/api/students

# Get specific student
curl http://localhost:5000/api/students/21CS001

# Filter by platform
curl http://localhost:5000/api/students?platform=codechef

# Get leaderboard
curl http://localhost:5000/api/analytics/leaderboard

# Upload file
curl -X POST http://localhost:5000/api/upload \
  -F "file=@students.xlsx"
```

---

## 🎯 Next Steps

### 1. Upload Student Data

1. Prepare Excel file with student data
2. Go to http://localhost:8080
3. Click "Upload Data"
4. Select your Excel file
5. Wait for processing
6. View results on dashboard

### 2. Filter by Platform

1. Click "Select Platform" dropdown
2. Choose platform (CodeChef, LeetCode, etc.)
3. View platform-specific rankings

### 3. Analyze Performance

1. View dashboard charts
2. Check leaderboard
3. Compare weekly performance
4. Export data if needed

---

## 📚 Documentation

For more detailed information, see:

- **Setup & Deployment**: `SETUP_AND_DEPLOYMENT.md`
- **Project Checklist**: `PROJECT_COMPLETENESS_CHECKLIST.md`
- **Backend Docs**: `backend/README.md`
- **Backend Setup**: `backend/SETUP.md`
- **Architecture**: `backend/ARCHITECTURE.md`
- **Quick Reference**: `backend/QUICK_REFERENCE.md`

---

## 🆘 Need Help?

### Check These First

1. **Backend logs**: `backend/logs/app.log`
2. **Browser console**: Press F12 in browser
3. **Terminal output**: Check for error messages
4. **Health endpoint**: `curl http://localhost:5000/health`

### Get Support

- **GitHub Issues**: https://github.com/Syfudeen/Skorly/issues
- **Documentation**: See files listed above
- **Email**: syfudeen@example.com

---

## 🎉 You're All Set!

Your Skorly application is now running!

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5000
- **Database**: MongoDB (local or Docker)

Start uploading student data and analyzing performance!

---

**Version**: 1.0.0  
**Last Updated**: March 12, 2026  
**Status**: ✅ Ready to Use
