# CCC Schedule Collector Integration Guide

This document serves as the authoritative guide for integrating the [CCC Schedule Collector](https://github.com/jmcpheron/ccc-schedule-collector) repository with the CCC Schedule project. It defines the data contract, architecture principles, and best practices for creating collectors that seamlessly integrate with the transformer architecture.

## Overview

The CCC Schedule ecosystem consists of two complementary repositories:

1. **CCC Schedule** (this repository): The viewer, transformer, and standardization layer
2. **CCC Schedule Collector**: Individual college data collectors that produce raw schedule data

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  CCC Schedule Collector │         │      CCC Schedule        │
├─────────────────────────┤         ├──────────────────────────┤
│                         │         │                          │
│  College Websites       │         │  Transformers            │
│       ↓                 │         │       ↓                  │
│  Collectors             │ ──JSON──▶  Standardized Format    │
│       ↓                 │         │       ↓                  │
│  Raw JSON Output        │         │  Web Viewer              │
│                         │         │                          │
└─────────────────────────┘         └──────────────────────────┘
```

## Data Contract

### Collector Output Format

Each collector MUST produce JSON output with the following structure:

```json
{
  "term": "Fall 2025",
  "term_code": "202570",
  "collection_timestamp": "2025-07-23T17:40:56.146559",
  "source_url": "https://www.riohondo.edu/schedule",
  "college_id": "rio-hondo",
  "collector_version": "1.0.0",
  "courses": [
    {
      // Course and section data
    }
  ],
  "metadata": {
    // Optional additional metadata
  }
}
```

### Required Top-Level Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `term` | string | Human-readable term name | "Fall 2025" |
| `term_code` | string | Machine-readable term code | "202570" |
| `collection_timestamp` | string | ISO 8601 timestamp of collection | "2025-07-23T17:40:56.146559" |
| `source_url` | string | URL where data was collected from | "https://www.riohondo.edu/schedule" |
| `college_id` | string | Unique identifier matching config | "rio-hondo" |
| `collector_version` | string | Version of the collector | "1.0.0" |
| `courses` | array | Array of course/section objects | See below |

### Course Data Structure

The `courses` array should contain flat objects representing sections (not hierarchical courses with nested sections). Each object should include all available data from the source:

```json
{
  "crn": "75065",
  "subject": "ACCT",
  "course_number": "100",
  "title": "Introduction to Accounting",
  "units": 3.0,
  "instructor": "Smith, John",
  "instructor_email": "jsmith@college.edu",
  "meeting_times": [
    {
      "days": "MW",
      "start_time": "10:00am",
      "end_time": "11:50am",
      "is_arranged": false
    }
  ],
  "location": "Science Building 201",
  "enrollment": {
    "capacity": 35,
    "actual": 28,
    "remaining": 7
  },
  "status": "OPEN",
  "section_type": "LEC",
  "delivery_method": "In Person",
  "start_date": "08/25",
  "end_date": "12/20",
  // Include ALL available fields from the source
  "zero_textbook_cost": true,
  "prerequisites": "MATH 100",
  "additional_fees": 25.00,
  // ... any other fields available
}
```

### Key Principles

1. **Collect Everything**: Include all available data fields, even if they seem unnecessary. Transformers will handle filtering.

2. **Preserve Original Values**: Keep data in its original format (e.g., "10:00am" not "10:00:00"). Transformers handle standardization.

3. **Flat Structure**: Output sections as a flat array, not nested under courses. Transformers handle grouping.

4. **Consistent Field Names**: Use consistent field names across collections for the same college.

5. **Null vs Missing**: Use `null` for explicitly empty values, omit fields that don't exist in the source.

## Directory Structure for Collector Repository

```
ccc-schedule-collector/
├── README.md
├── requirements.txt
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── collect-all.yml
├── collectors/
│   ├── __init__.py
│   ├── base_collector.py          # Abstract base class
│   ├── rio_hondo/
│   │   ├── __init__.py
│   │   ├── collector.py           # Rio Hondo specific collector
│   │   ├── config.json            # Collection configuration
│   │   └── test_collector.py
│   ├── north_orange_county/
│   │   ├── __init__.py
│   │   ├── collector.py
│   │   ├── config.json
│   │   └── test_collector.py
│   └── west_valley_mission/
│       ├── __init__.py
│       ├── collector.py
│       ├── config.json
│       └── test_collector.py
├── output/                        # Collected data output
│   ├── rio-hondo/
│   │   └── 202570/
│   │       ├── schedule_202570_latest.json
│   │       └── schedule_202570_20250723_174056.json
│   └── ...
├── tests/
│   ├── test_base_collector.py
│   └── fixtures/                  # Test HTML/data files
└── scripts/
    ├── collect_single.py          # Collect for one college
    ├── collect_all.py            # Collect for all colleges
    └── validate_output.py        # Validate collector output
```

## Collector Configuration

Each collector should have a `config.json`:

```json
{
  "college_id": "rio-hondo",
  "base_url": "https://www.riohondo.edu",
  "schedule_path": "/admissions-aid/schedule",
  "parser_type": "beautifulsoup",
  "rate_limit": {
    "requests_per_second": 2,
    "retry_attempts": 3
  },
  "selectors": {
    "course_rows": "tr.course-row",
    "crn": "td.crn",
    "subject": "td.subject"
    // ... HTML selectors
  },
  "term_mapping": {
    "Fall 2025": "202570",
    "Spring 2025": "202530"
  }
}
```

## College-Specific Examples

### Rio Hondo College

Rio Hondo uses a simple table-based schedule format:

**Collector Approach:**
- Parse HTML tables with BeautifulSoup
- Extract all visible fields
- Handle special cases like "ARR" for arranged times
- Include textbook cost indicators

**Key Fields:**
```json
{
  "zero_textbook_cost": false,
  "delivery_method": "Online SYNC",
  "book_link": "JavaScript:winOpen('https://bookstore.com/...')",
  "additional_hours": 54,
  "section_type": "LEC"
}
```

### North Orange County

NOCC has a more complex multi-file data structure:

**Collector Approach:**
- Access multiple JSON endpoints
- Join data from different sources (courses, sections, instructors)
- Maintain referential integrity
- Include all auxiliary data

**Key Fields:**
```json
{
  "campus": "FC",  // Fullerton College
  "ge_designation": ["A1", "C2"],
  "transferable": ["CSU", "UC"],
  "degree_applicable": true,
  "cohort_restrictions": ["HONORS", "STEM"]
}
```

### West Valley Mission

WVM uses Banner-style data with complex field names:

**Collector Approach:**
- Map Banner field names to readable names
- Handle multi-campus data (West Valley, Mission)
- Process meeting patterns and instructional methods
- Include enrollment management fields

**Key Fields:**
```json
{
  "campus_code": "MC",
  "instruction_method": "P",  // Banner code
  "xlst_group": "12345",      // Cross-listing
  "wait_capacity": 10,
  "census_date1": "09/06",
  "billing_hours": 3.0
}
```

## Best Practices

### 1. Error Handling

```python
class BaseCollector:
    def collect(self):
        try:
            data = self._fetch_data()
            return self._parse_data(data)
        except requests.RequestException as e:
            logger.error(f"Failed to fetch data: {e}")
            # Return cached data if available
            return self._get_cached_data()
        except ParseError as e:
            logger.error(f"Failed to parse data: {e}")
            # Save raw data for debugging
            self._save_debug_data(data)
            raise
```

### 2. Data Validation

```python
def validate_output(data):
    """Validate collector output meets contract."""
    required_fields = ['term', 'term_code', 'collection_timestamp', 
                      'source_url', 'college_id', 'courses']
    
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
    
    assert isinstance(data['courses'], list), "Courses must be an array"
    assert len(data['courses']) > 0, "No courses found"
    
    # Validate each course has minimum fields
    for course in data['courses']:
        assert 'crn' in course, "Course missing CRN"
        assert 'subject' in course, "Course missing subject"
```

### 3. Incremental Updates

```python
def should_update(self, last_modified):
    """Check if data needs updating."""
    # Option 1: Check last-modified header
    response = requests.head(self.config['schedule_url'])
    server_modified = response.headers.get('Last-Modified')
    
    # Option 2: Check for changes in content hash
    current_hash = self._get_content_hash()
    
    return current_hash != self.last_hash
```

### 4. Output Management

```python
def save_output(self, data, college_id, term_code):
    """Save output with versioning."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save timestamped version
    path = f"output/{college_id}/{term_code}"
    os.makedirs(path, exist_ok=True)
    
    # Save with timestamp
    with open(f"{path}/schedule_{term_code}_{timestamp}.json", 'w') as f:
        json.dump(data, f, indent=2)
    
    # Update latest symlink
    latest = f"{path}/schedule_{term_code}_latest.json"
    with open(latest, 'w') as f:
        json.dump(data, f, indent=2)
```

## Testing Requirements

### Unit Tests

Each collector should have comprehensive tests:

```python
def test_parse_meeting_times(collector):
    """Test meeting time parsing."""
    input_html = '<td>MWF 10:00am-11:50am</td>'
    expected = [{
        'days': 'MWF',
        'start_time': '10:00am',
        'end_time': '11:50am',
        'is_arranged': False
    }]
    assert collector._parse_meeting_times(input_html) == expected
```

### Integration Tests

Test against saved HTML fixtures:

```python
def test_full_parsing(collector):
    """Test parsing real schedule page."""
    with open('tests/fixtures/rio_hondo_schedule.html') as f:
        html = f.read()
    
    data = collector._parse_data(html)
    
    assert data['term'] == 'Fall 2025'
    assert len(data['courses']) > 100
    assert all('crn' in course for course in data['courses'])
```

## Integration Workflow

### 1. Development Phase

```bash
# Clone both repositories
git clone https://github.com/jmcpheron/ccc-schedule-collector.git
git clone https://github.com/jmcpheron/ccc-schedule.git

# Develop collector
cd ccc-schedule-collector
python scripts/collect_single.py rio-hondo

# Test with transformer
cd ../ccc-schedule
python scripts/transform_rio_hondo.py \
  ../ccc-schedule-collector/output/rio-hondo/202570/schedule_202570_latest.json
```

### 2. Validation

```bash
# Validate collector output
python scripts/validate_output.py output/rio-hondo/202570/schedule_202570_latest.json

# Test transformation
cd ../ccc-schedule
uv run python -m src.transformers.rio_hondo_transformer \
  --input ../ccc-schedule-collector/output/rio-hondo/202570/schedule_202570_latest.json \
  --validate
```

### 3. Production Deployment

The collector repository should:
1. Run scheduled GitHub Actions to collect data
2. Commit collected data to the repository
3. Optionally trigger downstream updates in CCC Schedule

## Versioning Strategy

### Collector Version

Include collector version in output:
```json
{
  "collector_version": "1.2.0",
  "schema_version": "1.0"
}
```

### Breaking Changes

When making breaking changes:
1. Increment major version
2. Update transformer to handle both versions
3. Document migration path
4. Maintain backward compatibility for 1 term

## Performance Considerations

1. **Rate Limiting**: Respect college servers with appropriate delays
2. **Caching**: Cache unchanged data to reduce server load
3. **Parallel Processing**: Process multiple pages concurrently when safe
4. **Incremental Updates**: Only collect changed data when possible

## Security Considerations

1. **No Credentials in Code**: Use environment variables
2. **Input Validation**: Sanitize all parsed data
3. **Error Messages**: Don't expose sensitive URLs in logs
4. **Access Control**: Respect robots.txt and terms of service

## Future Enhancements

1. **Common Parser Library**: Share parsing logic for similar systems
2. **Change Detection**: Automated notifications for schedule changes
3. **Data Quality Metrics**: Track completeness and accuracy
4. **API Integration**: Direct API access where available
5. **Multi-Format Support**: Handle PDF, Excel, and other formats

## Contributing

When adding a new college collector:

1. Follow the established directory structure
2. Extend `BaseCollector` class
3. Include comprehensive tests
4. Document any special parsing logic
5. Add example output to `examples/` directory
6. Update this guide with college-specific notes

## Questions?

For questions about:
- **Collector Development**: Open issue in ccc-schedule-collector
- **Transformer/Schema**: Open issue in ccc-schedule
- **Integration**: Reference this guide and open issue in appropriate repository