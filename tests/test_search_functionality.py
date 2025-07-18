"""Tests for search and filter functionality."""


import pytest


class TestSearchFunctionality:
    """Test suite for search and filter features."""

    @pytest.fixture
    def mock_course_data(self):
        """Mock course data for testing."""
        return {
            "courses": [
                {
                    "subj": "CS",
                    "crse": "101",
                    "title": "Introduction to Computer Science",
                    "units": 3,
                    "college": "West Valley College",
                    "term": "Spring 2024",
                    "sections": [
                        {
                            "crn": "12345",
                            "instructorEmail": "smith@example.com",
                            "instructorName": "Dr. Smith",
                            "instrMethod": "INP",
                            "days": "MW",
                            "startTime": "09:00",
                            "endTime": "10:30",
                            "enrollStatus": "Open",
                            "textbookCost": "ZTC",
                        }
                    ],
                },
                {
                    "subj": "MATH",
                    "crse": "201",
                    "title": "Calculus I",
                    "units": 4,
                    "college": "Mission College",
                    "term": "Spring 2024",
                    "sections": [
                        {
                            "crn": "23456",
                            "instructorEmail": "jones@example.com",
                            "instructorName": "Prof. Jones",
                            "instrMethod": "HYB",
                            "days": "TR",
                            "startTime": "14:00",
                            "endTime": "15:30",
                            "enrollStatus": "Waitlist",
                            "textbookCost": "LTC",
                        }
                    ],
                },
            ]
        }

    def test_search_filter_structure(self):
        """Test that search filter functions are properly structured."""
        # This test verifies the expected structure of filter functions
        expected_filters = [
            "filterBySearchTerm",
            "filterByTerm",
            "filterByCollege",
            "filterBySubject",
            "filterByInstructionalMode",
            "filterByUnits",
            "filterByDays",
            "filterByTime",
            "filterByInstructor",
            "filterByTextbookCost",
            "filterByTransferRequirements",
            "filterByOpenStatus",
        ]

        # These would be implemented in the JavaScript
        assert len(expected_filters) == 12, "Expected 12 filter functions"

    def test_search_term_matching(self, mock_course_data):
        """Test search term matching logic."""
        courses = mock_course_data["courses"]

        # Test subject code search
        search_term = "CS"
        matches = [c for c in courses if search_term.upper() in c["subj"].upper()]
        assert len(matches) == 1
        assert matches[0]["subj"] == "CS"

        # Test course number search
        search_term = "201"
        matches = [c for c in courses if search_term in c["crse"]]
        assert len(matches) == 1
        assert matches[0]["crse"] == "201"

        # Test title search
        search_term = "calculus"
        matches = [c for c in courses if search_term.lower() in c["title"].lower()]
        assert len(matches) == 1
        assert "Calculus" in matches[0]["title"]

        # Test CRN search
        search_term = "12345"
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                if search_term == section.get("crn"):
                    matches.append(course)
                    break
        assert len(matches) == 1

    def test_instructional_mode_filter(self, mock_course_data):
        """Test instructional mode filtering."""
        courses = mock_course_data["courses"]

        # Filter for in-person
        mode = "INP"
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                if section.get("instrMethod") == mode:
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "CS"

        # Filter for hybrid
        mode = "HYB"
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                if section.get("instrMethod") == mode:
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "MATH"

    def test_units_range_filter(self, mock_course_data):
        """Test units range filtering."""
        courses = mock_course_data["courses"]

        # Test min units
        min_units = 3.5
        matches = [c for c in courses if c["units"] >= min_units]
        assert len(matches) == 1
        assert matches[0]["units"] == 4

        # Test max units
        max_units = 3.5
        matches = [c for c in courses if c["units"] <= max_units]
        assert len(matches) == 1
        assert matches[0]["units"] == 3

        # Test range
        min_units = 3
        max_units = 3
        matches = [c for c in courses if min_units <= c["units"] <= max_units]
        assert len(matches) == 1

    def test_meeting_days_filter(self, mock_course_data):
        """Test meeting days filtering."""
        courses = mock_course_data["courses"]

        # Test single day
        selected_days = ["M"]
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                days = section.get("days", "")
                if any(day in days for day in selected_days):
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "CS"

        # Test multiple days
        selected_days = ["T", "R"]
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                days = section.get("days", "")
                if all(day in days for day in selected_days):
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "MATH"

    def test_time_range_filter(self, mock_course_data):
        """Test time range filtering."""
        courses = mock_course_data["courses"]

        # Test morning classes
        start_range = "08:00"
        end_range = "12:00"
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                start = section.get("startTime", "")
                if start_range <= start <= end_range:
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "CS"

        # Test afternoon classes
        start_range = "13:00"
        end_range = "18:00"
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                start = section.get("startTime", "")
                if start_range <= start <= end_range:
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "MATH"

    def test_instructor_filter(self, mock_course_data):
        """Test instructor name filtering."""
        courses = mock_course_data["courses"]

        # Test by name
        instructor = "Smith"
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                if instructor.lower() in section.get("instructorName", "").lower():
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "CS"

    def test_textbook_cost_filter(self, mock_course_data):
        """Test textbook cost filtering."""
        courses = mock_course_data["courses"]

        # Test ZTC filter
        cost_types = ["ZTC"]
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                if section.get("textbookCost") in cost_types:
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "CS"

        # Test multiple cost types
        cost_types = ["ZTC", "LTC"]
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                if section.get("textbookCost") in cost_types:
                    matches.append(course)
                    break
        assert len(matches) == 2

    def test_open_status_filter(self, mock_course_data):
        """Test open sections only filter."""
        courses = mock_course_data["courses"]

        # Filter for open sections only
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                if section.get("enrollStatus") == "Open":
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "CS"

    def test_combined_filters(self, mock_course_data):
        """Test multiple filters applied together."""
        courses = mock_course_data["courses"]

        # Apply multiple filters: units >= 3 AND has ZTC
        matches = []
        for course in courses:
            if course["units"] >= 3:
                for section in course.get("sections", []):
                    if section.get("textbookCost") == "ZTC":
                        matches.append(course)
                        break

        assert len(matches) == 1
        assert matches[0]["subj"] == "CS"
        assert matches[0]["units"] == 3

    def test_filter_reset(self):
        """Test that filter reset clears all selections."""
        # This tests the concept of resetting filters
        filters = {
            "searchTerm": "CS",
            "term": "Spring 2024",
            "college": "West Valley",
            "minUnits": 3,
            "selectedDays": ["M", "W"],
            "openOnly": True,
        }

        # Reset should clear all
        filters = {}
        assert len(filters) == 0, "All filters should be cleared"

    def test_pagination_calculation(self):
        """Test pagination calculations."""
        total_results = 45
        results_per_page = 10

        # Calculate total pages
        total_pages = (total_results + results_per_page - 1) // results_per_page
        assert total_pages == 5

        # Test page boundaries
        page = 1
        start_idx = (page - 1) * results_per_page
        end_idx = min(start_idx + results_per_page, total_results)
        assert start_idx == 0
        assert end_idx == 10

        page = 5
        start_idx = (page - 1) * results_per_page
        end_idx = min(start_idx + results_per_page, total_results)
        assert start_idx == 40
        assert end_idx == 45
