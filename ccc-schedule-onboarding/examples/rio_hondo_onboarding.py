#!/usr/bin/env python3
"""
Rio Hondo Community College Onboarding Example

This demonstrates how the LLM-enhanced onboarding system works with a real
Banner 8 system. It shows the complete flow from raw HTML to formatted JSON.
"""

import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from src.parsers.banner8_parser import Banner8Parser
from src.llm_parser import SmartScheduleExtractor
from src.data_normalizer import DataNormalizer


def main():
    """Run the Rio Hondo onboarding example."""
    print("🎓 Rio Hondo Community College - Schedule Extraction Demo")
    print("=" * 60)
    print()
    
    # Sample data from Rio Hondo's Banner 8 system
    # In production, this would be fetched from their website
    sample_html = """
ACCT - Accounting
ACCT 101 - Financial Accounting
Status    Type    CRN    Book    Zero    Unit    Meeting Time    Location    Cap    Act    Rem    Instructor    Instructor Email    Date    Weeks
CLOSED    WEB    37550    View Book        4.0    9 Hrs/Wk arr in addition to any scheduled hrs if applicable    Online ASYNC    45    28    17    Janet Cha    jcha@riohondo.edu    03/29-05/22    8
CLOSED    WEB    32689    View Book        4.0    9 Hrs/Wk arr in addition to any scheduled hrs if applicable    Online ASYNC    45    32    13    Daniel De La Rosa    Ddelarosa@riohondo.edu    03/29-05/22    8
ACCT 102 - Managerial Accounting
Status    Type    CRN    Book    Zero    Unit    Meeting Time    Location    Cap    Act    Rem    Instructor    Instructor Email    Date    Weeks
CLOSED    WEB    30094    View Book        4.0    9 Hrs/Wk arr in addition to any scheduled hrs if applicable    Online ASYNC    45    43    2    Janet Cha    jcha@riohondo.edu    03/29-05/22    8

CS - Computer Science
CS 101 - Introduction to Computer Science
Status    Type    CRN    Book    Zero    Unit    Meeting Time    Location    Cap    Act    Rem    Instructor    Instructor Email    Date    Weeks
OPEN    LEC    12345    View Book        3.0    MW 10:00am - 11:50am    TECH 205    30    25    5    Dr. Smith, Jane    jsmith@riohondo.edu    03/29-05/22    8
CLOSED    LEC    12346    View Book        3.0    TTh 2:00pm - 3:50pm    Online SYNC    35    35    0    Prof. Johnson, Mike    mjohnson@riohondo.edu    03/29-05/22    8

MATH - Mathematics
MATH 31 - Elementary Algebra
Status    Type    CRN    Book    Zero    Unit    Meeting Time    Location    Cap    Act    Rem    Instructor    Instructor Email    Date    Weeks
OPEN    LEC    23456    View Book        5.0    MTWTh 8:00am - 9:15am    MATH 101    40    38    2    Dr. Chen, Li    lchen@riohondo.edu    03/29-05/22    8
"""
    
    # Step 1: Parse with Banner 8 parser
    print("📋 Step 1: Parsing Banner 8 HTML...")
    parser = Banner8Parser()
    courses = parser.parse(sample_html)
    print(f"   ✅ Found {len(courses)} courses with {sum(len(c.sections) for c in courses)} sections")
    
    # Step 2: Convert to CCC format
    print("\n🔄 Step 2: Converting to CCC Schedule format...")
    extractor = SmartScheduleExtractor()
    ccc_data = extractor.to_ccc_format(courses)
    print(f"   ✅ Converted to unified format")
    
    # Step 3: Normalize and validate
    print("\n🧹 Step 3: Normalizing and validating data...")
    normalizer = DataNormalizer()
    
    # Normalize each course
    normalized_courses = []
    for course in ccc_data['courses']:
        normalized = normalizer.normalize_course(course)
        normalized_courses.append(normalized)
    
    ccc_data['courses'] = normalized_courses
    
    # Validate
    validation = normalizer.validate_course_data(normalized_courses)
    
    print(f"   ✅ Validation: {'PASSED' if validation.is_valid else 'FAILED'}")
    if validation.errors:
        print("   ❌ Errors:")
        for error in validation.errors:
            print(f"      - {error}")
    if validation.warnings:
        print("   ⚠️  Warnings:")
        for warning in validation.warnings:
            print(f"      - {warning}")
    
    # Step 4: Save the data
    print("\n💾 Step 4: Saving extracted data...")
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    
    output_file = output_dir / "rio_hondo_courses.json"
    with open(output_file, 'w') as f:
        json.dump(ccc_data, f, indent=2)
    
    print(f"   ✅ Saved to {output_file}")
    
    # Step 5: Show sample output
    print("\n📊 Sample Output:")
    print("-" * 60)
    
    # Show first course
    if ccc_data['courses']:
        sample_course = ccc_data['courses'][0]
        print(f"Course: {sample_course['courseKey']}")
        print(f"Title: {sample_course['title']}")
        print(f"Units: {sample_course['units']}")
        print(f"Sections: {len(sample_course['sections'])}")
        
        if sample_course['sections']:
            section = sample_course['sections'][0]
            print(f"\n  Section {section['sectionNumber']} (CRN: {section['crn']})")
            print(f"  Type: {section['type']}")
            print(f"  Instructor: {section['instructor']}")
            print(f"  Schedule: {section['schedule']['days']} {section['schedule']['time']}")
            print(f"  Location: {section['schedule']['location']}")
            print(f"  Status: {section['enrollment']['status']}")
    
    print("\n" + "=" * 60)
    print("✅ Demo complete!")
    print("\nThis demonstrates how Rio Hondo's Banner 8 data can be")
    print("automatically extracted and converted to CCC Schedule format.")
    print("\nIn production, this would run periodically to keep data current.")
    
    # Show how easy it is to onboard
    print("\n💡 To onboard your college:")
    print("1. Run: python -m src.onboarding_cli")
    print("2. Follow the conversational prompts")
    print("3. No coding required!")


def show_llm_capabilities():
    """Demonstrate LLM parsing capabilities."""
    print("\n🤖 LLM Parsing Capabilities:")
    print("-" * 60)
    
    # Show how LLM would handle variations
    variations = [
        "CLOSED WEB 12345 Book 3.0 MWF 10-11:50am Online",
        "Status: Closed | Type: Web | CRN: 12345 | Units: 3",
        "12345 CLOSED Web 3 units Mon/Wed/Fri 10:00-11:50 Online"
    ]
    
    print("The LLM parser can understand various formats:")
    for i, var in enumerate(variations, 1):
        print(f"\n{i}. Input:  {var}")
        print("   Output: Same structured data!")
    
    print("\nNo brittle regex or CSS selectors needed! 🎉")


if __name__ == "__main__":
    main()
    show_llm_capabilities()