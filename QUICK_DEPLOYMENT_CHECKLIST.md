# ⚡ Skorly - Quick Deployment Checklist

**Choose your deployment method and follow the steps**

---

## 🎯 Choose Your Deployment Method

### Option 1: Local (5 min) - Best for Testing
### Option 2: Docker (10 min) - Best for Local Testing
### Option 3: Heroku (30 min) - Best for Quick Trial
### Option 4: Railway (20 min) - Best for Modern Apps
### Option 5: Render (15 min) - Best for Simple Deployment
### Option 6: DigitalOcean (45 min) - Best for Production

---

## 🏠 Option 1: Local Deployment (5 minutes)

```bash
# ✅ Step 1: Clone
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly

# ✅ Step 2: Install
npm install
cd backend && npm install && cd ..

# ✅ Step 3: Configure
echo "VITE_API_URL=http://localhost:5000" > .env
cd backend && cp .env.example .env && cd ..

# ✅ Step 4: Start MongoDB
docker-compose -f backend/docker-compose.yml up -d mongodb

# ✅ Step 5: Start Backend (Terminal 2)
cd backend
node src/server-working.js

# ✅ Step 6: Start Frontend (Terminal 3)
npm run dev

# ✅ Step 7: Open Browser
# Frontend: http://localhost:8080
# Backend: http://localhost:5000
```

**Checklist:**
- [ ] Node.js 18+ installed
- [ ] MongoDB running
- [ ] Backend started
- [ ] Frontend started
- [ ] Can access http://localhost:8080
- [ ] No errors in console

---

## 🐳 Option 2: Docker Deployment (10 minutes)

```bash
# ✅ Step 1: Clone
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly

# ✅ Step 2: Build
docker-compose -f backend/docker-compose.yml build

# ✅ Step 3: Start
docker-compose -f backend/docker-compose.yml up -d

# ✅ Step 4: Check Status
docker-compose -f backend/docker-compose.yml ps

# ✅ Step 5: View Logs
docker-compose -f backend/docker-compose.yml logs -f

# ✅ Step 6: Open Browser
# Frontend: http://localhost:8080
# Backend: http://localhost:5000

# ✅ Step 7: Stop (when done)
docker-compose -f backend/docker-compose.yml down
```

**Checklist:**
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] All services running
- [ ] Can access http://localhost:8080
- [ ] No errors in logs

---

## 🎈 Option 3: Heroku Deployment (30 minutes)

### Backend

```bash
# ✅ Step 1: Login
heroku login

# ✅ Step 2: Create App
heroku create skorly-backend

# ✅ Step 3: Add MongoDB
heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skorly

# ✅ Step 4: Add Environment
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://skorly-frontend.herokuapp.com

# ✅ Step 5: Create Procfile
cd backend
echo "web: node src/server-working.js" > Procfile

# ✅ Step 6: Deploy
git push heroku main

# ✅ Step 7: Check Logs
heroku logs --tail

# ✅ Step 8: Get URL
heroku apps:info
# Backend URL: https://skorly-backend.herokuapp.com
```

### Frontend

```bash
# ✅ Step 1: Create App
heroku create skorly-frontend

# ✅ Step 2: Add Environment
heroku config:set VITE_API_URL=https://skorly-backend.herokuapp.com

# ✅ Step 3: Create Procfile
cd ..
echo "web: npm run preview" > Procfile

# ✅ Step 4: Deploy
git push heroku main

# ✅ Step 5: Open
heroku open -a skorly-frontend
```

**Checklist:**
- [ ] Heroku account created
- [ ] Heroku CLI installed
- [ ] MongoDB Atlas account created
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] Can access frontend URL
- [ ] Backend responding

---

## 🚂 Option 4: Railway Deployment (20 minutes)

```bash
# ✅ Step 1: Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# ✅ Step 2: Go to Railway
# https://railway.app

# ✅ Step 3: Create Project
# Click "New Project"
# Select "Deploy from GitHub"
# Connect GitHub account
# Select Skorly repository

# ✅ Step 4: Configure Backend
# In Railway Dashboard:
# - Go to Variables
# - Add MONGODB_URI=mongodb+srv://...
# - Add NODE_ENV=production
# - Add CORS_ORIGIN=https://your-railway-domain.railway.app

# ✅ Step 5: Deploy Frontend
# Create vercel.json in root:
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
EOF

# ✅ Step 6: Deploy to Vercel
npm install -g vercel
vercel

# ✅ Step 7: Configure Frontend
# In Vercel Dashboard:
# - Add VITE_API_URL=https://your-railway-backend-url

# ✅ Step 8: Access
# Frontend: https://your-vercel-domain.vercel.app
# Backend: https://your-railway-domain.railway.app
```

**Checklist:**
- [ ] GitHub account connected
- [ ] Railway account created
- [ ] Vercel account created
- [ ] MongoDB Atlas account created
- [ ] Backend deployed on Railway
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured
- [ ] Can access both URLs

---

## 🎨 Option 5: Render Deployment (15 minutes)

### Backend

```bash
# ✅ Step 1: Go to Render
# https://render.com

# ✅ Step 2: Create Web Service
# Click "New +"
# Select "Web Service"
# Connect GitHub
# Select Skorly repository

# ✅ Step 3: Configure
# Name: skorly-backend
# Environment: Node
# Build Command: cd backend && npm install
# Start Command: node src/server-working.js
# Plan: Free

# ✅ Step 4: Add Environment Variables
# MONGODB_URI=mongodb+srv://...
# NODE_ENV=production
# CORS_ORIGIN=https://your-frontend-url.onrender.com

# ✅ Step 5: Deploy
# Click "Create Web Service"
# Wait for deployment

# ✅ Step 6: Get URL
# Backend URL: https://skorly-backend.onrender.com
```

### Frontend

```bash
# ✅ Step 1: Create Static Site
# Click "New +"
# Select "Static Site"
# Connect GitHub
# Select Skorly repository

# ✅ Step 2: Configure
# Name: skorly-frontend
# Build Command: npm run build
# Publish Directory: dist

# ✅ Step 3: Add Environment Variables
# VITE_API_URL=https://skorly-backend.onrender.com

# ✅ Step 4: Deploy
# Click "Create Static Site"
# Wait for deployment

# ✅ Step 5: Access
# Frontend: https://skorly-frontend.onrender.com
```

**Checklist:**
- [ ] Render account created
- [ ] GitHub connected
- [ ] MongoDB Atlas account created
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] Can access both URLs
- [ ] No errors in logs

---

## 💧 Option 6: DigitalOcean Deployment (45 minutes)

```bash
# ✅ Step 1: Create Droplet
# Go to DigitalOcean
# Create Droplet:
# - Image: Ubuntu 20.04
# - Size: $5/month
# - Add SSH key

# ✅ Step 2: SSH into Droplet
ssh root@your-droplet-ip

# ✅ Step 3: Update System
apt update && apt upgrade -y

# ✅ Step 4: Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# ✅ Step 5: Install MongoDB
apt-get install -y mongodb
systemctl start mongodb
systemctl enable mongodb

# ✅ Step 6: Clone Repository
git clone https://github.com/Syfudeen/Skorly.git
cd Skorly/backend

# ✅ Step 7: Install Dependencies
npm install

# ✅ Step 8: Configure
cp .env.example .env
nano .env  # Edit with production values

# ✅ Step 9: Install PM2
npm install -g pm2

# ✅ Step 10: Start Backend
pm2 start src/server-working.js --name "skorly-api"
pm2 startup
pm2 save

# ✅ Step 11: Install Nginx
apt-get install -y nginx

# ✅ Step 12: Configure Nginx
nano /etc/nginx/sites-available/default
# Add proxy configuration (see DEPLOYMENT_GUIDE.md)

# ✅ Step 13: Setup SSL
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com

# ✅ Step 14: Deploy Frontend
cd ..
npm run build
# Copy dist folder to /var/www/html

# ✅ Step 15: Restart Nginx
systemctl restart nginx

# ✅ Step 16: Access
# Frontend: https://your-domain.com
# Backend: https://your-domain.com/api
```

**Checklist:**
- [ ] DigitalOcean account created
- [ ] Droplet created
- [ ] SSH key configured
- [ ] Node.js installed
- [ ] MongoDB installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Backend running with PM2
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Frontend deployed
- [ ] Domain configured
- [ ] Can access both URLs

---

## 📊 Deployment Comparison

| Method | Time | Cost | Difficulty | Best For |
|--------|------|------|-----------|----------|
| Local | 5 min | Free | Easy | Testing |
| Docker | 10 min | Free | Easy | Local testing |
| Heroku | 30 min | Free/Paid | Easy | Quick trial |
| Railway | 20 min | Free/Paid | Easy | Modern apps |
| Render | 15 min | Free/Paid | Easy | Simple apps |
| DigitalOcean | 45 min | $5/mo | Medium | Production |

---

## 🚀 Recommended Path

### For Trial (Choose One)
1. **Local** (5 min) - Fastest
2. **Docker** (10 min) - Most realistic
3. **Render** (15 min) - Cloud trial

### For Production
1. **DigitalOcean** ($5/mo) - Affordable
2. **AWS** (Paid) - Professional
3. **Vercel + Railway** (Free/Paid) - Modern

---

## ✅ Post-Deployment Checklist

After deployment, verify:

```bash
# ✅ Health Check
curl https://your-backend-url/health

# ✅ Get Students
curl https://your-backend-url/api/students

# ✅ Download Sample
curl https://your-backend-url/api/upload/sample -o sample.xlsx

# ✅ Frontend Loads
# Open https://your-frontend-url in browser

# ✅ Upload Works
# Try uploading sample.xlsx

# ✅ No Errors
# Check browser console (F12)
# Check backend logs
```

---

## 🆘 Troubleshooting

### "Failed to fetch" Error
```bash
# Check CORS_ORIGIN in backend .env
# Should match your frontend URL
CORS_ORIGIN=https://your-frontend-url.com
```

### Database Connection Error
```bash
# Verify MONGODB_URI
# Test connection: mongosh "your-connection-string"
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

### Frontend Shows Blank Page
```bash
# Check VITE_API_URL in frontend .env
# Should match your backend URL
VITE_API_URL=https://your-backend-url.com
```

---

## 📞 Need Help?

- **Local Issues**: See `CLONE_AND_RUN.md`
- **Setup Issues**: See `SETUP_AND_DEPLOYMENT.md`
- **Architecture**: See `backend/ARCHITECTURE.md`
- **Quick Reference**: See `QUICK_REFERENCE_CARD.md`

---

## 🎉 You're Deployed!

Once deployed:
1. Share the URL with users
2. Upload student data
3. Monitor performance
4. Scale as needed

---

**Version**: 1.0.0  
**Last Updated**: March 12, 2026  
**Status**: ✅ Ready to Deploy
