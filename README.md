# UAE Visa Services

A comprehensive visa application platform for UAE visa services, featuring a modern frontend and robust backend API.

## Project Structure

```
final/
├── backend/          # Node.js Express API server
├── frontend/         # Static HTML/CSS/JS frontend
└── README.md         # This file
```

## Features

- **Visa Application System**: Complete online visa application process
- **Status Tracking**: Real-time application status checking
- **Contact & Feedback**: Customer support and feedback collection
- **Newsletter Subscription**: Email newsletter management
- **Responsive Design**: Mobile-first responsive web design
- **Form Validation**: Client and server-side validation
- **Email Notifications**: Automated email confirmations
- **Admin Dashboard**: Application management and statistics

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with your database and email settings

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Serve the files using a local server (e.g., Live Server extension in VS Code)
   Or use Python's built-in server:
   ```bash
   python -m http.server 8000
   ```

The frontend will be available at `http://localhost:8000`

## API Endpoints

### Visa Applications
- `POST /api/visa/apply` - Submit visa application
- `GET /api/visa/status/:id` - Check application status
- `GET /api/visa/applications` - Get all applications (admin)
- `PUT /api/visa/:id/status` - Update application status (admin)

### Contact & Feedback
- `POST /api/contact` - Submit contact form
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get all feedback (admin)

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe` - Unsubscribe from newsletter
- `GET /api/newsletter/subscriptions` - Get all subscriptions (admin)

### Health Check
- `GET /api/health` - API health status

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (with Mongoose ODM)
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **Handlebars** - Email templating
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid and Flexbox
- **Vanilla JavaScript** - No framework dependencies
- **Font Awesome** - Icons
- **Google Fonts** - Typography
- **Responsive Design** - Mobile-first approach

## Environment Variables

See `.env.example` in the backend directory for required environment variables.

Key variables include:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `EMAIL_HOST` - SMTP server host
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password

## Deployment

### Backend Deployment (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy from the `backend` directory

### Frontend Deployment (Netlify)
1. Connect your GitHub repository to Netlify
2. Set build directory to `frontend`
3. Deploy with automatic builds on push

## Development

### Backend Development
```bash
cd backend
npm run dev     # Start with nodemon
npm test        # Run tests
npm run lint    # Check code style
```

### Frontend Development
- Use Live Server or similar for hot reload
- Modify files in `frontend/` directory
- Test responsive design across devices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email info@uaevisaservices.com or create an issue in this repository.