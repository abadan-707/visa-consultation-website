# UAE Visa Services - Frontend

A modern, responsive frontend for the UAE Visa Services platform built with HTML5, CSS3, and vanilla JavaScript.

## Features

- **Responsive Design** - Mobile-first approach with modern CSS Grid and Flexbox
- **Progressive Enhancement** - Works without JavaScript, enhanced with it
- **Accessibility** - WCAG 2.1 compliant with proper ARIA labels
- **Performance Optimized** - Lazy loading, critical CSS, optimized assets
- **Modern UI/UX** - Clean design with smooth animations and transitions
- **Form Validation** - Real-time client-side validation with server integration
- **Cross-Browser Compatible** - Supports all modern browsers

## Project Structure

```
frontend/
├── assets/              # Static assets
├── css/
│   ├── main.css        # Main stylesheet
│   └── responsive.css  # Responsive design rules
├── images/             # Image assets
├── js/
│   ├── main.js        # Core functionality
│   ├── forms.js       # Form handling and validation
│   └── animations.js  # Animation controllers
├── pages/
│   ├── contact.html        # Contact page
│   ├── feedback.html       # Feedback form
│   ├── status-check.html   # Application status checker
│   └── visa-application.html # Visa application form
├── index.html          # Homepage
└── README.md          # This file
```

## Quick Start

### Option 1: Live Server (Recommended)
1. Install the Live Server extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 2: Python HTTP Server
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Option 3: Node.js HTTP Server
```bash
npx http-server -p 8000
```

The application will be available at `http://localhost:8000`

## Pages Overview

### Homepage (`index.html`)
- Hero section with call-to-action
- Services overview
- Application process steps
- About section
- Contact information
- Newsletter subscription

### Visa Application (`pages/visa-application.html`)
- Multi-step application form
- Progress indicator
- File upload with drag-and-drop
- Real-time validation
- Conditional fields based on visa type

### Status Check (`pages/status-check.html`)
- Application status lookup
- Dynamic status timeline
- Document download for approved applications
- Progress tracking

### Contact (`pages/contact.html`)
- Contact form
- Office locations
- Contact information
- FAQ section with accordion

### Feedback (`pages/feedback.html`)
- Comprehensive feedback form
- Star rating system
- Service evaluation
- Customer testimonials

## CSS Architecture

### Main Stylesheet (`css/main.css`)
- CSS Custom Properties (variables)
- Modern CSS features (Grid, Flexbox)
- Component-based organization
- Utility classes
- Animation definitions

### Responsive Design (`css/responsive.css`)
- Mobile-first breakpoints
- Tablet and desktop optimizations
- Print styles
- High DPI display support
- Dark mode support
- Reduced motion preferences

### Breakpoints
```css
/* Mobile First */
@media (min-width: 480px)  { /* Mobile Large */ }
@media (min-width: 768px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1200px) { /* Large Desktop */ }
@media (min-width: 1440px) { /* Extra Large */ }
```

## JavaScript Modules

### Core Module (`js/main.js`)
- DOM utilities
- API communication
- Navigation handling
- Form validation helpers
- Scroll animations
- Image lazy loading

### Form Handler (`js/forms.js`)
- Form submission logic
- File upload handling
- Real-time validation
- Error/success messaging
- Dependent field management

### Animation Controller (`js/animations.js`)
- Scroll-triggered animations
- Parallax effects
- Loading animations
- Page transitions
- Text animations
- Reduced motion support

## Form Validation

### Client-Side Validation
- Real-time field validation
- Custom validation rules
- Visual feedback
- Accessibility support
- Error message display

### Validation Rules
- **Email**: RFC 5322 compliant
- **Phone**: International format support
- **Passport**: Country-specific formats
- **Dates**: Age verification, expiry checks
- **Files**: Type, size, and format validation

## API Integration

### Base Configuration
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Endpoints Used
- `POST /visa/apply` - Submit visa application
- `GET /visa/status/:id` - Check application status
- `POST /contact` - Submit contact form
- `POST /feedback` - Submit feedback
- `POST /newsletter/subscribe` - Newsletter subscription

### Error Handling
- Network error detection
- Server error display
- Validation error mapping
- User-friendly error messages

## Accessibility Features

### WCAG 2.1 Compliance
- Semantic HTML structure
- Proper heading hierarchy
- Alt text for images
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader compatibility

### Keyboard Navigation
- Tab order optimization
- Skip links
- Focus indicators
- Escape key handling
- Enter key submission

## Performance Optimizations

### Loading Performance
- Critical CSS inlining
- Resource preloading
- Image lazy loading
- Font display optimization
- Minified assets

### Runtime Performance
- Debounced scroll events
- Throttled resize handlers
- Efficient DOM queries
- Memory leak prevention
- Animation optimization

### Metrics
- Lighthouse score: 95+
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1

## Browser Support

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Graceful Degradation
- Internet Explorer 11 (basic functionality)
- Older mobile browsers
- JavaScript disabled scenarios

## Development Guidelines

### Code Style
- Consistent indentation (2 spaces)
- Semantic HTML elements
- BEM CSS methodology
- ESLint configuration
- Prettier formatting

### File Organization
- Logical component grouping
- Consistent naming conventions
- Modular JavaScript structure
- Optimized asset loading

### Testing
- Cross-browser testing
- Mobile device testing
- Accessibility testing
- Performance testing
- Form validation testing

## Customization

### CSS Variables
```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #1e40af;
  --accent-color: #f59e0b;
  --text-color: #1f2937;
  --background-color: #ffffff;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Theme Customization
1. Update CSS variables in `main.css`
2. Modify color scheme
3. Adjust typography settings
4. Update spacing and sizing

## Deployment

### Netlify Deployment
1. **Connect Repository** to Netlify
2. **Set Build Settings**:
   - Build command: (none)
   - Publish directory: `frontend`
3. **Configure Redirects** (optional):
   ```
   /*    /index.html   200
   ```

### Manual Deployment
1. **Build Assets** (if using build tools)
2. **Upload Files** to web server
3. **Configure Server** for SPA routing (if needed)
4. **Set Cache Headers** for static assets

### CDN Configuration
- Enable gzip compression
- Set appropriate cache headers
- Configure HTTPS redirect
- Enable HTTP/2

## SEO Optimization

### Meta Tags
- Title tags (unique per page)
- Meta descriptions
- Open Graph tags
- Twitter Card tags
- Canonical URLs

### Structured Data
- JSON-LD schema markup
- Organization information
- Service listings
- Contact information

### Performance
- Fast loading times
- Mobile-friendly design
- Core Web Vitals optimization
- Image optimization

## Security Considerations

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com;">
```

### Input Sanitization
- XSS prevention
- CSRF protection
- Input validation
- Safe DOM manipulation

## Troubleshooting

### Common Issues

**Forms not submitting:**
- Check API endpoint configuration
- Verify CORS settings
- Check browser console for errors

**Styles not loading:**
- Verify CSS file paths
- Check for syntax errors
- Clear browser cache

**JavaScript errors:**
- Check browser console
- Verify script loading order
- Check for missing dependencies

### Debug Mode
Add `?debug=true` to URL for additional logging:
```javascript
const DEBUG = new URLSearchParams(window.location.search).get('debug') === 'true';
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Test across browsers
5. Submit a pull request

### Development Setup
1. Clone the repository
2. Set up local server
3. Install development tools
4. Configure linting
5. Start development

## License

MIT License - see LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the repository
- Email: dev@uaevisaservices.com
- Documentation: [Project Wiki](link-to-wiki)