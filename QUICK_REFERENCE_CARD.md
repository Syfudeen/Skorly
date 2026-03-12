# 🚀 Skorly - Quick Reference Card

**Everything you need to know at a glance**

---

## ⚡ 30-Second Setup

```bash
git clone https://github.com/Syfudeen/Skorly.git && cd Skorly
npm install && cd backend && npm install && cd ..
echo "VITE_API_URL=http://localhost:5000" > .env
cd backend && cp .env.example .env && cd ..
docker-compose -f backend/docker-compose.yml up -d mongodb
```

Then in 3 terminals:
```bash
# Terminal 1: Backend
cd backend && node src/server-working.js

# Terminal 2: Frontend
npm run dev

# Terminal 3: Done! Open http://localhost:8080
```

---

## 📋 What You Need

| Item | Version | Link |
|------|---------|------|
| Node.js | 18+ | https://nodejs.org/ |
| MongoDB | 4.4+ | https://www.mongodb.com/ |
| Git | Latest | https://git-scm.com/ |

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `CLONE_AND_RUN.md` | **START HERE** - Quick start guide |
| `SETUP_AND_DEPLOYMENT.md` | Complete setup & deployment |
| `backend/.env.example` | Backend config template |
| `.env` | Frontend config (create this) |
| `backend/src/server-working.js` | Backend server (use this!) |

---

## 🎯 Common Commands

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Start MongoDB (Docker)
docker-compose -f backend/docker-compose.yml up -d mongodb

# Start backend
cd backend && node src/server-working.js

# Start frontend
npm run dev

# Build for production
npm run build

# Download sample template
curl http://localhost:5000/api/upload/sample -o sample.xlsx

# Check health
curl http://localhost:5000/health

# Get all students
curl http://localhost:5000/api/students
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:5000 |
| Health Check | http://localhost:5000/health |
| API Docs | http://localhost:5000/api |

---

## 📊 API Endpoints

```bash
# Upload Excel file
POST /api/upload

# Get all students
GET /api/students

# Get specific student
GET /api/students/:regNo

# Filter by platform
GET /api/students?platform=codechef

# Get leaderboard
GET /api/analytics/leaderboard

# Get weekly comparison
GET /api/analytics/weekly-comparison

# Health check
GET /health
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to fetch" | Check backend is running: `curl http://localhost:5000/health` |
| MongoDB error | Start MongoDB: `docker-compose -f backend/docker-compose.yml up -d mongodb` |
| Port in use | Kill process: `lsof -i :5000` then `kill -9 <PID>` |
| Module not found | Reinstall: `rm -rf node_modules && npm install` |
| Excel upload fails | Download sample: `curl http://localhost:5000/api/upload/sample -o sample.xlsx` |

---

## 📦 What's Included

- ✅ React 18 + TypeScript frontend
- ✅ Express.js + MongoDB backend
- ✅ Multi-platform integration (Codeforces, LeetCode, CodeChef, GitHub)
- ✅ Excel file processing
- ✅ Real-time analytics
- ✅ Docker support
- ✅ Complete documentation
- ✅ Sample data & templates

---

## 🎓 Learning Path

1. **New User?** → Read `CLONE_AND_RUN.md`
2. **Developer?** → Read `backend/ARCHITECTURE.md`
3. **DevOps?** → Read `SETUP_AND_DEPLOYMENT.md`
4. **Need Help?** → Check `PROJECT_COMPLETENESS_CHECKLIST.md`

---

## 🔧 Environment Variables

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000
```

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skorly
CORS_ORIGIN=http://localhost:8080,http://127.0.0.1:8080
```

---

## 📊 Project Stats

- **Frontend**: React 18, TypeScript, Tailwind CSS, 30+ components
- **Backend**: Express, MongoDB, Mongoose, 15+ API endpoints
- **Platforms**: 6 supported (Codeforces, LeetCode, CodeChef, GitHub, AtCoder, Codolio)
- **Documentation**: 10+ guides
- **Code**: 15,000+ lines

---

## ✅ Verification Checklist

```bash
# 1. Check Node.js
node --version  # Should be 18+

# 2. Check npm
npm --version   # Should be 8+

# 3. Check MongoDB
docker-compose -f backend/docker-compose.yml ps

# 4. Check backend
curl http://localhost:5000/health

# 5. Check frontend
# Open http://localhost:8080 in browser
```

---

## 🚀 Deployment Options

| Option | Command | Best For |
|--------|---------|----------|
| Local Dev | `npm run dev` | Development |
| Docker | `docker-compose up` | Testing |
| Production | `npm run build` | Production |
| PM2 | `pm2 start backend/src/server-working.js` | Scaling |

---

## 📞 Support

- **GitHub**: https://github.com/Syfudeen/Skorly
- **Issues**: https://github.com/Syfudeen/Skorly/issues
- **Docs**: See repository files

---

## 🎯 Next Steps

1. Clone: `git clone https://github.com/Syfudeen/Skorly.git`
2. Install: `npm install && cd backend && npm install`
3. Configure: Create `.env` files
4. Start: Run backend and frontend
5. Upload: Add student data
6. Analyze: View performance metrics

---

## 💡 Pro Tips

- Use `server-working.js` (no Redis required)
- Download sample template before uploading
- Check logs in `backend/logs/app.log`
- Use Docker for MongoDB (easier setup)
- Keep terminals open while developing

---

**Version**: 1.0.0  
**Status**: ✅ Ready to Use  
**Last Updated**: March 12, 2026

**👉 START HERE**: Read `CLONE_AND_RUN.md`
