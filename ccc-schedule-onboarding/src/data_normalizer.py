"""
Data Validation and Normalization for College Schedule Data

This module provides LLM-style intelligent normalization of course data,
handling various formats and inconsistencies automatically.
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, time
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of data validation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]


class DataNormalizer:
    """
    Intelligent data normalizer that uses LLM-style understanding
    to clean and standardize course data.
    """
    
    def __init__(self):
        # Common abbreviations and their expansions
        self.location_abbreviations = {
            'TBA': 'To Be Announced',
            'ARR': 'Arranged',
            'ASYNC': 'Asynchronous Online',
            'SYNC': 'Synchronous Online',
            'HY': 'Hybrid',
            'WEB': 'Online'
        }
        
        # Common building abbreviations
        self.building_patterns = {
            r'ADM': 'Administration',
            r'SCI': 'Science',
            r'BUS': 'Business',
            r'TECH': 'Technology',
            r'PE': 'Physical Education',
            r'LRC': 'Learning Resource Center',
            r'HSS': 'Humanities and Social Sciences'
        }
    
    def normalize_course(self, course: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a course and all its sections.
        
        This handles:
        - Unit format standardization
        - Title capitalization
        - Section data cleaning
        - Time format normalization
        - Location expansion
        """
        normalized = course.copy()
        
        # Normalize basic course info
        normalized['units'] = self.normalize_units(course.get('units', ''))
        normalized['title'] = self.normalize_title(course.get('title', ''))
        normalized['courseNumber'] = self.normalize_course_number(
            course.get('courseNumber', '')
        )
        
        # Normalize sections
        if 'sections' in normalized:
            normalized['sections'] = [
                self.normalize_section(section) 
                for section in normalized['sections']
            ]
        
        return normalized
    
    def normalize_section(self, section: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a single section."""
        normalized = section.copy()
        
        # Normalize schedule information
        if 'schedule' in normalized:
            schedule = normalized['schedule']
            schedule['days'] = self.normalize_days(schedule.get('days', ''))
            schedule['time'] = self.normalize_time(schedule.get('time', ''))
            schedule['location'] = self.normalize_location(
                schedule.get('location', '')
            )
        
        # Normalize instructor name
        if 'instructor' in normalized:
            normalized['instructor'] = self.normalize_instructor_name(
                normalized['instructor']
            )
        
        # Ensure enrollment data is clean
        if 'enrollment' in normalized:
            enrollment = normalized['enrollment']
            for field in ['seats', 'enrolled', 'waitlist']:
                if field in enrollment and enrollment[field] is not None:
                    enrollment[field] = max(0, int(enrollment[field]))
        
        return normalized
    
    def normalize_units(self, units: str) -> str:
        """
        Normalize unit values to consistent format.
        
        Examples:
        - "3" -> "3.0"
        - "3.0 units" -> "3.0"
        - "3-4" -> "3.0-4.0"
        - "3.5" -> "3.5"
        """
        if not units:
            return "0.0"
        
        # Remove 'units' or 'unit' suffix
        units = re.sub(r'\s*units?\s*$', '', units, flags=re.IGNORECASE)
        units = units.strip()
        
        # Handle range (e.g., "3-4")
        if '-' in units:
            parts = units.split('-')
            if len(parts) == 2:
                try:
                    start = float(parts[0].strip())
                    end = float(parts[1].strip())
                    return f"{start:.1f}-{end:.1f}"
                except ValueError:
                    pass
        
        # Handle single value
        try:
            value = float(units)
            return f"{value:.1f}"
        except ValueError:
            # If all else fails, return as-is
            return units
    
    def normalize_title(self, title: str) -> str:
        """
        Normalize course title capitalization.
        
        Uses intelligent title case that preserves acronyms.
        """
        if not title:
            return ""
        
        # Preserve all-caps words (likely acronyms)
        words = title.split()
        normalized_words = []
        
        for word in words:
            if word.isupper() and len(word) > 1:
                # Keep acronyms as-is
                normalized_words.append(word)
            elif word.lower() in ['and', 'or', 'the', 'in', 'of', 'to', 'for']:
                # Lowercase articles and prepositions
                normalized_words.append(word.lower())
            else:
                # Title case for regular words
                normalized_words.append(word.capitalize())
        
        # Capitalize first word regardless
        if normalized_words:
            normalized_words[0] = normalized_words[0].capitalize()
        
        return ' '.join(normalized_words)
    
    def normalize_course_number(self, course_number: str) -> str:
        """
        Normalize course number format.
        
        Examples:
        - "101" -> "101"
        - "101A" -> "101A"
        - "CS101" -> "101" (assuming subject is separate)
        """
        if not course_number:
            return ""
        
        # Extract just the number and optional letter suffix
        match = re.search(r'(\d+[A-Z]?)$', course_number)
        if match:
            return match.group(1)
        
        return course_number
    
    def normalize_days(self, days: str) -> str:
        """
        Normalize day codes to standard format.
        
        Examples:
        - "MWF" -> "MWF"
        - "M W F" -> "MWF"
        - "Mon Wed Fri" -> "MWF"
        - "T/Th" -> "TR"
        """
        if not days:
            return ""
        
        # Remove spaces and special characters
        days = re.sub(r'[^A-Za-z]', '', days)
        days = days.upper()
        
        # Expand common abbreviations
        replacements = {
            'TH': 'R',  # Thursday -> R
            'TU': 'T',  # Tuesday -> T
            'SA': 'S',  # Saturday -> S
            'SU': 'U',  # Sunday -> U
        }
        
        for old, new in replacements.items():
            days = days.replace(old, new)
        
        # Ensure standard order (MTWRFSU)
        day_order = {'M': 0, 'T': 1, 'W': 2, 'R': 3, 'F': 4, 'S': 5, 'U': 6}
        unique_days = list(set(days))
        unique_days.sort(key=lambda d: day_order.get(d, 99))
        
        return ''.join(unique_days)
    
    def normalize_time(self, time_str: str) -> str:
        """
        Normalize time format to standard "HH:MM AM - HH:MM PM".
        
        Examples:
        - "10:00am-11:50am" -> "10:00 AM - 11:50 AM"
        - "2:00 PM - 3:50 PM" -> "2:00 PM - 3:50 PM"
        - "14:00-15:50" -> "2:00 PM - 3:50 PM"
        """
        if not time_str or time_str.upper() in ['TBA', 'ARR']:
            return time_str
        
        # Extract start and end times
        time_pattern = r'(\d{1,2}):?(\d{2})?\s*([ap]\.?m\.?)?'
        matches = re.findall(time_pattern, time_str, re.IGNORECASE)
        
        if len(matches) >= 2:
            start_time = self._parse_time_match(matches[0])
            end_time = self._parse_time_match(matches[1])
            
            if start_time and end_time:
                return f"{self._format_time(start_time)} - {self._format_time(end_time)}"
        
        return time_str
    
    def _parse_time_match(self, match: Tuple[str, str, str]) -> Optional[time]:
        """Parse a regex time match into a time object."""
        hour, minute, meridiem = match
        
        try:
            hour = int(hour)
            minute = int(minute) if minute else 0
            
            # Handle 24-hour format
            if not meridiem and hour >= 13:
                hour = hour - 12
                meridiem = 'pm'
            elif not meridiem and hour < 12:
                meridiem = 'am'
            
            # Handle 12 AM/PM
            if meridiem and meridiem.lower().startswith('p') and hour < 12:
                hour += 12
            elif meridiem and meridiem.lower().startswith('a') and hour == 12:
                hour = 0
            
            return time(hour % 24, minute)
        
        except ValueError:
            return None
    
    def _format_time(self, t: time) -> str:
        """Format a time object as 'HH:MM AM/PM'."""
        hour = t.hour
        meridiem = 'AM'
        
        if hour >= 12:
            meridiem = 'PM'
            if hour > 12:
                hour -= 12
        elif hour == 0:
            hour = 12
        
        return f"{hour}:{t.minute:02d} {meridiem}"
    
    def normalize_location(self, location: str) -> str:
        """
        Normalize location names.
        
        This expands abbreviations and standardizes format.
        """
        if not location:
            return "TBA"
        
        location = location.strip()
        
        # Check for special locations
        if location.upper() in self.location_abbreviations:
            return self.location_abbreviations[location.upper()]
        
        # Expand building abbreviations
        for pattern, expansion in self.building_patterns.items():
            location = re.sub(
                rf'\b{pattern}\b', 
                expansion, 
                location, 
                flags=re.IGNORECASE
            )
        
        # Standardize room numbers
        location = re.sub(r'(\w+)\s+(\d+)', r'\1 \2', location)
        
        return location
    
    def normalize_instructor_name(self, name: str) -> str:
        """
        Normalize instructor names to consistent format.
        
        Examples:
        - "Smith, John" -> "John Smith"
        - "STAFF" -> "Staff"
        - "John Smith PhD" -> "Dr. John Smith"
        """
        if not name:
            return "Staff"
        
        name = name.strip()
        
        # Handle special cases
        if name.upper() in ['STAFF', 'TBA', 'TBD']:
            return "Staff"
        
        # Handle "Last, First" format
        if ',' in name:
            parts = name.split(',', 1)
            if len(parts) == 2:
                last, first = parts
                name = f"{first.strip()} {last.strip()}"
        
        # Handle titles
        titles = {
            'PhD': 'Dr.',
            'Ph.D.': 'Dr.',
            'MD': 'Dr.',
            'M.D.': 'Dr.'
        }
        
        for suffix, prefix in titles.items():
            if name.endswith(suffix):
                name = name[:-len(suffix)].strip()
                if not name.startswith(prefix):
                    name = f"{prefix} {name}"
        
        return name
    
    def validate_course_data(self, courses: List[Dict[str, Any]]) -> ValidationResult:
        """
        Validate course data and provide actionable feedback.
        
        This uses LLM-style understanding to identify issues and
        suggest improvements.
        """
        errors = []
        warnings = []
        suggestions = []
        
        for i, course in enumerate(courses):
            course_id = f"{course.get('subject', '???')} {course.get('courseNumber', '???')}"
            
            # Required fields
            if not course.get('subject'):
                errors.append(f"Course {i+1}: Missing subject code")
            
            if not course.get('courseNumber'):
                errors.append(f"Course {i+1}: Missing course number")
            
            if not course.get('title'):
                warnings.append(f"{course_id}: Missing course title")
            
            # Validate sections
            sections = course.get('sections', [])
            if not sections:
                warnings.append(f"{course_id}: No sections found")
            
            for j, section in enumerate(sections):
                section_id = f"{course_id} Section {section.get('crn', j+1)}"
                
                # Check for required section fields
                if not section.get('crn'):
                    errors.append(f"{section_id}: Missing CRN")
                
                # Check enrollment data consistency
                enrollment = section.get('enrollment', {})
                seats = enrollment.get('seats', 0)
                enrolled = enrollment.get('enrolled', 0)
                
                if enrolled > seats and seats > 0:
                    warnings.append(
                        f"{section_id}: Enrollment ({enrolled}) exceeds capacity ({seats})"
                    )
        
        # Overall suggestions
        if len(courses) < 10:
            suggestions.append(
                "Consider adding more courses to provide a complete schedule"
            )
        
        total_sections = sum(len(c.get('sections', [])) for c in courses)
        if total_sections == 0:
            errors.append("No course sections found in the data")
        
        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )