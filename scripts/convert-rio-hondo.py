#!/usr/bin/env python3
"""Convert Rio Hondo collector data to CCC Schedule standardized format."""

import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.transformers.rio_hondo_transformer import RioHondoTransformer
from src.schema_validator import validate_schedule_file


def convert_rio_hondo_to_schema(input_file: Path, output_file: Path) -> None:
    """Convert Rio Hondo collector JSON to CCC Schedule standardized format."""
    
    # Load Rio Hondo data
    with open(input_file, 'r') as f:
        rio_data = json.load(f)
    
    # Get college config path
    config_path = Path(__file__).parent.parent / "colleges" / "rio-hondo" / "config.json"
    
    # Initialize transformer
    transformer = RioHondoTransformer(config_path)
    
    # Transform data
    standardized_data = transformer.transform(rio_data)
    
    # Save output
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(standardized_data, f, indent=2)
    
    # Validate the output
    base_schema_path = Path(__file__).parent.parent / "data" / "schemas" / "base.json"
    is_valid, errors = validate_schedule_file(output_file, base_schema_path, config_path, strict=True)
    
    if is_valid:
        print(f"✓ Successfully converted and validated data")
    else:
        print(f"✗ Validation errors:")
        for error in errors:
            print(f"  - {error}")
    
    # Print summary
    courses = standardized_data["schedule"]["courses"]
    total_sections = sum(len(course["sections"]) for course in courses)
    print(f"\nConverted {len(courses)} courses with {total_sections} sections")
    print(f"Output saved to: {output_file}")


def main():
    """Main entry point."""
    # Define paths
    base_dir = Path(__file__).parent.parent
    input_file = base_dir / "ccc-schedule-examples" / "rio-hondo" / "data" / "202570" / "schedule_202570_latest.json"
    output_file = base_dir / "ccc-schedule-examples" / "rio-hondo" / "data" / "standardized_schedule.json"
    
    # Run conversion
    convert_rio_hondo_to_schema(input_file, output_file)


if __name__ == "__main__":
    main()