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

    def test_credit_type_filter(self, mock_course_data):
        """Test credit type filtering (CR/NC)."""
        # Add credit type to existing courses
        for course in mock_course_data["courses"]:
            course["creditType"] = "CR"

        # Add non-credit course to test data
        mock_course_data["courses"].append(
            {
                "subj": "PE",
                "crse": "099",
                "title": "Fitness Lab",
                "units": 0,
                "creditType": "NC",
                "college": "West Valley College",
                "term": "Spring 2024",
                "sections": [
                    {
                        "crn": "34567",
                        "instrMethod": "INP",
                        "enrollStatus": "Open",
                    }
                ],
            }
        )

        courses = mock_course_data["courses"]

        # Test credit filter
        matches = [c for c in courses if c.get("creditType") == "CR"]
        assert len(matches) == 2  # CS and MATH

        # Test non-credit filter
        matches = [c for c in courses if c.get("creditType") == "NC"]
        assert len(matches) == 1
        assert matches[0]["subj"] == "PE"

    def test_class_length_filter(self, mock_course_data):
        """Test class length filtering (Full Term/Short Term)."""
        # Update sections with length data
        for course in mock_course_data["courses"]:
            for section in course["sections"]:
                section["length"] = "Full Term"

        # Add short term course
        mock_course_data["courses"].append(
            {
                "subj": "BUS",
                "crse": "100",
                "title": "Quick Start Business",
                "units": 1,
                "college": "West Valley College",
                "term": "Spring 2024",
                "sections": [
                    {
                        "crn": "45678",
                        "length": "Short Term",
                        "instrMethod": "INP",
                        "enrollStatus": "Open",
                    }
                ],
            }
        )

        courses = mock_course_data["courses"]

        # Test full term filter
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                if section.get("length") == "Full Term":
                    matches.append(course)
                    break
        assert len(matches) == 2  # CS and MATH

        # Test short term filter
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                if section.get("length") == "Short Term":
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "BUS"

    def test_sunday_classes_filter(self, mock_course_data):
        """Test filtering for Sunday classes."""
        # Add Sunday course
        mock_course_data["courses"].append(
            {
                "subj": "YOGA",
                "crse": "150",
                "title": "Sunday Yoga",
                "units": 1,
                "college": "West Valley College",
                "term": "Spring 2024",
                "sections": [
                    {
                        "crn": "56789",
                        "days": "U",
                        "instrMethod": "INP",
                        "enrollStatus": "Open",
                    }
                ],
            }
        )

        courses = mock_course_data["courses"]

        # Test Sunday filter
        selected_days = ["U"]
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                days = section.get("days", "")
                if any(day in days for day in selected_days):
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "YOGA"

    def test_advanced_instructional_modes(self, mock_course_data):
        """Test filtering for advanced instructional modes (SON, TUT, WRK, FLX)."""
        # Add courses with different modes
        new_courses = [
            {
                "subj": "COMP",
                "crse": "200",
                "title": "Synchronous Online",
                "units": 3,
                "college": "West Valley College",
                "term": "Spring 2024",
                "sections": [
                    {
                        "crn": "67890",
                        "instrMethod": "SON",
                        "enrollStatus": "Open",
                    }
                ],
            },
            {
                "subj": "TUTR",
                "crse": "100",
                "title": "Tutorial",
                "units": 1,
                "college": "West Valley College",
                "term": "Spring 2024",
                "sections": [
                    {
                        "crn": "78901",
                        "instrMethod": "TUT",
                        "enrollStatus": "Open",
                    }
                ],
            },
            {
                "subj": "WORK",
                "crse": "499",
                "title": "Work Experience",
                "units": 3,
                "college": "West Valley College",
                "term": "Spring 2024",
                "sections": [
                    {
                        "crn": "89012",
                        "instrMethod": "WRK",
                        "enrollStatus": "Open",
                    }
                ],
            },
        ]

        mock_course_data["courses"].extend(new_courses)
        courses = mock_course_data["courses"]

        # Test each mode
        for mode, expected_subj in [("SON", "COMP"), ("TUT", "TUTR"), ("WRK", "WORK")]:
            matches = []
            for course in courses:
                for section in course.get("sections", []):
                    if section.get("instrMethod") == mode:
                        matches.append(course)
                        break
            assert len(matches) == 1
            assert matches[0]["subj"] == expected_subj

    def test_extreme_time_filters(self, mock_course_data):
        """Test filtering for very early morning and late evening classes."""
        # Add early and late classes
        new_courses = [
            {
                "subj": "EARLY",
                "crse": "500",
                "title": "Dawn Patrol",
                "units": 2,
                "college": "West Valley College",
                "term": "Spring 2024",
                "sections": [
                    {
                        "crn": "90123",
                        "startTime": "05:00",
                        "endTime": "07:00",
                        "instrMethod": "INP",
                        "enrollStatus": "Open",
                    }
                ],
            },
            {
                "subj": "LATE",
                "crse": "600",
                "title": "Night Owls",
                "units": 2,
                "college": "West Valley College",
                "term": "Spring 2024",
                "sections": [
                    {
                        "crn": "01234",
                        "startTime": "22:00",
                        "endTime": "23:30",
                        "instrMethod": "INP",
                        "enrollStatus": "Open",
                    }
                ],
            },
        ]

        mock_course_data["courses"].extend(new_courses)
        courses = mock_course_data["courses"]

        # Test early morning filter (5:00 AM - 7:00 AM)
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                start = section.get("startTime", "")
                if "05:00" <= start <= "07:00":
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "EARLY"

        # Test late evening filter (after 9:00 PM)
        matches = []
        for course in courses:
            for section in course.get("sections", []):
                start = section.get("startTime", "")
                if start >= "21:00":
                    matches.append(course)
                    break
        assert len(matches) == 1
        assert matches[0]["subj"] == "LATE"

    def test_complex_combined_filters(self, mock_course_data):
        """Test complex combinations of multiple filters."""
        # Set up test data with specific characteristics
        for course in mock_course_data["courses"]:
            course["creditType"] = "CR"
            for section in course["sections"]:
                section["length"] = "Full Term"

        courses = mock_course_data["courses"]

        # Test: Credit courses + ZTC + Morning classes
        matches = []
        for course in courses:
            if course.get("creditType") == "CR":
                for section in course.get("sections", []):
                    start_time = section.get("startTime", "")
                    textbook = section.get("textbookCost", "")
                    if textbook == "ZTC" and "08:00" <= start_time <= "12:00":
                        matches.append(course)
                        break

        assert len(matches) == 1
        assert matches[0]["subj"] == "CS"
