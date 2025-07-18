"""Utilities for processing schedule data."""

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Union

from .models import (
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


def load_json_data(file_path: Union[str, Path]) -> dict[str, Any]:
    """Load JSON data from a file.

    Args:
        file_path: Path to the JSON file

    Returns:
        Dictionary containing the parsed JSON data

    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(path, encoding="utf-8") as f:
        data: dict[str, Any] = json.load(f)
        return data


def validate_course_data(courses: list[dict[str, Any]]) -> None:
    """Validate course data structure.

    Args:
        courses: List of course dictionaries

    Raises:
        ValueError: If required fields are missing or invalid
    """
    required_fields = {"course_id", "title", "units", "description"}

    for i, course in enumerate(courses):
        missing_fields = required_fields - set(course.keys())
        if missing_fields:
            raise ValueError(
                f"Course at index {i} missing required fields: {missing_fields}"
            )

        if not isinstance(course.get("units"), (int, float)):
            raise ValueError(f"Course at index {i} has invalid units value")

        if course["units"] < 0:
            raise ValueError(f"Course at index {i} has negative units")


def filter_courses_by_units(
    courses: list[dict[str, Any]], min_units: float = 0, max_units: float = 99
) -> list[dict[str, Any]]:
    """Filter courses by unit range.

    Args:
        courses: List of course dictionaries
        min_units: Minimum units (inclusive)
        max_units: Maximum units (inclusive)

    Returns:
        Filtered list of courses
    """
    return [
        course for course in courses if min_units <= course.get("units", 0) <= max_units
    ]


def load_schedule_data(file_path: Union[str, Path]) -> Schedule:
    """Load and parse schedule data from JSON file.

    Args:
        file_path: Path to the schedule JSON file

    Returns:
        Schedule object with parsed data

    Raises:
        FileNotFoundError: If file doesn't exist
        json.JSONDecodeError: If file contains invalid JSON
        ValueError: If data doesn't match schema
    """
    data = load_json_data(file_path)

    if "schedule" in data:
        data = data["schedule"]

    # Parse metadata
    meta_data = data.get("metadata", {})
    metadata = Metadata(
        version=meta_data.get("version", "1.0.0"),
        last_updated=meta_data.get("last_updated", datetime.now().isoformat()),
        terms=[Term(**term) for term in meta_data.get("terms", [])],
        colleges=[
            College(
                id=college["id"],
                name=college["name"],
                abbreviation=college["abbreviation"],
                logo_url=college["logo_url"],
                theme=CollegeTheme(**college["theme"]),
            )
            for college in meta_data.get("colleges", [])
        ],
    )

    # Parse subjects
    subjects = [Subject(**subj) for subj in data.get("subjects", [])]

    # Parse instructors
    instructors = [Instructor(**inst) for inst in data.get("instructors", [])]

    # Parse courses with sections
    courses = []
    for course_data in data.get("courses", []):
        sections = []
        for section_data in course_data.get("sections", []):
            meetings = []
            for meeting_data in section_data.get("meetings", []):
                meeting = Meeting(
                    type=meeting_data["type"],
                    days=meeting_data["days"],
                    start_time=meeting_data["start_time"],
                    end_time=meeting_data["end_time"],
                    location=Location(**meeting_data["location"]),
                )
                meetings.append(meeting)

            section = Section(
                crn=section_data["crn"],
                section_number=section_data["section_number"],
                term=section_data["term"],
                college=section_data["college"],
                instruction_mode=section_data["instruction_mode"],
                status=section_data["status"],
                enrollment=Enrollment(**section_data["enrollment"]),
                meetings=meetings,
                instructors=section_data["instructors"],
                dates=SectionDates(**section_data["dates"]),
                textbook=Textbook(**section_data["textbook"]),
                notes=section_data.get("notes", ""),
                fees=section_data.get("fees", 0.0),
            )
            sections.append(section)

        # Parse course attributes if present
        attributes = None
        if "attributes" in course_data:
            attr_data = course_data["attributes"]
            attributes = CourseAttributes(
                transferable=Transferable(**attr_data["transferable"]),
                general_education=GeneralEducation(
                    csu_area=attr_data["general_education"].get("csu_area", []),
                    igetc_area=attr_data["general_education"].get("igetc_area", []),
                    local=attr_data["general_education"].get("local", []),
                ),
                c_id=attr_data.get("c_id"),
                degree_applicable=attr_data.get("degree_applicable", True),
                basic_skills=attr_data.get("basic_skills", False),
            )

        course = Course(
            course_key=course_data["course_key"],
            subject=course_data["subject"],
            course_number=course_data["course_number"],
            title=course_data["title"],
            description=course_data["description"],
            units=course_data["units"],
            unit_type=course_data["unit_type"],
            prerequisites=course_data.get("prerequisites", ""),
            corequisites=course_data.get("corequisites", ""),
            advisory=course_data.get("advisory", ""),
            attributes=attributes,
            sections=sections,
        )
        courses.append(course)

    return Schedule(
        metadata=metadata, subjects=subjects, instructors=instructors, courses=courses
    )


def save_schedule_data(schedule: Schedule, file_path: Union[str, Path]) -> None:
    """Save schedule data to JSON file.

    Args:
        schedule: Schedule object to save
        file_path: Path where to save the file
    """
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    data = {"schedule": asdict(schedule)}

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def filter_courses(courses: list[Course], filters: FilterOptions) -> list[Course]:
    """Filter courses based on multiple criteria.

    Args:
        courses: List of Course objects
        filters: FilterOptions with filter criteria

    Returns:
        Filtered list of courses
    """
    filtered_courses = []

    for course in courses:
        # First check course-level filters
        if filters.units_min is not None and course.units < filters.units_min:
            continue
        if filters.units_max is not None and course.units > filters.units_max:
            continue

        # Check subject filter
        if filters.subject and course.subject != filters.subject:
            continue

        # Check transferable filter
        if (
            filters.transferable
            and course.attributes
            and (
                (
                    filters.transferable == "CSU"
                    and not course.attributes.transferable.csu
                )
                or (
                    filters.transferable == "UC"
                    and not course.attributes.transferable.uc
                )
            )
        ):
            continue

        # Check GE area filter
        if (
            filters.ge_area
            and course.attributes
            and course.attributes.general_education
        ):
            ge = course.attributes.general_education
            if not any(
                [
                    filters.ge_area in ge.csu_area,
                    filters.ge_area in ge.igetc_area,
                    filters.ge_area in ge.local,
                ]
            ):
                continue

        # Check keyword in title or description
        if filters.keyword:
            keyword_lower = filters.keyword.lower()
            if not (
                keyword_lower in course.title.lower()
                or keyword_lower in course.description.lower()
                or keyword_lower in course.course_key.lower()
            ):
                continue

        # Now check section-level filters
        filtered_sections = []
        for section in course.sections:
            # Term filter
            if filters.term and section.term != filters.term:
                continue

            # College filter
            if filters.college and section.college != filters.college:
                continue

            # Instruction mode filter
            if (
                filters.instruction_mode
                and section.instruction_mode != filters.instruction_mode
            ):
                continue

            # Open only filter
            if filters.open_only and section.status != "Open":
                continue

            # Textbook cost filter
            if (
                filters.textbook_cost
                and section.textbook.cost_category != filters.textbook_cost
            ):
                continue

            # Days filter
            if filters.days:
                meeting_days = set()
                for meeting in section.meetings:
                    meeting_days.update(meeting.days)
                if not any(day in meeting_days for day in filters.days):
                    continue

            # Time filters
            if filters.start_time or filters.end_time:
                time_matches = False
                for meeting in section.meetings:
                    if filters.start_time and meeting.start_time < filters.start_time:
                        continue
                    if filters.end_time and meeting.end_time > filters.end_time:
                        continue
                    time_matches = True
                    break
                if not time_matches:
                    continue

            filtered_sections.append(section)

        # Only include course if it has matching sections
        if filtered_sections:
            # Create a copy of the course with filtered sections
            course_copy = Course(
                course_key=course.course_key,
                subject=course.subject,
                course_number=course.course_number,
                title=course.title,
                description=course.description,
                units=course.units,
                unit_type=course.unit_type,
                prerequisites=course.prerequisites,
                corequisites=course.corequisites,
                advisory=course.advisory,
                attributes=course.attributes,
                sections=filtered_sections,
            )
            filtered_courses.append(course_copy)

    return filtered_courses


def get_unique_values(schedule: Schedule) -> dict[str, list[str]]:
    """Extract unique values for filter options from schedule data.

    Args:
        schedule: Schedule object

    Returns:
        Dictionary with unique values for each filter type
    """
    unique_values: dict[str, Any] = {
        "terms": [],
        "colleges": [],
        "subjects": [],
        "instruction_modes": set(),
        "textbook_costs": set(),
        "ge_areas": set(),
    }

    # Get terms and colleges from metadata
    unique_values["terms"] = [term.code for term in schedule.metadata.terms]
    unique_values["colleges"] = [college.id for college in schedule.metadata.colleges]
    unique_values["subjects"] = [subject.code for subject in schedule.subjects]

    # Extract from courses and sections
    for course in schedule.courses:
        # Get GE areas
        if course.attributes and course.attributes.general_education:
            ge = course.attributes.general_education
            unique_values["ge_areas"].update(ge.csu_area)
            unique_values["ge_areas"].update(ge.igetc_area)
            unique_values["ge_areas"].update(ge.local)

        # Get section-specific values
        for section in course.sections:
            unique_values["instruction_modes"].add(section.instruction_mode)
            unique_values["textbook_costs"].add(section.textbook.cost_category)

    # Convert sets to sorted lists
    unique_values["instruction_modes"] = sorted(unique_values["instruction_modes"])
    unique_values["textbook_costs"] = sorted(unique_values["textbook_costs"])
    unique_values["ge_areas"] = sorted(unique_values["ge_areas"])

    return unique_values
