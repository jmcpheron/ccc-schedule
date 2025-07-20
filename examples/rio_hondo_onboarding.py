#!/usr/bin/env python3
"""Example onboarding script for Rio Hondo Community College.

This demonstrates how to use the LLM-enhanced onboarding system to parse
Banner 8 HTML schedule data without writing custom scrapers.
"""

import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
import sys
sys.path.append(str(Path(__file__).parent.parent))

from src.llm_parser import LLMParser
from src.parsers.banner8_parser import Banner8Parser
from src.college_config import CollegeConfig, get_banner8_default_config, save_college_config
from src.data_normalizer import DataNormalizer


def demo_rio_hondo_onboarding():
    """Demonstrate the onboarding process for Rio Hondo College."""
    
    print("🎓 Rio Hondo Community College - Schedule Integration Demo")
    print("=" * 60)
    
    # Step 1: Create college configuration
    print("\n1️⃣ Creating college configuration...")
    
    # Start with Banner 8 defaults
    config = get_banner8_default_config()
    
    # Customize for Rio Hondo
    config.college_id = "rio_hondo"
    config.college_name = "Rio Hondo Community College"
    config.college_abbreviation = "RHC"
    config.website = "https://www.riohondo.edu"
    config.schedule_url = "https://www.riohondo.edu/class-schedules/"
    
    # Add Rio Hondo specific mappings
    config.field_mappings.update({
        "zero_textbook_cost": "ZTC",
        "late_start": "LS",
        "honors": "HON",
        "online_anytime": "OA"
    })
    
    print(f"   ✓ College: {config.college_name}")
    print(f"   ✓ Format: {config.source_format}")
    print(f"   ✓ Mappings: {len(config.field_mappings)} fields configured")
    
    # Step 2: Simulate loading sample data
    print("\n2️⃣ Loading sample Banner 8 HTML data...")
    
    # In a real scenario, this would be actual HTML from Rio Hondo's schedule
    sample_html = """
    <table class="datadisplaytable">
        <tr class="ddtitle">
            <td>MATH-130 - Precalculus Mathematics - 30291</td>
        </tr>
        <tr>
            <td>30291</td>
            <td>130</td>
            <td>LEC</td>
            <td>5.000</td>
            <td>Precalculus Mathematics</td>
            <td>MW</td>
            <td>08:00 am-10:05 am</td>
            <td>30</td>
            <td>28</td>
            <td>2</td>
            <td>Gonzalez, Maria</td>
            <td>08/26-12/14</td>
            <td>S 203</td>
            <td>ZTC</td>
        </tr>
        <tr class="ddtitle">
            <td>ENGL-101 - College Composition - 30405</td>
        </tr>
        <tr>
            <td>30405</td>
            <td>101</td>
            <td>ONL</td>
            <td>4.000</td>
            <td>College Composition</td>
            <td>TBA</td>
            <td>TBA</td>
            <td>35</td>
            <td>35</td>
            <td>0</td>
            <td>Smith, John</td>
            <td>08/26-12/14</td>
            <td>ONLINE</td>
            <td>OA</td>
        </tr>
    </table>
    """
    
    print("   ✓ Loaded sample HTML data")
    
    # Step 3: Parse with Banner 8 parser
    print("\n3️⃣ Parsing Banner 8 HTML...")
    
    parser = Banner8Parser(config)
    parsed_data = parser.parse_html(sample_html)
    
    print(f"   ✓ Found {parsed_data['total_courses']} courses")
    print(f"   ✓ Found {parsed_data['total_sections']} sections")
    
    # Step 4: Normalize the data
    print("\n4️⃣ Normalizing data...")
    
    normalizer = DataNormalizer()
    for course in parsed_data['courses']:
        # Normalize course data
        course = normalizer.normalize_course_data(course)
        
        # Normalize each section
        for i, section in enumerate(course['sections']):
            course['sections'][i] = normalizer.normalize_section_data(section)
    
    print("   ✓ Normalized course numbers and titles")
    print("   ✓ Standardized time formats")
    print("   ✓ Cleaned instructor names")
    
    # Step 5: Convert to CCC format
    print("\n5️⃣ Converting to CCC Schedule format...")
    
    ccc_data = parser.to_ccc_format(parsed_data)
    
    # Add metadata
    ccc_data['schedule']['metadata'].update({
        'colleges': [{
            'id': config.college_id,
            'name': config.college_name,
            'abbreviation': config.college_abbreviation,
            'logo_url': '/assets/logos/rio_hondo.png',
            'theme': {
                'primary_color': '#003366',
                'secondary_color': '#FFB81C'
            }
        }],
        'terms': [{
            'code': '202530',
            'name': 'Spring 2025',
            'start_date': '2025-01-13',
            'end_date': '2025-05-23'
        }]
    })
    
    print("   ✓ Converted to CCC Schedule format")
    print("   ✓ Added college metadata")
    
    # Step 6: Validate the data
    print("\n6️⃣ Validating output...")
    
    validation_issues = normalizer.validate_normalized_data(ccc_data['schedule'])
    
    if validation_issues:
        print("   ⚠️  Validation issues found:")
        for issue in validation_issues:
            print(f"      - {issue}")
    else:
        print("   ✓ All data validated successfully")
    
    # Step 7: Save configuration and sample output
    print("\n7️⃣ Saving configuration and data...")
    
    # Save configuration
    config_dir = Path("configs")
    config_dir.mkdir(exist_ok=True)
    config_path = config_dir / "rio_hondo_config.json"
    save_college_config(config, config_path)
    print(f"   ✓ Saved configuration to {config_path}")
    
    # Save sample output
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    output_path = output_dir / "rio_hondo_schedule.json"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(ccc_data, f, indent=2, ensure_ascii=False)
    
    print(f"   ✓ Saved schedule data to {output_path}")
    
    # Display sample of parsed data
    print("\n📊 Sample Parsed Data:")
    print("-" * 60)
    
    for course in ccc_data['schedule']['courses'][:2]:
        print(f"\nCourse: {course['subject']} {course['course_number']} - {course['title']}")
        print(f"Units: {course['units']}")
        
        for section in course['sections']:
            print(f"\n  Section {section['crn']}:")
            print(f"    Status: {section['status']}")
            print(f"    Mode: {section['instruction_mode']}")
            print(f"    Enrollment: {section['enrollment']['enrolled']}/{section['enrollment']['capacity']}")
            print(f"    Instructor: {', '.join(section['instructors'])}")
            
            for meeting in section['meetings']:
                if meeting['days']:
                    print(f"    Meeting: {', '.join(meeting['days'])} {meeting['start_time']}-{meeting['end_time']}")
                    print(f"    Location: {meeting['location']['building']} {meeting['location']['room']}")
    
    print("\n" + "=" * 60)
    print("✅ Rio Hondo College onboarding demo completed!")
    print("\nNext steps:")
    print("1. Use the configuration to parse full schedule data")
    print("2. Set up automated updates (daily/weekly)")
    print("3. Deploy the schedule viewer with Rio Hondo branding")
    print("4. Test with students and faculty")
    

def demonstrate_llm_capabilities():
    """Show how LLM can handle variations in HTML structure."""
    
    print("\n\n🤖 LLM Parser Capabilities Demo")
    print("=" * 60)
    
    # Initialize LLM parser
    llm_parser = LLMParser()
    
    # Example 1: Different HTML structure
    print("\n📝 Example 1: Handling structure variations")
    
    variant_html = """
    <div class="course-info">
        <h3>Biology 101 - Introduction to Biology (CRN: 12345)</h3>
        <p>Instructor: Dr. Jane Smith (jsmith@riohondo.edu)</p>
        <p>Schedule: Mon/Wed 2:00pm-3:30pm in Science Building Room 101</p>
        <p>Status: <span style="color: red">CLOSED</span> (Enrollment: 40/40)</p>
        <p>Note: Zero Textbook Cost Section</p>
    </div>
    """
    
    response = llm_parser.parse(variant_html, format_hint='html')
    
    print("   ✓ Format detected:", response.extracted_data.get('format_detected'))
    print("   ✓ Confidence:", f"{response.confidence:.0%}")
    print("   ✓ Suggested mappings:")
    for field, source in response.suggested_mappings.items():
        print(f"      - {field}: {source}")
    
    # Example 2: JSON API response
    print("\n📝 Example 2: Parsing JSON API data")
    
    json_data = '''
    {
        "classes": [
            {
                "class_id": "30291",
                "subject_code": "MATH",
                "course_num": "130",
                "course_title": "Precalculus Mathematics",
                "units": 5.0,
                "instructor": {
                    "name": "Maria Gonzalez",
                    "email": "mgonzalez@riohondo.edu"
                },
                "schedule": {
                    "days": ["M", "W"],
                    "start": "08:00",
                    "end": "10:05",
                    "room": "S-203"
                },
                "enrollment": {
                    "current": 28,
                    "max": 30,
                    "available": 2
                },
                "attributes": ["ZTC", "STEM"]
            }
        ]
    }
    '''
    
    response = llm_parser.parse(json_data)
    
    print("   ✓ Format detected:", response.extracted_data.get('format_detected'))
    print("   ✓ Field mappings automatically detected")
    print("   ✓ No manual configuration required!")
    
    print("\n💡 Key Benefits:")
    print("   • Handles any HTML structure without code changes")
    print("   • Automatically detects JSON field mappings")
    print("   • Learns from examples to improve accuracy")
    print("   • No need for regex or CSS selectors")
    print("   • Works with screenshots and PDFs too!")


if __name__ == "__main__":
    # Run the main demo
    demo_rio_hondo_onboarding()
    
    # Show LLM capabilities
    demonstrate_llm_capabilities()