"""
Basic tests to verify the testing framework is set up correctly.
"""

import pytest


class TestBasicSetup:
    """Test basic project setup and configuration."""

    def test_pytest_is_working(self):
        """Verify that pytest is running correctly."""
        assert True

    def test_fixtures_are_available(self, sample_data):
        """Verify that fixtures from conftest.py are accessible."""
        assert sample_data["test_string"] == "Hello, World!"
        assert sample_data["test_number"] == 42
        assert len(sample_data["test_list"]) == 5

    def test_temp_directory_fixture(self, temp_dir):
        """Verify that the temporary directory fixture works."""
        test_file = temp_dir / "test.txt"
        test_file.write_text("Test content")

        assert test_file.exists()
        assert test_file.read_text() == "Test content"

    @pytest.mark.parametrize(
        "input,expected",
        [
            (1, 1),
            (2, 4),
            (3, 9),
            (4, 16),
            (5, 25),
        ],
    )
    def test_parametrized_example(self, input, expected):
        """Example of parametrized testing."""
        assert input**2 == expected


class TestExceptionHandling:
    """Test exception handling patterns."""

    def test_exception_is_raised(self):
        """Verify we can test for expected exceptions."""
        with pytest.raises(ValueError, match="Invalid value"):
            raise ValueError("Invalid value")

    def test_exception_context(self):
        """Verify we can capture exception details."""
        with pytest.raises(ZeroDivisionError) as exc_info:
            1 / 0  # noqa: B018

        assert "division by zero" in str(exc_info.value)
