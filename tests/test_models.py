"""Tests for data models."""

from datetime import datetime

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


class TestModels:
    """Test data model classes."""

    def test_term_creation(self):
        """Test Term model creation."""
        term = Term(
            code="202530",
            name="Spring 2025",
            start_date="2025-01-20",
            end_date="2025-05-25",
        )
        assert term.code == "202530"
        assert term.name == "Spring 2025"
        assert term.start_date == "2025-01-20"
        assert term.end_date == "2025-05-25"

    def test_college_with_theme(self):
        """Test College model with theme."""
        theme = CollegeTheme(primary_color="#003366", secondary_color="#0066CC")
        college = College(
            id="example",
            name="Example Community College",
            abbreviation="ECC",
            logo_url="/assets/logo.png",
            theme=theme,
        )
        assert college.id == "example"
        assert college.theme.primary_color == "#003366"

    def test_course_attributes(self):
        """Test CourseAttributes with nested objects."""
        transferable = Transferable(csu=True, uc=True, private=False)
        ge = GeneralEducation(csu_area=["B4"], igetc_area=["2A"], local=["Area D"])
        attributes = CourseAttributes(
            transferable=transferable,
            general_education=ge,
            c_id="COMP 112",
            degree_applicable=True,
            basic_skills=False,
        )
        assert attributes.transferable.csu is True
        assert "B4" in attributes.general_education.csu_area

    def test_section_with_meetings(self):
        """Test Section model with meetings."""
        location = Location(building="Science", room="101", campus="Main")
        meeting = Meeting(
            type="Lecture",
            days=["M", "W"],
            start_time="09:00",
            end_time="10:30",
            location=location,
        )
        enrollment = Enrollment(
            enrolled=24, capacity=30, waitlist=0, waitlist_capacity=5
        )
        dates = SectionDates(start="2025-01-20", end="2025-05-25", duration_weeks=16)
        textbook = Textbook(
            required=True, cost_category="Low", details="Open Educational Resources"
        )
        section = Section(
            crn="12345",
            section_number="001",
            term="202530",
            college="example",
            instruction_mode="In Person",
            status="Open",
            enrollment=enrollment,
            meetings=[meeting],
            instructors=["1"],
            dates=dates,
            textbook=textbook,
        )
        assert section.crn == "12345"
        assert len(section.meetings) == 1
        assert section.meetings[0].location.building == "Science"
        assert section.enrollment.enrolled == 24

    def test_course_with_sections(self):
        """Test Course model with sections."""
        section = Section(
            crn="12345",
            section_number="001",
            term="202530",
            college="example",
            instruction_mode="In Person",
            status="Open",
            enrollment=Enrollment(
                enrolled=24, capacity=30, waitlist=0, waitlist_capacity=5
            ),
            meetings=[],
            instructors=["1"],
            dates=SectionDates(start="2025-01-20", end="2025-05-25", duration_weeks=16),
            textbook=Textbook(required=True, cost_category="Low", details="OER"),
        )
        course = Course(
            course_key="CS-101",
            subject="CS",
            course_number="101",
            title="Introduction to Computer Science",
            description="An introduction to computer science concepts.",
            units=3.0,
            unit_type="semester",
            sections=[section],
        )
        assert course.course_key == "CS-101"
        assert len(course.sections) == 1
        assert course.sections[0].crn == "12345"

    def test_schedule_complete(self):
        """Test complete Schedule model."""
        metadata = Metadata(
            version="1.0.0",
            last_updated=datetime.now().isoformat(),
            terms=[
                Term(
                    code="202530",
                    name="Spring 2025",
                    start_date="2025-01-20",
                    end_date="2025-05-25",
                )
            ],
            colleges=[
                College(
                    id="example",
                    name="Example CC",
                    abbreviation="ECC",
                    logo_url="/logo.png",
                    theme=CollegeTheme(primary_color="#000", secondary_color="#FFF"),
                )
            ],
        )
        subjects = [Subject(code="CS", name="Computer Science", department="STEM")]
        instructors = [
            Instructor(
                id="1",
                name="Smith, John",
                email="jsmith@example.edu",
                departments=["CS"],
            )
        ]
        courses = []

        schedule = Schedule(
            metadata=metadata,
            subjects=subjects,
            instructors=instructors,
            courses=courses,
        )
        assert schedule.metadata.version == "1.0.0"
        assert len(schedule.subjects) == 1
        assert schedule.subjects[0].code == "CS"

    def test_filter_options(self):
        """Test FilterOptions model."""
        filters = FilterOptions(
            term="202530",
            subject="CS",
            units_min=3.0,
            units_max=4.0,
            open_only=True,
            keyword="programming",
        )
        assert filters.term == "202530"
        assert filters.units_min == 3.0
        assert filters.open_only is True
        assert filters.keyword == "programming"

    def test_filter_options_defaults(self):
        """Test FilterOptions with default values."""
        filters = FilterOptions()
        assert filters.term is None
        assert filters.college is None
        assert filters.subject is None
        assert filters.open_only is False
        assert filters.days is None
