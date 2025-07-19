# CCC Schedule Onboarding

This directory provides resources for California Community Colleges to integrate their course schedules into the CCC Schedule system.

## Quick Start

1. Look at the `demo-college/` example to see a working integration
2. Copy the `templates/basic-scraper.py` and adapt it for your college
3. Run the scraper to generate your `courses.json` file
4. Customize the `index.html` for your college's branding

## Demo College Example

The `demo-college/` directory shows a complete example of:
- A web scraper that extracts course data from a public college website
- The resulting JSON data in our standard format
- A customized schedule viewer

## How It Works

1. **No Internal Changes Required**: The scraper works with your existing public website
2. **Simple Integration**: Just run the scraper periodically to update your data
3. **Full Control**: Host the schedule viewer on your own servers or let us host it

## Getting Started

See `demo-college/scraper.py` for a working example you can adapt.