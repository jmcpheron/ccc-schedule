"""Rio Hondo College data transformer."""

from datetime import datetime
from typing import Any, Union

from .base_transformer import BaseTransformer


class RioHondoTransformer(BaseTransformer):
    """Transforms Rio Hondo collector data to standardized format."""

    def _extract_term_info(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Extract term information from Rio Hondo data."""
        return {
            "code": input_data.get("term_code", ""),
            "name": input_data.get("term", ""),
            "start_date": "2025-08-25",  # Fall 2025 - would ideally come from data
            "end_date": "2025-12-20",
        }

    def _transform_courses(self, input_data: dict[str, Any]) -> list[dict[str, Any]]:
        """Transform Rio Hondo courses to standardized format."""
        # Group courses by subject + course_number
        courses_map = {}

        for course_data in input_data.get("courses", []):
            # Create course key
            course_key = f"{course_data['subject']}-{course_data['course_number']}"

            # Create/update course
            if course_key not in courses_map:
                courses_map[course_key] = {
                    "course_id": course_key,
                    "subject": course_data["subject"],
                    "course_number": course_data["course_number"],
                    "title": course_data["title"],
                    "units": float(course_data["units"]),
                    "description": f"{course_data['title']} - {course_data['units']} units",
                    "sections": [],
                }

            # Transform section
            section = self._transform_section(course_data)
            courses_map[course_key]["sections"].append(section)

        return list(courses_map.values())

    def _transform_section(
        self, section_data: dict[str, Any], course_data: dict[str, Any] = None
    ) -> dict[str, Any]:
        """Transform a Rio Hondo section."""
        # Map status values
        status_map = {
            "OPEN": "Open",
            "CLOSED": "Closed",
            "Waitlisted": "Waitlist",
            "CANCELLED": "Cancelled",
        }
        raw_status = section_data.get("status", "Open")

        section = {
            "crn": section_data["crn"],
            "status": status_map.get(raw_status, raw_status),
            "instruction_mode": self._map_instruction_mode(
                section_data.get("delivery_method", "")
            ),
            "enrollment": {
                "enrolled": section_data.get("enrollment", {}).get("actual", 0),
                "capacity": section_data.get("enrollment", {}).get("capacity", 0),
                "available": section_data.get("enrollment", {}).get("remaining", 0),
            },
            "meetings": self._transform_meetings(section_data),
        }

        # Add instructor
        instructor = self._transform_instructor(section_data)
        if instructor:
            section["instructor"] = instructor

        # Add dates
        dates = self._transform_dates(section_data)
        if dates:
            section["dates"] = dates

        # Add attributes
        attributes = {}

        # Zero textbook cost
        if "zero_textbook_cost" in section_data:
            attributes["zero_textbook_cost"] = section_data["zero_textbook_cost"]

        # Section type
        if "section_type" in section_data:
            attributes["section_type"] = section_data["section_type"]

        # Weeks
        if "weeks" in section_data:
            attributes["weeks"] = section_data["weeks"]

        if attributes:
            section["attributes"] = attributes

        return section

    def _map_instruction_mode(self, delivery_method: str) -> str:
        """Map Rio Hondo delivery method to standardized instruction mode."""
        mode_mapping = {
            "Online": "ONL",
            "Online SYNC": "SYNC",
            "Hybrid": "HYB",
            "Arranged": "ARR",
            "In Person": "INP",
        }

        # Check if we have a direct mapping
        if delivery_method in mode_mapping:
            return mode_mapping[delivery_method]

        # Otherwise, try to infer
        delivery_lower = delivery_method.lower()
        if "online" in delivery_lower and "sync" in delivery_lower:
            return "SYNC"
        elif "online" in delivery_lower:
            return "ONL"
        elif "hybrid" in delivery_lower:
            return "HYB"
        elif "arranged" in delivery_lower:
            return "ARR"
        else:
            return "INP"  # Default to in-person

    def _transform_meetings(self, section_data: dict[str, Any]) -> list[dict[str, Any]]:
        """Transform Rio Hondo meeting times."""
        meetings = []

        for meeting in section_data.get("meeting_times", []):
            if meeting.get("is_arranged", False):
                # Arranged meeting
                meeting_data = {
                    "type": "Lecture",
                    "days": [],
                    "start_time": None,
                    "end_time": None,
                    "location": {
                        "building": "TBD",
                        "room": section_data.get("location", "ARR"),
                    },
                }
            else:
                # Regular meeting
                meeting_data = {
                    "type": "Lecture",
                    "days": self._parse_days(meeting.get("days", "")),
                    "start_time": self._parse_time(meeting.get("start_time")),
                    "end_time": self._parse_time(meeting.get("end_time")),
                    "location": self._parse_location(section_data.get("location", "")),
                }

            meetings.append(meeting_data)

        # If no meetings, create one arranged meeting
        if not meetings:
            meetings.append(
                {
                    "type": "Lecture",
                    "days": [],
                    "start_time": None,
                    "end_time": None,
                    "location": {
                        "building": "TBD",
                        "room": section_data.get("location", "TBD"),
                    },
                }
            )

        return meetings

    def _parse_days(self, days_str: str) -> list[str]:
        """Parse days string to list of day codes."""
        if not days_str or days_str == "ARR":
            return []

        # Map full day names to codes if needed
        day_map = {
            "M": "M",
            "Mon": "M",
            "Monday": "M",
            "T": "T",
            "Tue": "T",
            "Tuesday": "T",
            "W": "W",
            "Wed": "W",
            "Wednesday": "W",
            "R": "R",
            "Thu": "R",
            "Thursday": "R",
            "F": "F",
            "Fri": "F",
            "Friday": "F",
            "S": "S",
            "Sat": "S",
            "Saturday": "S",
            "U": "U",
            "Sun": "U",
            "Sunday": "U",
        }

        # Extract individual day codes
        days = []
        for char in days_str:
            if char in day_map:
                days.append(day_map[char])

        return days

    def _parse_time(self, time_str: Union[str, None]) -> Union[str, None]:
        """Convert time format from '06:00pm' to '18:00'."""
        if not time_str:
            return None

        try:
            # Parse time like "06:00pm"
            time_obj = datetime.strptime(time_str, "%I:%M%p")
            return time_obj.strftime("%H:%M")
        except:
            # Try other formats or return as-is
            return time_str

    def _parse_location(self, location_str: str) -> dict[str, str]:
        """Parse location string into building/room."""
        location = {"building": "Main", "room": location_str}

        # Special cases
        if "Online" in location_str:
            location["building"] = "Online"
            location["room"] = "Online"
        elif location_str.isdigit():
            # Just a room number
            location["room"] = location_str

        return location

    def _transform_instructor(self, section_data: dict[str, Any]) -> dict[str, Any]:
        """Transform instructor information."""
        instructor_name = section_data.get("instructor", "")
        instructor_email = section_data.get("instructor_email", "")

        if instructor_name and instructor_name != "TBA":
            return {
                "name": instructor_name,
                "email": instructor_email
                or f"{instructor_name.lower().replace(' ', '.')}@riohondo.edu",
            }

        return None

    def _transform_dates(self, section_data: dict[str, Any]) -> dict[str, Any]:
        """Transform date information."""
        dates = {}

        # Parse start/end dates if available
        start_date = section_data.get("start_date")
        end_date = section_data.get("end_date")

        if start_date:
            # Convert MM/DD to YYYY-MM-DD (assuming current year)
            try:
                month, day = start_date.split("/")
                dates["start"] = f"2025-{month.zfill(2)}-{day.zfill(2)}"
            except:
                dates["start"] = start_date
        else:
            dates["start"] = "2025-08-25"  # Default Fall 2025 start

        if end_date:
            try:
                month, day = end_date.split("/")
                dates["end"] = f"2025-{month.zfill(2)}-{day.zfill(2)}"
            except:
                dates["end"] = end_date
        else:
            dates["end"] = "2025-12-20"  # Default Fall 2025 end

        # Add duration if available
        if "weeks" in section_data:
            dates["duration_weeks"] = section_data["weeks"]

        return dates
