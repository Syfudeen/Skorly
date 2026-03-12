# 🚀 Skorly - Deployment Guide (Trial & Production)

**Complete deployment instructions for all platforms**

---

## 📋 Table of Contents

1. [Local Deployment (Trial)](#local-deployment-trial)
2. [Docker Deployment (Trial)](#docker-deployment-trial)
3. [Heroku Deployment (Free Trial)](#heroku-deployment-free-trial)
4. [Railway Deployment (Free Trial)](#railway-deployment-free-trial)
5. [Render Deployment (Free Trial)](#render-deployment-free-trial)
6. [AWS Deployment (Production)](#aws-deployment-production)
7. [DigitalOcean Deployment (Production)](#digitalocean-deployment-production)
8. [Vercel + Backend Deployment](#vercel--backend-deployment)

---

## 🏠 Local Deployment (Trial)

### Easiest & Fastest (5 minutes)

**Prerequisites:**
- Node.js 18+
- MongoDB (local or Docker)
- Git

**Steps:**

```bash
# 1. Clone
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Setup environment
echo "VITE_API_URL=http://localhost:5000" > .env
cd backend && cp .env.example .env && cd ..

# 4. Start MongoDB (Docker)
docker-compose -f backend/docker-compose.yml up -d mongodb

# 5. Start Backend (Terminal 2)
cd backend
node src/server-working.js

# 6. Start Frontend (Terminal 3)
npm run dev

# 7. Access
# Frontend: http://localhost:8080
# Backend: http://localhost:5000
```

**Pros:**
- ✅ Fastest setup
- ✅ No cost
- ✅ Full control
- ✅ Easy debugging

**Cons:**
- ❌ Only accessible locally
- ❌ Requires your machine to run 24/7

---

## 🐳 Docker Deployment (Trial)

### Best for Testing & Local Deployment

**Prerequisites:**
- Docker & Docker Compose installed
- Git

**Steps:**

```bash
# 1. Clone
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly

# 2. Build Docker images
docker-compose -f backend/docker-compose.yml build

# 3. Start all services
docker-compose -f backend/docker-compose.yml up -d

# 4. Check status
docker-compose -f backend/docker-compose.yml ps

# 5. View logs
docker-compose -f backend/docker-compose.yml logs -f

# 6. Access
# Frontend: http://localhost:8080
# Backend: http://localhost:5000

# 7. Stop services
docker-compose -f backend/docker-compose.yml down
```

**Pros:**
- ✅ Consistent environment
- ✅ Easy to scale
- ✅ All services together
- ✅ Easy to manage

**Cons:**
- ❌ Only accessible locally
- ❌ Requires Docker installation

---

## 🎈 Heroku Deployment (Free Trial)

### Quick Cloud Deployment (30 minutes)

**Prerequisites:**
- Heroku account (free)
- Heroku CLI installed
- Git

**Step 1: Create Heroku Apps**

```bash
# Login to Heroku
heroku login

# Create backend app
heroku create skorly-backend

# Create frontend app
heroku create skorly-frontend
```

**Step 2: Configure Backend**

```bash
# Navigate to backend
cd backend

# Add MongoDB Atlas URI
heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skorly

# Add other environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
heroku config:set CORS_ORIGIN=https://skorly-frontend.herokuapp.com

# Create Procfile
echo "web: node src/server-working.js" > Procfile

# Deploy backend
git push heroku main

# Check logs
heroku logs --tail
```

**Step 3: Configure Frontend**

```bash
# Go back to root
cd ..

# Create .env.production
echo "VITE_API_URL=https://skorly-backend.herokuapp.com" > .env.production

# Create Procfile for frontend
echo "web: npm run preview" > Procfile

# Deploy frontend
git push heroku main
```

**Step 4: Access**

```bash
# Open frontend
heroku open -a skorly-frontend

# Backend URL
https://skorly-backend.herokuapp.com
```

**Pros:**
- ✅ Free tier available
- ✅ Easy deployment
- ✅ Automatic SSL
- ✅ Good for trials

**Cons:**
- ❌ Free tier has limitations
- ❌ Sleeps after 30 min inactivity
- ❌ Limited database space

---

## 🚂 Railway Deployment (Free Trial)

### Modern Cloud Platform (20 minutes)

**Prerequisites:**
- Railway account (free)
- GitHub account
- Git

**Step 1: Connect GitHub**

```bash
# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Step 2: Deploy on Railway**

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select Skorly repository
6. Railway auto-detects and deploys

**Step 3: Configure Environment**

In Railway dashboard:
1. Go to Variables
2. Add:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skorly
   NODE_ENV=production
   PORT=5000
   CORS_ORIGIN=https://your-railway-domain.railway.app
   ```

**Step 4: Deploy Frontend**

1. Create `vercel.json` in root:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "env": {
       "VITE_API_URL": "@BACKEND_URL"
     }
   }
   ```

2. Deploy to Vercel (see Vercel section below)

**Pros:**
- ✅ Modern platform
- ✅ Easy GitHub integration
- ✅ Good free tier
- ✅ Fast deployment

**Cons:**
- ❌ Smaller community
- ❌ Limited free resources

---

## 🎨 Render Deployment (Free Trial)

### Simple & Fast (15 minutes)

**Prerequisites:**
- Render account (free)
- GitHub account

**Step 1: Deploy Backend**

1. Go to https://render.com
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub
5. Select Skorly repository
6. Configure:
   - **Name**: skorly-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `node src/server-working.js`
   - **Plan**: Free

7. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skorly
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

8. Deploy

**Step 2: Deploy Frontend**

1. Click "New +"
2. Select "Static Site"
3. Connect GitHub
4. Configure:
   - **Name**: skorly-frontend
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://skorly-backend.onrender.com
     ```

5. Deploy

**Step 3: Access**

- Frontend: https://skorly-frontend.onrender.com
- Backend: https://skorly-backend.onrender.com

**Pros:**
- ✅ Very easy setup
- ✅ Free tier available
- ✅ Good performance
- ✅ Auto-deploy from GitHub

**Cons:**
- ❌ Free tier spins down after inactivity
- ❌ Limited resources

---

## ☁️ AWS Deployment (Production)

### Professional & Scalable (1-2 hours)

**Prerequisites:**
- AWS account
- AWS CLI installed
- Docker

**Architecture:**
```
Frontend (S3 + CloudFront)
    ↓
Backend (EC2 or ECS)
    ↓
Database (RDS MongoDB or Atlas)
```

**Step 1: Deploy Frontend to S3**

```bash
# Build frontend
npm run build

# Create S3 bucket
aws s3 mb s3://skorly-frontend

# Upload files
aws s3 sync dist/ s3://skorly-frontend --delete

# Make public
aws s3api put-bucket-policy --bucket skorly-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::skorly-frontend/*"
  }]
}'

# Enable static website hosting
aws s3 website s3://skorly-frontend --index-document index.html --error-document index.html
```

**Step 2: Deploy Backend to EC2**

```bash
# Create EC2 instance
# - AMI: Ubuntu 20.04
# - Type: t2.micro (free tier)
# - Security Group: Allow 5000, 22, 80, 443

# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly/backend

# Install dependencies
npm install

# Create .env
cp .env.example .env
# Edit .env with production values

# Install PM2
sudo npm install -g pm2

# Start backend
pm2 start src/server-working.js --name "skorly-api"
pm2 startup
pm2 save

# Install Nginx
sudo apt-get install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
# Add proxy configuration
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Step 3: Setup SSL with Let's Encrypt**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Step 4: Setup Database**

Option A: MongoDB Atlas (Cloud)
```bash
# Create cluster at https://www.mongodb.com/cloud/atlas
# Get connection string
# Add to .env: MONGODB_URI=mongodb+srv://...
```

Option B: AWS RDS
```bash
# Create RDS instance in AWS Console
# Configure security groups
# Get connection string
```

**Pros:**
- ✅ Production-grade
- ✅ Highly scalable
- ✅ Auto-scaling available
- ✅ Professional support

**Cons:**
- ❌ More complex setup
- ❌ Costs money
- ❌ Requires AWS knowledge

---

## 💧 DigitalOcean Deployment (Production)

### Simple & Affordable (45 minutes)

**Prerequisites:**
- DigitalOcean account ($5/month)
- SSH key

**Step 1: Create Droplet**

1. Go to DigitalOcean
2. Create Droplet:
   - **Image**: Ubuntu 20.04
   - **Size**: $5/month (1GB RAM)
   - **Region**: Closest to you
   - **Add SSH key**

**Step 2: Setup Server**

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install MongoDB
apt-get install -y mongodb

# Start MongoDB
systemctl start mongodb
systemctl enable mongodb

# Clone repository
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly/backend

# Install dependencies
npm install

# Create .env
cp .env.example .env
nano .env  # Edit with production values

# Install PM2
npm install -g pm2

# Start backend
pm2 start src/server-working.js --name "skorly-api"
pm2 startup
pm2 save

# Install Nginx
apt-get install -y nginx

# Configure Nginx (see AWS section for config)
nano /etc/nginx/sites-available/default

# Restart Nginx
systemctl restart nginx

# Setup SSL
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

**Step 3: Deploy Frontend**

```bash
# Build frontend
npm run build

# Install Nginx on separate droplet or same droplet
# Copy dist folder to /var/www/html

# Configure Nginx for frontend
nano /etc/nginx/sites-available/default
# Add frontend configuration
```

**Step 4: Setup Domain**

1. Point domain to droplet IP in DNS settings
2. Wait for DNS propagation (5-30 min)

**Pros:**
- ✅ Affordable ($5/month)
- ✅ Simple setup
- ✅ Good documentation
- ✅ Reliable

**Cons:**
- ❌ Manual scaling
- ❌ Limited resources
- ❌ Requires server management

---

## 🚀 Vercel + Backend Deployment

### Best for Frontend (5 minutes)

**Step 1: Deploy Frontend to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
# - Project name: skorly
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

**Step 2: Configure Environment**

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

**Step 3: Deploy Backend Separately**

Use any of the above methods (Heroku, Railway, Render, AWS, DigitalOcean)

**Pros:**
- ✅ Easiest frontend deployment
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Great performance

**Cons:**
- ❌ Frontend only
- ❌ Need separate backend hosting

---

## 📊 Deployment Comparison

| Platform | Cost | Setup Time | Best For | Trial |
|----------|------|-----------|----------|-------|
| **Local** | Free | 5 min | Development | ✅ |
| **Docker** | Free | 10 min | Testing | ✅ |
| **Heroku** | Free/Paid | 30 min | Quick trial | ✅ |
| **Railway** | Free/Paid | 20 min | Modern apps | ✅ |
| **Render** | Free/Paid | 15 min | Simple apps | ✅ |
| **Vercel** | Free/Paid | 5 min | Frontend only | ✅ |
| **AWS** | Paid | 2 hours | Production | ❌ |
| **DigitalOcean** | $5/mo | 45 min | Production | ✅ |

---

## 🎯 Recommended Deployment Paths

### For Trial/Testing
**Recommended: Local + Docker**
```
Local Development → Docker Testing → Heroku/Railway Trial
```

### For Small Project
**Recommended: Vercel + Railway**
```
Frontend: Vercel (free)
Backend: Railway (free tier)
Database: MongoDB Atlas (free)
```

### For Production
**Recommended: AWS or DigitalOcean**
```
Frontend: S3 + CloudFront (AWS) or Nginx (DigitalOcean)
Backend: EC2 (AWS) or Droplet (DigitalOcean)
Database: RDS (AWS) or MongoDB Atlas (both)
```

---

## 🔧 Environment Variables for Deployment

### Frontend (.env or .env.production)
```env
VITE_API_URL=https://your-backend-url.com
```

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skorly
CORS_ORIGIN=https://your-frontend-url.com
LOG_LEVEL=info
JWT_SECRET=your-secret-key-change-this
```

---

## 📝 Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Frontend build successful (`npm run build`)
- [ ] Backend starts without errors
- [ ] API endpoints responding
- [ ] CORS configured correctly
- [ ] SSL certificate ready (for production)
- [ ] Domain configured
- [ ] Monitoring setup
- [ ] Backup strategy planned

---

## 🚨 Troubleshooting Deployment

### Issue: "Failed to fetch" after deployment
**Solution**: Check CORS_ORIGIN in backend .env

### Issue: Database connection error
**Solution**: Verify MONGODB_URI is correct and accessible

### Issue: Frontend shows blank page
**Solution**: Check VITE_API_URL in frontend .env

### Issue: Backend crashes on startup
**Solution**: Check logs with `pm2 logs` or `docker logs`

### Issue: Port already in use
**Solution**: Change PORT in .env or kill existing process

---

## 📚 Additional Resources

- **Heroku Docs**: https://devcenter.heroku.com/
- **Railway Docs**: https://docs.railway.app/
- **Render Docs**: https://render.com/docs
- **AWS Docs**: https://docs.aws.amazon.com/
- **DigitalOcean Docs**: https://docs.digitalocean.com/
- **Vercel Docs**: https://vercel.com/docs

---

## 🎉 Quick Start Deployment

### Fastest Trial (5 minutes)
```bash
# Local deployment
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly
npm install && cd backend && npm install && cd ..
docker-compose -f backend/docker-compose.yml up -d mongodb
# Terminal 2: cd backend && node src/server-working.js
# Terminal 3: npm run dev
# Open http://localhost:8080
```

### Fastest Cloud Trial (15 minutes)
```bash
# Render deployment
# 1. Push to GitHub
# 2. Go to render.com
# 3. Connect GitHub
# 4. Deploy backend and frontend
# 5. Done!
```

---

**Version**: 1.0.0  
**Last Updated**: March 12, 2026  
**Status**: ✅ Ready for Deployment
