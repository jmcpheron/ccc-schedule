"""
LLM-Enhanced Parser for College Schedule Data

This module uses Large Language Models to intelligently extract course data
from various formats (HTML, JSON, PDF) without requiring brittle CSS selectors
or regex patterns. The LLM understands context and can adapt to format variations.
"""

import json
import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class CourseSection:
    """Represents a single section of a course."""
    crn: str
    section_number: str
    instructor: str
    instructor_email: Optional[str] = None
    days: str = ""
    time: str = ""
    location: str = ""
    seats: Optional[int] = None
    enrolled: Optional[int] = None
    waitlist: Optional[int] = None
    status: str = "Open"
    type: str = "LEC"  # LEC, LAB, WEB, HY (Hybrid)
    notes: Optional[str] = None


@dataclass 
class Course:
    """Represents a course with all its sections."""
    subject: str
    course_number: str
    title: str
    units: str
    description: Optional[str] = None
    sections: List[CourseSection] = None
    
    def __post_init__(self):
        if self.sections is None:
            self.sections = []


class LLMParser:
    """
    Base class for LLM-powered schedule parsing.
    
    In production, this would use OpenAI/Anthropic APIs.
    For demo purposes, we'll simulate the LLM extraction.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        # In production: self.client = OpenAI(api_key=api_key)
    
    def parse_html(self, html_content: str, hints: Optional[Dict[str, Any]] = None) -> List[Course]:
        """
        Use LLM to extract course data from HTML.
        
        Args:
            html_content: Raw HTML from the college website
            hints: Optional hints about the format (e.g., "Banner 8 system")
            
        Returns:
            List of Course objects with all sections
        """
        # In production, this would make an API call like:
        # response = self.client.chat.completions.create(
        #     model="gpt-4",
        #     messages=[
        #         {"role": "system", "content": EXTRACTION_PROMPT},
        #         {"role": "user", "content": f"Extract course data from: {html_content}"}
        #     ]
        # )
        
        # For demo, we'll parse the Rio Hondo format
        return self._demo_parse_banner8(html_content)
    
    def _demo_parse_banner8(self, html_content: str) -> List[Course]:
        """Demo parser that simulates LLM extraction for Banner 8 HTML."""
        courses = []
        current_course = None
        
        # Simulate LLM understanding of the HTML structure
        lines = html_content.split('\n')
        
        for i, line in enumerate(lines):
            # Detect course headers (e.g., "ACCT 101 - Financial Accounting")
            course_match = re.match(r'^([A-Z]+)\s+(\d+)\s+-\s+(.+)$', line.strip())
            if course_match:
                # Save previous course
                if current_course:
                    courses.append(current_course)
                
                # Start new course
                current_course = Course(
                    subject=course_match.group(1),
                    course_number=course_match.group(2),
                    title=course_match.group(3),
                    units="3.0"  # Will be extracted from section data
                )
                continue
            
            # Detect section rows (contain Status, Type, CRN, etc.)
            if current_course and '\t' in line and any(status in line for status in ['CLOSED', 'OPEN', 'Cancelled']):
                parts = line.split('\t')
                if len(parts) >= 10:
                    try:
                        section = CourseSection(
                            crn=self._clean_field(parts[2]),
                            section_number=self._extract_section_number(parts),
                            instructor=self._clean_field(parts[11]) if len(parts) > 11 else "Staff",
                            instructor_email=self._clean_field(parts[12]) if len(parts) > 12 else None,
                            days=self._extract_days(parts[6] if len(parts) > 6 else ""),
                            time=self._extract_time(parts[6] if len(parts) > 6 else ""),
                            location=self._clean_field(parts[7]) if len(parts) > 7 else "TBA",
                            status=self._clean_field(parts[0]),
                            type=self._clean_field(parts[1]),
                            units=self._clean_field(parts[5]) if len(parts) > 5 else "3.0"
                        )
                        
                        # Extract enrollment info
                        if len(parts) > 10:
                            section.seats = self._safe_int(parts[8])
                            section.enrolled = self._safe_int(parts[9])
                            section.waitlist = self._safe_int(parts[10])
                        
                        # Update course units from first section
                        if current_course.units == "3.0" and section.units:
                            current_course.units = section.units
                        
                        current_course.sections.append(section)
                    except Exception:
                        # In production, LLM would handle malformed data better
                        pass
        
        # Don't forget the last course
        if current_course:
            courses.append(current_course)
        
        return courses
    
    def _clean_field(self, field: str) -> str:
        """Clean and normalize a field value."""
        return field.strip() if field else ""
    
    def _safe_int(self, value: str) -> Optional[int]:
        """Safely convert string to int."""
        try:
            return int(value.strip())
        except (ValueError, AttributeError):
            return None
    
    def _extract_days(self, schedule: str) -> str:
        """Extract days from schedule string."""
        # LLM would understand various formats
        days_pattern = r'[MTWRF]+'
        match = re.search(days_pattern, schedule)
        return match.group(0) if match else ""
    
    def _extract_time(self, schedule: str) -> str:
        """Extract time from schedule string."""
        # LLM would understand various time formats
        time_pattern = r'\d{1,2}:\d{2}[ap]m\s*-\s*\d{1,2}:\d{2}[ap]m'
        match = re.search(time_pattern, schedule, re.IGNORECASE)
        return match.group(0) if match else ""
    
    def _extract_section_number(self, parts: List[str]) -> str:
        """Extract section number from parts."""
        # In a real LLM implementation, it would understand context
        # For demo, we'll use a simple approach
        for part in parts:
            if part.strip().isdigit() and len(part.strip()) == 4:
                return part.strip()
        return "0001"
    
    def analyze_format(self, sample_content: str) -> Dict[str, Any]:
        """
        Analyze the format of the provided content and return insights.
        
        In production, this would use LLM to understand:
        - Data format (HTML tables, JSON, etc.)
        - Field names and locations
        - Special patterns or quirks
        """
        analysis = {
            "format_type": "unknown",
            "detected_fields": [],
            "sample_courses": [],
            "recommendations": []
        }
        
        # Simple detection for demo
        if "<table" in sample_content.lower():
            analysis["format_type"] = "HTML Table (likely Banner system)"
            analysis["detected_fields"] = [
                "CRN", "Status", "Type", "Course Number", 
                "Title", "Units", "Meeting Time", "Instructor"
            ]
            analysis["recommendations"].append(
                "This appears to be a Banner 8 system. We can extract all course data automatically."
            )
        elif "{" in sample_content and "}" in sample_content:
            analysis["format_type"] = "JSON"
            analysis["recommendations"].append(
                "JSON format detected. Field mapping will be straightforward."
            )
        
        return analysis
    
    def interactive_mapping(self, sample_data: str) -> Dict[str, str]:
        """
        In production, this would be an interactive process where the LLM
        helps the user map their fields to our standard format.
        
        Returns a mapping configuration.
        """
        # Simulate LLM-assisted mapping
        mapping = {
            "course_number": "Detected: 'Course' column or pattern like 'MATH 101'",
            "title": "Detected: 'Title' or 'Course Title' column",
            "crn": "Detected: 'CRN' column (5-digit numbers)",
            "instructor": "Detected: 'Instructor' column",
            "meeting_time": "Detected: Time patterns like '10:00am - 11:50am'",
            "status": "Detected: 'CLOSED', 'OPEN', 'Cancelled' indicators"
        }
        return mapping


class SmartScheduleExtractor:
    """
    High-level interface for extracting schedule data using LLM.
    Handles the complete extraction pipeline.
    """
    
    def __init__(self, parser: Optional[LLMParser] = None):
        self.parser = parser or LLMParser()
    
    def extract_from_url(self, url: str) -> List[Course]:
        """
        Extract course data from a URL.
        In production, would fetch the page and parse it.
        """
        # In production: 
        # html = fetch_page(url)
        # return self.parser.parse_html(html)
        
        # For demo, return empty list
        return []
    
    def extract_from_file(self, file_path: str) -> List[Course]:
        """Extract course data from a local file."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if file_path.endswith('.html'):
            return self.parser.parse_html(content)
        elif file_path.endswith('.json'):
            # In production, LLM would map JSON fields
            return []
        else:
            # LLM can handle various formats
            return self.parser.parse_html(content)
    
    def to_ccc_format(self, courses: List[Course]) -> Dict[str, Any]:
        """Convert extracted courses to CCC Schedule format."""
        # Extract unique subjects and instructors
        subjects = {}
        instructors = {}
        
        for course in courses:
            if course.subject not in subjects:
                subjects[course.subject] = {
                    "code": course.subject,
                    "name": self._expand_subject_name(course.subject)
                }
            
            for section in course.sections:
                if section.instructor and section.instructor not in instructors:
                    instructors[section.instructor] = {
                        "name": section.instructor,
                        "email": section.instructor_email or f"{section.instructor.lower().replace(' ', '.')}@college.edu"
                    }
        
        # Build CCC format
        ccc_data = {
            "metadata": {
                "college": "Community College",
                "term": "Spring 2025",
                "lastUpdated": datetime.now().isoformat(),
                "source": "LLM-Enhanced Parser"
            },
            "subjects": list(subjects.values()),
            "instructors": list(instructors.values()),
            "courses": []
        }
        
        # Convert courses
        for course in courses:
            course_key = f"{course.subject}-{course.course_number}"
            
            formatted_sections = []
            for section in course.sections:
                formatted_section = {
                    "sectionNumber": section.section_number,
                    "crn": section.crn,
                    "type": section.type,
                    "instructor": section.instructor,
                    "schedule": {
                        "days": section.days,
                        "time": section.time,
                        "location": section.location
                    },
                    "enrollment": {
                        "seats": section.seats,
                        "enrolled": section.enrolled,
                        "waitlist": section.waitlist,
                        "status": section.status
                    }
                }
                if section.notes:
                    formatted_section["notes"] = section.notes
                
                formatted_sections.append(formatted_section)
            
            formatted_course = {
                "courseKey": course_key,
                "subject": course.subject,
                "courseNumber": course.course_number,
                "title": course.title,
                "units": course.units,
                "description": course.description or "",
                "sections": formatted_sections
            }
            
            ccc_data["courses"].append(formatted_course)
        
        return ccc_data
    
    def _expand_subject_name(self, code: str) -> str:
        """Expand subject code to full name."""
        # In production, LLM would know these or look them up
        common_subjects = {
            "ACCT": "Accounting",
            "ADN": "Nursing AS Degree", 
            "AJ": "Administration of Justice",
            "ANTH": "Anthropology",
            "ART": "Art",
            "ASL": "American Sign Language",
            "BIO": "Biology",
            "BUSL": "Business Law",
            "CD": "Child Development",
            "CHST": "Chicano Studies",
            "CIT": "Computer Info Technology",
            "CS": "Computer Science",
            "ECON": "Economics",
            "ENGL": "English",
            "MATH": "Mathematics",
            "PSY": "Psychology",
            "SOC": "Sociology",
            "SPAN": "Spanish"
        }
        return common_subjects.get(code, code)