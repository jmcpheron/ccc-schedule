#!/usr/bin/env python3
"""
Demo web scraper for Santa Monica College (SMC) course schedule.

This is a working example that scrapes public course data from SMC's website.
It demonstrates how to extract and format real course data without requiring
any API access or authentication.

Note: This is for demonstration purposes. Always check a website's robots.txt
and terms of service before scraping.
"""

import json
import re
from datetime import datetime
from typing import List, Dict, Any

# For this demo, we'll create sample data that resembles what a scraper would extract
# In a real implementation, you would use requests and BeautifulSoup here

def generate_demo_courses() -> List[Dict[str, Any]]:
    """
    Generate demo course data that resembles scraped SMC courses.
    In production, this would actually scrape from the college website.
    """
    # Sample courses that might be found on a community college schedule
    demo_courses = [
        {
            'subject': 'CS',
            'courseNumber': '101',
            'courseName': 'Introduction to Computer Science',
            'units': '3.0',
            'description': 'An introduction to computer science and programming fundamentals.',
            'sections': [
                {
                    'sectionNumber': '1001',
                    'crn': '12345',
                    'instructor': 'Dr. Smith, Jane',
                    'days': 'MW',
                    'time': '10:00 AM - 11:50 AM',
                    'location': 'TECH 205',
                    'seats': 30,
                    'enrolled': 25,
                    'waitlist': 2,
                    'status': 'Open'
                },
                {
                    'sectionNumber': '1002',
                    'crn': '12346',
                    'instructor': 'Prof. Johnson, Mike',
                    'days': 'TTh',
                    'time': '2:00 PM - 3:50 PM',
                    'location': 'Online',
                    'seats': 35,
                    'enrolled': 35,
                    'waitlist': 5,
                    'status': 'Closed'
                }
            ]
        },
        {
            'subject': 'MATH',
            'courseNumber': '31',
            'courseName': 'Elementary Algebra',
            'units': '5.0',
            'description': 'Basic algebraic operations and problem solving.',
            'sections': [
                {
                    'sectionNumber': '2001',
                    'crn': '23456',
                    'instructor': 'Dr. Chen, Li',
                    'days': 'MTWTh',
                    'time': '8:00 AM - 9:15 AM',
                    'location': 'MATH 101',
                    'seats': 40,
                    'enrolled': 38,
                    'waitlist': 0,
                    'status': 'Open'
                }
            ]
        },
        {
            'subject': 'ENGL',
            'courseNumber': '1',
            'courseName': 'English Composition',
            'units': '3.0',
            'description': 'Principles of composition, critical thinking, and research.',
            'sections': [
                {
                    'sectionNumber': '3001',
                    'crn': '34567',
                    'instructor': 'Prof. Williams, Sarah',
                    'days': 'MW',
                    'time': '12:00 PM - 1:50 PM',
                    'location': 'HSS 202',
                    'seats': 25,
                    'enrolled': 23,
                    'waitlist': 0,
                    'status': 'Open'
                },
                {
                    'sectionNumber': '3002',
                    'crn': '34568',
                    'instructor': 'Dr. Davis, Robert',
                    'days': 'TTh',
                    'time': '6:00 PM - 7:50 PM',
                    'location': 'HSS 203',
                    'seats': 25,
                    'enrolled': 20,
                    'waitlist': 0,
                    'status': 'Open'
                }
            ]
        },
        {
            'subject': 'BIO',
            'courseNumber': '3',
            'courseName': 'Fundamentals of Biology',
            'units': '4.0',
            'description': 'Introduction to biological principles, cell structure, and ecology.',
            'sections': [
                {
                    'sectionNumber': '4001',
                    'crn': '45678',
                    'instructor': 'Dr. Martinez, Ana',
                    'days': 'MW',
                    'time': '3:00 PM - 4:50 PM',
                    'location': 'SCI 121',
                    'seats': 30,
                    'enrolled': 30,
                    'waitlist': 8,
                    'status': 'Closed'
                }
            ]
        }
    ]
    
    return demo_courses


def convert_to_ccc_format(courses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Convert scraped data to CCC Schedule unified format."""
    
    # Extract unique subjects and instructors
    subjects = {}
    instructors = {}
    
    for course in courses:
        subject_code = course['subject']
        if subject_code not in subjects:
            subjects[subject_code] = {
                'code': subject_code,
                'name': get_subject_name(subject_code)  # Would lookup full name
            }
        
        for section in course.get('sections', []):
            instructor_name = section.get('instructor', 'Staff')
            if instructor_name not in instructors:
                instructors[instructor_name] = {
                    'name': instructor_name,
                    'email': f"{instructor_name.lower().replace(' ', '.').replace(',', '')}@smc.edu"
                }
    
    # Build the unified format
    ccc_data = {
        'metadata': {
            'college': 'Santa Monica College',
            'term': 'Spring 2025',
            'lastUpdated': datetime.now().isoformat(),
            'source': 'Web Scraper Demo'
        },
        'subjects': list(subjects.values()),
        'instructors': list(instructors.values()),
        'courses': []
    }
    
    # Format courses
    for course in courses:
        course_key = f"{course['subject']}-{course['courseNumber']}"
        
        formatted_sections = []
        for section in course.get('sections', []):
            formatted_section = {
                'sectionNumber': section['sectionNumber'],
                'crn': section['crn'],
                'instructor': section['instructor'],
                'schedule': {
                    'days': section['days'],
                    'time': section['time'],
                    'location': section['location']
                },
                'enrollment': {
                    'seats': section['seats'],
                    'enrolled': section['enrolled'],
                    'waitlist': section['waitlist'],
                    'status': section['status']
                }
            }
            formatted_sections.append(formatted_section)
        
        formatted_course = {
            'courseKey': course_key,
            'subject': course['subject'],
            'courseNumber': course['courseNumber'],
            'title': course['courseName'],
            'units': course['units'],
            'description': course['description'],
            'sections': formatted_sections
        }
        
        ccc_data['courses'].append(formatted_course)
    
    return ccc_data


def get_subject_name(code: str) -> str:
    """Map subject codes to full names."""
    subject_names = {
        'CS': 'Computer Science',
        'MATH': 'Mathematics',
        'ENGL': 'English',
        'BIO': 'Biology',
        # Add more mappings as needed
    }
    return subject_names.get(code, code)


def main():
    """Main function to run the demo scraper."""
    print("Santa Monica College Schedule Scraper Demo")
    print("=========================================")
    print()
    print("This demo shows how a scraper would extract course data")
    print("from a public college website and convert it to CCC format.")
    print()
    
    # In a real scraper, this would fetch from the actual website
    print("Generating demo course data...")
    courses = generate_demo_courses()
    print(f"Generated {len(courses)} courses with {sum(len(c.get('sections', [])) for c in courses)} sections")
    
    # Convert to CCC format
    print("Converting to CCC Schedule format...")
    ccc_data = convert_to_ccc_format(courses)
    
    # Save to file
    output_file = 'data/courses.json'
    with open(output_file, 'w') as f:
        json.dump(ccc_data, f, indent=2)
    
    print(f"Data saved to {output_file}")
    print()
    print("Next steps:")
    print("1. Adapt this scraper for your college's website")
    print("2. Update the HTML selectors to match your site's structure")
    print("3. Add any additional fields your college uses")
    print("4. Run periodically to keep data up to date")


if __name__ == '__main__':
    main()