# CCC Schedule Data Submission Guidelines

## Overview

This document provides comprehensive guidelines for submitting course schedule data to the CCC Schedule system. Following these guidelines ensures data quality, consistency, and accessibility for all users.

## Data Format Requirements

### JSON Structure

All schedule data must be submitted in valid JSON format with the following structure:

```json
{
  "metadata": {
    "version": "1.0",
    "last_updated": "2024-01-30T12:00:00Z",
    "terms": [...],
    "colleges": [...]
  },
  "courses": [
    {
      "course_id": "CS101",
      "title": "Introduction to Computer Science",
      "units": 3,
      "sections": [...]
    }
  ]
}
```

### Required Fields

#### Course Level
- `course_id` (string): Course identifier in format "SUBJ###[A-Z]?" (e.g., "CS101", "MATH123A")
- `title` (string): Full course title
- `units` (number): Credit units (0-99)
- `college` (string): College name or identifier
- `term` (string): Term code in YYYYMM format (e.g., "202530")

#### Section Level
- `crn` (string): 5-digit Course Reference Number
- `instrMethod` (string): Instruction mode (see valid values below)
- `enrollStatus` (string): Current enrollment status

### Field Specifications

#### Course ID Format
- 2-4 uppercase letters for subject code
- 1-4 digits for course number
- Optional single uppercase letter suffix
- Examples: "CS101", "MATH123A", "BIOL1"

#### CRN (Course Reference Number)
- Exactly 5 digits
- Must be unique within a term
- Format: "12345"

#### Time Format
- 24-hour format: "HH:MM"
- Valid range: "00:00" to "23:59"
- Examples: "09:00", "14:30", "18:45"

#### Date Format
- ISO 8601 format for timestamps: "YYYY-MM-DDTHH:MM:SSZ"
- Date ranges: "MM/DD/YYYY - MM/DD/YYYY"
- Examples: "01/15/2024 - 05/20/2024"

#### Meeting Days
- Single character codes:
  - M = Monday
  - T = Tuesday
  - W = Wednesday
  - R = Thursday
  - F = Friday
  - S = Saturday
  - U = Sunday
- Combine for multiple days: "MWF", "TR"

## Valid Field Values

### Instruction Modes
- `INP` - In-Person
- `HYB` - Hybrid
- `FLX` - Flexible
- `AON` - Asynchronous Online
- `SON` - Synchronous Online
- `TUT` - Tutorial
- `WRK` - Work Experience

### Credit Types
- `CR` - Credit
- `NC` - Non-Credit

### Enrollment Status
- `Open` - Accepting enrollments
- `Closed` - Not accepting enrollments
- `Waitlist` - Waitlist available

### Textbook Cost Indicators
- `ZTC` - Zero Textbook Cost
- `LTC` - Low Textbook Cost (< $50)
- `REG` - Regular textbook cost

## Validation Rules

### Course Validation
1. **Units Range**: 0-99 (decimals allowed)
2. **Title Length**: 1-200 characters
3. **Description**: Optional, max 2000 characters
4. **Prerequisites**: Use course IDs separated by commas

### Section Validation
1. **Time Logic**: End time must be after start time
2. **Enrollment Logic**: 
   - Enrolled count cannot exceed capacity
   - Waitlist only valid when enrolled = capacity
3. **Instructor Email**: Must be valid email format
4. **Location**: Building and room number (e.g., "MATH 101")

### Cross-Field Validation
1. If status is "Open", enrolled < capacity
2. If status is "Closed", no automatic assumption about capacity
3. If meeting days specified, start/end times required
4. Online courses (AON) should not have meeting times

## Submission Process

### 1. Data Preparation
```bash
# Validate your data file
uv run python -m src.cli schedule-validate data/schedule.json

# Check specific validation
uv run python -m src.validators validate_schedule_file data/schedule.json
```

### 2. Common Validation Errors

#### Missing Required Fields
```
Error: course[0].course_id: Required field 'course_id' is missing
Fix: Ensure all courses have a course_id field
```

#### Invalid Format
```
Error: sections[0].crn: Invalid CRN format: '1234'. CRN must be exactly 5 digits
Fix: Pad with leading zeros: "01234"
```

#### Time Logic Error
```
Error: sections[0].time: End time (09:00) must be after start time (10:30)
Fix: Correct the time values
```

### 3. Testing Your Data

Run the comprehensive test suite:
```bash
# Test data structure
uv run pytest tests/test_data_utils.py

# Test validation
uv run python -c "
from src.validators import validate_course_submission
import json

with open('data/my_course.json') as f:
    course = json.load(f)
    
is_valid, errors, warnings = validate_course_submission(course)
print(f'Valid: {is_valid}')
for error in errors:
    print(f'Error: {error}')
for warning in warnings:
    print(f'Warning: {warning}')
"
```

## Best Practices

### 1. Data Quality
- **Consistency**: Use consistent formatting across all entries
- **Completeness**: Provide all available information
- **Accuracy**: Verify data before submission
- **Updates**: Submit updates promptly when changes occur

### 2. Accessibility Information
- **Always include**:
  - Clear course titles and descriptions
  - Instructor contact information
  - Building accessibility notes
  - Online course technical requirements

### 3. Student-Friendly Data
- **Helpful additions**:
  - Textbook cost indicators (ZTC/LTC)
  - Prerequisites in plain language
  - Important dates (drop deadlines, etc.)
  - Special requirements or fees

### 4. Incremental Updates
When updating existing data:
1. Maintain CRN consistency
2. Track enrollment changes
3. Update timestamps
4. Preserve historical data where applicable

## Error Recovery

### Handling Validation Failures

1. **Review error messages carefully**
   ```
   Error: course[5].sections[2].instrMethod: Invalid instruction mode 'ONLINE'. 
   Must be one of: INP, HYB, FLX, AON, SON, TUT, WRK
   ```

2. **Fix errors in order**
   - Start with structural errors
   - Then format errors
   - Finally logical errors

3. **Use validation tools**
   ```python
   from src.validators import CourseValidator
   
   validator = CourseValidator()
   result = validator.validate_course(course_data)
   print(result.get_summary())
   ```

### Common Fixes

| Error Type | Example | Fix |
|------------|---------|-----|
| Missing field | "Required field 'units' is missing" | Add the field with appropriate value |
| Format error | "Invalid email format" | Correct to valid email format |
| Range error | "Units must be between 0 and 99" | Adjust value to valid range |
| Logic error | "Enrolled exceeds capacity" | Review and correct the numbers |

## Automated Validation

### Pre-submission Checklist
- [ ] JSON is valid and well-formed
- [ ] All required fields present
- [ ] Formats match specifications
- [ ] Cross-field validation passes
- [ ] No duplicate CRNs within term
- [ ] Enrollment numbers are logical
- [ ] Times and dates are valid

### Validation Script
```python
#!/usr/bin/env python3
"""Pre-submission validation script"""

import json
import sys
from pathlib import Path
from src.validators import validate_schedule_file

def main():
    if len(sys.argv) != 2:
        print("Usage: python validate_submission.py <schedule.json>")
        sys.exit(1)
    
    file_path = Path(sys.argv[1])
    result = validate_schedule_file(file_path)
    
    print(result.get_summary())
    
    if not result.is_valid:
        print("\nErrors found:")
        for error in result.errors:
            print(f"  ❌ {error}")
        sys.exit(1)
    
    if result.warnings:
        print("\nWarnings:")
        for warning in result.warnings:
            print(f"  ⚠️  {warning['field']}: {warning['message']}")
    
    print("\n✅ Validation passed! Ready for submission.")

if __name__ == "__main__":
    main()
```

## Support and Resources

### Getting Help
1. Review this guide and error messages
2. Check the [validation test examples](../tests/test_data_utils.py)
3. Use the built-in validation tools
4. Submit issues on GitHub with:
   - Error messages
   - Sample data (sanitized)
   - Expected vs actual behavior

### Additional Resources
- [JSON Schema Documentation](https://json-schema.org/)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)
- [Email Format Specification](https://emailregex.com/)
- [Accessibility Guidelines](./ACCESSIBILITY.md)

## Version History

- **v1.0** (2024-01-30): Initial submission guidelines
  - Comprehensive validation rules
  - Error handling procedures
  - Best practices for data quality