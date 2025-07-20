"""LLM-based parser for intelligently extracting schedule data from various formats."""

import json
import re
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
from pathlib import Path
import os

# For now, we'll create a mock LLM interface that can be replaced with actual API calls
@dataclass
class LLMResponse:
    """Response from LLM parsing."""
    extracted_data: Dict[str, Any]
    confidence: float
    suggested_mappings: Dict[str, str]
    warnings: List[str]


class LLMParser:
    """Intelligent parser using LLM for extracting schedule data."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the LLM parser.
        
        Args:
            api_key: API key for OpenAI/Anthropic. If not provided, uses environment variable.
        """
        self.api_key = api_key or os.getenv("LLM_API_KEY")
        self.extraction_prompt_template = """
        Analyze the following course schedule data and extract structured information.
        
        Look for these key fields:
        - Course identifiers (subject code, course number, CRN)
        - Course title and description
        - Units/credits
        - Meeting times and locations
        - Instructor information
        - Enrollment status and counts
        - Prerequisites and corequisites
        - Transfer and GE information
        - Special attributes (online, hybrid, zero textbook cost, etc.)
        
        Input format: {format_type}
        
        Data:
        {data}
        
        Return a structured JSON with the extracted information, maintaining consistency
        with the CCC Schedule format. Include confidence scores for uncertain extractions.
        """
        
    def detect_format(self, content: str) -> str:
        """Detect the format of the input content.
        
        Args:
            content: Raw content to analyze
            
        Returns:
            Format type: 'html', 'json', 'csv', 'pdf_text', etc.
        """
        content = content.strip()
        
        # Check for JSON
        if content.startswith('{') or content.startswith('['):
            try:
                json.loads(content)
                return 'json'
            except:
                pass
                
        # Check for HTML
        if '<html' in content.lower() or '<table' in content.lower():
            return 'html'
            
        # Check for CSV
        if '\t' in content or ',' in content.split('\n')[0]:
            return 'csv'
            
        return 'text'
        
    def parse_banner8_html(self, html_content: str) -> LLMResponse:
        """Parse Banner 8 HTML table format.
        
        Args:
            html_content: HTML content from Banner 8 system
            
        Returns:
            LLMResponse with extracted course and section data
        """
        # For now, implement a pattern-based parser that mimics LLM behavior
        # In production, this would call the actual LLM API
        
        extracted_data = {
            "courses": [],
            "format_detected": "Banner 8 HTML Table"
        }
        
        warnings = []
        
        # Simple pattern matching for demonstration
        # Real implementation would use LLM to understand table structure
        
        # Extract course blocks
        course_pattern = r'<tr.*?class="ddtitle".*?>(.*?)</tr>'
        section_pattern = r'<tr.*?>(.*?)</tr>'
        
        # Mock extraction logic
        courses_found = re.findall(course_pattern, html_content, re.DOTALL)
        
        if not courses_found:
            warnings.append("No courses found in Banner 8 format. Format might be different.")
            
        # Build suggested mappings based on detected patterns
        suggested_mappings = {
            "course_title": "td.ddtitle",
            "crn": "td:contains('CRN')",
            "status": "td:contains('CLOSED')",
            "meeting_time": "td:contains('Time')",
            "instructor": "td:contains('@')",
            "location": "td:contains('Building')"
        }
        
        return LLMResponse(
            extracted_data=extracted_data,
            confidence=0.85,
            suggested_mappings=suggested_mappings,
            warnings=warnings
        )
        
    def parse_generic_html(self, html_content: str) -> LLMResponse:
        """Parse generic HTML content using LLM.
        
        Args:
            html_content: HTML content to parse
            
        Returns:
            LLMResponse with extracted data
        """
        # Simplified version - real implementation would use LLM
        extracted_data = {"courses": [], "format_detected": "Generic HTML"}
        
        # Look for common patterns
        if 'course' in html_content.lower():
            extracted_data["confidence_note"] = "Detected course-related content"
            
        return LLMResponse(
            extracted_data=extracted_data,
            confidence=0.7,
            suggested_mappings={},
            warnings=["Using generic HTML parser. Results may need manual review."]
        )
        
    def parse_json_data(self, json_content: str) -> LLMResponse:
        """Parse JSON schedule data.
        
        Args:
            json_content: JSON string to parse
            
        Returns:
            LLMResponse with extracted data
        """
        try:
            data = json.loads(json_content)
            
            # Analyze structure
            if isinstance(data, list) and len(data) > 0:
                sample = data[0]
                fields = list(sample.keys())
                
                # Suggest mappings based on field names
                suggested_mappings = self._suggest_json_mappings(fields)
                
                return LLMResponse(
                    extracted_data={"raw_data": data, "format_detected": "JSON Array"},
                    confidence=0.95,
                    suggested_mappings=suggested_mappings,
                    warnings=[]
                )
            else:
                return LLMResponse(
                    extracted_data={"raw_data": data, "format_detected": "JSON Object"},
                    confidence=0.9,
                    suggested_mappings={},
                    warnings=["JSON structure is not an array. Manual mapping may be required."]
                )
                
        except json.JSONDecodeError as e:
            return LLMResponse(
                extracted_data={},
                confidence=0.0,
                suggested_mappings={},
                warnings=[f"Failed to parse JSON: {str(e)}"]
            )
            
    def _suggest_json_mappings(self, fields: List[str]) -> Dict[str, str]:
        """Suggest field mappings based on JSON field names.
        
        Args:
            fields: List of field names from JSON
            
        Returns:
            Dictionary of suggested mappings
        """
        # Common field name patterns
        mapping_patterns = {
            "course_number": ["coursenumber", "course_number", "coursenum", "course_num", "crse_numb"],
            "course_title": ["title", "course_title", "coursename", "course_name"],
            "units": ["units", "credits", "credit_hours", "unit_value"],
            "crn": ["crn", "section_id", "class_number", "section_num"],
            "instructor": ["instructor", "instructor_name", "faculty", "teacher"],
            "meeting_time": ["meeting_time", "time", "schedule", "class_time"],
            "location": ["location", "room", "building", "classroom"],
            "status": ["status", "enrollment_status", "class_status", "availability"]
        }
        
        suggested = {}
        for target_field, patterns in mapping_patterns.items():
            for field in fields:
                field_lower = field.lower()
                for pattern in patterns:
                    if pattern.lower() in field_lower or field_lower in pattern:
                        suggested[target_field] = field
                        break
                if target_field in suggested:
                    break
                    
        return suggested
        
    def parse(self, content: str, format_hint: Optional[str] = None) -> LLMResponse:
        """Parse schedule data from any supported format.
        
        Args:
            content: Raw content to parse
            format_hint: Optional hint about the format
            
        Returns:
            LLMResponse with extracted data
        """
        # Detect format if not provided
        format_type = format_hint or self.detect_format(content)
        
        if format_type == 'json':
            return self.parse_json_data(content)
        elif format_type == 'html':
            # Check if it's Banner 8 format
            if 'ddtitle' in content or 'Banner' in content:
                return self.parse_banner8_html(content)
            else:
                return self.parse_generic_html(content)
        else:
            return LLMResponse(
                extracted_data={},
                confidence=0.0,
                suggested_mappings={},
                warnings=[f"Unsupported format: {format_type}"]
            )
            
    def validate_extraction(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate extracted data and provide improvement suggestions.
        
        Args:
            extracted_data: Data extracted by the parser
            
        Returns:
            Validation results with suggestions
        """
        validation_results = {
            "is_valid": True,
            "missing_fields": [],
            "quality_issues": [],
            "suggestions": []
        }
        
        # Check for required fields
        required_fields = ["course_number", "title", "units"]
        
        if "courses" in extracted_data:
            for i, course in enumerate(extracted_data["courses"]):
                for field in required_fields:
                    if field not in course or not course[field]:
                        validation_results["missing_fields"].append(f"Course {i}: {field}")
                        validation_results["is_valid"] = False
                        
        # Check data quality
        if len(validation_results["missing_fields"]) > 0:
            validation_results["suggestions"].append(
                "Some required fields are missing. Please review the field mappings."
            )
            
        return validation_results