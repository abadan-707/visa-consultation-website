# Complete Deployment Guide

## 🚀 Step-by-Step Deployment to GitHub, Render & Netlify

### Prerequisites
- **Git installed on your computer** (see installation guide below)
- GitHub account
- Render account (free tier available)
- Netlify account (free tier available)

### 🔧 Install Git (Required)

#### Option 1: Download Git for Windows
1. Go to [git-scm.com](https://git-scm.com/download/win)
2. Download the latest version
3. Run the installer with default settings
4. Restart your terminal/PowerShell
5. Test: `git --version`

#### Option 2: Install via Chocolatey (if you have it)
```powershell
choco install git
```

#### Option 3: Install via Winget
```powershell
winget install --id Git.Git -e --source winget
```

**⚠️ IMPORTANT: Restart your terminal after installing Git!**

---

## 📁 Step 1: Prepare Your Project Structure

Your project should have this structure:
```
final/
├── backend/          # Node.js backend
├── frontend/         # Static frontend
├── .gitignore
├── README.md
└── DEPLOYMENT_GUIDE.md
```

---

## 🔧 Step 2: Initialize Git Repository

### 2.1 Open Terminal in Project Root
```bash
cd C:\Users\hazard\Desktop\final
```

### 2.2 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Complete visa consultation website"
```

---

## 🐙 Step 3: Create GitHub Repository

### 3.1 Create Repository on GitHub
1. Go to [GitHub.com](https://github.com)
2. Click **"New repository"** (green button)
3. Repository name: `visa-consultation-website`
4. Description: `Professional visa consultation website with Node.js backend and responsive frontend`
5. Set to **Public** (or Private if preferred)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

### 3.2 Connect Local Repository to GitHub
```bash
# Replace 'yourusername' with your actual GitHub username
git remote add origin https://github.com/yourusername/visa-consultation-website.git
git branch -M main
git push -u origin main
```

---

## 🖥️ Step 4: Deploy Backend to Render

### 4.1 Prepare Backend for Deployment

#### Update package.json (if needed)
Ensure your `backend/package.json` has:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### Create Render Configuration
Create `backend/render.yaml`:
```yaml
services:
  - type: web
    name: visa-consultation-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        fromService:
          type: web
          name: visa-consultation-backend
          property: port
```

### 4.2 Deploy to Render

1. **Go to [Render.com](https://render.com)**
2. **Sign up/Login** with GitHub
3. **Click "New +"** → **"Web Service"**
4. **Connect GitHub repository**:
   - Select your `visa-consultation-website` repository
   - Click **"Connect"**

5. **Configure Service**:
   - **Name**: `visa-consultation-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

6. **Environment Variables**:
   - Click **"Advanced"**
   - Add environment variable:
     - **Key**: `NODE_ENV`
     - **Value**: `production`

7. **Click "Create Web Service"**

### 4.3 Wait for Deployment
- Deployment takes 2-5 minutes
- You'll get a URL like: `https://visa-consultation-backend.onrender.com`
- **SAVE THIS URL** - you'll need it for frontend configuration

---

## 🌐 Step 5: Deploy Frontend to Netlify

### 5.1 Update Frontend Configuration

#### Update API Base URL
Edit `frontend/js/forms.js` and replace localhost URLs:

**Find this line:**
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

**Replace with your Render URL:**
```javascript
const API_BASE_URL = 'https://visa-consultation-backend.onrender.com/api';
```

#### Commit Changes
```bash
git add .
git commit -m "Update API base URL for production"
git push origin main
```

### 5.2 Deploy to Netlify

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up/Login** with GitHub
3. **Click "Add new site"** → **"Import an existing project"**
4. **Choose GitHub** and authorize Netlify
5. **Select your repository**: `visa-consultation-website`

6. **Configure Build Settings**:
   - **Base directory**: `frontend`
   - **Build command**: (leave empty)
   - **Publish directory**: `frontend`

7. **Click "Deploy site"**

### 5.3 Configure Custom Domain (Optional)
1. In Netlify dashboard, go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow DNS configuration instructions

---

## ✅ Step 6: Test Your Deployment

### 6.1 Test Backend API
Open your Render URL in browser:
```
https://visa-consultation-backend.onrender.com/api/health
```
You should see: `{"status":"OK","message":"Server is running"}`

### 6.2 Test Frontend
Open your Netlify URL and test:
1. **Visa Application Form**
2. **Contact Form**
3. **Feedback Form**
4. **Newsletter Subscription**

### 6.3 Test Form Submissions
- Fill out each form completely
- Check browser console for errors
- Verify success messages appear

---

## 🔧 Step 7: Environment Variables & Security

### 7.1 Render Environment Variables
In Render dashboard:
1. Go to your service
2. Click **"Environment"**
3. Add these variables:
   ```
   NODE_ENV=production
   DATABASE_URL=sqlite:./database.sqlite
   CORS_ORIGIN=https://your-netlify-site.netlify.app
   ```

### 7.2 Update CORS Settings
In `backend/server.js`, update CORS configuration:
```javascript
const corsOptions = {
  origin: [
    'https://your-netlify-site.netlify.app',
    'http://localhost:3000' // Keep for local development
  ],
  credentials: true
};
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot GET /" on Render
**Solution**: Ensure `start` script in package.json points to correct file

### Issue 2: CORS Errors
**Solution**: Update CORS origin in backend to match Netlify URL

### Issue 3: Forms Not Submitting
**Solution**: Check API_BASE_URL in frontend matches Render URL exactly

### Issue 4: Database Errors
**Solution**: Render automatically creates SQLite file, no action needed

### Issue 5: Build Failures
**Solution**: Check Node.js version compatibility in package.json

---

## 📱 Step 8: Final Verification Checklist

- [ ] GitHub repository created and code pushed
- [ ] Backend deployed to Render successfully
- [ ] Frontend deployed to Netlify successfully
- [ ] All forms working in production
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active (automatic on both platforms)

---

## 🎉 Congratulations!

Your visa consultation website is now live:
- **Frontend**: `https://your-site.netlify.app`
- **Backend**: `https://your-backend.onrender.com`

### Next Steps:
1. Monitor application performance
2. Set up analytics (Google Analytics)
3. Configure email notifications
4. Add monitoring and logging
5. Set up automated backups

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review deployment logs in Render/Netlify dashboards
3. Verify all URLs and environment variables
4. Test locally first to isolate issues

**Remember**: Free tier services may have cold starts (initial load delay). Consider upgrading for production use.