# Claude Code Testing Instructions

This document provides specific testing instructions for Claude Code when working with the CCC Schedule test suite. These supplement the main CLAUDE.md file.

## Test Suite Overview

The test suite uses pytest with the following key files:
- `conftest.py` - Shared fixtures and test configuration
- `test_data_utils.py` - Tests for data validation and processing
- `test_schedule_utils.py` - Tests for schedule-specific utilities
- `test_models.py` - Tests for data models
- `test_search_functionality.py` - Tests for search features
- `test_frontend_elements.py` - Tests for UI component validation
- `test_responsive_design.py` - Tests for responsive design checks

## Testing Commands

```bash
# Run all tests with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/test_data_utils.py -v

# Run tests matching a pattern
uv run pytest -k "test_validate" -v

# Run with coverage (when configured)
uv run pytest --cov=src --cov-report=html

# Run tests in parallel (if pytest-xdist installed)
uv run pytest -n auto
```

## Writing New Tests

### Test Structure
- Use descriptive test names: `test_validate_course_with_invalid_units_raises_error`
- Group related tests in classes when appropriate
- Use pytest.mark.parametrize for testing multiple scenarios
- Keep tests focused on single behaviors

### Fixtures
- Check `conftest.py` for available fixtures before creating new ones
- Create module-specific fixtures in the test file if only used there
- Use fixture scope appropriately (function, class, module, session)

### Example Patterns

```python
# Parametrized tests for multiple cases
@pytest.mark.parametrize("input,expected", [
    ("CS-101", True),
    ("MATH-200A", True),
    ("", False),
])
def test_course_id_validation(input, expected):
    assert is_valid_course_id(input) == expected

# Testing exceptions
def test_invalid_crn_raises_error():
    with pytest.raises(ValueError, match="CRN must be numeric"):
        validate_crn("ABC123")

# Using fixtures
def test_transform_schedule(sample_rio_hondo_data):
    result = transform_schedule(sample_rio_hondo_data)
    assert result["metadata"]["college"]["id"] == "rio-hondo"
```

## Test Data

### Location
- Small test fixtures: Inline in test files or conftest.py
- Large test data: Create files in `tests/fixtures/` directory
- Use realistic data that covers edge cases

### Creating Test Data
```python
# Good: Minimal but complete
sample_course = {
    "course_id": "CS-101",
    "subject": "CS",
    "course_number": "101",
    "title": "Intro to CS",
    "units": 3.0,
    "sections": []
}

# Avoid: Overly complex test data that obscures the test purpose
```

## Common Testing Patterns

### Data Validation Tests
- Test both valid and invalid inputs
- Test boundary conditions (0, negative, very large values)
- Test required vs optional fields
- Test data type conversions

### Transformer Tests
- Test with minimal valid input
- Test handling of missing optional fields
- Test edge cases (empty arrays, null values)
- Verify output matches schema

### Search/Filter Tests
- Test exact matches
- Test partial matches
- Test case sensitivity
- Test special characters
- Test empty results

## Performance Considerations

- Mock external dependencies (file I/O, network calls)
- Use small datasets for unit tests
- Create separate integration tests for full-scale testing
- Set appropriate timeouts for long-running tests

## Test Organization

### Naming Convention
- Test files: `test_<module_name>.py`
- Test functions: `test_<specific_behavior>`
- Test classes: `Test<ComponentName>`

### Test Categories
- Unit tests: Test individual functions/methods
- Integration tests: Test component interactions
- Validation tests: Test data integrity
- Edge case tests: Test boundary conditions

## Debugging Failed Tests

```bash
# Run single test with print statements visible
uv run pytest tests/test_data_utils.py::test_specific_function -v -s

# Run with pdb on failure
uv run pytest --pdb

# Show local variables on failure
uv run pytest -l
```

## Important Reminders

1. **Always run tests after changes** - Use `uv run pytest` before committing
2. **Test the actual behavior** - Not the implementation details
3. **Keep tests independent** - Each test should be runnable in isolation
4. **Use meaningful assertions** - Include assertion messages for clarity
5. **Test error paths** - Not just the happy path
6. **Update tests when updating code** - Keep tests in sync with implementation

## When Adding New Features

1. Write tests first (TDD approach) or immediately after implementation
2. Cover both positive and negative cases
3. Add integration tests if feature spans multiple modules
4. Update this file if introducing new testing patterns