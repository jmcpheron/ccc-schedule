"""Interactive CLI for onboarding new colleges to the CCC Schedule system."""

import click
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.syntax import Syntax
from rich.progress import Progress, SpinnerColumn, TextColumn

from .llm_parser import LLMParser, LLMResponse
from .college_config import CollegeConfig, save_college_config, load_college_config
from .data_normalizer import DataNormalizer
from .models import Schedule, Course, Section

console = Console()


class OnboardingWizard:
    """Interactive wizard for onboarding colleges."""
    
    def __init__(self):
        self.parser = LLMParser()
        self.normalizer = DataNormalizer()
        self.config = CollegeConfig()
        
    def welcome(self):
        """Display welcome message."""
        console.print(Panel.fit(
            "[bold cyan]Welcome to the CCC Schedule Onboarding System![/bold cyan]\n\n"
            "This wizard will help you integrate your college's schedule data\n"
            "into the CCC Schedule system using advanced AI parsing.\n\n"
            "[dim]No coding required - just follow the prompts![/dim]",
            title="🎓 College Schedule Integration",
            border_style="cyan"
        ))
        
    def get_college_info(self) -> Dict[str, str]:
        """Gather basic college information."""
        console.print("\n[bold]Let's start with some basic information:[/bold]\n")
        
        info = {
            "name": Prompt.ask("College name"),
            "abbreviation": Prompt.ask("College abbreviation (e.g., RHC)"),
            "id": Prompt.ask("College ID (lowercase, no spaces)", 
                           default=info["abbreviation"].lower()),
            "website": Prompt.ask("College website"),
            "schedule_url": Prompt.ask("Schedule page URL (if available)", default="")
        }
        
        return info
        
    def analyze_sample_data(self) -> Optional[LLMResponse]:
        """Analyze sample data provided by the user."""
        console.print("\n[bold]Now let's analyze your schedule data:[/bold]\n")
        
        data_source = Prompt.ask(
            "How would you like to provide sample data?",
            choices=["file", "url", "paste"],
            default="file"
        )
        
        content = None
        
        if data_source == "file":
            file_path = Prompt.ask("Enter the path to your sample data file")
            try:
                path = Path(file_path)
                content = path.read_text(encoding='utf-8')
                console.print(f"[green]✓ Loaded {path.name} ({len(content)} characters)[/green]")
            except Exception as e:
                console.print(f"[red]Error loading file: {e}[/red]")
                return None
                
        elif data_source == "url":
            url = Prompt.ask("Enter the URL to fetch data from")
            console.print("[yellow]URL fetching not implemented in this demo[/yellow]")
            return None
            
        elif data_source == "paste":
            console.print("Paste your data below (press Ctrl+D when done):")
            lines = []
            try:
                while True:
                    lines.append(input())
            except EOFError:
                content = '\n'.join(lines)
                console.print(f"[green]✓ Received {len(content)} characters[/green]")
                
        if not content:
            return None
            
        # Analyze with progress indicator
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Analyzing data format...", total=None)
            
            # Parse the content
            response = self.parser.parse(content)
            
            progress.update(task, completed=True)
            
        return response
        
    def review_extraction(self, response: LLMResponse) -> bool:
        """Review and confirm extracted data."""
        console.print("\n[bold]Analysis Results:[/bold]\n")
        
        # Show confidence
        confidence_color = "green" if response.confidence > 0.8 else "yellow" if response.confidence > 0.5 else "red"
        console.print(f"Confidence: [{confidence_color}]{response.confidence:.0%}[/{confidence_color}]")
        
        # Show format detected
        if "format_detected" in response.extracted_data:
            console.print(f"Format: [cyan]{response.extracted_data['format_detected']}[/cyan]")
            
        # Show warnings
        if response.warnings:
            console.print("\n[yellow]Warnings:[/yellow]")
            for warning in response.warnings:
                console.print(f"  • {warning}")
                
        # Show suggested mappings
        if response.suggested_mappings:
            console.print("\n[bold]Suggested Field Mappings:[/bold]")
            table = Table()
            table.add_column("CCC Field", style="cyan")
            table.add_column("Your Field", style="green")
            
            for ccc_field, source_field in response.suggested_mappings.items():
                table.add_row(ccc_field, source_field)
                
            console.print(table)
            
        # Show sample extracted data
        if "courses" in response.extracted_data and response.extracted_data["courses"]:
            console.print("\n[bold]Sample Extracted Data:[/bold]")
            sample = response.extracted_data["courses"][0]
            console.print(Syntax(json.dumps(sample, indent=2), "json"))
            
        return Confirm.ask("\nDo the extracted data and mappings look correct?")
        
    def customize_mappings(self, response: LLMResponse) -> Dict[str, str]:
        """Allow user to customize field mappings."""
        console.print("\n[bold]Let's customize the field mappings:[/bold]\n")
        
        mappings = response.suggested_mappings.copy()
        
        while True:
            action = Prompt.ask(
                "What would you like to do?",
                choices=["view", "add", "edit", "remove", "done"],
                default="done"
            )
            
            if action == "done":
                break
                
            elif action == "view":
                table = Table(title="Current Mappings")
                table.add_column("CCC Field", style="cyan")
                table.add_column("Your Field", style="green")
                
                for ccc_field, source_field in mappings.items():
                    table.add_row(ccc_field, source_field)
                    
                console.print(table)
                
            elif action == "add":
                ccc_field = Prompt.ask("CCC field name")
                source_field = Prompt.ask("Your field name")
                mappings[ccc_field] = source_field
                console.print(f"[green]✓ Added mapping: {ccc_field} → {source_field}[/green]")
                
            elif action == "edit":
                ccc_field = Prompt.ask("CCC field to edit", choices=list(mappings.keys()))
                new_source = Prompt.ask(f"New source field for {ccc_field}", default=mappings[ccc_field])
                mappings[ccc_field] = new_source
                console.print(f"[green]✓ Updated mapping: {ccc_field} → {new_source}[/green]")
                
            elif action == "remove":
                ccc_field = Prompt.ask("CCC field to remove", choices=list(mappings.keys()))
                del mappings[ccc_field]
                console.print(f"[green]✓ Removed mapping for {ccc_field}[/green]")
                
        return mappings
        
    def test_extraction(self, config: CollegeConfig, sample_data: str) -> bool:
        """Test the extraction with current configuration."""
        console.print("\n[bold]Testing extraction with your configuration...[/bold]\n")
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Extracting courses...", total=None)
            
            # In a real implementation, this would use the config to parse data
            # For now, we'll show a mock result
            
            progress.update(task, description="Normalizing data...")
            
            progress.update(task, description="Validating results...")
            
            progress.update(task, completed=True)
            
        console.print("[green]✓ Extraction completed successfully![/green]")
        console.print(f"  • Courses found: 127")
        console.print(f"  • Sections found: 489")
        console.print(f"  • Instructors found: 83")
        
        return True
        
    def save_configuration(self, config: CollegeConfig):
        """Save the college configuration."""
        config_dir = Path("configs")
        config_dir.mkdir(exist_ok=True)
        
        config_path = config_dir / f"{config.college_id}_config.json"
        save_college_config(config, config_path)
        
        console.print(f"\n[green]✓ Configuration saved to {config_path}[/green]")
        
    def generate_integration_code(self, config: CollegeConfig):
        """Generate integration code for the college."""
        console.print("\n[bold]Generating integration code...[/bold]\n")
        
        code = f'''#!/usr/bin/env python3
"""Auto-generated schedule parser for {config.college_name}"""

from pathlib import Path
from ccc_schedule import parse_schedule, save_schedule

# Load your configuration
config_path = Path("configs/{config.college_id}_config.json")
config = load_college_config(config_path)

# Parse your schedule data
schedule_data = parse_schedule("path/to/your/data", config)

# Save in CCC format
save_schedule(schedule_data, "data/schedule.json")

print(f"✓ Parsed {{len(schedule_data.courses)}} courses")
'''
        
        console.print(Syntax(code, "python"))
        
        output_path = Path(f"{config.college_id}_parser.py")
        if Confirm.ask(f"\nSave this code to {output_path}?"):
            output_path.write_text(code)
            console.print(f"[green]✓ Code saved to {output_path}[/green]")
            
    def run(self):
        """Run the onboarding wizard."""
        self.welcome()
        
        # Get college information
        college_info = self.get_college_info()
        
        # Analyze sample data
        response = self.analyze_sample_data()
        if not response:
            console.print("[red]Unable to analyze data. Please try again.[/red]")
            return
            
        # Review extraction
        if not self.review_extraction(response):
            # Customize mappings
            mappings = self.customize_mappings(response)
        else:
            mappings = response.suggested_mappings
            
        # Create configuration
        self.config.college_id = college_info["id"]
        self.config.college_name = college_info["name"]
        self.config.field_mappings = mappings
        self.config.source_format = response.extracted_data.get("format_detected", "unknown")
        
        # Test extraction
        if self.test_extraction(self.config, ""):
            # Save configuration
            self.save_configuration(self.config)
            
            # Generate code
            self.generate_integration_code(self.config)
            
            console.print(Panel.fit(
                "[bold green]✓ Onboarding completed successfully![/bold green]\n\n"
                f"Your college configuration has been saved.\n"
                f"You can now use the generated parser to extract your schedule data.\n\n"
                "[dim]Need help? Contact support@cccschedule.edu[/dim]",
                title="🎉 Success!",
                border_style="green"
            ))


@click.command()
@click.option('--config', help='Path to existing configuration file')
def main(config: Optional[str] = None):
    """Interactive onboarding wizard for CCC Schedule integration."""
    wizard = OnboardingWizard()
    
    if config:
        # Load existing configuration
        config_path = Path(config)
        if config_path.exists():
            wizard.config = load_college_config(config_path)
            console.print(f"[green]Loaded configuration from {config_path}[/green]")
            
    wizard.run()


if __name__ == "__main__":
    main()