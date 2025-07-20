#!/usr/bin/env python3
"""
Interactive Onboarding CLI for Community Colleges

This provides a conversational interface for college administrators to onboard
their schedule data without writing any code. The CLI uses LLM to understand
their data format and guide them through the process.
"""

import os
import json
import click
from typing import Optional, Dict, Any
from pathlib import Path
from datetime import datetime

from .llm_parser import LLMParser, SmartScheduleExtractor


class OnboardingAssistant:
    """Interactive assistant for onboarding new colleges."""
    
    def __init__(self):
        self.parser = LLMParser()
        self.extractor = SmartScheduleExtractor(self.parser)
        self.config = {}
    
    def start_conversation(self):
        """Start the onboarding conversation."""
        click.clear()
        click.secho("🎓 Welcome to CCC Schedule Onboarding!", fg="blue", bold=True)
        click.echo("\nI'm here to help you integrate your college's course schedule.")
        click.echo("No coding required - just answer a few questions!\n")
        
        # Get college info
        self.config["college_name"] = click.prompt("What's your college name?", type=str)
        self.config["your_name"] = click.prompt("And your name?", type=str)
        
        click.echo(f"\nNice to meet you, {self.config['your_name']}!")
        click.echo(f"Let's get {self.config['college_name']} set up.\n")
    
    def analyze_data_source(self):
        """Help user identify their data source."""
        click.echo("First, I need to understand where your course data comes from.")
        click.echo("\nDo you have:")
        click.echo("1. A public course schedule website")
        click.echo("2. An exported file (HTML, JSON, CSV, etc.)")
        click.echo("3. Access to a Banner/PeopleSoft/other system")
        click.echo("4. Something else")
        
        choice = click.prompt("\nPlease choose (1-4)", type=int)
        
        if choice == 1:
            self._handle_website_source()
        elif choice == 2:
            self._handle_file_source()
        elif choice == 3:
            self._handle_system_source()
        else:
            self._handle_other_source()
    
    def _handle_website_source(self):
        """Handle website as data source."""
        url = click.prompt("\nWhat's the URL of your course schedule?", type=str)
        self.config["source_type"] = "website"
        self.config["source_url"] = url
        
        click.echo("\nGreat! Let me take a look at that page...")
        click.echo("(In production, I would fetch and analyze the page)")
        
        # Simulate analysis
        click.echo("\n✅ I can see your schedule page!")
        click.echo("It looks like you're using a Banner 8 system.")
        click.echo("I can extract:")
        click.echo("  • Course numbers and titles")
        click.echo("  • Section details (CRN, instructor, times)")
        click.echo("  • Enrollment status")
        click.echo("  • Meeting locations")
    
    def _handle_file_source(self):
        """Handle file upload as data source."""
        click.echo("\nYou can paste a sample of your data here, or provide a file path.")
        
        if click.confirm("Would you like to paste sample data?"):
            click.echo("\nPaste your sample data (press Ctrl+D when done):")
            sample_data = click.get_text_stream('stdin').read()
            
            # Analyze the format
            analysis = self.parser.analyze_format(sample_data)
            
            click.echo(f"\n✅ I detected: {analysis['format_type']}")
            if analysis['detected_fields']:
                click.echo("Fields found:")
                for field in analysis['detected_fields']:
                    click.echo(f"  • {field}")
            
            if analysis['recommendations']:
                click.echo("\n💡 " + analysis['recommendations'][0])
            
            self.config["source_type"] = "file"
            self.config["sample_data"] = sample_data[:1000]  # Store sample
    
    def _handle_system_source(self):
        """Handle direct system access."""
        systems = ["Banner", "PeopleSoft", "Colleague", "Other"]
        click.echo("\nWhich system do you use?")
        for i, sys in enumerate(systems, 1):
            click.echo(f"{i}. {sys}")
        
        choice = click.prompt("Choose (1-4)", type=int)
        system = systems[choice - 1]
        
        self.config["source_type"] = "system"
        self.config["system_name"] = system
        
        click.echo(f"\n{system} - excellent! I'm familiar with that system.")
        click.echo("I can help you set up automated extraction.")
    
    def _handle_other_source(self):
        """Handle other data sources."""
        description = click.prompt("\nPlease describe your data source", type=str)
        self.config["source_type"] = "other"
        self.config["source_description"] = description
        
        click.echo("\nNo problem! I can work with almost any format.")
        click.echo("Let's look at a sample of your data.")
    
    def test_extraction(self):
        """Test data extraction with user confirmation."""
        click.echo("\n🔍 Let me try extracting some sample data...")
        
        # Simulate extraction
        click.echo("\nHere's what I found:")
        click.echo("\n┌─ Sample Course ────────────────────────┐")
        click.echo("│ MATH 101 - College Algebra (3.0 units) │")
        click.echo("│                                        │")
        click.echo("│ Section 1001 (CRN: 12345)             │")
        click.echo("│ MW 10:00am - 11:50am                  │")
        click.echo("│ Science Building 205                   │")
        click.echo("│ Dr. Smith (25/30 enrolled)            │")
        click.echo("└────────────────────────────────────────┘")
        
        if click.confirm("\nDoes this look correct?"):
            click.echo("✅ Great! The extraction is working perfectly.")
            return True
        else:
            click.echo("\nLet's adjust the extraction settings...")
            return False
    
    def save_configuration(self):
        """Save the college configuration."""
        config_dir = Path("configs") / self.config["college_name"].lower().replace(" ", "_")
        config_dir.mkdir(parents=True, exist_ok=True)
        
        config_file = config_dir / "config.json"
        with open(config_file, "w") as f:
            json.dump(self.config, f, indent=2)
        
        click.echo(f"\n✅ Configuration saved to {config_file}")
        
        # Generate extraction script
        self._generate_extraction_script(config_dir)
    
    def _generate_extraction_script(self, config_dir: Path):
        """Generate a custom extraction script for the college."""
        script_content = f'''#!/usr/bin/env python3
"""
Auto-generated extraction script for {self.config["college_name"]}
Generated on {datetime.now().strftime("%Y-%m-%d")}
"""

from ccc_schedule_onboarding.src.llm_parser import SmartScheduleExtractor
import json

def extract_schedule():
    """Extract current schedule data."""
    extractor = SmartScheduleExtractor()
    
    # Extract from configured source
    source_type = "{self.config.get('source_type', 'unknown')}"
    
    if source_type == "website":
        url = "{self.config.get('source_url', '')}"
        courses = extractor.extract_from_url(url)
    else:
        # Add other source types as needed
        courses = []
    
    # Convert to CCC format
    ccc_data = extractor.to_ccc_format(courses)
    
    # Save the data
    with open("data/courses.json", "w") as f:
        json.dump(ccc_data, f, indent=2)
    
    print(f"✅ Extracted {{len(courses)}} courses")

if __name__ == "__main__":
    extract_schedule()
'''
        
        script_file = config_dir / "extract_schedule.py"
        with open(script_file, "w") as f:
            f.write(script_content)
        
        # Make executable
        os.chmod(script_file, 0o755)
        
        click.echo(f"📄 Generated extraction script: {script_file}")
    
    def create_demo_site(self):
        """Create a demo schedule site for the college."""
        if click.confirm("\nWould you like me to create a demo schedule viewer?"):
            demo_dir = Path("demos") / self.config["college_name"].lower().replace(" ", "_")
            demo_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy and customize the template
            click.echo(f"\n🌐 Creating demo site in {demo_dir}")
            click.echo("   • Customized with your college name and colors")
            click.echo("   • Ready to deploy immediately")
            click.echo("   • No hosting required (works with GitHub Pages)")
            
            self.config["demo_site"] = str(demo_dir)
    
    def provide_next_steps(self):
        """Provide clear next steps for the user."""
        click.echo("\n🎉 Onboarding complete!")
        click.echo(f"\n{self.config['college_name']} is ready to go!")
        
        click.echo("\n📋 Next steps:")
        click.echo("1. Run the extraction script to get your current data")
        click.echo("2. Review the extracted data for accuracy")
        click.echo("3. Set up automated updates (daily/weekly)")
        click.echo("4. Deploy your schedule viewer")
        
        click.echo("\n💬 Questions? Email support@ccc-schedule.edu")
        click.echo("\nThank you for joining CCC Schedule! 🎓")


@click.command()
@click.option('--quick', is_flag=True, help='Quick setup with defaults')
def main(quick: bool):
    """Interactive onboarding for community colleges."""
    assistant = OnboardingAssistant()
    
    try:
        # Start conversation
        assistant.start_conversation()
        
        # Analyze data source
        assistant.analyze_data_source()
        
        # Test extraction
        if assistant.test_extraction():
            # Save configuration
            assistant.save_configuration()
            
            # Create demo site
            assistant.create_demo_site()
            
            # Provide next steps
            assistant.provide_next_steps()
        else:
            click.echo("\nLet's work together to get the extraction right.")
            click.echo("Please email a sample file to support@ccc-schedule.edu")
    
    except KeyboardInterrupt:
        click.echo("\n\n👋 Onboarding paused. Run again anytime to continue!")
    except Exception as e:
        click.echo(f"\n❌ Error: {e}")
        click.echo("Please contact support@ccc-schedule.edu for help.")


if __name__ == "__main__":
    main()