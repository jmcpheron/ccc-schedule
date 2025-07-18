#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Setup script for creating a local college test environment.
This script automates the process of setting up a test branch with college-specific data.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def run_command(cmd, capture=False):
    """Run a shell command and optionally capture output."""
    print(f"Running: {' '.join(cmd)}")
    if capture:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout.strip()
    else:
        subprocess.run(cmd, check=True)


def create_branch(college_name):
    """Create a new test branch for the college."""
    branch_name = f"test/{college_name.lower().replace(' ', '-')}"

    # Check if branch already exists
    existing_branches = run_command(["git", "branch", "-l"], capture=True)
    if branch_name in existing_branches:
        print(f"Branch {branch_name} already exists. Switching to it...")
        run_command(["git", "checkout", branch_name])
    else:
        print(f"Creating new branch: {branch_name}")
        run_command(["git", "checkout", "-b", branch_name])

    return branch_name


def setup_college_data(college_name, college_id):
    """Create college-specific data file from template."""
    template_path = Path("data/college-template.json")
    output_path = Path(f"data/{college_id}.json")

    if not template_path.exists():
        print("Error: Template file not found. Please run from project root.")
        sys.exit(1)

    # Load template
    with open(template_path, "r") as f:
        data = json.load(f)

    # Update college name in all courses
    for course in data.get("courses", []):
        course["college"] = college_name

    # Save customized data
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Created college data file: {output_path}")
    return output_path


def update_javascript(data_file):
    """Update JavaScript to use the new data file."""
    js_file = Path("js/schedule-enhanced.js")

    if not js_file.exists():
        print("Warning: JavaScript file not found. You'll need to update it manually.")
        return

    # Read the file
    with open(js_file, "r") as f:
        content = f.read()

    # Replace the data file path
    old_path = "data/courses.json"
    new_path = str(data_file)

    if old_path in content:
        content = content.replace(old_path, new_path)
        with open(js_file, "w") as f:
            f.write(content)
        print(f"Updated JavaScript to use: {new_path}")
    else:
        print("Warning: Could not find data path in JavaScript. Update manually.")


def update_branding(college_name):
    """Update HTML with college branding."""
    html_file = Path("index.html")

    if not html_file.exists():
        print("Warning: index.html not found.")
        return

    with open(html_file, "r") as f:
        content = f.read()

    # Update title
    content = content.replace(
        "<title>CCC Schedule</title>", f"<title>{college_name} - Class Schedule</title>"
    )

    # Update demo alert
    content = content.replace(
        "Welcome to the CCC Schedule Demo!",
        f"Welcome to the {college_name} Schedule Demo!",
    )

    with open(html_file, "w") as f:
        f.write(content)

    print(f"Updated branding for: {college_name}")


def validate_data(data_file):
    """Validate the college data using CLI tools."""
    try:
        run_command(
            ["uv", "run", "python", "-m", "src.cli", "validate", str(data_file)]
        )
        print("✓ Data validation passed!")
    except subprocess.CalledProcessError:
        print("✗ Data validation failed. Please check your data file.")
        sys.exit(1)


def start_server(port=8000):
    """Start a local development server."""
    print(f"\nStarting local server on port {port}...")
    print(f"Visit http://localhost:{port} to view your site")
    print("Press Ctrl+C to stop the server\n")

    try:
        subprocess.run([sys.executable, "-m", "http.server", str(port)])
    except KeyboardInterrupt:
        print("\nServer stopped.")


def main():
    parser = argparse.ArgumentParser(
        description="Set up a local test environment for a specific college"
    )
    parser.add_argument(
        "college_name",
        help="Full name of the college (e.g., 'Sample Community College')",
    )
    parser.add_argument(
        "--college-id",
        help="Short identifier for files (e.g., 'scc'). Defaults to college name.",
        default=None,
    )
    parser.add_argument(
        "--no-server", action="store_true", help="Don't start the development server"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port for development server (default: 8000)",
    )
    parser.add_argument(
        "--skip-validation", action="store_true", help="Skip data validation step"
    )

    args = parser.parse_args()

    # Generate college ID if not provided
    if args.college_id is None:
        args.college_id = args.college_name.lower().replace(" ", "-")

    print(f"Setting up local environment for: {args.college_name}")
    print("=" * 50)

    # Create branch
    branch_name = create_branch(args.college_name)

    # Set up data
    data_file = setup_college_data(args.college_name, args.college_id)

    # Update JavaScript
    update_javascript(data_file)

    # Update branding
    update_branding(args.college_name)

    # Validate data
    if not args.skip_validation:
        validate_data(data_file)

    print("\n✅ Setup complete!")
    print(f"Branch: {branch_name}")
    print(f"Data file: {data_file}")

    # Start server
    if not args.no_server:
        start_server(args.port)
    else:
        print(f"\nTo start the server manually, run:")
        print(f"python -m http.server {args.port}")


if __name__ == "__main__":
    main()
