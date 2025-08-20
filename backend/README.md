# UAE Visa Services - Backend API

A robust Node.js Express API server for handling visa applications, contact forms, feedback, and newsletter subscriptions.

## Features

- **RESTful API** - Clean and consistent API design
- **MongoDB Integration** - Document-based data storage
- **File Upload Support** - Handle document uploads with validation
- **Email Service** - Automated email notifications
- **Input Validation** - Comprehensive server-side validation
- **Security Middleware** - Helmet, CORS, rate limiting
- **Error Handling** - Centralized error management
- **Health Monitoring** - API health check endpoints

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## Environment Variables

### Required Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/uae-visa-services

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=UAE Visa Services <noreply@uaevisaservices.com>
```

### Optional Variables
```env
# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Application
APP_NAME=UAE Visa Services
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8000

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Health Check
```http
GET /api/health
```
Returns API health status and system information.

### Visa Applications

#### Submit Application
```http
POST /api/visa/apply
Content-Type: multipart/form-data
```

**Request Body:**
- Personal information (firstName, lastName, email, etc.)
- Passport details
- Visa type and purpose
- Document uploads (passport copy, photo, etc.)

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": "UAE-2024-001234",
    "status": "pending"
  }
}
```

#### Check Status
```http
GET /api/visa/status/:applicationId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "UAE-2024-001234",
    "status": "processing",
    "submittedAt": "2024-01-15T10:30:00Z",
    "lastUpdated": "2024-01-16T14:20:00Z",
    "estimatedCompletion": "2024-01-20T00:00:00Z"
  }
}
```

#### Get All Applications (Admin)
```http
GET /api/visa/applications?page=1&limit=10&status=pending
```

#### Update Application Status (Admin)
```http
PUT /api/visa/:id/status
Content-Type: application/json

{
  "status": "approved",
  "notes": "Application approved"
}
```

### Contact Forms

#### Submit Contact Form
```http
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry about visa process",
  "message": "I have a question about..."
}
```

### Feedback

#### Submit Feedback
```http
POST /api/feedback
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "serviceUsed": "tourist-visa",
  "overallRating": 5,
  "feedbackType": "compliment",
  "subject": "Excellent service",
  "message": "Very satisfied with the service"
}
```

#### Get All Feedback (Admin)
```http
GET /api/feedback?page=1&limit=10&rating=5
```

### Newsletter

#### Subscribe
```http
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "preferences": ["visa-updates", "travel-tips"]
}
```

#### Unsubscribe
```http
POST /api/newsletter/unsubscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "unsubscribe-token"
}
```

## Data Models

### Visa Application
```javascript
{
  applicationId: String, // Auto-generated
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    dateOfBirth: Date,
    nationality: String,
    gender: String
  },
  passportInfo: {
    passportNumber: String,
    issueDate: Date,
    expiryDate: Date,
    issuingCountry: String
  },
  visaInfo: {
    type: String, // tourist, business, family, etc.
    purpose: String,
    duration: String,
    entryType: String
  },
  documents: [{
    type: String,
    filename: String,
    path: String,
    size: Number
  }],
  status: String, // pending, processing, approved, rejected
  submittedAt: Date,
  lastUpdated: Date
}
```

### Contact Form
```javascript
{
  name: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  submittedAt: Date,
  responded: Boolean
}
```

### Feedback
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  serviceUsed: String,
  applicationId: String, // Optional
  overallRating: Number, // 1-5
  speedRating: Number,
  supportRating: Number,
  feedbackType: String,
  subject: String,
  message: String,
  positiveAspects: [String],
  wouldRecommend: String,
  submittedAt: Date
}
```

## File Upload

### Supported File Types
- **Images**: JPG, JPEG, PNG, GIF
- **Documents**: PDF, DOC, DOCX

### File Size Limits
- Maximum file size: 10MB per file
- Maximum total upload: 50MB per request

### Upload Directory Structure
```
uploads/
├── visa-applications/
│   ├── 2024/
│   │   ├── 01/
│   │   └── 02/
│   └── ...
└── temp/
```

## Email Templates

The system uses Handlebars templates for emails:

- `visa-confirmation.hbs` - Visa application confirmation
- `contact-confirmation.hbs` - Contact form confirmation
- `feedback-confirmation.hbs` - Feedback submission confirmation
- `newsletter-welcome.hbs` - Newsletter subscription welcome

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request throttling
- **Input Validation** - Server-side validation
- **File Upload Security** - Type and size validation
- **Environment Variables** - Sensitive data protection

## Development

### Available Scripts
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests
npm run test:watch # Run tests in watch mode
npm run lint     # Check code style
npm run lint:fix # Fix code style issues
```

### Database Setup

1. **Install MongoDB** locally or use MongoDB Atlas
2. **Create Database** named `uae-visa-services`
3. **Update Connection String** in `.env` file

### Testing

Run the test suite:
```bash
npm test
```

For continuous testing during development:
```bash
npm run test:watch
```

## Deployment

### Render Deployment

1. **Connect Repository** to Render
2. **Set Environment Variables** in Render dashboard
3. **Configure Build Settings**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`

### Environment Variables for Production
Ensure all required environment variables are set in your production environment.

## Monitoring

### Health Check
The `/api/health` endpoint provides:
- API status
- Database connection status
- System uptime
- Memory usage

### Logging
Logs are written to console and can be configured with different levels:
- `error` - Error messages only
- `warn` - Warnings and errors
- `info` - General information (default)
- `debug` - Detailed debugging information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.