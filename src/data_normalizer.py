"""Data normalization utilities for schedule data."""

import re
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, time
import unicodedata


class DataNormalizer:
    """Normalize and clean schedule data using LLM-enhanced techniques."""
    
    def __init__(self):
        """Initialize the data normalizer."""
        self.unit_patterns = [
            (r'(\d+\.?\d*)\s*units?', float),
            (r'(\d+\.?\d*)\s*credits?', float),
            (r'(\d+\.?\d*)\s*hrs?', float),
            (r'(\d+)-(\d+)\s*units?', lambda m: float(m.group(2))),  # Take max for ranges
        ]
        
        self.time_patterns = [
            (r'(\d{1,2}):(\d{2})\s*(am|pm)', self._parse_12hr_time),
            (r'(\d{1,2})(\d{2})\s*(am|pm)', self._parse_12hr_time_no_colon),
            (r'(\d{1,2}):(\d{2})', self._parse_24hr_time),
            (r'(\d{3,4})', self._parse_military_time),
        ]
        
        self.day_mappings = {
            'monday': 'M', 'mon': 'M', 'm': 'M',
            'tuesday': 'T', 'tue': 'T', 'tu': 'T', 't': 'T',
            'wednesday': 'W', 'wed': 'W', 'w': 'W',
            'thursday': 'R', 'thu': 'R', 'th': 'R', 'r': 'R',
            'friday': 'F', 'fri': 'F', 'f': 'F',
            'saturday': 'S', 'sat': 'S', 's': 'S',
            'sunday': 'U', 'sun': 'U', 'su': 'U', 'u': 'U'
        }
        
    def normalize_course_data(self, course_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize course data to standard format.
        
        Args:
            course_data: Raw course data
            
        Returns:
            Normalized course data
        """
        normalized = course_data.copy()
        
        # Normalize course number
        if 'course_number' in normalized:
            normalized['course_number'] = self.normalize_course_number(
                normalized['course_number']
            )
            
        # Normalize title
        if 'title' in normalized:
            normalized['title'] = self.normalize_text(normalized['title'])
            
        # Normalize units
        if 'units' in normalized:
            normalized['units'] = self.normalize_units(str(normalized['units']))
            
        # Normalize description
        if 'description' in normalized:
            normalized['description'] = self.clean_description(normalized['description'])
            
        return normalized
        
    def normalize_section_data(self, section_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize section data to standard format.
        
        Args:
            section_data: Raw section data
            
        Returns:
            Normalized section data
        """
        normalized = section_data.copy()
        
        # Normalize CRN
        if 'crn' in normalized:
            normalized['crn'] = self.normalize_crn(normalized['crn'])
            
        # Normalize status
        if 'status' in normalized:
            normalized['status'] = self.normalize_status(normalized['status'])
            
        # Normalize enrollment numbers
        for field in ['enrolled', 'capacity', 'waitlist', 'waitlist_capacity']:
            if field in normalized:
                normalized[field] = self.normalize_number(normalized[field])
                
        # Normalize meetings
        if 'meetings' in normalized:
            normalized['meetings'] = [
                self.normalize_meeting(meeting) for meeting in normalized['meetings']
            ]
            
        # Normalize instructor names
        if 'instructors' in normalized:
            normalized['instructors'] = [
                self.normalize_instructor_name(name) for name in normalized['instructors']
            ]
            
        return normalized
        
    def normalize_meeting(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize meeting data.
        
        Args:
            meeting_data: Raw meeting data
            
        Returns:
            Normalized meeting data
        """
        normalized = meeting_data.copy()
        
        # Normalize days
        if 'days' in normalized:
            if isinstance(normalized['days'], str):
                normalized['days'] = self.parse_days(normalized['days'])
            else:
                normalized['days'] = [self.normalize_day(d) for d in normalized['days']]
                
        # Normalize times
        if 'start_time' in normalized:
            normalized['start_time'] = self.normalize_time(normalized['start_time'])
        if 'end_time' in normalized:
            normalized['end_time'] = self.normalize_time(normalized['end_time'])
            
        # Normalize location
        if 'location' in normalized:
            if isinstance(normalized['location'], str):
                building, room = self.parse_location(normalized['location'])
                normalized['location'] = {
                    'building': building,
                    'room': room,
                    'campus': 'Main'
                }
                
        return normalized
        
    def normalize_course_number(self, course_num: str) -> str:
        """Normalize course number format.
        
        Args:
            course_num: Raw course number
            
        Returns:
            Normalized course number
        """
        # Remove extra whitespace
        course_num = course_num.strip()
        
        # Standardize separators
        course_num = re.sub(r'[\s\-_]+', ' ', course_num)
        
        # Ensure uppercase for letter suffixes
        course_num = re.sub(r'(\d+)([a-z]+)', lambda m: m.group(1) + m.group(2).upper(), course_num)
        
        return course_num
        
    def normalize_text(self, text: str) -> str:
        """Normalize text by fixing encoding and formatting issues.
        
        Args:
            text: Raw text
            
        Returns:
            Normalized text
        """
        # Fix encoding issues
        text = unicodedata.normalize('NFKD', text)
        
        # Replace multiple spaces with single space
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common typos and formatting
        text = text.strip()
        
        # Title case if all caps
        if text.isupper() and len(text) > 10:
            text = text.title()
            
        return text
        
    def normalize_units(self, units_str: str) -> float:
        """Extract and normalize unit values.
        
        Args:
            units_str: String containing unit information
            
        Returns:
            Normalized unit value as float
        """
        units_str = str(units_str).lower()
        
        # Try each pattern
        for pattern, converter in self.unit_patterns:
            match = re.search(pattern, units_str)
            if match:
                if callable(converter):
                    return converter(match)
                else:
                    return converter(match.group(1))
                    
        # Try direct float conversion
        try:
            return float(units_str)
        except:
            return 0.0
            
    def normalize_crn(self, crn: Union[str, int]) -> str:
        """Normalize CRN format.
        
        Args:
            crn: Course Reference Number
            
        Returns:
            Normalized CRN as string
        """
        crn_str = str(crn).strip()
        
        # Remove any non-numeric characters
        crn_str = re.sub(r'\D', '', crn_str)
        
        # Pad with zeros if needed (CRNs are typically 5 digits)
        if len(crn_str) < 5:
            crn_str = crn_str.zfill(5)
            
        return crn_str
        
    def normalize_status(self, status: str) -> str:
        """Normalize section status.
        
        Args:
            status: Raw status string
            
        Returns:
            Normalized status
        """
        status_lower = status.lower().strip()
        
        # Map common variations
        if status_lower in ['open', 'available', 'seats available']:
            return 'Open'
        elif status_lower in ['closed', 'full', 'no seats']:
            return 'Closed'
        elif status_lower in ['waitlist', 'wait list', 'waiting list']:
            return 'Waitlist'
        elif status_lower in ['cancelled', 'canceled']:
            return 'Cancelled'
        else:
            # Return original with proper case
            return status.strip().title()
            
    def normalize_number(self, value: Any) -> int:
        """Normalize numeric values.
        
        Args:
            value: Value to normalize
            
        Returns:
            Integer value
        """
        if isinstance(value, (int, float)):
            return int(value)
            
        # Convert string to number
        value_str = str(value).strip()
        
        # Remove non-numeric characters
        value_str = re.sub(r'[^\d\-]', '', value_str)
        
        try:
            return int(value_str)
        except:
            return 0
            
    def normalize_time(self, time_str: str) -> str:
        """Normalize time to 24-hour format (HH:MM).
        
        Args:
            time_str: Time string in various formats
            
        Returns:
            Normalized time in HH:MM format
        """
        if not time_str or time_str.upper() == 'TBA':
            return ''
            
        time_str = str(time_str).strip()
        
        # Try each time pattern
        for pattern, parser in self.time_patterns:
            match = re.search(pattern, time_str, re.IGNORECASE)
            if match:
                return parser(match)
                
        return time_str  # Return original if no pattern matches
        
    def _parse_12hr_time(self, match) -> str:
        """Parse 12-hour time format."""
        hour = int(match.group(1))
        minute = int(match.group(2))
        ampm = match.group(3).lower()
        
        if ampm == 'pm' and hour != 12:
            hour += 12
        elif ampm == 'am' and hour == 12:
            hour = 0
            
        return f"{hour:02d}:{minute:02d}"
        
    def _parse_12hr_time_no_colon(self, match) -> str:
        """Parse 12-hour time format without colon."""
        hour = int(match.group(1))
        minute = int(match.group(2))
        ampm = match.group(3).lower()
        
        if ampm == 'pm' and hour != 12:
            hour += 12
        elif ampm == 'am' and hour == 12:
            hour = 0
            
        return f"{hour:02d}:{minute:02d}"
        
    def _parse_24hr_time(self, match) -> str:
        """Parse 24-hour time format."""
        hour = int(match.group(1))
        minute = int(match.group(2))
        return f"{hour:02d}:{minute:02d}"
        
    def _parse_military_time(self, match) -> str:
        """Parse military time format (e.g., 1330)."""
        time_str = match.group(1)
        if len(time_str) == 3:
            time_str = '0' + time_str
        hour = int(time_str[:2])
        minute = int(time_str[2:])
        return f"{hour:02d}:{minute:02d}"
        
    def parse_days(self, days_str: str) -> List[str]:
        """Parse days string into list of day codes.
        
        Args:
            days_str: String containing day information
            
        Returns:
            List of normalized day codes
        """
        days_str = days_str.strip().lower()
        days = []
        
        # Handle common combined formats
        combined_patterns = {
            'mwf': ['M', 'W', 'F'],
            'mw': ['M', 'W'],
            'tr': ['T', 'R'],
            'tuth': ['T', 'R'],
            'mtwth': ['M', 'T', 'W', 'R'],
            'mtwthf': ['M', 'T', 'W', 'R', 'F'],
            'daily': ['M', 'T', 'W', 'R', 'F'],
            'mtwr': ['M', 'T', 'W', 'R'],
            'mtwrf': ['M', 'T', 'W', 'R', 'F']
        }
        
        if days_str in combined_patterns:
            return combined_patterns[days_str]
            
        # Parse individual days
        for day_name, day_code in self.day_mappings.items():
            if day_name in days_str:
                if day_code not in days:
                    days.append(day_code)
                    
        # If no days found, try character by character
        if not days:
            for char in days_str.upper():
                if char in ['M', 'T', 'W', 'R', 'F', 'S', 'U']:
                    if char not in days:
                        days.append(char)
                        
        return days
        
    def normalize_day(self, day: str) -> str:
        """Normalize a single day code.
        
        Args:
            day: Day string
            
        Returns:
            Normalized day code
        """
        day_lower = day.lower().strip()
        return self.day_mappings.get(day_lower, day.upper())
        
    def parse_location(self, location_str: str) -> tuple[str, str]:
        """Parse location string into building and room.
        
        Args:
            location_str: Location string
            
        Returns:
            Tuple of (building, room)
        """
        if not location_str or location_str.upper() == 'TBA':
            return '', ''
            
        # Common patterns
        patterns = [
            r'([A-Z]+\d*)\s+(\d+[A-Z]?)',  # e.g., "BLDG 101A"
            r'([A-Z]+)\s*-\s*(\d+)',        # e.g., "BLDG-101"
            r'(\w+)\s+Room\s+(\w+)',        # e.g., "Science Room 101"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, location_str, re.IGNORECASE)
            if match:
                return match.group(1).upper(), match.group(2).upper()
                
        # Fallback: split on space
        parts = location_str.split(' ', 1)
        if len(parts) == 2:
            return parts[0].upper(), parts[1].upper()
            
        return location_str.upper(), ''
        
    def normalize_instructor_name(self, name: str) -> str:
        """Normalize instructor name format.
        
        Args:
            name: Instructor name
            
        Returns:
            Normalized name in "Last, First" format
        """
        if not name or name.upper() in ['TBA', 'STAFF', 'UNKNOWN']:
            return 'Staff'
            
        name = self.normalize_text(name)
        
        # Handle "Last, First" format
        if ',' in name:
            parts = name.split(',', 1)
            last = parts[0].strip()
            first = parts[1].strip() if len(parts) > 1 else ''
            return f"{last}, {first}"
            
        # Handle "First Last" format
        parts = name.split()
        if len(parts) >= 2:
            # Assume last word is last name
            last = parts[-1]
            first = ' '.join(parts[:-1])
            return f"{last}, {first}"
            
        return name
        
    def clean_description(self, description: str) -> str:
        """Clean and format course description.
        
        Args:
            description: Raw description text
            
        Returns:
            Cleaned description
        """
        if not description:
            return ''
            
        # Normalize text first
        description = self.normalize_text(description)
        
        # Remove common prefixes
        prefixes = [
            r'^(Course\s+)?Description:\s*',
            r'^Overview:\s*',
            r'^\d+\s+hours?\s+(lecture|lab)\.?\s*',
        ]
        
        for prefix in prefixes:
            description = re.sub(prefix, '', description, flags=re.IGNORECASE)
            
        # Remove excessive line breaks
        description = re.sub(r'\n\s*\n\s*\n+', '\n\n', description)
        
        # Ensure it ends with a period
        if description and not description.rstrip().endswith('.'):
            description = description.rstrip() + '.'
            
        return description.strip()
        
    def validate_normalized_data(self, data: Dict[str, Any]) -> List[str]:
        """Validate normalized data and return any issues.
        
        Args:
            data: Normalized data
            
        Returns:
            List of validation issues
        """
        issues = []
        
        # Check required fields
        if 'courses' in data:
            for i, course in enumerate(data['courses']):
                if not course.get('course_number'):
                    issues.append(f"Course {i}: Missing course number")
                if not course.get('title'):
                    issues.append(f"Course {i}: Missing title")
                if course.get('units', 0) <= 0:
                    issues.append(f"Course {i}: Invalid units value")
                    
                # Check sections
                for j, section in enumerate(course.get('sections', [])):
                    if not section.get('crn'):
                        issues.append(f"Course {i}, Section {j}: Missing CRN")
                    if not section.get('meetings'):
                        issues.append(f"Course {i}, Section {j}: No meeting times")
                        
        return issues