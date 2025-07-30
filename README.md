# CCC Schedule

[![Tests](https://github.com/jmcpheron/ccc-schedule/actions/workflows/test.yml/badge.svg)](https://github.com/jmcpheron/ccc-schedule/actions/workflows/test.yml)
[![Code Quality](https://github.com/jmcpheron/ccc-schedule/actions/workflows/code-quality.yml/badge.svg)](https://github.com/jmcpheron/ccc-schedule/actions/workflows/code-quality.yml)
[![Deploy](https://github.com/jmcpheron/ccc-schedule/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/jmcpheron/ccc-schedule/actions/workflows/deploy-pages.yml)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG%202.1-AA%20Compliant-success)](docs/ACCESSIBILITY.md)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python&logoColor=white)](https://www.python.org/)

A comprehensive web-based class schedule viewer and data management system for California Community Colleges.

## 🚀 Live Demo

Check out the live demo: [https://jmcpheron.github.io/ccc-schedule/](https://jmcpheron.github.io/ccc-schedule/)

## Overview

CCC Schedule provides a modern, accessible interface for browsing community college course schedules with powerful search and filtering capabilities. The project includes both a responsive web application and Python utilities for data processing and validation.

## Features

### Web Application
- 🔍 **Advanced Search**: Real-time search across course titles, descriptions, and course numbers
- 🎯 **Smart Filtering**: Filter by term, college, subject, units, days, time, and more
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ♿ **WCAG 2.1 AA Compliant**: Full accessibility with keyboard navigation and screen reader support
- 🌓 **Dark Mode**: Automatic theme detection with manual toggle and persistence
- 📊 **Multiple Views**: Card view and table view for different browsing preferences
- 📄 **Pagination**: Efficient browsing of large course catalogs
- 🎨 **Customizable**: Easy to brand for your college's identity

### Data Processing
- ✅ **Data Validation**: Ensure schedule data integrity
- 🔄 **Format Conversion**: Convert between different data formats
- 📋 **CLI Tools**: Command-line utilities for data management
- 🧪 **Comprehensive Testing**: Full test suite with pytest

## Architecture

- **Frontend**: Single-page application using HTML5, Bootstrap 5, and jQuery
- **Data Format**: Unified JSON schema for all schedule data
- **Backend**: No server required - works with static files
- **Python Tools**: Data processing utilities with modern type hints
- **Deployment**: Can be hosted anywhere (GitHub Pages, S3, CDN, etc.)

## Prerequisites

- **For the web app**: Any modern web browser
- **For development**: Python 3.9+ and [UV](https://github.com/astral-sh/uv)

### Installing UV

```bash
# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or using pip
pip install uv
```

## Quick Start

### Using the Web Application

1. Clone the repository (or fork it for your own college)
2. Add your JSON data files to the `data/` directory
3. Customize the branding in `index.html`
4. Deploy to any static web host

### Development Setup

```bash
# Clone the repository
git clone https://github.com/jmcpheron/ccc-schedule.git
cd ccc-schedule

# Or if you've forked it:
# git clone https://github.com/YOUR-USERNAME/ccc-schedule.git
# cd ccc-schedule

# Install Python dependencies
uv sync --all-extras

# Run tests
uv run pytest

# Check code quality
uv run ruff check .
uv run mypy .

# Run locally
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

## Data Structure

The project uses a unified JSON schema that combines all schedule information:

```json
{
  "schedule": {
    "metadata": {
      "version": "1.0.0",
      "terms": [...],
      "colleges": [...]
    },
    "subjects": [...],
    "instructors": [...],
    "courses": [
      {
        "course_key": "CS-101",
        "title": "Introduction to Computer Science",
        "sections": [...]
      }
    ]
  }
}
```

See `data/schema.json` for a complete example.

## CLI Commands

The project includes powerful command-line tools for data management:

```bash
# Validate schedule data
uv run python -m src.cli schedule-validate data/schedule.json

# Show schedule information
uv run python -m src.cli schedule-info data/schedule.json

# Filter schedule data
uv run python -m src.cli schedule-filter data/schedule.json \
  --subject CS \
  --open-only \
  --output filtered.json

# Legacy commands (for backward compatibility)
uv run python -m src.cli validate data/courses.json
uv run python -m src.cli filter data/courses.json --min-units 3
```

## Python Development

This project uses UV for modern Python dependency management:

### Running Tests
```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov

# Run specific test file
uv run pytest tests/test_basics.py
```

### Code Quality
```bash
# Format code
uv run ruff format .

# Lint code
uv run ruff check .

# Type checking
uv run mypy .
```

### Managing Dependencies
```bash
# Add a dependency
uv add requests

# Add a dev dependency
uv add --dev pytest-watch

# Update dependencies
uv lock --upgrade
```

## Project Structure

```
ccc-schedule/
├── src/                    # Python source code
│   ├── __init__.py        # Package exports
│   ├── models.py          # Data models (dataclasses)
│   ├── data_utils.py      # Data processing utilities
│   └── cli.py             # Command-line interface
├── tests/                  # Python test suite
│   ├── conftest.py        # Pytest configuration
│   ├── test_models.py     # Model tests
│   ├── test_data_utils.py # Utility tests
│   └── test_schedule_utils.py # Schedule processing tests
├── data/                   # JSON data files
│   ├── schema.json        # Example unified schema
│   └── example.json       # Legacy example data
├── docs/                   # Documentation
│   ├── API.md             # Python API documentation
│   └── DEPLOYMENT.md      # Deployment guide
├── css/                    # Stylesheets
│   └── schedule.css       # Custom styles
├── js/                     # JavaScript files
│   └── schedule.js        # Main application logic
├── assets/                 # Static assets (logos, etc.)
├── index.html             # Main web application
├── pyproject.toml         # Python project configuration
├── uv.lock               # Locked dependencies
├── CONTRIBUTING.md        # Contributing guidelines
├── CLAUDE.md             # Claude Code instructions
└── README.md             # This file
```

## Testing

The Python components use pytest with:
- Fixtures for shared test utilities
- Parametrized tests for multiple scenarios
- Async support with pytest-asyncio
- Coverage reporting with pytest-cov

## Documentation

- [API Documentation](docs/API.md) - Python API reference and examples
- [Deployment Guide](docs/DEPLOYMENT.md) - How to deploy for your college
- [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) - Set up test branches and run locally with your data
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Development setup
- Code style guidelines
- Testing requirements
- Pull request process

## License

MIT