# Claude Code Development Guide

This document provides instructions and context for Claude Code when working on the CCC Schedule project.

## Project Overview

CCC Schedule is a web-based class schedule viewer for California Community Colleges with Python utilities for data processing. The project uses UV for Python dependency management and testing.

## Key Commands

### Testing
```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/test_data_utils.py -v

# Run tests with coverage (when coverage is configured)
uv run pytest --cov=src
```

### Code Quality
```bash
# Format code
uv run ruff format .

# Check linting
uv run ruff check .

# Fix linting issues
uv run ruff check --fix .

# Type checking
uv run mypy src/
```

### Dependency Management
```bash
# Install all dependencies
uv sync --all-extras

# Add a new dependency
uv add package-name

# Add a dev dependency
uv add --dev package-name

# Update dependencies
uv lock --upgrade
```

### Running the CLI
```bash
# Validate course data
uv run python -m src.cli validate data/example.json

# Filter courses by units
uv run python -m src.cli filter data/example.json --min-units 3 --max-units 4
```

## Project Structure

- `src/` - Python source code for data utilities
- `tests/` - Test suite using pytest
- `data/` - JSON data files (example and actual schedule data)
- `css/`, `js/` - Frontend web application files
- `index.html` - Main web application entry point

## Development Workflow

1. Always run tests after making changes
2. Use ruff for formatting before committing
3. Run mypy for type checking
4. Write tests for new functionality
5. Keep Python 3.9+ compatibility

## Testing Conventions

- Use pytest fixtures for shared test data
- Group related tests in classes
- Use parametrized tests for multiple scenarios
- Mock external dependencies when appropriate

## Type Hints

- Use `Union[str, Path]` instead of `str | Path` for Python 3.9 compatibility
- Always add type hints to function signatures
- Use `typing` module imports for complex types

## Important Notes

- This is primarily a web project with Python utilities
- The build configuration is set up to not require a specific package structure
- UV manages all Python dependencies and virtual environments
- All tools (pytest, ruff, mypy) are run through UV