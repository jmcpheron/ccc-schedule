# Advanced Filter Testing Guide

## Quick Test Instructions

Open the page at http://127.0.0.1:1234 and try these filter combinations:

### 1. Test Instructor Search
- Type "shadow" in the Instructor field
- You should see "Master Shadow" in the dropdown
- Selecting it should show only NINJA101

### 2. Test Open Only Button
- Click "Open Only" button
- Should hide courses with "Waitlist" status (UFO303, INTERN499)

### 3. Test Meeting Days
- Click Advanced Filters
- Select "Sunday" in Meeting Days
- Should show only CHILL099

### 4. Test Time Range
- Move Start Time slider to 10:00 PM
- Should show only NINJA101 and LATE600

### 5. Test Instructional Mode
- Select "Synchronous Online"
- Should show only ZOOM250

### 6. Test Textbook Cost
- Select "ZTC" (Zero Textbook Cost)
- Should show: CACT101, TACO150, NINJA101, TIME404, LLAMA220, PIRATE180, CHILL099, TUTOR100, LATE600

### 7. Test Credit Type
- Select "Non-Credit" from Credit Type dropdown
- Should show only CHILL099

### 8. Test Class Length
- In Advanced Filters, select "Short Term" under Class Length
- Should show CHILL099 and ZOOM250

### 9. Test Multiple Filters
- Select "Monday" in Meeting Days
- AND select "ZTC" in Textbook Cost
- Should show only TIME404

## Console Test Script

You can also paste this in your browser console to verify filters are loaded:

```javascript
// Check if filters are working
console.log('Total courses:', allCourses.length);
console.log('Non-credit courses:', allCourses.filter(c => c.creditType === 'NC').map(c => c.subj));
console.log('Sunday courses:', allCourses.filter(c => c.sections?.some(s => s.days?.includes('U'))).map(c => c.subj));
console.log('Short term courses:', allCourses.filter(c => c.sections?.some(s => s.length === 'Short Term')).map(c => c.subj));
console.log('Early morning courses:', allCourses.filter(c => c.sections?.some(s => s.startTime && s.startTime < '07:00')).map(c => c.subj));
```

## Expected Results

With our enhanced sample data, you should have:
- 16 total courses
- 1 non-credit course (CHILL)
- 1 Sunday course (CHILL)
- 2 short term courses (CHILL, ZOOM)
- 2 early morning courses (CACT, EARLY)
- Various instructional modes: INP, HYB, SON, AON, FLX, TUT, WRK