#!/usr/bin/env python3
"""Command-line interface for CCC Schedule utilities."""

import argparse
import json
import sys

from src.data_utils import (
    filter_courses,
    filter_courses_by_units,
    get_unique_values,
    load_json_data,
    load_schedule_data,
    save_schedule_data,
    validate_course_data,
)
from src.models import FilterOptions


def main() -> int:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="CCC Schedule data processing utilities"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Validate command
    validate_parser = subparsers.add_parser(
        "validate", help="Validate course data JSON file"
    )
    validate_parser.add_argument("file", help="Path to course JSON file")

    # Filter command
    filter_parser = subparsers.add_parser("filter", help="Filter courses by unit range")
    filter_parser.add_argument("file", help="Path to course JSON file")
    filter_parser.add_argument(
        "--min-units", type=float, default=0, help="Minimum units (default: 0)"
    )
    filter_parser.add_argument(
        "--max-units", type=float, default=99, help="Maximum units (default: 99)"
    )

    # Schedule validate command
    schedule_validate_parser = subparsers.add_parser(
        "schedule-validate", help="Validate schedule data JSON file"
    )
    schedule_validate_parser.add_argument("file", help="Path to schedule JSON file")

    # Schedule info command
    schedule_info_parser = subparsers.add_parser(
        "schedule-info", help="Show schedule information and statistics"
    )
    schedule_info_parser.add_argument("file", help="Path to schedule JSON file")

    # Schedule filter command
    schedule_filter_parser = subparsers.add_parser(
        "schedule-filter", help="Filter schedule data with multiple criteria"
    )
    schedule_filter_parser.add_argument("file", help="Path to schedule JSON file")
    schedule_filter_parser.add_argument(
        "--term", help="Filter by term code (e.g., 202530)"
    )
    schedule_filter_parser.add_argument("--college", help="Filter by college ID")
    schedule_filter_parser.add_argument(
        "--subject", help="Filter by subject code (e.g., CS)"
    )
    schedule_filter_parser.add_argument(
        "--instruction-mode", help="Filter by instruction mode"
    )
    schedule_filter_parser.add_argument(
        "--keyword", help="Search in course title and description"
    )
    schedule_filter_parser.add_argument("--min-units", type=float, help="Minimum units")
    schedule_filter_parser.add_argument("--max-units", type=float, help="Maximum units")
    schedule_filter_parser.add_argument(
        "--open-only", action="store_true", help="Show only open sections"
    )
    schedule_filter_parser.add_argument("--output", help="Output file path (optional)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    try:
        if args.command == "validate":
            data = load_json_data(args.file)
            courses = data.get("courses", [])
            validate_course_data(courses)
            print(f"✓ Successfully validated {len(courses)} courses")
            return 0

        elif args.command == "filter":
            data = load_json_data(args.file)
            courses = data.get("courses", [])
            filtered = filter_courses_by_units(
                courses, min_units=args.min_units, max_units=args.max_units
            )
            print(
                f"Found {len(filtered)} courses between {args.min_units} and {args.max_units} units:"
            )
            for course in filtered:
                print(
                    f"  - {course.get('course_id', 'N/A')}: {course.get('title', 'N/A')} ({course.get('units', 0)} units)"
                )
            return 0

        elif args.command == "schedule-validate":
            schedule = load_schedule_data(args.file)
            print("✓ Successfully validated schedule data")
            print(f"  Version: {schedule.metadata.version}")
            print(f"  Terms: {len(schedule.metadata.terms)}")
            print(f"  Colleges: {len(schedule.metadata.colleges)}")
            print(f"  Courses: {len(schedule.courses)}")
            total_sections = sum(len(course.sections) for course in schedule.courses)
            print(f"  Total sections: {total_sections}")
            return 0

        elif args.command == "schedule-info":
            schedule = load_schedule_data(args.file)
            unique_values = get_unique_values(schedule)

            print("Schedule Information:")
            print(f"  Version: {schedule.metadata.version}")
            print(f"  Last updated: {schedule.metadata.last_updated}")
            print(f"\nTerms ({len(unique_values['terms'])}):")
            for term in schedule.metadata.terms:
                print(f"    - {term.code}: {term.name}")
            print(f"\nColleges ({len(unique_values['colleges'])}):")
            for college in schedule.metadata.colleges:
                print(f"    - {college.id}: {college.name} ({college.abbreviation})")
            print(f"\nSubjects ({len(unique_values['subjects'])}):")
            for _, subject_code in enumerate(unique_values["subjects"][:10]):
                subject = next(s for s in schedule.subjects if s.code == subject_code)
                print(f"    - {subject.code}: {subject.name}")
            if len(unique_values["subjects"]) > 10:
                print(f"    ... and {len(unique_values['subjects']) - 10} more")
            print(
                f"\nInstruction modes: {', '.join(unique_values['instruction_modes'])}"
            )
            print(f"Textbook costs: {', '.join(unique_values['textbook_costs'])}")
            print(f"GE areas: {', '.join(unique_values['ge_areas'][:10])}")
            if len(unique_values["ge_areas"]) > 10:
                print(f"    ... and {len(unique_values['ge_areas']) - 10} more")
            return 0

        elif args.command == "schedule-filter":
            schedule = load_schedule_data(args.file)

            # Build filter options
            filters = FilterOptions(
                term=args.term,
                college=args.college,
                subject=args.subject,
                instruction_mode=args.instruction_mode,
                keyword=args.keyword,
                units_min=args.min_units,
                units_max=args.max_units,
                open_only=args.open_only,
            )

            # Apply filters
            filtered_courses = filter_courses(schedule.courses, filters)

            # Count results
            total_sections = sum(len(course.sections) for course in filtered_courses)

            print(
                f"Found {len(filtered_courses)} courses with {total_sections} sections"
            )

            # Show first few results
            for course in filtered_courses[:5]:
                print(f"\n{course.course_key}: {course.title}")
                print(f"  Units: {course.units}")
                print(f"  Sections: {len(course.sections)}")
                for section in course.sections[:2]:
                    print(
                        f"    - CRN {section.crn}: {section.instruction_mode}, {section.status}"
                    )
                if len(course.sections) > 2:
                    print(f"    ... and {len(course.sections) - 2} more sections")

            if len(filtered_courses) > 5:
                print(f"\n... and {len(filtered_courses) - 5} more courses")

            # Save to file if requested
            if args.output:
                filtered_schedule = schedule
                filtered_schedule.courses = filtered_courses
                save_schedule_data(filtered_schedule, args.output)
                print(f"\nFiltered schedule saved to: {args.output}")

            return 0

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except ValueError as e:
        print(f"Validation error: {e}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
