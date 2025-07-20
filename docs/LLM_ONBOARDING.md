# LLM-Enhanced College Schedule Onboarding System

## Overview

The CCC Schedule project now features an advanced onboarding system that uses Large Language Models (LLMs) to intelligently parse and extract schedule data from any format without requiring custom code for each college.

## Key Features

### 🤖 Intelligent Parsing
- **Automatic Format Detection**: Detects HTML, JSON, CSV, and other formats automatically
- **Adaptive Field Mapping**: LLM understands context to map fields correctly
- **No Code Required**: College staff can onboard through a conversational interface
- **Handles Variations**: Works with any HTML structure, not just specific selectors

### 🎯 Banner 8 Specialized Support
- Pre-configured parser for Banner 8 HTML tables
- Understands Banner 8 field names and structures
- Handles complex meeting patterns and schedules
- Extracts all metadata (ZTC, prerequisites, etc.)

### 💬 Interactive Onboarding
- Step-by-step wizard interface
- Visual preview of extracted data
- Real-time validation and feedback
- Customizable field mappings

### 🔄 Data Normalization
- Automatic time format standardization (12hr → 24hr)
- Instructor name normalization
- Course number formatting
- Unit value extraction from various formats

## Quick Start

### 1. Interactive Onboarding (Recommended)

```bash
# Run the interactive wizard
python -m src.onboarding_cli

# Or with an existing configuration
python -m src.onboarding_cli --config configs/your_college_config.json
```

### 2. Programmatic Usage

```python
from src.llm_parser import LLMParser
from src.college_config import get_banner8_default_config
from src.parsers.banner8_parser import Banner8Parser

# For Banner 8 systems
config = get_banner8_default_config()
config.college_id = "your_college"
config.college_name = "Your College Name"

# Parse HTML
parser = Banner8Parser(config)
data = parser.parse_html(html_content)

# Convert to CCC format
ccc_data = parser.to_ccc_format(data)
```

### 3. Example: Rio Hondo College

See `examples/rio_hondo_onboarding.py` for a complete example:

```bash
python examples/rio_hondo_onboarding.py
```

## Architecture

### Components

1. **LLM Parser** (`src/llm_parser.py`)
   - Generic parser using LLM for understanding any format
   - Format detection and field extraction
   - Confidence scoring and validation

2. **College Configuration** (`src/college_config.py`)
   - Stores college-specific settings
   - Field mappings and extraction rules
   - Templates for common systems

3. **Banner 8 Parser** (`src/parsers/banner8_parser.py`)
   - Specialized parser for Banner 8 HTML
   - Handles table-based layouts
   - Complex meeting pattern extraction

4. **Data Normalizer** (`src/data_normalizer.py`)
   - Standardizes formats across colleges
   - Cleans and validates data
   - Handles edge cases

5. **Interactive CLI** (`src/onboarding_cli.py`)
   - User-friendly wizard interface
   - Rich terminal UI with progress indicators
   - Step-by-step guidance

## Onboarding Process

### Step 1: Gather College Information
```
College name: Rio Hondo Community College
College abbreviation: RHC
College ID: rio_hondo
Website: https://www.riohondo.edu
```

### Step 2: Provide Sample Data
- Upload a file
- Paste HTML/JSON
- Provide a URL

### Step 3: Review Extraction
The system shows:
- Detected format
- Confidence level
- Suggested field mappings
- Sample extracted data

### Step 4: Customize Mappings (Optional)
Fine-tune field mappings if needed:
```
CCC Field        Your Field
---------        ----------
course_number    crseNumb
course_title     crseTitle
units           creditHrs
```

### Step 5: Test & Validate
- System tests extraction with full data
- Shows statistics and any issues
- Validates against CCC schema

### Step 6: Save Configuration
Configuration saved for future use:
```json
{
  "college_id": "rio_hondo",
  "college_name": "Rio Hondo Community College",
  "source_format": "banner8_html",
  "field_mappings": {
    "course_number": "crseNumb",
    "course_title": "crseTitle",
    ...
  }
}
```

## Supported Formats

### HTML Formats
- **Banner 8**: Table-based layout with ddtitle/dddefault classes
- **PeopleSoft**: Div-based layout with specific class names
- **Custom HTML**: Any structure (LLM will understand)

### Data Formats
- **JSON**: Automatic field detection
- **CSV**: Column mapping support
- **XML**: Structured data extraction

### Special Features
- **Screenshots**: Can parse data from images
- **PDFs**: Extract schedule data from PDF documents
- **Mixed Formats**: Handle pages with multiple data types

## Advanced Configuration

### Custom Extraction Rules
```python
from src.college_config import ExtractionRule

rule = ExtractionRule(
    field_name="zero_textbook_cost",
    rule_type="regex",
    rule_value=r"ZTC|Zero Textbook Cost",
    post_processing="bool(match)"
)
config.add_custom_rule(rule)
```

### Parser Options
```python
config.parser_options = {
    "table_class": "datadisplaytable",
    "course_row_class": "ddtitle",
    "default_term": "202530"
}
```

### Validation Rules
```python
config.validation_rules = {
    "min_units": 0.5,
    "max_units": 20,
    "required_fields": ["crn", "course_number", "title"]
}
```

## Data Flow

```
Raw Data (HTML/JSON/etc.)
    ↓
Format Detection
    ↓
LLM/Parser Extraction
    ↓
Field Mapping
    ↓
Data Normalization
    ↓
Validation
    ↓
CCC Schedule Format
```

## Benefits Over Traditional Scraping

### Traditional Approach
- ❌ Brittle CSS selectors break with site changes
- ❌ Custom code for each college
- ❌ Manual updates when format changes
- ❌ Technical expertise required

### LLM-Enhanced Approach
- ✅ Understands content, not just structure
- ✅ Adapts to format changes automatically
- ✅ One system for all colleges
- ✅ Non-technical staff can onboard

## Best Practices

1. **Provide Good Sample Data**
   - Include various course types
   - Show edge cases (online, hybrid, cancelled)
   - Include full semester data if possible

2. **Review Mappings Carefully**
   - Verify field mappings are correct
   - Test with different course types
   - Check special attributes (ZTC, honors, etc.)

3. **Regular Updates**
   - Schedule periodic data refreshes
   - Monitor for format changes
   - Update configuration as needed

4. **Validation**
   - Always validate extracted data
   - Check enrollment numbers make sense
   - Verify dates and times are correct

## Troubleshooting

### Low Confidence Scores
- Provide more sample data
- Check if format has changed significantly
- Consider custom extraction rules

### Missing Fields
- Review field mappings
- Check if data exists in source
- Add custom extraction rules

### Incorrect Data
- Verify source data is correct
- Check normalization rules
- Adjust parser configuration

## Future Enhancements

- **Real LLM Integration**: Connect to OpenAI/Anthropic APIs
- **Multi-language Support**: Parse schedules in any language
- **Change Detection**: Automatic notifications when format changes
- **Bulk Onboarding**: Onboard multiple colleges at once
- **Visual Parser**: Point and click on webpage to select data

## Contributing

To add support for a new college system:

1. Create a new parser in `src/parsers/`
2. Add default configuration template
3. Include example data and test cases
4. Submit a pull request

## Support

For help with onboarding:
- Check examples in `examples/` directory
- Review existing college configurations
- Open an issue on GitHub
- Contact: support@cccschedule.edu