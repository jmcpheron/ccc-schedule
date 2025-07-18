# CCC Schedule Deployment Guide

This guide explains how to deploy the CCC Schedule application for a California Community College.

## Overview

CCC Schedule is a static web application that requires no backend server. It works entirely with JSON data files and can be hosted on any static web hosting service.

## Prerequisites

- Web server or static hosting service (GitHub Pages, Netlify, etc.)
- Python 3.9+ for data processing (optional)
- Text editor for JSON files

## Deployment Options

### Option 1: GitHub Pages (Recommended)

1. Fork or clone this repository
2. Enable GitHub Pages in repository settings
3. Select the branch and folder to serve
4. Your site will be available at `https://[username].github.io/ccc-schedule/`

### Option 2: Static Web Server

1. Copy these files to your web server:
   ```
   index.html
   css/
   js/
   assets/
   data/
   ```

2. Ensure your web server serves JSON files with correct MIME type
3. Configure CORS if data files are on a different domain

### Option 3: CDN Deployment

1. Upload files to your CDN (CloudFront, Cloudflare, etc.)
2. Configure caching headers appropriately
3. Set up custom domain if desired

## Data Preparation

### 1. Create Your Schedule Data

Create a JSON file following the schema in `data/schema.json`:

```json
{
  "schedule": {
    "metadata": {
      "version": "1.0.0",
      "last_updated": "2025-01-18T00:00:00Z",
      "terms": [...],
      "colleges": [...]
    },
    "subjects": [...],
    "instructors": [...],
    "courses": [...]
  }
}
```

### 2. Validate Your Data

Use the CLI to validate your data:

```bash
uv run python -m src.cli schedule-validate your-data.json
```

### 3. Update Data Path

Edit `js/schedule.js` to point to your data file:

```javascript
// Line ~38
url: 'data/schema.json',  // Change to your data file
```

## Customization

### 1. Branding

Update these files for your college's branding:

- **Logo**: Replace `assets/logo.png` with your college logo
- **Colors**: Edit CSS variables in `css/schedule.css`:
  ```css
  :root {
    --primary-color: #003366;    /* Your primary color */
    --secondary-color: #0066CC;  /* Your secondary color */
  }
  ```
- **Title**: Update the title in `index.html`:
  ```html
  <title>Your College Schedule</title>
  ```

### 2. Features

Enable/disable features in `index.html`:

- Remove filter options you don't need
- Add custom fields to the section modal
- Modify the navigation menu

### 3. Data Updates

Options for updating schedule data:

1. **Manual Updates**: Edit JSON files directly
2. **Automated Pipeline**: Set up a script to generate JSON from your SIS
3. **API Integration**: Modify JavaScript to fetch from your API

## Performance Optimization

### 1. Data Size

For large datasets:
- Split data by term
- Implement lazy loading
- Use data compression (gzip)

### 2. Caching

Configure appropriate cache headers:
```
Cache-Control: public, max-age=3600  # 1 hour for data
Cache-Control: public, max-age=86400 # 1 day for assets
```

### 3. CDN Usage

For better performance:
- Serve static assets from CDN
- Use CDN for Bootstrap and jQuery
- Enable CDN compression

## Security Considerations

1. **Data Privacy**: 
   - Remove sensitive instructor information
   - Consider FERPA requirements
   - Anonymize student enrollment data

2. **CORS Policy**:
   - Configure CORS if loading data from different domain
   - Restrict origins in production

3. **Content Security Policy**:
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net code.jquery.com;">
   ```

## Monitoring

### 1. Analytics

Add Google Analytics or similar:
```html
<!-- Add before </body> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

### 2. Error Tracking

Consider adding error tracking:
- Sentry for JavaScript errors
- Custom error logging
- User feedback mechanism

## Maintenance

### Regular Tasks

1. **Data Updates**:
   - Update schedule data each term
   - Verify data accuracy
   - Test after updates

2. **Dependency Updates**:
   - Update Bootstrap and jQuery periodically
   - Check for security patches
   - Test compatibility

3. **Performance Monitoring**:
   - Check page load times
   - Monitor data file sizes
   - Review error logs

### Troubleshooting

Common issues and solutions:

1. **Data not loading**:
   - Check browser console for errors
   - Verify JSON file path
   - Validate JSON syntax

2. **Filters not working**:
   - Check data format matches schema
   - Verify all required fields present
   - Test with sample data

3. **Performance issues**:
   - Reduce data size
   - Enable compression
   - Implement pagination

## Support

For deployment assistance:
1. Check the [API documentation](API.md)
2. Review [contributing guidelines](../CONTRIBUTING.md)
3. Open an issue on GitHub

## Example Deployment Script

```bash
#!/bin/bash
# deploy.sh - Example deployment script

# Validate data
uv run python -m src.cli schedule-validate data/schedule.json

# Build for production (if needed)
# npm run build

# Copy files to web server
rsync -avz --exclude='.git' --exclude='tests' \
  index.html css/ js/ assets/ data/ \
  user@server:/var/www/schedule/

# Set permissions
ssh user@server 'chmod -R 755 /var/www/schedule/'

echo "Deployment complete!"
```