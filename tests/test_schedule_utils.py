"""Tests for schedule data utilities."""

import json
from datetime import datetime

import pytest

from src.data_utils import (
    filter_courses,
    get_unique_values,
    load_schedule_data,
    save_schedule_data,
)
from src.models import (
    College,
    CollegeTheme,
    Course,
    CourseAttributes,
    Enrollment,
    FilterOptions,
    GeneralEducation,
    Instructor,
    Location,
    Meeting,
    Metadata,
    Schedule,
    Section,
    SectionDates,
    Subject,
    Term,
    Textbook,
    Transferable,
)


class TestScheduleUtils:
    """Test schedule data utility functions."""

    @pytest.fixture
    def sample_schedule(self):
        """Create a sample schedule for testing."""
        metadata = Metadata(
            version="1.0.0",
            last_updated=datetime.now().isoformat(),
            terms=[
                Term(
                    code="202530",
                    name="Spring 2025",
                    start_date="2025-01-20",
                    end_date="2025-05-25",
                ),
                Term(
                    code="202540",
                    name="Summer 2025",
                    start_date="2025-06-01",
                    end_date="2025-08-15",
                ),
            ],
            colleges=[
                College(
                    id="main",
                    name="Main Campus",
                    abbreviation="MC",
                    logo_url="/logo.png",
                    theme=CollegeTheme(
                        primary_color="#003366", secondary_color="#0066CC"
                    ),
                ),
                College(
                    id="west",
                    name="West Campus",
                    abbreviation="WC",
                    logo_url="/logo-west.png",
                    theme=CollegeTheme(
                        primary_color="#660033", secondary_color="#CC0066"
                    ),
                ),
            ],
        )

        subjects = [
            Subject(code="CS", name="Computer Science", department="STEM"),
            Subject(code="MATH", name="Mathematics", department="STEM"),
            Subject(code="ENG", name="English", department="Liberal Arts"),
        ]

        instructors = [
            Instructor(
                id="1",
                name="Smith, John",
                email="jsmith@example.edu",
                departments=["CS"],
            ),
            Instructor(
                id="2", name="Doe, Jane", email="jdoe@example.edu", departments=["MATH"]
            ),
        ]

        # Create courses with different attributes for testing
        courses = [
            Course(
                course_key="CS-101",
                subject="CS",
                course_number="101",
                title="Introduction to Computer Science",
                description="An introduction to computer science concepts.",
                units=3.0,
                unit_type="semester",
                attributes=CourseAttributes(
                    transferable=Transferable(csu=True, uc=True, private=False),
                    general_education=GeneralEducation(
                        csu_area=["B4"], igetc_area=["2A"]
                    ),
                    degree_applicable=True,
                ),
                sections=[
                    Section(
                        crn="12345",
                        section_number="001",
                        term="202530",
                        college="main",
                        instruction_mode="In Person",
                        status="Open",
                        enrollment=Enrollment(
                            enrolled=24, capacity=30, waitlist=0, waitlist_capacity=5
                        ),
                        meetings=[
                            Meeting(
                                type="Lecture",
                                days=["M", "W"],
                                start_time="09:00",
                                end_time="10:30",
                                location=Location(
                                    building="Science", room="101", campus="Main"
                                ),
                            )
                        ],
                        instructors=["1"],
                        dates=SectionDates(
                            start="2025-01-20", end="2025-05-25", duration_weeks=16
                        ),
                        textbook=Textbook(
                            required=True, cost_category="Low", details="OER"
                        ),
                    ),
                    Section(
                        crn="12346",
                        section_number="002",
                        term="202530",
                        college="main",
                        instruction_mode="Online",
                        status="Closed",
                        enrollment=Enrollment(
                            enrolled=30, capacity=30, waitlist=5, waitlist_capacity=10
                        ),
                        meetings=[],
                        instructors=["1"],
                        dates=SectionDates(
                            start="2025-01-20", end="2025-05-25", duration_weeks=16
                        ),
                        textbook=Textbook(
                            required=False, cost_category="Zero", details="No textbook"
                        ),
                    ),
                ],
            ),
            Course(
                course_key="MATH-120",
                subject="MATH",
                course_number="120",
                title="Calculus I",
                description="Introduction to differential calculus.",
                units=4.0,
                unit_type="semester",
                attributes=CourseAttributes(
                    transferable=Transferable(csu=True, uc=True, private=True),
                    general_education=GeneralEducation(
                        csu_area=["B4"], igetc_area=["2"]
                    ),
                    degree_applicable=True,
                ),
                sections=[
                    Section(
                        crn="23456",
                        section_number="001",
                        term="202530",
                        college="west",
                        instruction_mode="Hybrid",
                        status="Open",
                        enrollment=Enrollment(
                            enrolled=18, capacity=25, waitlist=0, waitlist_capacity=5
                        ),
                        meetings=[
                            Meeting(
                                type="Lecture",
                                days=["T", "R"],
                                start_time="14:00",
                                end_time="15:30",
                                location=Location(
                                    building="Math", room="200", campus="West"
                                ),
                            )
                        ],
                        instructors=["2"],
                        dates=SectionDates(
                            start="2025-01-20", end="2025-05-25", duration_weeks=16
                        ),
                        textbook=Textbook(
                            required=True,
                            cost_category="High",
                            details="Required textbook",
                        ),
                    )
                ],
            ),
        ]

        return Schedule(
            metadata=metadata,
            subjects=subjects,
            instructors=instructors,
            courses=courses,
        )

    def test_save_and_load_schedule(self, tmp_path, sample_schedule):
        """Test saving and loading schedule data."""
        file_path = tmp_path / "test_schedule.json"

        # Save schedule
        save_schedule_data(sample_schedule, file_path)
        assert file_path.exists()

        # Load schedule
        loaded_schedule = load_schedule_data(file_path)

        # Verify data
        assert loaded_schedule.metadata.version == "1.0.0"
        assert len(loaded_schedule.courses) == 2
        assert loaded_schedule.courses[0].course_key == "CS-101"
        assert len(loaded_schedule.courses[0].sections) == 2

    def test_filter_courses_by_subject(self, sample_schedule):
        """Test filtering courses by subject."""
        filters = FilterOptions(subject="CS")
        filtered = filter_courses(sample_schedule.courses, filters)

        assert len(filtered) == 1
        assert filtered[0].subject == "CS"

    def test_filter_courses_by_units(self, sample_schedule):
        """Test filtering courses by unit range."""
        filters = FilterOptions(units_min=3.5, units_max=4.5)
        filtered = filter_courses(sample_schedule.courses, filters)

        assert len(filtered) == 1
        assert filtered[0].units == 4.0

    def test_filter_courses_by_term(self, sample_schedule):
        """Test filtering courses by term."""
        filters = FilterOptions(term="202530")
        filtered = filter_courses(sample_schedule.courses, filters)

        # Both courses have sections in Spring 2025
        assert len(filtered) == 2

    def test_filter_courses_by_college(self, sample_schedule):
        """Test filtering courses by college."""
        filters = FilterOptions(college="west")
        filtered = filter_courses(sample_schedule.courses, filters)

        assert len(filtered) == 1
        assert filtered[0].course_key == "MATH-120"

    def test_filter_courses_by_instruction_mode(self, sample_schedule):
        """Test filtering courses by instruction mode."""
        filters = FilterOptions(instruction_mode="Online")
        filtered = filter_courses(sample_schedule.courses, filters)

        assert len(filtered) == 1
        assert filtered[0].course_key == "CS-101"
        assert len(filtered[0].sections) == 1
        assert filtered[0].sections[0].instruction_mode == "Online"

    def test_filter_courses_open_only(self, sample_schedule):
        """Test filtering for open sections only."""
        filters = FilterOptions(open_only=True)
        filtered = filter_courses(sample_schedule.courses, filters)

        # CS-101 has one open section, MATH-120 has one open section
        assert len(filtered) == 2
        for course in filtered:
            for section in course.sections:
                assert section.status == "Open"

    def test_filter_courses_by_days(self, sample_schedule):
        """Test filtering courses by meeting days."""
        filters = FilterOptions(days=["T", "R"])
        filtered = filter_courses(sample_schedule.courses, filters)

        assert len(filtered) == 1
        assert filtered[0].course_key == "MATH-120"

    def test_filter_courses_by_time(self, sample_schedule):
        """Test filtering courses by time range."""
        filters = FilterOptions(start_time="08:00", end_time="11:00")
        filtered = filter_courses(sample_schedule.courses, filters)

        assert len(filtered) == 1
        assert filtered[0].course_key == "CS-101"
        assert len(filtered[0].sections) == 1  # Only the in-person section matches

    def test_filter_courses_by_keyword(self, sample_schedule):
        """Test filtering courses by keyword search."""
        filters = FilterOptions(keyword="calculus")
        filtered = filter_courses(sample_schedule.courses, filters)

        assert len(filtered) == 1
        assert filtered[0].course_key == "MATH-120"

    def test_filter_courses_by_transferable(self, sample_schedule):
        """Test filtering courses by transferable status."""
        filters = FilterOptions(transferable="UC")
        filtered = filter_courses(sample_schedule.courses, filters)

        # Both courses are UC transferable
        assert len(filtered) == 2

    def test_filter_courses_by_ge_area(self, sample_schedule):
        """Test filtering courses by GE area."""
        filters = FilterOptions(ge_area="B4")
        filtered = filter_courses(sample_schedule.courses, filters)

        # Both courses have B4 in CSU GE
        assert len(filtered) == 2

    def test_filter_courses_by_textbook_cost(self, sample_schedule):
        """Test filtering courses by textbook cost."""
        filters = FilterOptions(textbook_cost="Zero")
        filtered = filter_courses(sample_schedule.courses, filters)

        assert len(filtered) == 1
        assert filtered[0].course_key == "CS-101"
        assert len(filtered[0].sections) == 1
        assert filtered[0].sections[0].textbook.cost_category == "Zero"

    def test_filter_courses_multiple_criteria(self, sample_schedule):
        """Test filtering with multiple criteria."""
        filters = FilterOptions(
            subject="CS",
            instruction_mode="In Person",
            open_only=True,
            units_min=3.0,
            units_max=3.0,
        )
        filtered = filter_courses(sample_schedule.courses, filters)

        assert len(filtered) == 1
        assert filtered[0].course_key == "CS-101"
        assert len(filtered[0].sections) == 1
        assert filtered[0].sections[0].crn == "12345"

    def test_get_unique_values(self, sample_schedule):
        """Test extracting unique values from schedule."""
        unique_values = get_unique_values(sample_schedule)

        assert "202530" in unique_values["terms"]
        assert "202540" in unique_values["terms"]
        assert "main" in unique_values["colleges"]
        assert "west" in unique_values["colleges"]
        assert "CS" in unique_values["subjects"]
        assert "MATH" in unique_values["subjects"]
        assert "In Person" in unique_values["instruction_modes"]
        assert "Online" in unique_values["instruction_modes"]
        assert "Hybrid" in unique_values["instruction_modes"]
        assert "Low" in unique_values["textbook_costs"]
        assert "Zero" in unique_values["textbook_costs"]
        assert "High" in unique_values["textbook_costs"]
        assert "B4" in unique_values["ge_areas"]
        assert "2A" in unique_values["ge_areas"]

    def test_load_schedule_with_nested_structure(self, tmp_path):
        """Test loading schedule data with 'schedule' wrapper."""
        data = {
            "schedule": {
                "metadata": {
                    "version": "1.0.0",
                    "last_updated": datetime.now().isoformat(),
                    "terms": [],
                    "colleges": [],
                },
                "subjects": [],
                "instructors": [],
                "courses": [],
            }
        }

        file_path = tmp_path / "nested_schedule.json"
        with open(file_path, "w") as f:
            json.dump(data, f)

        schedule = load_schedule_data(file_path)
        assert schedule.metadata.version == "1.0.0"
