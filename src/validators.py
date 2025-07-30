"""
Enhanced validators for CCC Schedule data submission.
Provides comprehensive validation with clear error messages and guardrails.
"""

import re
from datetime import datetime, time
from typing import Dict, List, Optional, Tuple, Union, Any
from pathlib import Path


class ValidationError(Exception):
    """Custom exception for validation errors with detailed feedback."""
    
    def __init__(self, field: str, message: str, value: Any = None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"{field}: {message}")


class ValidationResult:
    """Container for validation results with errors and warnings."""
    
    def __init__(self):
        self.errors: List[ValidationError] = []
        self.warnings: List[Dict[str, str]] = []
        self.valid_count: int = 0
        self.total_count: int = 0
    
    @property
    def is_valid(self) -> bool:
        """Check if validation passed without errors."""
        return len(self.errors) == 0
    
    def add_error(self, field: str, message: str, value: Any = None):
        """Add a validation error."""
        self.errors.append(ValidationError(field, message, value))
    
    def add_warning(self, field: str, message: str):
        """Add a validation warning (non-fatal)."""
        self.warnings.append({"field": field, "message": message})
    
    def get_summary(self) -> str:
        """Get a summary of validation results."""
        if self.is_valid:
            status = "✓ Validation passed"
        else:
            status = "✗ Validation failed"
        
        summary = [
            status,
            f"Total items: {self.total_count}",
            f"Valid items: {self.valid_count}",
            f"Errors: {len(self.errors)}",
            f"Warnings: {len(self.warnings)}"
        ]
        
        return "\n".join(summary)


class CourseValidator:
    """Validator for course data with comprehensive checks."""
    
    # Regex patterns
    CRN_PATTERN = re.compile(r'^\d{5}$')
    COURSE_ID_PATTERN = re.compile(r'^[A-Z]{2,4}\s*\d{1,4}[A-Z]?$')
    TIME_PATTERN = re.compile(r'^([01]?\d|2[0-3]):([0-5]\d)$')
    EMAIL_PATTERN = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    TERM_PATTERN = re.compile(r'^\d{6}$')  # YYYYMM format
    
    # Valid values
    VALID_INSTRUCTION_MODES = {'INP', 'HYB', 'FLX', 'AON', 'SON', 'TUT', 'WRK'}
    VALID_CREDIT_TYPES = {'CR', 'NC'}
    VALID_ENROLLMENT_STATUS = {'Open', 'Closed', 'Waitlist'}
    VALID_MEETING_DAYS = {'M', 'T', 'W', 'R', 'F', 'S', 'U'}
    VALID_TEXTBOOK_COSTS = {'ZTC', 'LTC', 'REG'}
    
    def validate_course(self, course: Dict[str, Any]) -> ValidationResult:
        """Validate a single course and all its sections."""
        result = ValidationResult()
        result.total_count = 1
        
        try:
            # Required fields
            self._validate_required_fields(course, result)
            
            # Course-level validations
            self._validate_course_fields(course, result)
            
            # Section validations
            if 'sections' in course:
                for i, section in enumerate(course.get('sections', [])):
                    self._validate_section(section, i, result)
            
            if result.is_valid:
                result.valid_count = 1
                
        except Exception as e:
            result.add_error('course', f"Unexpected error: {str(e)}")
        
        return result
    
    def validate_courses(self, courses: List[Dict[str, Any]]) -> ValidationResult:
        """Validate multiple courses."""
        result = ValidationResult()
        result.total_count = len(courses)
        
        for i, course in enumerate(courses):
            course_result = self.validate_course(course)
            
            # Aggregate results
            for error in course_result.errors:
                error.field = f"course[{i}].{error.field}"
                result.errors.append(error)
            
            for warning in course_result.warnings:
                warning['field'] = f"course[{i}].{warning['field']}"
                result.warnings.append(warning)
            
            if course_result.is_valid:
                result.valid_count += 1
        
        return result
    
    def _validate_required_fields(self, course: Dict[str, Any], result: ValidationResult):
        """Check that all required fields are present."""
        required_fields = ['course_id', 'title', 'units', 'college', 'term']
        
        for field in required_fields:
            if field not in course or course[field] is None:
                result.add_error(field, f"Required field '{field}' is missing")
            elif isinstance(course[field], str) and not course[field].strip():
                result.add_error(field, f"Required field '{field}' is empty")
    
    def _validate_course_fields(self, course: Dict[str, Any], result: ValidationResult):
        """Validate course-level fields."""
        # Course ID format
        course_id = course.get('course_id', '')
        if course_id and not self.COURSE_ID_PATTERN.match(course_id):
            result.add_error('course_id', 
                           f"Invalid course ID format: '{course_id}'. Expected format: 'CS101' or 'MATH123A'",
                           course_id)
        
        # Units validation
        units = course.get('units')
        if units is not None:
            try:
                units_float = float(units)
                if units_float < 0 or units_float > 99:
                    result.add_error('units', 
                                   f"Units must be between 0 and 99, got {units_float}",
                                   units)
            except (ValueError, TypeError):
                result.add_error('units', f"Units must be a number, got '{units}'", units)
        
        # Credit type
        credit_type = course.get('creditType')
        if credit_type and credit_type not in self.VALID_CREDIT_TYPES:
            result.add_error('creditType',
                           f"Invalid credit type '{credit_type}'. Must be one of: {', '.join(self.VALID_CREDIT_TYPES)}",
                           credit_type)
        
        # Term validation
        term = course.get('term')
        if term and not self.TERM_PATTERN.match(str(term)):
            result.add_warning('term', f"Term '{term}' doesn't match expected format YYYYMM")
    
    def _validate_section(self, section: Dict[str, Any], index: int, result: ValidationResult):
        """Validate a course section."""
        section_prefix = f"sections[{index}]"
        
        # CRN validation
        crn = section.get('crn')
        if crn:
            if not self.CRN_PATTERN.match(str(crn)):
                result.add_error(f"{section_prefix}.crn",
                               f"Invalid CRN format: '{crn}'. CRN must be exactly 5 digits",
                               crn)
        else:
            result.add_error(f"{section_prefix}.crn", "Section missing CRN")
        
        # Instruction mode
        instr_mode = section.get('instrMethod')
        if instr_mode and instr_mode not in self.VALID_INSTRUCTION_MODES:
            result.add_error(f"{section_prefix}.instrMethod",
                           f"Invalid instruction mode '{instr_mode}'. Must be one of: {', '.join(self.VALID_INSTRUCTION_MODES)}",
                           instr_mode)
        
        # Time validation
        start_time = section.get('startTime')
        end_time = section.get('endTime')
        
        if start_time and end_time:
            if not self._validate_time_format(start_time):
                result.add_error(f"{section_prefix}.startTime",
                               f"Invalid time format: '{start_time}'. Use HH:MM format (24-hour)",
                               start_time)
            elif not self._validate_time_format(end_time):
                result.add_error(f"{section_prefix}.endTime",
                               f"Invalid time format: '{end_time}'. Use HH:MM format (24-hour)",
                               end_time)
            else:
                # Check time logic
                if not self._validate_time_range(start_time, end_time):
                    result.add_error(f"{section_prefix}.time",
                                   f"End time ({end_time}) must be after start time ({start_time})")
        
        # Meeting days validation
        days = section.get('days')
        if days:
            invalid_days = [d for d in days if d not in self.VALID_MEETING_DAYS]
            if invalid_days:
                result.add_error(f"{section_prefix}.days",
                               f"Invalid meeting days: {', '.join(invalid_days)}. Valid days are: {', '.join(self.VALID_MEETING_DAYS)}",
                               days)
        
        # Enrollment validation
        self._validate_enrollment(section, section_prefix, result)
        
        # Instructor validation
        self._validate_instructor(section, section_prefix, result)
        
        # Textbook cost validation
        textbook_cost = section.get('textbookCost')
        if textbook_cost and textbook_cost not in self.VALID_TEXTBOOK_COSTS:
            result.add_warning(f"{section_prefix}.textbookCost",
                             f"Unknown textbook cost type '{textbook_cost}'")
    
    def _validate_time_format(self, time_str: str) -> bool:
        """Validate time format (HH:MM)."""
        return bool(self.TIME_PATTERN.match(time_str))
    
    def _validate_time_range(self, start_time: str, end_time: str) -> bool:
        """Validate that end time is after start time."""
        try:
            start_h, start_m = map(int, start_time.split(':'))
            end_h, end_m = map(int, end_time.split(':'))
            
            start = time(start_h, start_m)
            end = time(end_h, end_m)
            
            return end > start
        except:
            return False
    
    def _validate_enrollment(self, section: Dict[str, Any], prefix: str, result: ValidationResult):
        """Validate enrollment data."""
        status = section.get('enrollStatus')
        if status and status not in self.VALID_ENROLLMENT_STATUS:
            result.add_error(f"{prefix}.enrollStatus",
                           f"Invalid enrollment status '{status}'. Must be one of: {', '.join(self.VALID_ENROLLMENT_STATUS)}",
                           status)
        
        # Capacity validation
        capacity = section.get('capacity')
        enrolled = section.get('enrolled')
        waitlist = section.get('waitlist')
        
        if capacity is not None and enrolled is not None:
            try:
                cap = int(capacity)
                enr = int(enrolled)
                
                if cap < 0:
                    result.add_error(f"{prefix}.capacity", "Capacity cannot be negative", capacity)
                if enr < 0:
                    result.add_error(f"{prefix}.enrolled", "Enrolled count cannot be negative", enrolled)
                if enr > cap:
                    result.add_warning(f"{prefix}.enrollment",
                                     f"Enrolled ({enr}) exceeds capacity ({cap})")
                
                # Check status consistency
                if status == 'Open' and enr >= cap:
                    result.add_warning(f"{prefix}.enrollStatus",
                                     "Status is 'Open' but class appears full")
                elif status == 'Closed' and enr < cap:
                    result.add_warning(f"{prefix}.enrollStatus",
                                     "Status is 'Closed' but class has available seats")
                
            except (ValueError, TypeError):
                result.add_error(f"{prefix}.enrollment",
                               "Capacity and enrolled must be valid integers")
        
        if waitlist is not None:
            try:
                wl = int(waitlist)
                if wl < 0:
                    result.add_error(f"{prefix}.waitlist", "Waitlist count cannot be negative", waitlist)
            except (ValueError, TypeError):
                result.add_error(f"{prefix}.waitlist", "Waitlist must be a valid integer", waitlist)
    
    def _validate_instructor(self, section: Dict[str, Any], prefix: str, result: ValidationResult):
        """Validate instructor information."""
        name = section.get('instructorName')
        email = section.get('instructorEmail')
        
        if email and not self.EMAIL_PATTERN.match(email):
            result.add_error(f"{prefix}.instructorEmail",
                           f"Invalid email format: '{email}'",
                           email)
        
        # Check consistency
        if email and not name:
            result.add_warning(f"{prefix}.instructor",
                             "Instructor email provided but name is missing")
        elif name and not email:
            result.add_warning(f"{prefix}.instructor",
                             "Instructor name provided but email is missing")


class ScheduleValidator:
    """Validator for complete schedule data files."""
    
    def __init__(self):
        self.course_validator = CourseValidator()
    
    def validate_schedule(self, schedule_data: Dict[str, Any]) -> ValidationResult:
        """Validate a complete schedule data structure."""
        result = ValidationResult()
        
        # Check top-level structure
        if 'metadata' not in schedule_data:
            result.add_error('metadata', "Missing metadata section")
        else:
            self._validate_metadata(schedule_data['metadata'], result)
        
        if 'courses' not in schedule_data:
            result.add_error('courses', "Missing courses section")
        else:
            # Validate all courses
            courses_result = self.course_validator.validate_courses(
                schedule_data['courses']
            )
            
            # Merge results
            result.errors.extend(courses_result.errors)
            result.warnings.extend(courses_result.warnings)
            result.total_count = courses_result.total_count
            result.valid_count = courses_result.valid_count
        
        return result
    
    def _validate_metadata(self, metadata: Dict[str, Any], result: ValidationResult):
        """Validate metadata section."""
        required_fields = ['version', 'last_updated']
        
        for field in required_fields:
            if field not in metadata:
                result.add_error(f'metadata.{field}', f"Missing required field '{field}'")
        
        # Validate date format
        last_updated = metadata.get('last_updated')
        if last_updated:
            try:
                datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
            except:
                result.add_error('metadata.last_updated',
                               f"Invalid date format: '{last_updated}'. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)")


def validate_course_submission(course_data: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
    """
    Convenience function to validate course data submission.
    
    Returns:
        Tuple of (is_valid, errors, warnings)
    """
    validator = CourseValidator()
    result = validator.validate_course(course_data)
    
    errors = [f"{e.field}: {e.message}" for e in result.errors]
    warnings = [f"{w['field']}: {w['message']}" for w in result.warnings]
    
    return result.is_valid, errors, warnings


def validate_schedule_file(file_path: Union[str, Path]) -> ValidationResult:
    """
    Validate a schedule JSON file.
    
    Args:
        file_path: Path to the JSON file
        
    Returns:
        ValidationResult with detailed feedback
    """
    import json
    
    path = Path(file_path)
    if not path.exists():
        result = ValidationResult()
        result.add_error('file', f"File not found: {file_path}")
        return result
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        result = ValidationResult()
        result.add_error('json', f"Invalid JSON: {str(e)}")
        return result
    except Exception as e:
        result = ValidationResult()
        result.add_error('file', f"Error reading file: {str(e)}")
        return result
    
    validator = ScheduleValidator()
    return validator.validate_schedule(data)


# Example usage and testing
if __name__ == "__main__":
    # Example course data
    sample_course = {
        "course_id": "CS101",
        "title": "Introduction to Computer Science",
        "units": 3,
        "college": "Cosmic Cactus",
        "term": "202530",
        "creditType": "CR",
        "sections": [{
            "crn": "12345",
            "instrMethod": "INP",
            "instructorName": "Dr. Smith",
            "instructorEmail": "smith@example.edu",
            "days": "MWF",
            "startTime": "09:00",
            "endTime": "10:30",
            "location": "Room 101",
            "capacity": 30,
            "enrolled": 25,
            "waitlist": 2,
            "enrollStatus": "Open",
            "textbookCost": "ZTC"
        }]
    }
    
    # Validate
    is_valid, errors, warnings = validate_course_submission(sample_course)
    
    print(f"Valid: {is_valid}")
    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  - {error}")
    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"  - {warning}")