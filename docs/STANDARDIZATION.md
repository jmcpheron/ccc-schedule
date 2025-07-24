# CCC Schedule Data Standardization

This document describes the standardized data format and extensible architecture for the California Community College Schedule project.

## Overview

The CCC Schedule project uses a standardized, extensible data format that allows different colleges to:
- Share a common core schema for essential schedule data
- Add college-specific features through configuration
- Maintain compatibility across different data sources
- Enable feature flags for UI components

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ Data Sources    │────▶│ Transformers     │────▶│ Standardized   │
│ (College APIs,  │     │ (College-specific│     │ Schema         │
│  Collectors)    │     │  converters)     │     │                │
└─────────────────┘     └──────────────────┘     └────────────────┘
                                │                          │
                                ▼                          ▼
                        ┌──────────────────┐     ┌────────────────┐
                        │ College Config   │     │ Validation     │
                        │ (features.json)  │     │ (extensible)   │
                        └──────────────────┘     └────────────────┘
```

## Directory Structure

```
ccc-schedule/
├── data/
│   └── schemas/
│       └── base.json           # Core schema definition
├── colleges/
│   ├── west-valley-mission/
│   │   └── config.json        # College-specific configuration
│   ├── north-orange-county/
│   │   └── config.json
│   └── rio-hondo/
│       └── config.json
├── src/
│   ├── schema_validator.py    # Extensible validation
│   └── transformers/
│       ├── base_transformer.py
│       └── rio_hondo_transformer.py
└── scripts/
    └── convert-*.py           # Conversion scripts
```

## Base Schema

The base schema (`data/schemas/base.json`) defines the core fields that all colleges must provide:

### Required Fields

- **Course Level:**
  - `course_id`: Unique identifier
  - `subject`: Subject code (e.g., MATH)
  - `course_number`: Course number (e.g., 101)
  - `title`: Course title
  - `units`: Credit units

- **Section Level:**
  - `crn`: Course Reference Number
  - `status`: Enrollment status (Open/Closed/Waitlist)
  - `enrollment`: Object with enrolled/capacity
  - `meetings`: Array of meeting times/locations

### Optional Fields

- `instruction_mode`: Mode of instruction
- `instructor`: Name and email
- `dates`: Start/end dates
- `attributes`: College-specific attributes

## College Configuration

Each college has a configuration file (`colleges/<college-id>/config.json`) that defines:

### 1. College Information
```json
{
  "college": {
    "id": "west-valley-mission",
    "name": "West Valley Mission Community College District",
    "district": "West Valley Mission CCD",
    "campuses": [
      {"code": "WV", "name": "West Valley College"},
      {"code": "MC", "name": "Mission College"}
    ]
  }
}
```

### 2. Feature Flags
```json
{
  "features": {
    "textbook_cost": {
      "enabled": true,
      "categories": [
        {"code": "ZTC", "name": "Zero Textbook Cost"},
        {"code": "LTC", "name": "Low Textbook Cost"}
      ]
    },
    "instruction_modes": {
      "enabled": true,
      "modes": {
        "INP": {"name": "In Person"},
        "SON": {"name": "Online Synchronous"},
        "AON": {"name": "Online Asynchronous"}
      }
    }
  }
}
```

### 3. Data Mappings
```json
{
  "data_mappings": {
    "course": {
      "course_id": "{{SUBJ_CODE}}-{{CRSE_NUMB}}",
      "subject": "SUBJ_CODE",
      "course_number": "CRSE_NUMB"
    },
    "section": {
      "crn": "CRN",
      "status": {
        "field": "SSBSECT_SSTS_CODE",
        "mapping": {"A": "Open", "C": "Closed"}
      }
    }
  }
}
```

### 4. UI Components
```json
{
  "ui_components": {
    "filters": {
      "textbook_cost": {
        "enabled": true,
        "label": "Textbook Cost",
        "type": "multiselect"
      }
    },
    "display": {
      "show_waitlist_info": true,
      "show_textbook_badges": true
    }
  }
}
```

## Creating a New College Integration

### Step 1: Create College Configuration

Create `colleges/<college-id>/config.json`:

```json
{
  "college": {
    "id": "your-college",
    "name": "Your College Name"
  },
  "features": {
    // Enable only features your college needs
  },
  "data_mappings": {
    // Map your source fields to standard fields
  }
}
```

### Step 2: Create a Transformer

Create `src/transformers/your_college_transformer.py`:

```python
from .base_transformer import BaseTransformer

class YourCollegeTransformer(BaseTransformer):
    def _extract_term_info(self, input_data):
        # Extract term from your data format
        pass
    
    def _transform_courses(self, input_data):
        # Transform to standard format
        pass
    
    def _transform_meetings(self, section_data):
        # Convert meeting times
        pass
```

### Step 3: Create Conversion Script

Create `scripts/convert-your-college.py`:

```python
from src.transformers.your_college_transformer import YourCollegeTransformer
from src.schema_validator import validate_schedule_file

def convert():
    transformer = YourCollegeTransformer("colleges/your-college/config.json")
    data = transformer.transform(input_data)
    
    # Validate
    is_valid, errors = validate_schedule_file(output_path)
```

## Validation

The validation system supports both base schema validation and college-specific requirements:

```python
from src.schema_validator import ExtensibleSchemaValidator

# Basic validation (base schema only)
validator = ExtensibleSchemaValidator("data/schemas/base.json")
is_valid, errors = validator.validate(data)

# Strict validation (includes college requirements)
validator = ExtensibleSchemaValidator(
    "data/schemas/base.json",
    "colleges/west-valley-mission/config.json"
)
is_valid, errors = validator.validate(data, strict=True)
```

## UI Integration

The frontend can read college configurations to conditionally render features:

```javascript
// Load college config
const config = await fetch(`/colleges/${collegeId}/config.json`);

// Check feature availability
if (config.features.textbook_cost.enabled) {
  renderTextbookFilter(config.features.textbook_cost.categories);
}

// Use display settings
if (config.ui_components.display.show_waitlist_info) {
  showWaitlistColumn();
}
```

## Examples

### West Valley Mission (Full Features)
- All textbook cost categories (ZTC, LTC, OER, etc.)
- Extended instruction modes (synchronous/asynchronous online)
- Multiple campus support
- Census date tracking
- Non-credit courses
- Cohort restrictions

### North Orange County (Simplified)
- Basic OER indicator
- Standard instruction modes
- Multi-campus support
- Simplified data structure

### Rio Hondo (Collector Integration)
- Basic ZTC flag
- Simple delivery methods
- External data collector
- Minimal configuration

## Best Practices

1. **Start Minimal**: Enable only features your college actually uses
2. **Map Carefully**: Ensure data mappings accurately reflect your source data
3. **Validate Often**: Run validation during development to catch issues early
4. **Document Mappings**: Comment complex mappings in your transformer
5. **Test Incrementally**: Test with small data samples first

## Future Enhancements

- Schema versioning and migrations
- Plugin system for custom features
- Automated testing for transformers
- UI component library for common features
- GraphQL API with college-specific resolvers