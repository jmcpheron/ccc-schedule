"""Tests for the LLM parser module."""

import pytest
from src.llm_parser import LLMParser, LLMResponse


class TestLLMParser:
    """Test cases for LLM parser."""
    
    @pytest.fixture
    def parser(self):
        """Create a parser instance."""
        return LLMParser()
    
    def test_detect_format_json(self, parser):
        """Test JSON format detection."""
        json_content = '{"courses": [{"id": 1, "name": "Math"}]}'
        assert parser.detect_format(json_content) == 'json'
        
    def test_detect_format_html(self, parser):
        """Test HTML format detection."""
        html_content = '<html><table><tr><td>Course</td></tr></table></html>'
        assert parser.detect_format(html_content) == 'html'
        
    def test_detect_format_csv(self, parser):
        """Test CSV format detection."""
        csv_content = 'Course,Title,Units\nMATH-101,Calculus,4'
        assert parser.detect_format(csv_content) == 'csv'
        
    def test_parse_json_data(self, parser):
        """Test parsing JSON data."""
        json_content = '''
        [
            {
                "courseNumber": "CS-101",
                "courseName": "Intro to Programming",
                "units": 3,
                "instructor": "John Smith"
            }
        ]
        '''
        
        response = parser.parse_json_data(json_content)
        
        assert isinstance(response, LLMResponse)
        assert response.confidence > 0.9
        assert 'course_number' in response.suggested_mappings
        assert response.suggested_mappings['course_number'] == 'courseNumber'
        
    def test_parse_banner8_html(self, parser):
        """Test parsing Banner 8 HTML."""
        html_content = '''
        <table class="datadisplaytable">
            <tr class="ddtitle">
                <td>MATH-101 - Calculus I</td>
            </tr>
        </table>
        '''
        
        response = parser.parse_banner8_html(html_content)
        
        assert isinstance(response, LLMResponse)
        assert response.extracted_data['format_detected'] == 'Banner 8 HTML Table'
        assert 'course_title' in response.suggested_mappings
        
    def test_suggest_json_mappings(self, parser):
        """Test field mapping suggestions."""
        fields = ['courseNumber', 'title', 'units', 'instructor_name', 'crn']
        
        mappings = parser._suggest_json_mappings(fields)
        
        assert mappings['course_number'] == 'courseNumber'
        assert mappings['course_title'] == 'title'
        assert mappings['units'] == 'units'
        assert mappings['instructor'] == 'instructor_name'
        assert mappings['crn'] == 'crn'
        
    def test_validate_extraction(self, parser):
        """Test extraction validation."""
        # Valid data
        valid_data = {
            'courses': [
                {
                    'course_number': 'CS-101',
                    'title': 'Introduction to Computer Science',
                    'units': 3
                }
            ]
        }
        
        results = parser.validate_extraction(valid_data)
        assert results['is_valid'] is True
        assert len(results['missing_fields']) == 0
        
        # Invalid data (missing required fields)
        invalid_data = {
            'courses': [
                {
                    'course_number': 'CS-101',
                    # Missing title and units
                }
            ]
        }
        
        results = parser.validate_extraction(invalid_data)
        assert results['is_valid'] is False
        assert len(results['missing_fields']) > 0