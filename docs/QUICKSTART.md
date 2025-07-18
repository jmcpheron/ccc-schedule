# CCC Schedule Quick Start Guide

Get your college's schedule online in minutes!

## 1. Download the Project

Download or clone the CCC Schedule repository to your computer.

## 2. Add Your Logo

Replace `assets/logo.png` with your college's logo. The logo should be:
- PNG format (transparent background recommended)
- Approximately 200x50 pixels
- Named `logo.png`

## 3. Customize Branding

Edit `css/schedule.css` to match your college colors:

```css
:root {
    --primary-color: #003366;    /* Change to your primary color */
    --secondary-color: #0066CC;  /* Change to your secondary color */
}
```

## 4. Update the Title

Edit `index.html` and change the title and navbar brand:

```html
<title>Your College Name - Schedule</title>

<!-- In the navbar -->
<a class="navbar-brand" href="#">
    <img src="assets/logo.png" alt="Logo" height="30" class="d-inline-block align-text-top me-2">
    Your College Name Schedule
</a>
```

## 5. Prepare Your Data

The easiest way to get started is to modify the example data:

1. Open `data/schema.json`
2. Update the metadata section:
   ```json
   "metadata": {
     "version": "1.0.0",
     "last_updated": "2025-01-18T00:00:00Z",
     "terms": [
       {
         "code": "202530",
         "name": "Spring 2025",
         "start_date": "2025-01-20",
         "end_date": "2025-05-25"
       }
     ],
     "colleges": [
       {
         "id": "main",
         "name": "Your College Name",
         "abbreviation": "YCN",
         "logo_url": "/assets/logo.png",
         "theme": {
           "primary_color": "#003366",
           "secondary_color": "#0066CC"
         }
       }
     ]
   }
   ```

3. Add your subjects:
   ```json
   "subjects": [
     {
       "code": "MATH",
       "name": "Mathematics",
       "department": "Math and Science"
     },
     {
       "code": "ENG",
       "name": "English",
       "department": "Language Arts"
     }
   ]
   ```

4. Add courses with sections (see schema for full structure)

## 6. Test Locally

Open `index.html` in your web browser. You should see:
- Your college logo and colors
- The example course data
- Working search and filters

## 7. Deploy

### Option A: GitHub Pages (Free)

1. Create a GitHub repository
2. Upload all files
3. Go to Settings → Pages
4. Select "Deploy from a branch"
5. Choose your main branch
6. Your site will be live at `https://[username].github.io/[repository-name]/`

### Option B: Web Server

Upload these files to your web server:
- `index.html`
- `css/` folder
- `js/` folder
- `assets/` folder
- `data/` folder

## 8. Update Data

To update your schedule data:

1. Edit `data/schema.json` with new course information
2. Validate the data (optional):
   ```bash
   uv run python -m src.cli schedule-validate data/schema.json
   ```
3. Upload the updated file to your server

## Common Customizations

### Remove Unused Filters

Edit `index.html` and remove filter sections you don't need. For example, to remove the textbook cost filter, delete the entire `<div class="mb-3">` section containing it.

### Change Default Term

Edit `js/schedule.js` and find the `populateFilters()` function. Add:
```javascript
// Set default term
elements.termSelect.val('202530'); // Your term code
```

### Add Custom Fields

To add custom fields to sections:

1. Add the field to your data
2. Update the section display in `js/schedule.js`
3. Add styling in `css/schedule.css` if needed

## Need Help?

- Check the [full documentation](../README.md)
- Review [deployment options](DEPLOYMENT.md)
- See [API documentation](API.md) for data processing