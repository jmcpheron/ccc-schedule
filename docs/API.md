# CCC Schedule API Documentation

This document describes the Python API for working with CCC Schedule data.

## Installation

```python
from src import (
    load_schedule_data, save_schedule_data, filter_courses,
    get_unique_values, Schedule, Course, FilterOptions
)
```

## Core Functions

### load_schedule_data

Load schedule data from a JSON file.

```python
def load_schedule_data(file_path: str | Path) -> Schedule:
    """
    Load and parse schedule data from JSON file.
    
    Args:
        file_path: Path to the schedule JSON file
        
    Returns:
        Schedule object with parsed data
        
    Raises:
        FileNotFoundError: If file doesn't exist
        json.JSONDecodeError: If file contains invalid JSON
        ValueError: If data doesn't match schema
    """
```

**Example:**
```python
schedule = load_schedule_data("data/spring2025.json")
print(f"Loaded {len(schedule.courses)} courses")
```

### save_schedule_data

Save schedule data to a JSON file.

```python
def save_schedule_data(schedule: Schedule, file_path: str | Path) -> None:
    """
    Save schedule data to JSON file.
    
    Args:
        schedule: Schedule object to save
        file_path: Path where to save the file
    """
```

**Example:**
```python
save_schedule_data(schedule, "output/filtered_schedule.json")
```

### filter_courses

Filter courses based on multiple criteria.

```python
def filter_courses(courses: list[Course], filters: FilterOptions) -> list[Course]:
    """
    Filter courses based on multiple criteria.
    
    Args:
        courses: List of Course objects
        filters: FilterOptions with filter criteria
        
    Returns:
        Filtered list of courses
    """
```

**Example:**
```python
filters = FilterOptions(
    subject="CS",
    units_min=3.0,
    open_only=True,
    instruction_mode="In Person"
)
filtered = filter_courses(schedule.courses, filters)
```

### get_unique_values

Extract unique values for building filter options.

```python
def get_unique_values(schedule: Schedule) -> dict[str, list[str]]:
    """
    Extract unique values for filter options from schedule data.
    
    Returns:
        Dictionary with unique values for each filter type:
        - terms: List of term codes
        - colleges: List of college IDs
        - subjects: List of subject codes
        - instruction_modes: List of instruction modes
        - textbook_costs: List of textbook cost categories
        - ge_areas: List of GE area codes
    """
```

**Example:**
```python
unique_values = get_unique_values(schedule)
print(f"Available subjects: {', '.join(unique_values['subjects'])}")
```

## Data Models

### Schedule

The root container for all schedule data.

```python
@dataclass
class Schedule:
    metadata: Metadata
    subjects: list[Subject]
    instructors: list[Instructor]
    courses: list[Course]
```

### Course

Represents a course with its sections.

```python
@dataclass
class Course:
    course_key: str              # Unique identifier (e.g., "CS-101")
    subject: str                 # Subject code (e.g., "CS")
    course_number: str           # Course number (e.g., "101")
    title: str                   # Course title
    description: str             # Course description
    units: float                 # Number of units
    unit_type: str              # Type of units (e.g., "semester")
    prerequisites: str = ""      # Prerequisites text
    corequisites: str = ""       # Corequisites text
    advisory: str = ""           # Advisory text
    attributes: Optional[CourseAttributes] = None
    sections: list[Section] = field(default_factory=list)
```

### Section

Represents a specific section of a course.

```python
@dataclass
class Section:
    crn: str                     # Course Reference Number
    section_number: str          # Section number
    term: str                    # Term code (e.g., "202530")
    college: str                 # College ID
    instruction_mode: str        # Mode (e.g., "In Person", "Online")
    status: str                  # Status (e.g., "Open", "Closed")
    enrollment: Enrollment       # Enrollment information
    meetings: list[Meeting]      # Meeting times and locations
    instructors: list[str]       # Instructor IDs
    dates: SectionDates         # Start/end dates
    textbook: Textbook          # Textbook information
    notes: str = ""             # Additional notes
    fees: float = 0.0           # Additional fees
```

### FilterOptions

Options for filtering courses.

```python
@dataclass
class FilterOptions:
    term: Optional[str] = None
    college: Optional[str] = None
    subject: Optional[str] = None
    instruction_mode: Optional[str] = None
    days: Optional[list[str]] = None
    start_time: Optional[str] = None      # Format: "HH:MM"
    end_time: Optional[str] = None        # Format: "HH:MM"
    units_min: Optional[float] = None
    units_max: Optional[float] = None
    ge_area: Optional[str] = None
    transferable: Optional[str] = None    # "CSU" or "UC"
    textbook_cost: Optional[str] = None   # "Zero", "Low", "High"
    open_only: bool = False
    keyword: Optional[str] = None
```

## Common Use Cases

### 1. Load and Display Course Count by Subject

```python
schedule = load_schedule_data("data/schedule.json")

subject_counts = {}
for course in schedule.courses:
    subject_counts[course.subject] = subject_counts.get(course.subject, 0) + 1

for subject, count in sorted(subject_counts.items()):
    print(f"{subject}: {count} courses")
```

### 2. Find All Open Sections for a Subject

```python
filters = FilterOptions(subject="MATH", open_only=True)
math_courses = filter_courses(schedule.courses, filters)

for course in math_courses:
    print(f"\n{course.course_key}: {course.title}")
    for section in course.sections:
        print(f"  CRN {section.crn}: {section.instruction_mode}")
```

### 3. Search for Courses by Keyword

```python
filters = FilterOptions(keyword="python")
results = filter_courses(schedule.courses, filters)

for course in results:
    print(f"{course.course_key}: {course.title}")
    print(f"  {course.description}")
```

### 4. Filter by Multiple Criteria

```python
filters = FilterOptions(
    term="202530",
    units_min=3.0,
    units_max=4.0,
    days=["M", "W"],
    start_time="09:00",
    end_time="12:00",
    transferable="UC"
)
results = filter_courses(schedule.courses, filters)
```

### 5. Export Filtered Results

```python
# Filter courses
filters = FilterOptions(subject="CS", open_only=True)
filtered_courses = filter_courses(schedule.courses, filters)

# Create new schedule with filtered courses
filtered_schedule = Schedule(
    metadata=schedule.metadata,
    subjects=schedule.subjects,
    instructors=schedule.instructors,
    courses=filtered_courses
)

# Save to file
save_schedule_data(filtered_schedule, "output/cs_open_sections.json")
```

## Working with Meeting Times

```python
for course in schedule.courses:
    for section in course.sections:
        for meeting in section.meetings:
            print(f"{course.course_key} - {section.crn}")
            print(f"  {meeting.type}: {', '.join(meeting.days)}")
            print(f"  {meeting.start_time} - {meeting.end_time}")
            print(f"  {meeting.location.building} {meeting.location.room}")
```

## Error Handling

```python
try:
    schedule = load_schedule_data("data/schedule.json")
except FileNotFoundError:
    print("Schedule file not found")
except json.JSONDecodeError as e:
    print(f"Invalid JSON: {e}")
except ValueError as e:
    print(f"Data validation error: {e}")
```