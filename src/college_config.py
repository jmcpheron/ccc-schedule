"""College configuration management for the onboarding system."""

import json
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime


@dataclass
class ExtractionRule:
    """Custom extraction rule for specific fields."""
    field_name: str
    rule_type: str  # 'regex', 'xpath', 'css_selector', 'llm_prompt'
    rule_value: str
    post_processing: Optional[str] = None  # Python expression for post-processing


@dataclass
class CollegeConfig:
    """Configuration for a specific college's data extraction."""
    
    # Basic information
    college_id: str = ""
    college_name: str = ""
    college_abbreviation: str = ""
    website: str = ""
    schedule_url: str = ""
    
    # Data source configuration
    source_format: str = ""  # 'banner8_html', 'json_api', 'custom_html', etc.
    source_encoding: str = "utf-8"
    
    # Field mappings
    field_mappings: Dict[str, str] = field(default_factory=dict)
    
    # Custom extraction rules
    custom_rules: List[ExtractionRule] = field(default_factory=list)
    
    # Parser configuration
    parser_options: Dict[str, Any] = field(default_factory=dict)
    
    # Validation rules
    validation_rules: Dict[str, Any] = field(default_factory=dict)
    
    # Metadata
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    version: str = "1.0.0"
    
    def add_mapping(self, ccc_field: str, source_field: str):
        """Add a field mapping."""
        self.field_mappings[ccc_field] = source_field
        self.updated_at = datetime.now().isoformat()
        
    def add_custom_rule(self, rule: ExtractionRule):
        """Add a custom extraction rule."""
        self.custom_rules.append(rule)
        self.updated_at = datetime.now().isoformat()
        
    def get_mapped_field(self, ccc_field: str) -> Optional[str]:
        """Get the source field for a CCC field."""
        return self.field_mappings.get(ccc_field)
        
    def validate(self) -> List[str]:
        """Validate the configuration.
        
        Returns:
            List of validation errors (empty if valid)
        """
        errors = []
        
        if not self.college_id:
            errors.append("College ID is required")
            
        if not self.college_name:
            errors.append("College name is required")
            
        if not self.source_format:
            errors.append("Source format is required")
            
        # Check required mappings
        required_mappings = ["course_number", "course_title", "units"]
        for field in required_mappings:
            if field not in self.field_mappings:
                errors.append(f"Missing required mapping: {field}")
                
        return errors


def save_college_config(config: CollegeConfig, file_path: Path):
    """Save college configuration to JSON file.
    
    Args:
        config: CollegeConfig object to save
        file_path: Path where to save the configuration
    """
    config.updated_at = datetime.now().isoformat()
    
    # Convert to dictionary
    config_dict = asdict(config)
    
    # Ensure directory exists
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save as JSON
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(config_dict, f, indent=2, ensure_ascii=False)


def load_college_config(file_path: Path) -> CollegeConfig:
    """Load college configuration from JSON file.
    
    Args:
        file_path: Path to configuration file
        
    Returns:
        CollegeConfig object
        
    Raises:
        FileNotFoundError: If configuration file doesn't exist
        json.JSONDecodeError: If file contains invalid JSON
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        config_dict = json.load(f)
        
    # Convert custom rules back to ExtractionRule objects
    if 'custom_rules' in config_dict:
        config_dict['custom_rules'] = [
            ExtractionRule(**rule) for rule in config_dict['custom_rules']
        ]
        
    return CollegeConfig(**config_dict)


def get_banner8_default_config() -> CollegeConfig:
    """Get default configuration for Banner 8 systems.
    
    Returns:
        CollegeConfig with common Banner 8 mappings
    """
    config = CollegeConfig(
        source_format="banner8_html",
        field_mappings={
            # Course fields
            "course_subject": "subjCode",
            "course_number": "crseNumb",
            "course_title": "crseTitle",
            "description": "crseDesc",
            "units": "creditHrs",
            "prerequisites": "prereqs",
            "corequisites": "coreqs",
            
            # Section fields
            "crn": "crn",
            "section_number": "seqNumb",
            "status": "ssts",
            "enrollment": "enrollment",
            "capacity": "maxEnrl",
            "waitlist": "waitCount",
            
            # Meeting fields
            "days": "days",
            "start_time": "beginTime",
            "end_time": "endTime",
            "building": "bldg",
            "room": "room",
            
            # Instructor fields
            "instructor_name": "instructorName",
            "instructor_email": "instructorEmail"
        },
        parser_options={
            "table_class": "datadisplaytable",
            "course_row_class": "ddtitle",
            "section_row_class": "dddefault"
        }
    )
    
    # Add common Banner 8 extraction rules
    config.add_custom_rule(ExtractionRule(
        field_name="zero_textbook_cost",
        rule_type="regex",
        rule_value=r"Zero Textbook Cost|ZTC",
        post_processing="bool(match)"
    ))
    
    config.add_custom_rule(ExtractionRule(
        field_name="online_course",
        rule_type="regex",
        rule_value=r"ONLINE|Online|WEB",
        post_processing="bool(match)"
    ))
    
    return config


def get_config_templates() -> Dict[str, CollegeConfig]:
    """Get configuration templates for common systems.
    
    Returns:
        Dictionary of template name to CollegeConfig
    """
    return {
        "banner8": get_banner8_default_config(),
        "peoplesoft": CollegeConfig(
            source_format="peoplesoft_html",
            field_mappings={
                "course_number": "class_nbr",
                "course_title": "descr",
                "units": "units_acad_prog",
                "crn": "class_section",
                "status": "enrl_stat",
                "instructor_name": "name_display"
            }
        ),
        "custom_json": CollegeConfig(
            source_format="json_api",
            parser_options={
                "data_path": "courses",
                "flatten_nested": True
            }
        )
    }


def merge_configs(base: CollegeConfig, override: CollegeConfig) -> CollegeConfig:
    """Merge two configurations, with override taking precedence.
    
    Args:
        base: Base configuration
        override: Configuration with overrides
        
    Returns:
        Merged configuration
    """
    # Create a copy of base
    merged = CollegeConfig(**asdict(base))
    
    # Override with non-empty values from override
    override_dict = asdict(override)
    for key, value in override_dict.items():
        if value and (isinstance(value, (str, list, dict)) and len(value) > 0):
            setattr(merged, key, value)
            
    merged.updated_at = datetime.now().isoformat()
    return merged