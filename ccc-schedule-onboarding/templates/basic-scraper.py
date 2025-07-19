#!/usr/bin/env python3
"""
Basic web scraper template for extracting course data from community college websites.

This template shows how to:
1. Scrape course data from a public website
2. Parse the HTML to extract course information
3. Convert to the CCC Schedule JSON format
4. Save the data for use with the schedule viewer

Adapt this template for your specific college website.
"""

import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict, Any


def scrape_courses(base_url: str) -> List[Dict[str, Any]]:
    """
    Scrape course data from the college website.
    
    Args:
        base_url: The base URL of the course catalog
        
    Returns:
        List of course dictionaries
    """
    courses = []
    
    # Example: Fetch the course catalog page
    response = requests.get(base_url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # TODO: Adapt these selectors for your specific website structure
    course_elements = soup.find_all('div', class_='course-listing')
    
    for element in course_elements:
        # Extract course information
        # Adapt these based on your website's HTML structure
        course = {
            'courseNumber': element.find('span', class_='course-number').text.strip(),
            'courseName': element.find('h3', class_='course-title').text.strip(),
            'units': element.find('span', class_='units').text.strip(),
            'description': element.find('p', class_='description').text.strip(),
            # Add more fields as needed
        }
        
        # Extract sections if available
        sections = []
        section_elements = element.find_all('div', class_='section')
        
        for section in section_elements:
            section_data = {
                'sectionNumber': section.find('span', class_='section-num').text.strip(),
                'instructor': section.find('span', class_='instructor').text.strip(),
                'days': section.find('span', class_='days').text.strip(),
                'time': section.find('span', class_='time').text.strip(),
                'location': section.find('span', class_='location').text.strip(),
                # Add enrollment info, dates, etc.
            }
            sections.append(section_data)
        
        course['sections'] = sections
        courses.append(course)
    
    return courses


def convert_to_ccc_format(courses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Convert scraped data to CCC Schedule format.
    
    Args:
        courses: List of course dictionaries from scraper
        
    Returns:
        Dictionary in CCC Schedule format
    """
    # Build the standardized format
    ccc_data = {
        'metadata': {
            'lastUpdated': datetime.now().isoformat(),
            'source': 'Web Scraper',
            'college': 'Demo College'
        },
        'courses': []
    }
    
    for course in courses:
        ccc_course = {
            'courseNumber': course.get('courseNumber', ''),
            'courseName': course.get('courseName', ''),
            'units': course.get('units', ''),
            'description': course.get('description', ''),
            'sections': course.get('sections', [])
        }
        ccc_data['courses'].append(ccc_course)
    
    return ccc_data


def main():
    """Main function to run the scraper."""
    # Configuration
    CATALOG_URL = 'https://example-college.edu/schedule'  # Replace with actual URL
    OUTPUT_FILE = 'data/courses.json'
    
    print(f"Scraping courses from {CATALOG_URL}...")
    
    try:
        # Scrape the courses
        courses = scrape_courses(CATALOG_URL)
        print(f"Found {len(courses)} courses")
        
        # Convert to CCC format
        ccc_data = convert_to_ccc_format(courses)
        
        # Save to file
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(ccc_data, f, indent=2)
        
        print(f"Data saved to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())