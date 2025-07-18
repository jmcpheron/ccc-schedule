# Contributing to CCC Schedule

Thank you for your interest in contributing to the CCC Schedule project! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Python 3.9 or higher
- UV package manager (install with `pip install uv`)
- Node.js (for running the development server)

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ccc-schedule.git
cd ccc-schedule
```

2. Install Python dependencies:
```bash
uv sync --all-extras
```

3. Run tests to ensure everything is working:
```bash
uv run pytest
```

## Project Structure

```
ccc-schedule/
├── src/               # Python source code
│   ├── models.py      # Data models using dataclasses
│   ├── data_utils.py  # Data processing utilities
│   └── cli.py         # Command-line interface
├── tests/             # Test suite
├── index.html         # Main web application
├── js/                # JavaScript files
│   └── schedule.js    # Core application logic
├── css/               # Stylesheets
│   └── schedule.css   # Custom styles
├── data/              # Data files
│   ├── schema.json    # Example data schema
│   └── example.json   # Legacy example data
├── assets/            # Static assets (logos, etc.)
└── ccc-schedule-examples/  # Real-world implementations
```

## Development Workflow

### Python Development

1. **Adding New Features**
   - Add new functions to `src/data_utils.py` or create new modules
   - Update data models in `src/models.py` if needed
   - Export new functions in `src/__init__.py`

2. **Writing Tests**
   - Add tests for new functionality in `tests/`
   - Use pytest fixtures for shared test data
   - Aim for high test coverage

3. **Code Quality**
   ```bash
   # Format code
   uv run ruff format .
   
   # Check linting
   uv run ruff check .
   
   # Type checking
   uv run mypy src/
   ```

### Frontend Development

1. **Modifying the UI**
   - Update HTML structure in `index.html`
   - Modify JavaScript logic in `js/schedule.js`
   - Update styles in `css/schedule.css`

2. **Testing Frontend**
   - Open `index.html` in a web browser
   - Or use the example server:
   ```bash
   python -m http.server 8000
   ```

## Data Format

The project uses a unified JSON schema for schedule data. See `data/schema.json` for the complete structure.

### Key Components:

1. **Metadata**: Version, terms, colleges
2. **Subjects**: Subject codes and names
3. **Instructors**: Instructor information
4. **Courses**: Course details with nested sections

### Example Course Structure:
```json
{
  "course_key": "CS-101",
  "subject": "CS",
  "course_number": "101",
  "title": "Introduction to Computer Science",
  "units": 3.0,
  "sections": [
    {
      "crn": "12345",
      "status": "Open",
      "meetings": [...]
    }
  ]
}
```

## CLI Commands

The project includes several CLI commands for data processing:

```bash
# Validate schedule data
uv run python -m src.cli schedule-validate data/schema.json

# Get schedule information
uv run python -m src.cli schedule-info data/schema.json

# Filter schedule data
uv run python -m src.cli schedule-filter data/schema.json --subject CS --open-only
```

## Adding Support for a New College

1. Create a new data file following the schema in `data/schema.json`
2. Update the metadata section with college information
3. Add college-specific attributes if needed
4. Test data loading and filtering

## Code Style Guidelines

- Use type hints for all function parameters and return values
- Follow PEP 8 style guidelines (enforced by ruff)
- Write descriptive docstrings for all public functions
- Keep functions focused and single-purpose
- Use meaningful variable names

## Testing Guidelines

- Write tests for all new functionality
- Use parametrized tests for multiple scenarios
- Mock external dependencies when appropriate
- Run the full test suite before submitting changes:
  ```bash
  uv run pytest -v
  ```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and quality checks
5. Commit your changes with clear messages
6. Push to your fork
7. Open a Pull Request with a clear description

## Reporting Issues

- Use the GitHub issue tracker
- Include relevant information:
  - Python version
  - Error messages
  - Steps to reproduce
  - Expected vs actual behavior

## Questions?

If you have questions about contributing, please open an issue for discussion.