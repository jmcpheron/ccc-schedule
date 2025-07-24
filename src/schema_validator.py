"""Schema validation utilities for extensible CCC Schedule data."""

import json
from pathlib import Path
from typing import Any, Union

from jsonschema import Draft7Validator


class ExtensibleSchemaValidator:
    """Validates schedule data against base schema with college-specific extensions."""

    def __init__(
        self,
        base_schema_path: Union[str, Path],
        college_config_path: Union[str, Path] = None,
    ):
        """Initialize validator with base schema and optional college config.

        Args:
            base_schema_path: Path to base schema JSON file
            college_config_path: Path to college configuration JSON file
        """
        self.base_schema = self._load_json(base_schema_path)
        self.college_config = (
            self._load_json(college_config_path) if college_config_path else None
        )
        self.validator = Draft7Validator(self.base_schema)

    @staticmethod
    def _load_json(path: Union[str, Path]) -> dict[str, Any]:
        """Load JSON file."""
        with open(path) as f:
            return json.load(f)

    def validate(
        self, data: dict[str, Any], strict: bool = False
    ) -> tuple[bool, list[str]]:
        """Validate data against schema.

        Args:
            data: Schedule data to validate
            strict: If True, validate college-specific requirements

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []

        # Validate against base schema
        base_errors = list(self.validator.iter_errors(data))
        if base_errors:
            errors.extend([f"Base schema: {e.message}" for e in base_errors])

        # Validate college-specific requirements if strict mode
        if strict and self.college_config:
            college_errors = self._validate_college_requirements(data)
            errors.extend(college_errors)

        return len(errors) == 0, errors

    def _validate_college_requirements(self, data: dict[str, Any]) -> list[str]:
        """Validate college-specific requirements based on config."""
        errors = []
        features = self.college_config.get("features", {})

        # Check if required features are present in data
        if features.get("textbook_cost", {}).get("enabled"):
            errors.extend(self._check_textbook_cost(data))

        if features.get("instruction_modes", {}).get("enabled"):
            errors.extend(self._check_instruction_modes(data))

        if features.get("enrollment_tracking", {}).get("enabled"):
            errors.extend(self._check_enrollment_tracking(data))

        return errors

    def _check_textbook_cost(self, data: dict[str, Any]) -> list[str]:
        """Check textbook cost data."""
        errors = []
        valid_categories = {
            cat["code"]
            for cat in self.college_config["features"]["textbook_cost"]["categories"]
        }

        for course in data.get("schedule", {}).get("courses", []):
            for section in course.get("sections", []):
                # Check if textbook cost is in attributes
                textbook_cost = section.get("attributes", {}).get("textbook_cost")
                if textbook_cost and textbook_cost not in valid_categories:
                    errors.append(
                        f"Invalid textbook cost '{textbook_cost}' in section {section.get('crn')}. "
                        f"Valid values: {valid_categories}"
                    )

        return errors

    def _check_instruction_modes(self, data: dict[str, Any]) -> list[str]:
        """Check instruction mode data."""
        errors = []
        # Get the mapped codes (values) from the modes configuration
        modes_config = self.college_config["features"]["instruction_modes"]["modes"]
        valid_modes = set()
        for key, mode_info in modes_config.items():
            if isinstance(mode_info, dict) and "code" in mode_info:
                valid_modes.add(mode_info["code"])
            else:
                # Handle simple string values
                valid_modes.add(key)

        for course in data.get("schedule", {}).get("courses", []):
            for section in course.get("sections", []):
                mode = section.get("instruction_mode")
                if mode and mode not in valid_modes:
                    errors.append(
                        f"Invalid instruction mode '{mode}' in section {section.get('crn')}. "
                        f"Valid values: {valid_modes}"
                    )

        return errors

    def _check_enrollment_tracking(self, data: dict[str, Any]) -> list[str]:
        """Check enrollment tracking fields."""
        errors = []
        required_fields = self.college_config["features"]["enrollment_tracking"].get(
            "fields", []
        )

        for course in data.get("schedule", {}).get("courses", []):
            for section in course.get("sections", []):
                attributes = section.get("attributes", {})
                missing_fields = [
                    field for field in required_fields if field not in attributes
                ]

                if missing_fields:
                    errors.append(
                        f"Section {section.get('crn')} missing enrollment tracking fields: "
                        f"{missing_fields}"
                    )

        return errors


def validate_schedule_file(
    schedule_path: Union[str, Path],
    base_schema_path: Union[str, Path] = "data/schemas/base.json",
    college_config_path: Union[str, Path] = None,
    strict: bool = False,
) -> tuple[bool, list[str]]:
    """Convenience function to validate a schedule file.

    Args:
        schedule_path: Path to schedule JSON file
        base_schema_path: Path to base schema (default: data/schemas/base.json)
        college_config_path: Path to college config file
        strict: Enable strict college-specific validation

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    validator = ExtensibleSchemaValidator(base_schema_path, college_config_path)

    with open(schedule_path) as f:
        data = json.load(f)

    return validator.validate(data, strict)


def merge_with_base_schema(
    base_schema_path: Union[str, Path], college_extensions: dict[str, Any]
) -> dict[str, Any]:
    """Merge college-specific extensions with base schema.

    Args:
        base_schema_path: Path to base schema
        college_extensions: Dictionary of schema extensions

    Returns:
        Merged schema dictionary
    """
    with open(base_schema_path) as f:
        base_schema = json.load(f)

    # Deep merge extensions into base schema
    # This is a simplified merge - in production would need recursive merge
    merged = base_schema.copy()

    # Add college-specific properties
    if "properties" in college_extensions:
        merged["properties"]["schedule"]["properties"].update(
            college_extensions["properties"]
        )

    return merged
