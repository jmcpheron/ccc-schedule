"""Tests for data utility functions."""

import json

import pytest

from src.data_utils import filter_courses_by_units, load_json_data, validate_course_data


class TestLoadJsonData:
    """Test JSON data loading functionality."""

    def test_load_valid_json(self, temp_dir):
        """Test loading valid JSON file."""
        # Create a test JSON file
        test_data = {"courses": ["CS101", "MATH201"], "total": 2}
        json_file = temp_dir / "test.json"
        json_file.write_text(json.dumps(test_data))

        # Load and verify
        result = load_json_data(json_file)
        assert result == test_data

    def test_load_missing_file(self):
        """Test loading non-existent file."""
        with pytest.raises(FileNotFoundError, match="File not found"):
            load_json_data("nonexistent.json")

    def test_load_invalid_json(self, temp_dir):
        """Test loading invalid JSON file."""
        json_file = temp_dir / "invalid.json"
        json_file.write_text("{ invalid json }")

        with pytest.raises(json.JSONDecodeError):
            load_json_data(json_file)


class TestValidateCourseData:
    """Test course data validation."""

    def test_valid_course_data(self):
        """Test validation of properly formatted courses."""
        courses = [
            {
                "course_id": "CS101",
                "title": "Intro to Computer Science",
                "units": 3,
                "description": "Basic CS concepts",
            },
            {
                "course_id": "MATH201",
                "title": "Calculus I",
                "units": 4,
                "description": "Differential calculus",
            },
        ]
        # Should not raise any exception
        validate_course_data(courses)

    def test_missing_required_fields(self):
        """Test validation with missing fields."""
        courses = [
            {
                "course_id": "CS101",
                "title": "Intro to CS",
                # Missing 'units' and 'description'
            }
        ]
        with pytest.raises(ValueError, match="missing required fields"):
            validate_course_data(courses)

    def test_invalid_units_type(self):
        """Test validation with invalid units type."""
        courses = [
            {
                "course_id": "CS101",
                "title": "Intro to CS",
                "units": "three",  # Should be numeric
                "description": "Basic CS",
            }
        ]
        with pytest.raises(ValueError, match="invalid units value"):
            validate_course_data(courses)

    def test_negative_units(self):
        """Test validation with negative units."""
        courses = [
            {
                "course_id": "CS101",
                "title": "Intro to CS",
                "units": -1,
                "description": "Basic CS",
            }
        ]
        with pytest.raises(ValueError, match="negative units"):
            validate_course_data(courses)


class TestFilterCoursesByUnits:
    """Test course filtering by units."""

    @pytest.fixture
    def sample_courses(self):
        """Provide sample course data."""
        return [
            {"course_id": "CS101", "title": "Intro to CS", "units": 3},
            {"course_id": "MATH201", "title": "Calculus I", "units": 4},
            {"course_id": "PE100", "title": "Physical Ed", "units": 1},
            {"course_id": "CHEM301", "title": "Organic Chemistry", "units": 5},
            {"course_id": "ART150", "title": "Art History", "units": 3},
        ]

    def test_filter_default_range(self, sample_courses):
        """Test filtering with default range (all courses)."""
        result = filter_courses_by_units(sample_courses)
        assert len(result) == 5

    def test_filter_by_min_units(self, sample_courses):
        """Test filtering by minimum units."""
        result = filter_courses_by_units(sample_courses, min_units=3)
        assert len(result) == 4  # Excludes PE100 (1 unit)
        assert all(course["units"] >= 3 for course in result)

    def test_filter_by_max_units(self, sample_courses):
        """Test filtering by maximum units."""
        result = filter_courses_by_units(sample_courses, max_units=3)
        assert len(result) == 3  # CS101, PE100, ART150
        assert all(course["units"] <= 3 for course in result)

    def test_filter_by_range(self, sample_courses):
        """Test filtering by unit range."""
        result = filter_courses_by_units(sample_courses, min_units=2, max_units=4)
        assert len(result) == 3  # CS101, MATH201, ART150
        assert all(2 <= course["units"] <= 4 for course in result)

    def test_filter_empty_list(self):
        """Test filtering empty course list."""
        result = filter_courses_by_units([])
        assert result == []

    @pytest.mark.parametrize(
        "min_units,max_units,expected_count",
        [
            (0, 1, 1),  # Only PE100
            (3, 3, 2),  # CS101 and ART150
            (5, 10, 1),  # Only CHEM301
            (10, 20, 0),  # No courses
        ],
    )
    def test_filter_parametrized(
        self, sample_courses, min_units, max_units, expected_count
    ):
        """Test filtering with various parameter combinations."""
        result = filter_courses_by_units(
            sample_courses, min_units=min_units, max_units=max_units
        )
        assert len(result) == expected_count
