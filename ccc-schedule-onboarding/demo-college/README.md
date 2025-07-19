# Santa Monica College Schedule Demo

This directory demonstrates how Santa Monica College (or any community college) can integrate their course schedule into the CCC Schedule system without any internal changes.

## How It Works

1. **Web Scraper** (`scraper.py`): Extracts course data from your public website
2. **Data File** (`data/courses.json`): Stores the extracted data in CCC format
3. **Schedule Viewer** (`index.html`): Displays the courses with search and filtering

## Running the Demo

```bash
# Generate sample data
python scraper.py

# View the schedule (from the root directory)
python -m http.server 8000
# Then open: http://localhost:8000/ccc-schedule-onboarding/demo-college/
```

## Adapting for Your College

1. **Modify the scraper**: Update `scraper.py` to match your website's HTML structure
2. **Customize branding**: Edit `index.html` with your college's name and colors
3. **Schedule updates**: Run the scraper periodically (e.g., daily via cron job)

## No IT Department Changes Needed

- Works with your existing public website
- No API access required
- No database changes
- Host anywhere (your servers or ours)

## Data Format

The scraper outputs data in this format:

```json
{
  "metadata": {
    "college": "Your College Name",
    "term": "Spring 2025",
    "lastUpdated": "2025-01-19T..."
  },
  "courses": [
    {
      "courseKey": "MATH-101",
      "title": "College Algebra",
      "sections": [...]
    }
  ]
}
```

See `data/courses.json` for a complete example.