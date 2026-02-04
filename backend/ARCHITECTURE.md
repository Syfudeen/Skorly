# Skorly Backend - System Architecture

## 🏗️ Architecture Overview

Skorly is a production-ready student coding platform tracker built with a scalable, queue-based architecture designed to handle 300-1000+ students efficiently.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Frontend)                        │
│                    React + TypeScript + Vite                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      EXPRESS API SERVER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes: Upload │ Jobs │ Students │ Analytics            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware: Auth │ Validation │ Rate Limiting │ CORS    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services: Excel │ Platform APIs │ Comparison           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
┌───────────────▼──────────┐  ┌──────────▼──────────────────────┐
│      MONGODB             │  │      REDIS + BULLMQ             │
│  ┌──────────────────┐   │  │  ┌──────────────────────────┐  │
│  │ Students         │   │  │  │ Job Queue                │  │
│  │ PlatformStats    │   │  │  │ Rate Limiting            │  │
│  │ PerformanceHistory│  │  │  │ Caching                  │  │
│  │ UploadJobs       │   │  │  └──────────────────────────┘  │
│  └──────────────────┘   │  └─────────────┬───────────────────┘
└──────────────────────────┘                │
                                            │
                             ┌──────────────▼──────────────────┐
                             │      WORKER PROCESS             │
                             │  ┌──────────────────────────┐  │
                             │  │ Process Student Jobs     │  │
                             │  │ Fetch Platform APIs      │  │
                             │  │ Compare Data             │  │
                             │  │ Store Results            │  │
                             │  └──────────────────────────┘  │
                             └─────────────────────────────────┘
                                            │
                             ┌──────────────▼──────────────────┐
                             │    EXTERNAL PLATFORM APIs       │
                             │  ┌──────────────────────────┐  │
                             │  │ Codeforces API           │  │
                             │  │ LeetCode GraphQL         │  │
                             │  │ CodeChef (Scraping)      │  │
                             │  │ GitHub API               │  │
                             │  └──────────────────────────┘  │
                             └─────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Excel Upload Flow

```
User uploads Excel
       │
       ▼
API receives file
       │
       ▼
Validate file format
       │
       ▼
Parse Excel → Extract students
       │
       ▼
Validate student data
       │
       ▼
Create UploadJob record
       │
       ▼
Add students to BullMQ queue
       │
       ▼
Return jobId to client
       │
       ▼
Client polls /api/jobs/:jobId for progress
```

### 2. Worker Processing Flow

```
Worker picks job from queue
       │
       ▼
Fetch student from job data
       │
       ▼
For each platform ID:
  ├─ Enforce rate limiting
  ├─ Call platform API
  ├─ Parse response
  └─ Handle errors
       │
       ▼
Get previous stats from DB
       │
       ▼
Compare current vs previous
       │
       ▼
Calculate changes & trends
       │
       ▼
Save to database:
  ├─ Update Student record
  ├─ Save PlatformStats
  └─ Create PerformanceHistory
       │
       ▼
Update UploadJob progress
       │
       ▼
Mark job as complete
```

## 📊 Database Schema

### Students Collection

```javascript
{
  _id: ObjectId,
  regNo: String (unique, indexed),
  name: String,
  department: String (indexed),
  year: String,
  platformIds: {
    codeforces: String,
    codechef: String,
    leetcode: String,
    atcoder: String,
    codolio: String,
    github: String
  },
  isActive: Boolean,
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### PlatformStats Collection

```javascript
{
  _id: ObjectId,
  regNo: String (indexed),
  platform: String (indexed),
  platformUserId: String,
  currentStats: {
    rating: Number,
    maxRating: Number,
    problemsSolved: Number,
    contestsParticipated: Number,
    rank: Number,
    additionalData: Object
  },
  previousStats: {
    rating: Number,
    maxRating: Number,
    problemsSolved: Number,
    contestsParticipated: Number,
    rank: Number,
    additionalData: Object
  },
  changes: {
    rating: Number,
    maxRating: Number,
    problemsSolved: Number,
    contestsParticipated: Number,
    rank: Number
  },
  lastFetched: Date,
  fetchStatus: String,
  errorMessage: String,
  uploadJobId: ObjectId (indexed),
  createdAt: Date,
  updatedAt: Date
}

// Compound Index: { regNo: 1, platform: 1 } (unique)
```

### PerformanceHistory Collection

```javascript
{
  _id: ObjectId,
  regNo: String (indexed),
  uploadJobId: ObjectId (indexed),
  weekNumber: Number (indexed),
  weekLabel: String,
  uploadDate: Date (indexed),
  platformStats: [{
    platform: String,
    rating: Number,
    maxRating: Number,
    problemsSolved: Number,
    contestsParticipated: Number,
    rank: Number,
    fetchStatus: String
  }],
  overallScore: Number,
  performanceLevel: String,
  totalPlatforms: Number,
  activePlatforms: Number,
  metadata: {
    processingTime: Number,
    errors: Array
  },
  createdAt: Date,
  updatedAt: Date
}

// Compound Index: { regNo: 1, uploadDate: -1 }
```

### UploadJobs Collection

```javascript
{
  _id: ObjectId,
  jobId: String (unique, indexed),
  fileName: String,
  originalName: String,
  fileSize: Number,
  status: String (indexed),
  progress: {
    total: Number,
    processed: Number,
    successful: Number,
    failed: Number,
    percentage: Number
  },
  studentsData: {
    total: Number,
    valid: Number,
    invalid: Number,
    duplicates: Number
  },
  weekInfo: {
    weekNumber: Number,
    weekLabel: String,
    uploadDate: Date
  },
  processingStats: {
    startTime: Date,
    endTime: Date,
    duration: Number,
    averageProcessingTime: Number
  },
  platformStats: {
    codeforces: { attempted, successful, failed },
    codechef: { attempted, successful, failed },
    leetcode: { attempted, successful, failed },
    // ... other platforms
  },
  errors: [{
    type: String,
    message: String,
    details: Object,
    timestamp: Date,
    regNo: String,
    platform: String
  }],
  metadata: Object,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

## 🔌 Platform API Integration

### Codeforces (Official API)

**Endpoints:**
- User Info: `GET /api/user.info?handles={handle}`
- User Status: `GET /api/user.status?handle={handle}`

**Rate Limit:** 5 requests/second

**Data Extracted:**
- Rating (current & max)
- Problems solved (unique)
- Contests participated
- Rank

### LeetCode (GraphQL API)

**Endpoint:** `POST /graphql`

**Query:**
```graphql
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats { acSubmissionNum { count } }
  }
  userContestRanking(username: $username) {
    rating
    attendedContestsCount
    globalRanking
  }
}
```

**Rate Limit:** 2 requests/second

**Data Extracted:**
- Contest rating
- Problems solved
- Contests attended
- Global ranking

### CodeChef (Web Scraping)

**Approach:** Controlled scraping with rate limiting

**Rate Limit:** 1 request/second

**Data Extracted:**
- Rating
- Problems solved
- Contest participation

### GitHub (REST API)

**Endpoints:**
- User: `GET /users/{username}`
- Repos: `GET /users/{username}/repos`

**Rate Limit:** 10 requests/second (with auth)

**Data Extracted:**
- Public repositories
- Stars received
- Followers/Following
- Contributions

## ⚙️ Queue System (BullMQ)

### Queue Configuration

```javascript
{
  concurrency: 5,              // Process 5 jobs simultaneously
  retryAttempts: 3,            // Retry failed jobs 3 times
  retryDelay: 5000,            // 5 seconds between retries
  backoff: 'exponential',      // Exponential backoff
  removeOnComplete: 100,       // Keep last 100 completed jobs
  removeOnFail: 50             // Keep last 50 failed jobs
}
```

### Job Structure

```javascript
{
  name: 'process-student',
  data: {
    student: {
      regNo: 'CS001',
      name: 'John Doe',
      platformIds: { ... }
    },
    uploadJobId: 'job_123456_abc',
    timestamp: '2026-02-04T...'
  },
  opts: {
    priority: 0,
    delay: 100,                // Stagger jobs by 100ms
    jobId: 'job_123456_abc-CS001'
  }
}
```

### Worker Concurrency

The system processes multiple students in parallel:
- **Concurrency:** 5 workers
- **Rate Limiting:** Per-platform limits enforced
- **Staggering:** 100ms delay between job additions
- **Retry Logic:** Exponential backoff on failures

## 🔒 Security Features

### 1. Rate Limiting

**API Endpoints:**
- General: 100 requests / 15 minutes
- Upload: 5 uploads / 15 minutes
- Read operations: 60 requests / minute

**Platform APIs:**
- Codeforces: 5 req/sec
- LeetCode: 2 req/sec
- CodeChef: 1 req/sec
- GitHub: 10 req/sec

### 2. Input Validation

- Excel file validation (size, format, structure)
- Student data validation (regNo, name, platform IDs)
- Duplicate detection
- SQL injection prevention
- XSS protection

### 3. Error Handling

- Global error handler
- Graceful degradation
- Partial success handling
- Detailed error logging
- User-friendly error messages

### 4. CORS Configuration

```javascript
{
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

## 📈 Performance Optimizations

### 1. Database Indexing

```javascript
// Students
{ regNo: 1 } (unique)
{ department: 1 }
{ createdAt: -1 }

// PlatformStats
{ regNo: 1, platform: 1 } (unique)
{ uploadJobId: 1 }
{ lastFetched: -1 }

// PerformanceHistory
{ regNo: 1, uploadDate: -1 }
{ uploadJobId: 1 }
{ weekNumber: 1 }

// UploadJobs
{ jobId: 1 } (unique)
{ status: 1 }
{ createdAt: -1 }
```

### 2. Caching Strategy

**Redis Caching:**
- Student stats: 1 hour TTL
- Platform stats: 30 minutes TTL
- Job progress: 5 minutes TTL
- Analytics: 2 hours TTL

### 3. Query Optimization

- Lean queries for read operations
- Projection to limit fields
- Pagination for large datasets
- Aggregation pipelines for analytics

### 4. Connection Pooling

- MongoDB: Max 10 connections
- Redis: Persistent connection
- HTTP: Keep-alive enabled

## 🔍 Monitoring & Logging

### Log Levels

- **error:** Critical errors
- **warn:** Warnings and degraded performance
- **info:** General information
- **http:** HTTP requests
- **debug:** Detailed debugging information

### Log Files

```
logs/
├── app.log          # All logs
├── error.log        # Error logs only
├── http.log         # HTTP request logs
├── exceptions.log   # Uncaught exceptions
└── rejections.log   # Unhandled rejections
```

### Metrics Tracked

- Request count & duration
- Queue statistics
- Database query performance
- API call success/failure rates
- Memory & CPU usage
- Error rates by type

## 🚀 Scalability

### Horizontal Scaling

The system is designed for horizontal scaling:

1. **Multiple API Servers:**
   - Load balancer distributes requests
   - Stateless design (session in Redis)
   - Shared MongoDB & Redis

2. **Multiple Workers:**
   - Add more worker processes
   - BullMQ handles distribution
   - No coordination needed

3. **Database Sharding:**
   - Shard by regNo or department
   - Read replicas for analytics

### Vertical Scaling

- Increase worker concurrency
- Add more MongoDB connections
- Increase Redis memory
- Optimize queries

### Performance Targets

- **Upload Processing:** 300 students in ~10 minutes
- **API Response Time:** < 200ms (p95)
- **Queue Throughput:** 5-10 students/second
- **Database Queries:** < 100ms (p95)

## 🧪 Testing Strategy

### Unit Tests

- Service functions
- Utility functions
- Model methods
- Validation logic

### Integration Tests

- API endpoints
- Database operations
- Queue processing
- Platform API mocking

### Load Tests

- Concurrent uploads
- High-volume queue processing
- Database performance
- API rate limiting

## 📦 Deployment

### Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Configure production MongoDB URI
- [ ] Set up Redis with password
- [ ] Configure CORS for production domain
- [ ] Set secure JWT secret
- [ ] Enable HTTPS
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Set up CI/CD pipeline

### Environment Variables

See `.env.example` for all required variables.

### Docker Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Process Management

Use PM2 for production:

```bash
pm2 start src/server.js --name skorly-api
pm2 start src/workers/studentWorker.js --name skorly-worker
pm2 save
pm2 startup
```

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Follow ESLint rules
5. Use conventional commits

## 📄 License

MIT License