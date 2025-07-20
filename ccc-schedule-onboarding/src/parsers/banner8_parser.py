"""
Banner 8 Specific Parser for Community College Schedules

This parser is optimized for Ellucian Banner 8 systems like Rio Hondo's.
It uses LLM-style understanding to handle the complex table structures
and various edge cases in Banner HTML output.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from ..llm_parser import Course, CourseSection


class Banner8Parser:
    """
    Specialized parser for Banner 8 HTML schedule format.
    
    This parser understands the specific patterns and quirks of Banner 8
    systems, making it more reliable than generic HTML parsing.
    """
    
    def __init__(self):
        self.current_subject = None
        self.current_course = None
        self.courses = []
    
    def parse(self, html_content: str) -> List[Course]:
        """
        Parse Banner 8 HTML content into Course objects.
        
        This method handles:
        - Subject headers (e.g., "ACCT - Accounting")
        - Course titles (e.g., "ACCT 101 - Financial Accounting")
        - Multiple sections with complex meeting patterns
        - Various section types (WEB, HY, LEC, LAB, etc.)
        - Special notes and prerequisites
        """
        self.courses = []
        self.current_subject = None
        self.current_course = None
        
        # Process line by line for better control
        lines = html_content.split('\n')
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip empty lines
            if not line:
                i += 1
                continue
            
            # Check for subject header (e.g., "ACCT - Accounting")
            if self._is_subject_header(line):
                self._process_subject_header(line)
            
            # Check for course title (e.g., "ACCT 101 - Financial Accounting")
            elif self._is_course_title(line):
                self._save_current_course()
                self._process_course_title(line)
            
            # Check for section header row
            elif self._is_section_header(line):
                # Skip the header row
                i += 1
                # Process section data rows
                while i < len(lines) and not self._is_new_section_group(lines[i]):
                    if self._is_section_row(lines[i]):
                        section_data, lines_consumed = self._extract_section_data(lines, i)
                        if section_data:
                            self._add_section(section_data)
                        i += lines_consumed
                    else:
                        i += 1
                continue
            
            i += 1
        
        # Don't forget the last course
        self._save_current_course()
        
        return self.courses
    
    def _is_subject_header(self, line: str) -> bool:
        """Check if line is a subject header like 'ACCT - Accounting'."""
        pattern = r'^[A-Z]{2,4}\s+-\s+[A-Za-z\s]+$'
        return bool(re.match(pattern, line))
    
    def _is_course_title(self, line: str) -> bool:
        """Check if line is a course title like 'ACCT 101 - Financial Accounting'."""
        pattern = r'^[A-Z]{2,4}\s+\d{2,3}[A-Z]?\s+-\s+.+$'
        return bool(re.match(pattern, line))
    
    def _is_section_header(self, line: str) -> bool:
        """Check if line is a section table header."""
        headers = ['Status', 'Type', 'CRN', 'Book', 'Zero', 'Unit']
        return any(header in line for header in headers)
    
    def _is_section_row(self, line: str) -> bool:
        """Check if line contains section data."""
        # Look for status indicators
        statuses = ['CLOSED', 'OPEN', 'Cancelled']
        return any(line.startswith(status) for status in statuses)
    
    def _is_new_section_group(self, line: str) -> bool:
        """Check if we're starting a new course or subject."""
        return (self._is_subject_header(line) or 
                self._is_course_title(line) or
                not line.strip())
    
    def _process_subject_header(self, line: str):
        """Process a subject header line."""
        match = re.match(r'^([A-Z]{2,4})\s+-\s+(.+)$', line)
        if match:
            self.current_subject = {
                'code': match.group(1),
                'name': match.group(2).strip()
            }
    
    def _process_course_title(self, line: str):
        """Process a course title line."""
        match = re.match(r'^([A-Z]{2,4})\s+(\d{2,3}[A-Z]?)\s+-\s+(.+)$', line)
        if match:
            self.current_course = Course(
                subject=match.group(1),
                course_number=match.group(2),
                title=match.group(3).strip(),
                units="0.0"  # Will be updated from sections
            )
    
    def _extract_section_data(self, lines: List[str], start_idx: int) -> Tuple[Optional[Dict], int]:
        """
        Extract section data from one or more lines.
        
        Returns tuple of (section_data, lines_consumed)
        """
        section_data = {}
        lines_consumed = 0
        
        # Parse the main section line
        main_line = lines[start_idx].strip()
        if not main_line:
            return None, 1
        
        # Split by tabs or multiple spaces
        parts = re.split(r'\t+|\s{2,}', main_line)
        
        if len(parts) < 10:
            return None, 1
        
        # Extract fields based on Banner 8 format
        try:
            section_data = {
                'status': parts[0].strip(),
                'type': parts[1].strip(),
                'crn': parts[2].strip(),
                'units': self._extract_units(parts),
                'meeting_time': parts[6].strip() if len(parts) > 6 else '',
                'location': parts[7].strip() if len(parts) > 7 else 'TBA',
                'capacity': self._safe_int(parts[8]) if len(parts) > 8 else None,
                'enrolled': self._safe_int(parts[9]) if len(parts) > 9 else None,
                'remaining': self._safe_int(parts[10]) if len(parts) > 10 else None,
                'instructor': parts[11].strip() if len(parts) > 11 else 'Staff',
                'instructor_email': parts[12].strip() if len(parts) > 12 else None,
                'dates': parts[13].strip() if len(parts) > 13 else '',
                'weeks': parts[14].strip() if len(parts) > 14 else ''
            }
            
            lines_consumed = 1
            
            # Check for additional meeting times on subsequent lines
            next_idx = start_idx + 1
            while next_idx < len(lines):
                next_line = lines[next_idx].strip()
                
                # If line contains time pattern but no status, it's additional meeting
                if (self._contains_time_pattern(next_line) and 
                    not any(next_line.startswith(s) for s in ['CLOSED', 'OPEN', 'Cancelled'])):
                    
                    # Extract additional meeting info
                    additional_parts = re.split(r'\t+|\s{2,}', next_line)
                    if len(additional_parts) >= 3:
                        # Append to existing meeting time
                        if 'additional_meetings' not in section_data:
                            section_data['additional_meetings'] = []
                        
                        section_data['additional_meetings'].append({
                            'days': self._extract_days(additional_parts[0]),
                            'time': self._extract_time_from_parts(additional_parts),
                            'location': additional_parts[2] if len(additional_parts) > 2 else 'TBA',
                            'dates': additional_parts[-1] if len(additional_parts) > 3 else ''
                        })
                    
                    lines_consumed += 1
                    next_idx += 1
                else:
                    break
            
            return section_data, lines_consumed
            
        except Exception as e:
            # In production, log the error
            return None, 1
    
    def _add_section(self, section_data: Dict[str, Any]):
        """Add a section to the current course."""
        if not self.current_course:
            return
        
        # Create CourseSection object
        section = CourseSection(
            crn=section_data['crn'],
            section_number=section_data['crn'][-4:],  # Use last 4 digits as section
            instructor=section_data['instructor'],
            instructor_email=section_data.get('instructor_email'),
            days=self._extract_days(section_data['meeting_time']),
            time=self._extract_time(section_data['meeting_time']),
            location=section_data['location'],
            seats=section_data.get('capacity'),
            enrolled=section_data.get('enrolled'),
            waitlist=self._calculate_waitlist(section_data),
            status=section_data['status'],
            type=section_data['type']
        )
        
        # Add notes for special cases
        notes = []
        if section_data.get('dates') and section_data['dates'] != '03/29-05/22':
            notes.append(f"Dates: {section_data['dates']}")
        
        if section_data.get('additional_meetings'):
            for meeting in section_data['additional_meetings']:
                notes.append(f"Also meets: {meeting['days']} {meeting['time']} in {meeting['location']}")
        
        if 'arr' in section_data.get('meeting_time', '').lower():
            notes.append("Hours to be arranged")
        
        if notes:
            section.notes = '; '.join(notes)
        
        # Update course units from first section
        if self.current_course.units == "0.0" and section_data.get('units'):
            self.current_course.units = section_data['units']
        
        self.current_course.sections.append(section)
    
    def _save_current_course(self):
        """Save the current course to the courses list."""
        if self.current_course and self.current_course.sections:
            self.courses.append(self.current_course)
            self.current_course = None
    
    def _extract_units(self, parts: List[str]) -> str:
        """Extract units from parts list."""
        for part in parts:
            if re.match(r'^\d+\.\d+$', part.strip()):
                return part.strip()
        return "0.0"
    
    def _extract_days(self, text: str) -> str:
        """Extract day codes from text."""
        # Look for patterns like M, T, W, R, F, S
        days_match = re.search(r'[MTWRFS]+(?:\s+[MTWRFS]+)*', text)
        if days_match:
            # Combine multiple day groups
            return ''.join(days_match.group(0).split())
        return ""
    
    def _extract_time(self, text: str) -> str:
        """Extract time range from text."""
        # Look for time patterns like "10:00am - 11:50am"
        time_pattern = r'\d{1,2}:\d{2}[ap]m\s*-\s*\d{1,2}:\d{2}[ap]m'
        match = re.search(time_pattern, text, re.IGNORECASE)
        return match.group(0) if match else ""
    
    def _extract_time_from_parts(self, parts: List[str]) -> str:
        """Extract time from parts array."""
        for part in parts:
            if re.search(r'\d{1,2}:\d{2}[ap]m', part, re.IGNORECASE):
                return part
        return ""
    
    def _contains_time_pattern(self, text: str) -> bool:
        """Check if text contains a time pattern."""
        return bool(re.search(r'\d{1,2}:\d{2}[ap]m', text, re.IGNORECASE))
    
    def _safe_int(self, value: Any) -> Optional[int]:
        """Safely convert value to integer."""
        try:
            return int(str(value).strip())
        except (ValueError, AttributeError):
            return None
    
    def _calculate_waitlist(self, section_data: Dict) -> Optional[int]:
        """Calculate waitlist from capacity, enrolled, and remaining."""
        # In Banner 8, if enrolled >= capacity, remaining shows waitlist
        capacity = section_data.get('capacity')
        enrolled = section_data.get('enrolled')
        remaining = section_data.get('remaining')
        
        if all(x is not None for x in [capacity, enrolled, remaining]):
            if enrolled >= capacity and remaining > 0:
                return remaining
            else:
                return 0
        return None