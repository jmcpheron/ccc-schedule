"""Base transformer class for converting college data to standardized format."""

import json
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any, Union


class BaseTransformer(ABC):
    """Abstract base class for college-specific data transformers."""
    
    def __init__(self, college_config_path: Union[str, Path]):
        """Initialize transformer with college configuration.
        
        Args:
            college_config_path: Path to college configuration JSON file
        """
        self.config = self._load_config(college_config_path)
        self.college_info = self.config['college']
        self.features = self.config['features']
        self.mappings = self.config.get('data_mappings', {})
    
    @staticmethod
    def _load_config(path: Union[str, Path]) -> dict[str, Any]:
        """Load college configuration."""
        with open(path, 'r') as f:
            return json.load(f)
    
    def transform(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Transform college-specific data to standardized format.
        
        Args:
            input_data: Raw data from college source
            
        Returns:
            Standardized schedule data
        """
        # Create base structure
        schedule = {
            "schedule": {
                "metadata": self._create_metadata(input_data),
                "courses": self._transform_courses(input_data)
            }
        }
        
        # Add extensions if any
        extensions = self._create_extensions(input_data)
        if extensions:
            schedule["schedule"]["extensions"] = extensions
        
        return schedule
    
    def _create_metadata(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Create metadata section."""
        metadata = {
            "version": "1.0.0",
            "last_updated": datetime.now().isoformat(),
            "college": {
                "id": self.college_info['id'],
                "name": self.college_info['name']
            }
        }
        
        # Add district if present
        if 'district' in self.college_info:
            metadata["college"]["district"] = self.college_info['district']
        
        # Extract term information
        term = self._extract_term_info(input_data)
        if term:
            metadata["term"] = term
        
        return metadata
    
    @abstractmethod
    def _extract_term_info(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Extract term information from input data.
        
        Must be implemented by subclasses.
        """
        pass
    
    @abstractmethod
    def _transform_courses(self, input_data: dict[str, Any]) -> list[dict[str, Any]]:
        """Transform course data to standardized format.
        
        Must be implemented by subclasses.
        """
        pass
    
    def _create_extensions(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Create college-specific extensions.
        
        Can be overridden by subclasses.
        """
        return {}
    
    def _map_field(self, source_data: dict[str, Any], mapping: Union[str, dict]) -> Any:
        """Map a field from source data using configuration mapping.
        
        Args:
            source_data: Source data dictionary
            mapping: Field mapping (string for direct map, dict for complex)
            
        Returns:
            Mapped value
        """
        if isinstance(mapping, str):
            # Direct field mapping
            return self._get_nested_value(source_data, mapping)
        elif isinstance(mapping, dict):
            # Complex mapping with transformations
            field = mapping.get('field')
            value = self._get_nested_value(source_data, field) if field else None
            
            # Apply mapping if present
            if 'mapping' in mapping and value is not None:
                value = mapping['mapping'].get(value, value)
            
            return value
        
        return None
    
    def _get_nested_value(self, data: dict[str, Any], path: str) -> Any:
        """Get nested value from dictionary using dot notation.
        
        Args:
            data: Source dictionary
            path: Dot-separated path (e.g., "enrollment.actual")
            
        Returns:
            Value at path or None
        """
        if not path:
            return None
        
        keys = path.split('.')
        value = data
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None
        
        return value
    
    def _apply_template(self, template: str, data: dict[str, Any]) -> str:
        """Apply template string with data values.
        
        Args:
            template: Template string with {{field}} placeholders
            data: Data dictionary
            
        Returns:
            Filled template string
        """
        result = template
        
        # Find all placeholders
        import re
        placeholders = re.findall(r'\{\{(\w+)\}\}', template)
        
        for placeholder in placeholders:
            value = data.get(placeholder, '')
            result = result.replace(f'{{{{{placeholder}}}}}', str(value))
        
        return result
    
    def _transform_section(self, section_data: dict[str, Any], course_data: dict[str, Any] = None) -> dict[str, Any]:
        """Transform a section using mappings.
        
        Args:
            section_data: Raw section data
            course_data: Parent course data if needed
            
        Returns:
            Transformed section
        """
        section_mapping = self.mappings.get('section', {})
        
        # Build base section
        section = {
            "crn": self._map_field(section_data, section_mapping.get('crn')),
            "status": self._map_field(section_data, section_mapping.get('status', 'Open')),
            "enrollment": self._transform_enrollment(section_data),
            "meetings": self._transform_meetings(section_data)
        }
        
        # Add optional fields
        if 'instruction_mode' in section_mapping:
            mode = self._map_field(section_data, section_mapping['instruction_mode'])
            if mode:
                section['instruction_mode'] = mode
        
        # Add instructor
        instructor = self._transform_instructor(section_data)
        if instructor:
            section['instructor'] = instructor
        
        # Add dates
        dates = self._transform_dates(section_data)
        if dates:
            section['dates'] = dates
        
        # Add attributes
        attributes = self._extract_attributes(section_data)
        if attributes:
            section['attributes'] = attributes
        
        return section
    
    def _transform_enrollment(self, section_data: dict[str, Any]) -> dict[str, Any]:
        """Transform enrollment data."""
        enrollment_mapping = self.mappings.get('section', {}).get('enrollment', {})
        
        enrollment = {
            "enrolled": self._map_field(section_data, enrollment_mapping.get('enrolled', 0)) or 0,
            "capacity": self._map_field(section_data, enrollment_mapping.get('capacity', 0)) or 0
        }
        
        # Add optional fields
        if 'available' in enrollment_mapping:
            enrollment['available'] = self._map_field(section_data, enrollment_mapping['available']) or 0
        
        if 'waitlist' in enrollment_mapping:
            waitlist = self._map_field(section_data, enrollment_mapping['waitlist'])
            if waitlist is not None:
                enrollment['waitlist'] = waitlist
        
        return enrollment
    
    @abstractmethod
    def _transform_meetings(self, section_data: dict[str, Any]) -> list[dict[str, Any]]:
        """Transform meeting times. Must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def _transform_instructor(self, section_data: dict[str, Any]) -> dict[str, Any]:
        """Transform instructor data. Must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def _transform_dates(self, section_data: dict[str, Any]) -> dict[str, Any]:
        """Transform date information. Must be implemented by subclasses."""
        pass
    
    def _extract_attributes(self, section_data: dict[str, Any]) -> dict[str, Any]:
        """Extract college-specific attributes."""
        attributes = {}
        attribute_mapping = self.mappings.get('section', {}).get('attributes', {})
        
        for attr_name, attr_mapping in attribute_mapping.items():
            value = self._map_field(section_data, attr_mapping)
            if value is not None:
                attributes[attr_name] = value
        
        return attributes