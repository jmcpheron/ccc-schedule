# California Community College Schedule Comparison

## Overview
This project contains downloaded examples of two community college district schedule web applications:
- West Valley Mission Community College District (https://schedule.wvm.edu)
- North Orange County Community College District (https://schedule.test.nocccd.edu)

Both appear to be based on similar source code but have diverged in implementation.

## Project Structure
```
ccc-schedule-examples/
├── west-valley-mission/
│   ├── index.html          # Main HTML file (inline JS)
│   ├── assets/             # CSS files
│   │   ├── combined_bootstrap.min.css
│   │   ├── wv_bootstrap.min.css
│   │   └── mc_bootstrap.min.css
│   └── data/               # JSON data files
│       ├── sobterm.json
│       ├── courses_202530.json
│       ├── subjects_202530.json
│       ├── csuge.json
│       └── igetc.json
├── north-orange-county/
│   ├── index.html          # Main HTML file
│   ├── assets/             # JavaScript files
│   │   ├── help.js
│   │   └── index.js
│   └── data/               # JSON data files
│       ├── courses_202590.json
│       └── sections_202590.json
├── server.py               # Local development server
└── COMPARISON.md          # This file

## Key Differences

### 1. Architecture
**West Valley Mission:**
- All JavaScript is inline in the HTML file
- Multiple JSON endpoints for different data types
- Chained AJAX requests for data loading
- Dynamic CSS loading based on college selection

**North Orange County:**
- Separate JavaScript files (help.js, index.js)
- Simpler data structure (courses.json, sections.json)
- Different data loading pattern

### 2. Data Structure
**West Valley Mission uses multiple JSON files:**
- courses.json - Course catalog
- crns.json - Course reference numbers
- ssrmeet.json - Meeting times
- section-instructors.json - Instructor assignments
- section-attributes.json - Section attributes
- xlst.json - Cross-listed courses
- cohorts.json - Student cohorts
- subjects.json - Subject list
- instructors.json - Instructor list

**North Orange County uses fewer files:**
- courses.json - Course catalog
- sections.json - Section details (combines multiple WVM files)

### 3. Features
Both systems offer:
- Term-based course search
- Advanced filtering options
- Responsive design
- Real-time search results

**West Valley Mission specific:**
- Multi-college support (West Valley, Mission)
- Dynamic theme switching
- CSU GE and IGETC pattern tracking

**North Orange County specific:**
- Simpler architecture
- Potentially faster loading (fewer requests)

## Running Locally

1. Start the Python server:
   ```bash
   # For West Valley Mission
   python3 server.py west-valley-mission

   # For North Orange County
   python3 server.py north-orange-county
   ```

2. Open http://localhost:8000 in your browser

Note: The local versions may have limited functionality as they're missing backend APIs and complete data sets.

## Next Steps for Building a Vanilla Version

1. **Data Model**: Create a unified data structure that combines the best of both approaches
2. **Performance**: Use NOCCCD's simpler loading pattern but maintain WVM's rich data
3. **Features**: Include multi-college support and transfer pattern tracking
4. **Modern Stack**: Consider using modern JavaScript frameworks and build tools
5. **API Design**: Create a cleaner API structure avoiding multiple chained requests