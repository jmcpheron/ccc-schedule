from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Term:
    code: str
    name: str
    start_date: str
    end_date: str


@dataclass
class CollegeTheme:
    primary_color: str
    secondary_color: str


@dataclass
class College:
    id: str
    name: str
    abbreviation: str
    logo_url: str
    theme: CollegeTheme


@dataclass
class Metadata:
    version: str
    last_updated: str
    terms: list[Term]
    colleges: list[College]


@dataclass
class Subject:
    code: str
    name: str
    department: str


@dataclass
class Instructor:
    id: str
    name: str
    email: str
    departments: list[str]


@dataclass
class Transferable:
    csu: bool
    uc: bool
    private: bool


@dataclass
class GeneralEducation:
    csu_area: list[str] = field(default_factory=list)
    igetc_area: list[str] = field(default_factory=list)
    local: list[str] = field(default_factory=list)


@dataclass
class CourseAttributes:
    transferable: Transferable
    general_education: GeneralEducation
    c_id: Optional[str] = None
    degree_applicable: bool = True
    basic_skills: bool = False


@dataclass
class Enrollment:
    enrolled: int
    capacity: int
    waitlist: int
    waitlist_capacity: int


@dataclass
class Location:
    building: str
    room: str
    campus: str


@dataclass
class Meeting:
    type: str
    days: list[str]
    start_time: str
    end_time: str
    location: Location


@dataclass
class SectionDates:
    start: str
    end: str
    duration_weeks: int


@dataclass
class Textbook:
    required: bool
    cost_category: str
    details: str


@dataclass
class Section:
    crn: str
    section_number: str
    term: str
    college: str
    instruction_mode: str
    status: str
    enrollment: Enrollment
    meetings: list[Meeting]
    instructors: list[str]
    dates: SectionDates
    textbook: Textbook
    notes: str = ""
    fees: float = 0.0


@dataclass
class Course:
    course_key: str
    subject: str
    course_number: str
    title: str
    description: str
    units: float
    unit_type: str
    prerequisites: str = ""
    corequisites: str = ""
    advisory: str = ""
    attributes: Optional[CourseAttributes] = None
    sections: list[Section] = field(default_factory=list)


@dataclass
class Schedule:
    metadata: Metadata
    subjects: list[Subject]
    instructors: list[Instructor]
    courses: list[Course]


@dataclass
class FilterOptions:
    term: Optional[str] = None
    college: Optional[str] = None
    subject: Optional[str] = None
    instruction_mode: Optional[str] = None
    days: Optional[list[str]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    units_min: Optional[float] = None
    units_max: Optional[float] = None
    ge_area: Optional[str] = None
    transferable: Optional[str] = None
    textbook_cost: Optional[str] = None
    open_only: bool = False
    keyword: Optional[str] = None
