# Local Development Guide for CCC Schedule

This guide provides detailed instructions for setting up a test branch, loading college-specific data, and running a local instance of the CCC Schedule application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a Test Branch](#creating-a-test-branch)
3. [Setting Up Local Development](#setting-up-local-development)
4. [Loading College-Specific Data](#loading-college-specific-data)
5. [Running the Application Locally](#running-the-application-locally)
6. [Complete Example: Mountain View College](#complete-example-mountain-view-college)
7. [Troubleshooting](#troubleshooting)
8. [Contributing Your Changes](#contributing-your-changes)

## Quick Start with Automated Setup

For the fastest setup, use our automated script:

```bash
# Set up for "Mountain View College"
python scripts/setup-local-college.py "Mountain View College"

# With custom options
python scripts/setup-local-college.py "West Valley College" --college-id wvc --port 8080
```

This script will:
1. Create a test branch
2. Set up college data from template
3. Update JavaScript configuration
4. Validate the data
5. Start a local server

## Prerequisites

Before you begin, ensure you have the following installed:

- **Git** - For version control
- **Python 3.9+** - For data processing utilities
- **UV** - Python package manager (install with `pip install uv`)
- **Web Browser** - Chrome, Firefox, Safari, or Edge
- **Text Editor** - VS Code, Sublime Text, or similar

### Optional but Recommended

- **Node.js** - For running a development server
- **VS Code** with Live Server extension - For easy local testing

## Creating a Test Branch

### 1. Fork the Repository

First, fork the repository on GitHub:

1. Visit https://github.com/jmcpheron/ccc-schedule
2. Click the "Fork" button in the top right
3. Select your GitHub account

### 2. Clone Your Fork

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/ccc-schedule.git
cd ccc-schedule

# Add the upstream repository
git remote add upstream https://github.com/jmcpheron/ccc-schedule.git
```

### 3. Create a College-Specific Branch

Use a naming convention that identifies your college:

```bash
# Create a branch for your college
git checkout -b test/college-name

# Examples:
# git checkout -b test/west-valley
# git checkout -b test/mission-college
# git checkout -b test/de-anza
```

### 4. Keep Your Branch Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Merge or rebase upstream changes
git merge upstream/main
# or
git rebase upstream/main
```

## Setting Up Local Development

### 1. Install Python Dependencies

```bash
# Install UV if you haven't already
pip install uv

# Install project dependencies
uv sync --all-extras
```

### 2. Verify Installation

```bash
# Run tests to ensure everything works
uv run pytest

# Check CLI tools
uv run python -m src.cli --help
```

## Loading College-Specific Data

### Understanding the Data Structure

The application uses a JSON format for course data. There are two main formats supported:

1. **Legacy Format** (`courses.json`) - Simple array of courses
2. **Unified Schema** (`schema.json`) - Comprehensive format with metadata

### Option 1: Using the Course Template

Start with the provided template:

```bash
# Copy the template
cp data/college-template.json data/my-college.json

# Edit with your college's data
# Use your favorite editor
nano data/my-college.json
```

### Option 2: Creating Data from Scratch

Create a new JSON file with your college's course data:

```json
{
  "courses": [
    {
      "subj": "CS",
      "crse": "101",
      "course_id": "CS101",
      "title": "Introduction to Computer Science",
      "units": 3,
      "description": "An introduction to computer science concepts",
      "college": "Your College Name",
      "term": "Spring 2025",
      "creditType": "CR",
      "sections": [
        {
          "crn": "12345",
          "instructorName": "Dr. Smith",
          "instructorEmail": "smith@college.edu",
          "instrMethod": "INP",
          "days": "MW",
          "startTime": "09:00",
          "endTime": "10:30",
          "location": "Building A, Room 101",
          "dates": "01/20/25 - 05/16/25",
          "enrollStatus": "Open",
          "textbookCost": "ZTC",
          "length": "Full Term"
        }
      ]
    }
  ]
}
```

### Option 3: Converting Existing Data

If you have data in another format:

```python
# Example script to convert CSV to JSON
import csv
import json

def convert_csv_to_json(csv_file, json_file):
    courses = []
    
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Map your CSV columns to the JSON structure
            course = {
                "subj": row["Subject"],
                "crse": row["Course"],
                "title": row["Title"],
                # ... map other fields
            }
            courses.append(course)
    
    with open(json_file, 'w') as f:
        json.dump({"courses": courses}, f, indent=2)

# Use the script
convert_csv_to_json('your-data.csv', 'data/my-college.json')
```

### Validating Your Data

Always validate your data before testing:

```bash
# Validate the JSON structure
uv run python -m src.cli validate data/my-college.json

# Get information about your data
uv run python -m src.cli info data/my-college.json

# Test filtering
uv run python -m src.cli filter data/my-college.json --subject CS
```

## Running the Application Locally

### Option 1: Python Simple HTTP Server (Recommended)

```bash
# Start a local web server
python -m http.server 8000

# For Python 2 (if that's what you have)
python -m SimpleHTTPServer 8000
```

Then open http://localhost:8000 in your browser.

### Option 2: Node.js Server

If you have Node.js installed:

```bash
# Install http-server globally
npm install -g http-server

# Start the server
http-server -p 8000
```

### Option 3: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Configuring Data Source

Update the JavaScript to use your data file:

1. Open `js/schedule-enhanced.js`
2. Find the `loadInitialData` function (around line 130)
3. Update the data path:

```javascript
// Change this line:
$.getJSON('data/courses.json')
// To:
$.getJSON('data/my-college.json')
```

## Complete Example: Mountain View College

Let's walk through setting up a complete test environment for a fictional "Mountain View College":

### 1. Create the Branch

```bash
git checkout -b test/mountain-view-college
```

### 2. Create College Data

Create `data/mountain-view.json`:

```json
{
  "courses": [
    {
      "subj": "CS",
      "crse": "101",
      "course_id": "CS101",
      "title": "Introduction to Programming",
      "units": 3,
      "description": "Learn the fundamentals of programming using Python",
      "college": "Mountain View College",
      "term": "Spring 2025",
      "creditType": "CR",
      "transferable": true,
      "sections": [
        {
          "crn": "20001",
          "instructorName": "Dr. Emily Chen",
          "instructorEmail": "echen@mvc.edu",
          "instrMethod": "INP",
          "days": "MW",
          "startTime": "10:00",
          "endTime": "11:30",
          "location": "Tech Building, Room 205",
          "dates": "01/27/25 - 05/23/25",
          "enrollStatus": "Open",
          "enrollCurrent": 22,
          "enrollMax": 30,
          "textbookCost": "ZTC",
          "length": "Full Term",
          "notes": "Laptop required. No prior programming experience needed."
        },
        {
          "crn": "20002",
          "instructorName": "Prof. James Wilson",
          "instructorEmail": "jwilson@mvc.edu",
          "instrMethod": "ONL",
          "days": "Asynchronous",
          "startTime": "",
          "endTime": "",
          "location": "Online",
          "dates": "01/27/25 - 05/23/25",
          "enrollStatus": "Open",
          "enrollCurrent": 18,
          "enrollMax": 35,
          "textbookCost": "LTC",
          "length": "Full Term",
          "notes": "Weekly Zoom sessions on Thursdays 6-7 PM"
        }
      ]
    },
    {
      "subj": "MATH",
      "crse": "110",
      "course_id": "MATH110",
      "title": "College Algebra",
      "units": 4,
      "description": "Functions, equations, and graphs; polynomial and rational functions",
      "college": "Mountain View College",
      "term": "Spring 2025",
      "creditType": "CR",
      "transferable": true,
      "sections": [
        {
          "crn": "20101",
          "instructorName": "Dr. Sarah Martinez",
          "instructorEmail": "smartinez@mvc.edu",
          "instrMethod": "HYB",
          "days": "TR",
          "startTime": "14:00",
          "endTime": "15:30",
          "location": "Math Building, Room 110 / Online",
          "dates": "01/27/25 - 05/23/25",
          "enrollStatus": "Waitlist",
          "enrollCurrent": 32,
          "enrollMax": 32,
          "waitlistCurrent": 5,
          "textbookCost": "REQ",
          "length": "Full Term",
          "notes": "Hybrid: In-person Tuesdays, online Thursdays"
        }
      ]
    }
  ]
}
```

### 3. Update the JavaScript

Edit `js/schedule-enhanced.js`:

```javascript
// Line ~131
$.getJSON('data/mountain-view.json')
```

### 4. Customize Branding (Optional)

Update `index.html`:

```html
<!-- Update the title -->
<title>Mountain View College - Class Schedule</title>

<!-- Update the navbar brand -->
<a class="navbar-brand" href="#">Mountain View College Schedule</a>

<!-- Update the demo alert -->
<strong>Mountain View College Schedule Demo</strong>
```

### 5. Start Local Server

```bash
python -m http.server 8000
```

### 6. Test Your Setup

1. Open http://localhost:8000
2. Verify your courses appear
3. Test search functionality
4. Test all filters
5. Check responsive design

## Troubleshooting

### Common Issues

#### Data Not Loading

1. Check browser console (F12) for errors
2. Verify JSON syntax:
   ```bash
   python -m json.tool data/my-college.json
   ```
3. Ensure file path is correct in JavaScript

#### Filters Not Working

1. Verify all required fields are present in your data
2. Check that field names match exactly (case-sensitive)
3. Use the validation tool:
   ```bash
   uv run python -m src.cli validate data/my-college.json
   ```

#### CORS Errors

If loading data from a different domain:

1. Use a local server (not file://)
2. Configure CORS headers on your data server
3. Use a proxy or load data from same domain

### Debug Mode

Add debug logging to help troubleshoot:

```javascript
// In js/schedule-enhanced.js, add after line 130:
console.log('Loading data from:', 'data/my-college.json');

// In the .done() callback:
console.log('Loaded courses:', allCourses.length);
console.log('Sample course:', allCourses[0]);
```

## Contributing Your Changes

Once you've successfully set up your college's data:

### 1. Commit Your Changes

```bash
# Add your files
git add data/my-college.json
git add any-other-modified-files

# Commit with a descriptive message
git commit -m "Add Mountain View College course data and configuration"
```

### 2. Push to Your Fork

```bash
git push origin test/mountain-view-college
```

### 3. Create a Pull Request (Optional)

If you've made improvements that could benefit others:

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Describe your changes
4. Submit the pull request

### 4. Deploy Your Version

Follow the [Deployment Guide](DEPLOYMENT.md) to deploy your customized version.

## Additional Resources

- [API Documentation](API.md) - Python API reference
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Contributing Guidelines](../CONTRIBUTING.md) - Code contribution process
- [Data Schema Reference](../data/schema.json) - Complete data structure

## Need Help?

- Check existing issues on GitHub
- Open a new issue with:
  - Your college name
  - Error messages
  - Steps to reproduce
  - Sample data (sanitized)

Happy developing! 🎓