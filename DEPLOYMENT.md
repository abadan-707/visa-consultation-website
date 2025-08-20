# Deployment Guide

This guide provides step-by-step instructions for deploying the UAE Visa Services application to production environments.

## Overview

- **Backend**: Deploy to Render.com (Node.js hosting)
- **Frontend**: Deploy to Netlify (Static site hosting)
- **Database**: MongoDB Atlas (Cloud database)
- **Email**: Gmail SMTP or SendGrid

## Prerequisites

- GitHub account
- Render.com account
- Netlify account
- MongoDB Atlas account (free tier available)
- Domain name (optional)

---

## Backend Deployment (Render)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Ensure your `package.json` has the correct scripts**:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js"
     }
   }
   ```

### Step 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**:
   - Choose "Build a Database"
   - Select "Shared" (free tier)
   - Choose your preferred cloud provider and region
   - Name your cluster (e.g., "uae-visa-cluster")

3. **Configure Database Access**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create a username and password
   - Set privileges to "Read and write to any database"

4. **Configure Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (0.0.0.0/0)
   - Or add specific IP addresses for better security

5. **Get Connection String**:
   - Go to "Databases"
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### Step 3: Deploy to Render

1. **Create Render Account**:
   - Go to [Render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your backend code

3. **Configure Service Settings**:
   ```
   Name: uae-visa-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**:
   Click "Advanced" and add these environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uae-visa-services
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=UAE Visa Services <noreply@uaevisaservices.com>
   
   # File Upload
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   
   # Security
   BCRYPT_ROUNDS=12
   RATE_LIMIT_WINDOW=900000
   RATE_LIMIT_MAX=100
   
   # Application
   APP_NAME=UAE Visa Services
   APP_URL=https://your-backend-url.onrender.com
   FRONTEND_URL=https://your-frontend-url.netlify.app
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Wait for the build and deployment to complete
   - Note your service URL (e.g., `https://uae-visa-backend.onrender.com`)

### Step 4: Configure Email Service

#### Option A: Gmail SMTP
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS` environment variable

#### Option B: SendGrid (Recommended for production)
1. **Create SendGrid Account**: [SendGrid.com](https://sendgrid.com)
2. **Create API Key**:
   - Go to Settings → API Keys
   - Create new API key with "Full Access"
3. **Update Environment Variables**:
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=your-sendgrid-api-key
   ```

### Step 5: Test Backend Deployment

1. **Health Check**:
   ```bash
   curl https://your-backend-url.onrender.com/api/health
   ```

2. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "API is running",
     "timestamp": "2024-01-15T10:30:00.000Z"
   }
   ```

---

## Frontend Deployment (Netlify)

### Step 1: Prepare Frontend

1. **Update API Base URL**:
   In `frontend/js/main.js`, update the API configuration:
   ```javascript
   const CONFIG = {
     API_BASE_URL: 'https://your-backend-url.onrender.com/api',
     // ... other config
   };
   ```

2. **Test Locally**:
   - Serve the frontend locally
   - Test all forms and functionality
   - Ensure API calls work with production backend

### Step 2: Deploy to Netlify

1. **Create Netlify Account**:
   - Go to [Netlify.com](https://netlify.com)
   - Sign up with your GitHub account

2. **Deploy from Git**:
   - Click "New site from Git"
   - Choose GitHub
   - Select your repository

3. **Configure Build Settings**:
   ```
   Branch to deploy: main
   Base directory: frontend
   Build command: (leave empty)
   Publish directory: . (current directory)
   ```

4. **Deploy**:
   - Click "Deploy site"
   - Wait for deployment to complete
   - Note your site URL (e.g., `https://amazing-site-name.netlify.app`)

### Step 3: Configure Custom Domain (Optional)

1. **Add Custom Domain**:
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter your domain name

2. **Configure DNS**:
   - Add CNAME record pointing to your Netlify subdomain
   - Or use Netlify DNS for easier management

3. **Enable HTTPS**:
   - Netlify automatically provides SSL certificates
   - Force HTTPS redirect in site settings

### Step 4: Configure Redirects and Headers

1. **Create `_redirects` file** in frontend root:
   ```
   # SPA fallback
   /*    /index.html   200
   
   # API proxy (optional)
   /api/*  https://your-backend-url.onrender.com/api/:splat  200
   ```

2. **Create `_headers` file** for security:
   ```
   /*
     X-Frame-Options: DENY
     X-XSS-Protection: 1; mode=block
     X-Content-Type-Options: nosniff
     Referrer-Policy: strict-origin-when-cross-origin
   ```

### Step 5: Test Frontend Deployment

1. **Functionality Test**:
   - Visit your Netlify URL
   - Test all pages and forms
   - Verify API integration
   - Check responsive design

2. **Performance Test**:
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Test loading speed

---

## Post-Deployment Configuration

### Update CORS Settings

Update your backend CORS configuration to include your frontend URL:

```javascript
// In your backend server.js or cors configuration
const corsOptions = {
  origin: [
    'http://localhost:8000',
    'https://your-frontend-url.netlify.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
};
```

### Environment-Specific Configuration

1. **Backend Environment Variables**:
   ```bash
   # Update FRONTEND_URL in Render
   FRONTEND_URL=https://your-frontend-url.netlify.app
   ```

2. **Frontend API Configuration**:
   ```javascript
   // Consider using environment detection
   const API_BASE_URL = window.location.hostname === 'localhost' 
     ? 'http://localhost:3000/api'
     : 'https://your-backend-url.onrender.com/api';
   ```

---

## Monitoring and Maintenance

### Backend Monitoring (Render)

1. **View Logs**:
   - Go to your service dashboard
   - Click "Logs" tab
   - Monitor for errors and performance issues

2. **Set Up Alerts**:
   - Configure email notifications for deployments
   - Monitor service health

3. **Auto-Deploy**:
   - Render automatically deploys on git push
   - Monitor deployment status

### Frontend Monitoring (Netlify)

1. **Deploy Notifications**:
   - Configure Slack/email notifications
   - Monitor build status

2. **Analytics**:
   - Enable Netlify Analytics (paid feature)
   - Or integrate Google Analytics

3. **Form Handling**:
   - Monitor form submissions
   - Check for spam or errors

### Database Monitoring (MongoDB Atlas)

1. **Performance Monitoring**:
   - Monitor connection counts
   - Check query performance
   - Set up alerts for high usage

2. **Backup Configuration**:
   - Enable automatic backups
   - Test restore procedures

---

## Troubleshooting

### Common Backend Issues

**Service won't start:**
```bash
# Check logs in Render dashboard
# Verify environment variables
# Check package.json start script
```

**Database connection failed:**
```bash
# Verify MongoDB Atlas connection string
# Check network access settings
# Verify database user credentials
```

**CORS errors:**
```bash
# Update CORS origin in backend
# Check frontend URL configuration
# Verify API endpoints
```

### Common Frontend Issues

**Build failed:**
```bash
# Check build logs in Netlify
# Verify file paths and structure
# Check for syntax errors
```

**API calls failing:**
```bash
# Verify API base URL
# Check CORS configuration
# Test API endpoints directly
```

**Forms not working:**
```bash
# Check JavaScript console for errors
# Verify form action URLs
# Test API endpoints
```

### Performance Issues

**Slow API responses:**
- Check database query performance
- Monitor Render service metrics
- Consider upgrading service plan

**Slow frontend loading:**
- Optimize images and assets
- Enable compression
- Use CDN for static assets

---

## Security Checklist

### Backend Security
- [ ] Environment variables properly set
- [ ] Database access restricted
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] File upload restrictions in place
- [ ] CORS properly configured

### Frontend Security
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] XSS protection implemented
- [ ] Content Security Policy set
- [ ] Input sanitization in place

### Database Security
- [ ] Network access restricted
- [ ] Strong database credentials
- [ ] Regular backups enabled
- [ ] Monitoring alerts configured

---

## Scaling Considerations

### Backend Scaling
- **Render**: Upgrade to higher-tier plans for more resources
- **Database**: Consider MongoDB Atlas dedicated clusters
- **CDN**: Use Cloudflare or AWS CloudFront
- **Caching**: Implement Redis for session storage

### Frontend Scaling
- **CDN**: Netlify includes global CDN
- **Image Optimization**: Use Netlify Image Optimization
- **Performance**: Monitor Core Web Vitals
- **Caching**: Configure appropriate cache headers

---

## Cost Optimization

### Free Tier Limits

**Render (Free Plan)**:
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- 512MB RAM, 0.1 CPU

**Netlify (Free Plan)**:
- 100GB bandwidth/month
- 300 build minutes/month
- 1 concurrent build

**MongoDB Atlas (Free Plan)**:
- 512MB storage
- Shared clusters
- No backup

### Upgrade Recommendations

**For Production**:
- Render: Starter plan ($7/month) for always-on service
- MongoDB Atlas: Dedicated cluster for better performance
- Consider paid email service (SendGrid, Mailgun)

---

## Support and Resources

### Documentation
- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

### Community Support
- Render Community Forum
- Netlify Community Forum
- MongoDB Community Forum
- Stack Overflow

### Professional Support
- Consider paid support plans for production applications
- Hire DevOps consultant for complex deployments
- Set up monitoring and alerting services

This deployment guide should get your UAE Visa Services application running in production. Remember to test thoroughly and monitor your application after deployment.