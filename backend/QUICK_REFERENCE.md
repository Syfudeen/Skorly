# Skorly Backend - Quick Reference Guide

## 🚀 Quick Commands

### Setup & Installation
```bash
npm install                    # Install dependencies
npm run setup:test            # Verify setup
npm run setup:sample          # Generate sample Excel
```

### Development
```bash
npm run dev                   # Start API server (with auto-reload)
npm run worker                # Start worker process
npm run docker:up             # Start all services with Docker
npm run docker:logs           # View Docker logs
npm run docker:down           # Stop Docker services
```

### Testing
```bash
npm test                      # Run tests
npm run test:watch            # Run tests in watch mode
npm run lint                  # Check code style
npm run lint:fix              # Fix code style issues
```

## 📡 API Quick Reference

### Base URL
```
http://localhost:5000/api
```

### Upload Excel
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@students.xlsx"
```

### Get Job Progress
```bash
curl http://localhost:5000/api/jobs/{jobId}
```

### Get All Students
```bash
curl "http://localhost:5000/api/students?page=1&limit=20"
```

### Get Student Details
```bash
curl http://localhost:5000/api/students/21CS001
```

### Get Dashboard Analytics
```bash
curl http://localhost:5000/api/analytics/dashboard
```

### Get Leaderboard
```bash
curl "http://localhost:5000/api/analytics/leaderboard?limit=10"
```

## 📊 Excel Format

### Required Columns (in order)
1. Name
2. Reg No
3. Dept
4. Year
5. CodeChef ID
6. LeetCode ID
7. Codeforces ID
8. AtCoder ID
9. Codolio ID
10. GitHub ID

### Example Row
```
John Doe | 21CS001 | Computer Science | 3rd Year | john_cc | john_lc | john_cf | john_at | john_cd | john-gh
```

### Download Sample
```bash
curl http://localhost:5000/api/upload/sample -o sample.xlsx
```

## 🔧 Environment Variables

### Essential Variables
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skorly
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:3000
```

### Queue Configuration
```env
QUEUE_CONCURRENCY=5
QUEUE_RETRY_ATTEMPTS=3
QUEUE_RETRY_DELAY=5000
```

## 🐳 Docker Commands

### Start Services
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f worker
docker-compose logs -f mongodb
docker-compose logs -f redis
```

### Stop Services
```bash
docker-compose down
```

### Restart Service
```bash
docker-compose restart backend
docker-compose restart worker
```

### Access Containers
```bash
docker exec -it skorly-backend sh
docker exec -it skorly-mongodb mongosh
docker exec -it skorly-redis redis-cli
```

## 🗄️ Database Access

### MongoDB
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/skorly

# Or via Docker
docker exec -it skorly-mongodb mongosh skorly

# Common queries
db.students.find()
db.uploadjobs.find().sort({createdAt:-1}).limit(5)
db.performancehistories.find({regNo:"21CS001"})
```

### Redis
```bash
# Connect to Redis
redis-cli

# Or via Docker
docker exec -it skorly-redis redis-cli

# Common commands
KEYS *
GET job:progress:job_123
LRANGE queue:student-processing:waiting 0 -1
```

## 📝 Common Tasks

### Check System Health
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/health
```

### Upload and Track
```bash
# 1. Upload file
RESPONSE=$(curl -s -X POST http://localhost:5000/api/upload \
  -F "file=@students.xlsx")

# 2. Extract jobId
JOB_ID=$(echo $RESPONSE | jq -r '.data.jobId')

# 3. Track progress
watch -n 2 "curl -s http://localhost:5000/api/jobs/$JOB_ID | jq '.data.job.progress'"
```

### Get Statistics
```bash
# Job statistics
curl http://localhost:5000/api/jobs/stats/overview

# Student statistics
curl http://localhost:5000/api/students/stats/summary

# Platform analytics
curl http://localhost:5000/api/analytics/platforms
```

## 🔍 Troubleshooting

### Check if Services are Running
```bash
# MongoDB
mongosh --eval "db.adminCommand('ping')"

# Redis
redis-cli ping

# API Server
curl http://localhost:5000/health
```

### View Logs
```bash
# Application logs
tail -f logs/app.log
tail -f logs/error.log

# Docker logs
docker-compose logs -f
```

### Clear Queue
```bash
# Connect to Redis
redis-cli

# Delete queue keys
DEL bull:student-processing:*
```

### Reset Database
```bash
# Connect to MongoDB
mongosh skorly

# Drop collections
db.students.drop()
db.platformstats.drop()
db.performancehistories.drop()
db.uploadjobs.drop()
```

## 📊 Monitoring

### Queue Statistics
```bash
curl http://localhost:5000/api/jobs/stats/overview | jq '.data.queue'
```

### Database Status
```bash
curl http://localhost:5000/api/health | jq '.services.database'
```

### Redis Status
```bash
curl http://localhost:5000/api/health | jq '.services.redis'
```

### Memory Usage
```bash
curl http://localhost:5000/api/health | jq '.memory'
```

## 🎯 Performance Tips

### Increase Concurrency
```env
# In .env
QUEUE_CONCURRENCY=10  # Process 10 students simultaneously
```

### Optimize Database
```bash
# Create indexes
mongosh skorly --eval "
  db.students.createIndex({regNo: 1});
  db.platformstats.createIndex({regNo: 1, platform: 1});
  db.performancehistories.createIndex({regNo: 1, uploadDate: -1});
"
```

### Monitor Performance
```bash
# Watch queue processing
watch -n 1 "curl -s http://localhost:5000/api/jobs/stats/overview | jq '.data.queue'"

# Monitor memory
watch -n 5 "curl -s http://localhost:5000/api/health | jq '.memory'"
```

## 🔐 Security Checklist

- [ ] Change default MongoDB credentials
- [ ] Set Redis password
- [ ] Update JWT_SECRET in .env
- [ ] Configure CORS_ORIGIN for production
- [ ] Enable HTTPS in production
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Review file upload limits

## 📚 Useful Links

- **API Documentation**: See README.md
- **Architecture**: See ARCHITECTURE.md
- **Setup Guide**: See SETUP.md
- **Implementation**: See IMPLEMENTATION_SUMMARY.md

## 🆘 Getting Help

1. Check logs: `tail -f logs/app.log`
2. Verify setup: `npm run setup:test`
3. Check health: `curl http://localhost:5000/api/health`
4. Review documentation in .md files

## 💡 Pro Tips

1. **Use Docker for development** - It's easier and more reliable
2. **Monitor logs** - They contain valuable debugging information
3. **Test with sample data** - Use `npm run setup:sample`
4. **Check health endpoint** - Before reporting issues
5. **Use jq** - For pretty JSON output: `curl ... | jq`

---

**Quick Start**: `npm run docker:up` → Upload Excel → Track Progress → View Analytics

**Need Help?** Check SETUP.md for detailed instructions