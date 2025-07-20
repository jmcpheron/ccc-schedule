"""Specialized parser for Banner 8 HTML schedule data."""

import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from bs4 import BeautifulSoup
import json

from ..college_config import CollegeConfig
from ..models import Course, Section, Meeting, Instructor, Enrollment


class Banner8Parser:
    """Parser specifically designed for Banner 8 HTML table format."""
    
    def __init__(self, config: CollegeConfig):
        """Initialize Banner 8 parser with college configuration.
        
        Args:
            config: College configuration with field mappings
        """
        self.config = config
        self.course_pattern = re.compile(r'([A-Z]+)\s*-?\s*(\d+[A-Z]?)\s*-\s*(.+)')
        self.time_pattern = re.compile(r'(\d{1,2}):(\d{2})\s*(am|pm)', re.IGNORECASE)
        self.building_room_pattern = re.compile(r'([A-Z]+\d*)\s+(\d+[A-Z]?)')
        
    def parse_html(self, html_content: str) -> Dict[str, Any]:
        """Parse Banner 8 HTML content.
        
        Args:
            html_content: HTML content from Banner 8 system
            
        Returns:
            Dictionary with parsed course and section data
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Find the main data table
        table = soup.find('table', class_='datadisplaytable')
        if not table:
            # Try alternative table identifiers
            table = soup.find('table', {'summary': re.compile('schedule', re.I)})
            
        if not table:
            return {"courses": [], "parse_errors": ["No data table found"]}
            
        courses = []
        current_course = None
        current_section = None
        
        # Process each row in the table
        rows = table.find_all('tr')
        
        for row in rows:
            # Check if this is a course header row
            if self._is_course_row(row):
                if current_course and current_section:
                    current_course["sections"].append(current_section)
                if current_course:
                    courses.append(current_course)
                    
                current_course = self._parse_course_row(row)
                current_section = None
                
            # Check if this is a section details row
            elif current_course and self._is_section_row(row):
                if current_section:
                    current_course["sections"].append(current_section)
                    
                current_section = self._parse_section_row(row)
                
            # Additional meeting times for current section
            elif current_section and self._is_meeting_row(row):
                meeting = self._parse_meeting_row(row)
                if meeting:
                    current_section["meetings"].append(meeting)
                    
        # Don't forget the last course/section
        if current_section:
            current_course["sections"].append(current_section)
        if current_course:
            courses.append(current_course)
            
        return {
            "courses": courses,
            "total_courses": len(courses),
            "total_sections": sum(len(c["sections"]) for c in courses),
            "parse_timestamp": datetime.now().isoformat()
        }
        
    def _is_course_row(self, row) -> bool:
        """Check if a row contains course information."""
        # Banner 8 typically uses 'ddtitle' class for course headers
        return row.get('class') and 'ddtitle' in row.get('class')
        
    def _is_section_row(self, row) -> bool:
        """Check if a row contains section information."""
        # Look for rows with CRN information
        cells = row.find_all('td')
        if len(cells) > 0:
            first_cell_text = cells[0].get_text(strip=True)
            # CRNs are typically 5 digits
            return bool(re.match(r'^\d{5}$', first_cell_text))
        return False
        
    def _is_meeting_row(self, row) -> bool:
        """Check if a row contains additional meeting information."""
        cells = row.find_all('td')
        if len(cells) > 5:
            # Check for time pattern in expected column
            time_text = cells[1].get_text(strip=True)
            return bool(self.time_pattern.search(time_text))
        return False
        
    def _parse_course_row(self, row) -> Dict[str, Any]:
        """Parse course information from a row."""
        text = row.get_text(strip=True)
        
        # Extract course info using pattern matching
        match = self.course_pattern.match(text)
        if match:
            subject, number, title = match.groups()
        else:
            # Fallback parsing
            parts = text.split(' - ', 2)
            if len(parts) >= 3:
                subject = parts[0].strip()
                number = parts[1].strip()
                title = parts[2].strip()
            else:
                subject, number, title = "UNKNOWN", "000", text
                
        return {
            "subject": subject,
            "course_number": number,
            "title": title,
            "full_title": text,
            "sections": []
        }
        
    def _parse_section_row(self, row) -> Dict[str, Any]:
        """Parse section information from a row."""
        cells = row.find_all('td')
        
        # Map columns to fields (Banner 8 typical layout)
        section = {
            "crn": cells[0].get_text(strip=True) if len(cells) > 0 else "",
            "section_number": cells[1].get_text(strip=True) if len(cells) > 1 else "",
            "campus": cells[2].get_text(strip=True) if len(cells) > 2 else "",
            "credits": self._parse_credits(cells[3].get_text(strip=True)) if len(cells) > 3 else 0,
            "title": cells[4].get_text(strip=True) if len(cells) > 4 else "",
            "days": cells[5].get_text(strip=True) if len(cells) > 5 else "",
            "time": cells[6].get_text(strip=True) if len(cells) > 6 else "",
            "capacity": cells[7].get_text(strip=True) if len(cells) > 7 else "",
            "enrolled": cells[8].get_text(strip=True) if len(cells) > 8 else "",
            "available": cells[9].get_text(strip=True) if len(cells) > 9 else "",
            "instructor": cells[10].get_text(strip=True) if len(cells) > 10 else "",
            "date_range": cells[11].get_text(strip=True) if len(cells) > 11 else "",
            "location": cells[12].get_text(strip=True) if len(cells) > 12 else "",
            "attribute": cells[13].get_text(strip=True) if len(cells) > 13 else "",
            "meetings": []
        }
        
        # Parse the primary meeting
        meeting = self._create_meeting(
            section["days"],
            section["time"],
            section["location"],
            section["date_range"]
        )
        if meeting:
            section["meetings"].append(meeting)
            
        # Determine status based on availability
        section["status"] = self._determine_status(section)
        
        # Extract additional attributes
        section["attributes"] = self._parse_attributes(section.get("attribute", ""))
        
        return section
        
    def _parse_meeting_row(self, row) -> Optional[Dict[str, Any]]:
        """Parse additional meeting information from a row."""
        cells = row.find_all('td')
        
        if len(cells) > 6:
            return self._create_meeting(
                cells[5].get_text(strip=True),  # days
                cells[6].get_text(strip=True),  # time
                cells[12].get_text(strip=True) if len(cells) > 12 else "",  # location
                cells[11].get_text(strip=True) if len(cells) > 11 else ""   # date range
            )
            
        return None
        
    def _create_meeting(self, days: str, time: str, location: str, date_range: str) -> Optional[Dict[str, Any]]:
        """Create a meeting object from parsed data."""
        if not days or days == "TBA":
            return None
            
        # Parse time
        start_time, end_time = self._parse_time_range(time)
        
        # Parse location
        building, room = self._parse_location(location)
        
        # Parse date range
        start_date, end_date = self._parse_date_range(date_range)
        
        return {
            "days": self._parse_days(days),
            "start_time": start_time,
            "end_time": end_time,
            "building": building,
            "room": room,
            "location_raw": location,
            "start_date": start_date,
            "end_date": end_date,
            "meeting_type": "Lecture"  # Default, can be enhanced
        }
        
    def _parse_credits(self, credit_text: str) -> float:
        """Parse credit hours from text."""
        try:
            # Handle ranges like "1.000 - 3.000"
            if '-' in credit_text:
                parts = credit_text.split('-')
                return float(parts[1].strip())
            else:
                return float(credit_text.strip())
        except:
            return 0.0
            
    def _parse_time_range(self, time_text: str) -> Tuple[str, str]:
        """Parse time range into start and end times."""
        if '-' not in time_text:
            return "", ""
            
        try:
            start, end = time_text.split('-')
            start_time = self._normalize_time(start.strip())
            end_time = self._normalize_time(end.strip())
            return start_time, end_time
        except:
            return "", ""
            
    def _normalize_time(self, time_str: str) -> str:
        """Normalize time to 24-hour format (HH:MM)."""
        match = self.time_pattern.match(time_str)
        if match:
            hour, minute, ampm = match.groups()
            hour = int(hour)
            
            if ampm.lower() == 'pm' and hour != 12:
                hour += 12
            elif ampm.lower() == 'am' and hour == 12:
                hour = 0
                
            return f"{hour:02d}:{minute}"
            
        return time_str
        
    def _parse_location(self, location_text: str) -> Tuple[str, str]:
        """Parse location into building and room."""
        if not location_text or location_text == "TBA":
            return "", ""
            
        match = self.building_room_pattern.match(location_text)
        if match:
            return match.group(1), match.group(2)
            
        # Fallback - split on space
        parts = location_text.split(' ', 1)
        if len(parts) == 2:
            return parts[0], parts[1]
            
        return location_text, ""
        
    def _parse_days(self, days_text: str) -> List[str]:
        """Parse days text into list of day codes."""
        days = []
        day_map = {
            'M': 'M', 'Mo': 'M', 'Mon': 'M',
            'T': 'T', 'Tu': 'T', 'Tue': 'T',
            'W': 'W', 'We': 'W', 'Wed': 'W',
            'R': 'R', 'Th': 'R', 'Thu': 'R',
            'F': 'F', 'Fr': 'F', 'Fri': 'F',
            'S': 'S', 'Sa': 'S', 'Sat': 'S',
            'U': 'U', 'Su': 'U', 'Sun': 'U'
        }
        
        # Handle common formats
        if days_text in ["MWF", "MW", "TR", "TuTh", "MTWThF"]:
            # Split combined day strings
            for char in days_text:
                if char in day_map:
                    days.append(char)
        else:
            # Try to parse individual days
            for day, code in day_map.items():
                if day in days_text:
                    days.append(code)
                    
        return days
        
    def _parse_date_range(self, date_text: str) -> Tuple[str, str]:
        """Parse date range text."""
        if '-' in date_text:
            parts = date_text.split('-')
            if len(parts) == 2:
                return parts[0].strip(), parts[1].strip()
                
        return date_text, date_text
        
    def _determine_status(self, section: Dict[str, Any]) -> str:
        """Determine section status based on enrollment."""
        try:
            available = int(section.get("available", 0))
            if available > 0:
                return "Open"
            else:
                return "Closed"
        except:
            return "Unknown"
            
    def _parse_attributes(self, attr_text: str) -> List[str]:
        """Parse section attributes."""
        attributes = []
        
        # Common Banner 8 attributes
        attribute_patterns = {
            "ZTC": "Zero Textbook Cost",
            "OER": "Open Educational Resources",
            "ONLINE": "Online",
            "HYBRID": "Hybrid",
            "LEC": "Lecture",
            "LAB": "Laboratory",
            "CSU": "CSU Transferable",
            "UC": "UC Transferable",
            "IGETC": "IGETC"
        }
        
        for pattern, description in attribute_patterns.items():
            if pattern in attr_text.upper():
                attributes.append(description)
                
        return attributes
        
    def to_ccc_format(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert parsed Banner 8 data to CCC Schedule format.
        
        Args:
            parsed_data: Data parsed from Banner 8 HTML
            
        Returns:
            Data in CCC Schedule format
        """
        ccc_courses = []
        
        for course_data in parsed_data.get("courses", []):
            # Build course object
            course = {
                "course_key": f"{course_data['subject']}-{course_data['course_number']}",
                "subject": course_data["subject"],
                "course_number": course_data["course_number"],
                "title": course_data["title"],
                "description": "",  # Would need to fetch from course catalog
                "units": 0,  # Will be set from first section
                "unit_type": "semester",
                "prerequisites": "",
                "corequisites": "",
                "advisory": "",
                "sections": []
            }
            
            # Process sections
            for section_data in course_data.get("sections", []):
                # Set course units from first section
                if course["units"] == 0 and section_data.get("credits"):
                    course["units"] = section_data["credits"]
                    
                section = {
                    "crn": section_data["crn"],
                    "section_number": section_data.get("section_number", ""),
                    "term": self.config.parser_options.get("default_term", ""),
                    "college": self.config.college_id,
                    "instruction_mode": self._determine_instruction_mode(section_data),
                    "status": section_data.get("status", "Unknown"),
                    "enrollment": {
                        "enrolled": int(section_data.get("enrolled", 0)),
                        "capacity": int(section_data.get("capacity", 0)),
                        "waitlist": 0,  # Not typically shown in Banner 8 HTML
                        "waitlist_capacity": 0
                    },
                    "meetings": [],
                    "instructors": [section_data.get("instructor", "Staff")],
                    "dates": {
                        "start": "",
                        "end": "",
                        "duration_weeks": 16  # Default
                    },
                    "textbook": {
                        "required": True,
                        "cost_category": self._determine_textbook_cost(section_data),
                        "details": ""
                    },
                    "notes": "",
                    "fees": 0.0
                }
                
                # Process meetings
                for meeting_data in section_data.get("meetings", []):
                    meeting = {
                        "type": meeting_data.get("meeting_type", "Lecture"),
                        "days": meeting_data.get("days", []),
                        "start_time": meeting_data.get("start_time", ""),
                        "end_time": meeting_data.get("end_time", ""),
                        "location": {
                            "building": meeting_data.get("building", ""),
                            "room": meeting_data.get("room", ""),
                            "campus": section_data.get("campus", "Main")
                        }
                    }
                    
                    # Update section dates from first meeting
                    if not section["dates"]["start"] and meeting_data.get("start_date"):
                        section["dates"]["start"] = meeting_data["start_date"]
                        section["dates"]["end"] = meeting_data.get("end_date", "")
                        
                    section["meetings"].append(meeting)
                    
                course["sections"].append(section)
                
            if course["sections"]:
                ccc_courses.append(course)
                
        return {
            "schedule": {
                "metadata": {
                    "version": "1.0.0",
                    "last_updated": datetime.now().isoformat(),
                    "source": "Banner 8 HTML Parser",
                    "parser_version": "1.0.0"
                },
                "courses": ccc_courses
            }
        }
        
    def _determine_instruction_mode(self, section_data: Dict[str, Any]) -> str:
        """Determine instruction mode from section data."""
        attributes = section_data.get("attributes", [])
        location = section_data.get("location", "")
        
        if "Online" in attributes or "ONLINE" in location:
            return "Online"
        elif "Hybrid" in attributes:
            return "Hybrid"
        else:
            return "In Person"
            
    def _determine_textbook_cost(self, section_data: Dict[str, Any]) -> str:
        """Determine textbook cost category."""
        attributes = section_data.get("attributes", [])
        
        if "Zero Textbook Cost" in attributes or "OER" in attributes:
            return "Zero"
        else:
            return "Unknown"