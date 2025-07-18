"""Tests for frontend UI elements."""

from pathlib import Path

import pytest
from bs4 import BeautifulSoup


class TestFrontendElements:
    """Test suite for frontend HTML elements."""

    @pytest.fixture
    def index_html(self):
        """Load and parse the index.html file."""
        index_path = Path(__file__).parent.parent / "index.html"
        with open(index_path, encoding="utf-8") as f:
            content = f.read()
        return BeautifulSoup(content, "html.parser")

    def test_navbar_structure(self, index_html):
        """Test that navbar contains required elements."""
        navbar = index_html.find("nav", {"id": "top-navbar"})
        assert navbar is not None, "Navbar with id 'top-navbar' not found"

        # Check for container
        container = navbar.find("div", {"class": "container"})
        assert container is not None, "Container not found in navbar"

    def test_search_form_elements(self, index_html):
        """Test that search form contains all required elements."""
        search_form = index_html.find("form", {"id": "search-form"})
        assert search_form is not None, "Search form not found"

        # Check main search input
        search_input = index_html.find("input", {"id": "search_input_main"})
        assert search_input is not None, "Main search input not found"
        assert search_input.get("placeholder") is not None

        # Check search buttons
        all_button = index_html.find("button", {"id": "button-search"})
        open_button = index_html.find("button", {"id": "button-search-open"})
        assert all_button is not None, "All search button not found"
        assert open_button is not None, "Open classes button not found"

    def test_dropdown_selects(self, index_html):
        """Test that all required dropdown selects exist."""
        required_selects = [
            "term-select",
            "college-select",
            "subject-select",
            "credit-select",
        ]

        for select_id in required_selects:
            select = index_html.find("select", {"id": select_id})
            assert select is not None, f"Select with id '{select_id}' not found"

    def test_instructional_mode_dropdown(self, index_html):
        """Test instructional mode dropdown structure."""
        dropdown = index_html.find("div", {"id": "instr-method-drop-down"})
        assert dropdown is not None, "Instructional mode dropdown not found"

        # Check for button
        button = index_html.find("button", {"id": "instr-method-button"})
        assert button is not None, "Instructional mode button not found"

        # Check for checkbox options
        checkboxes = index_html.find_all("input", {"name": "flexRadioInstrMethod"})
        assert len(checkboxes) >= 5, "Expected at least 5 instructional mode options"

    def test_more_options_section(self, index_html):
        """Test collapsible more options section."""
        more_options = index_html.find("div", {"id": "more-options"})
        assert more_options is not None, "More options section not found"
        assert "collapse" in more_options.get("class", []), (
            "More options should have collapse class"
        )

        # Check for instructor input
        instructor_input = index_html.find("input", {"id": "instructor-input"})
        assert instructor_input is not None, "Instructor input not found"

    def test_meeting_days_checkboxes(self, index_html):
        """Test meeting days selection."""
        days = ["M", "T", "W", "R", "F", "S", "U"]

        for day in days:
            checkbox = index_html.find(
                "input", {"name": "flexRadioMeetingDays", "value": day}
            )
            assert checkbox is not None, f"Meeting day checkbox for '{day}' not found"

    def test_time_range_sliders(self, index_html):
        """Test time range slider inputs."""
        start_time = index_html.find("input", {"id": "start-time"})
        end_time = index_html.find("input", {"id": "end-time"})

        assert start_time is not None, "Start time slider not found"
        assert end_time is not None, "End time slider not found"
        assert start_time.get("type") == "range", "Start time should be range input"
        assert end_time.get("type") == "range", "End time should be range input"

    def test_textbook_cost_filter(self, index_html):
        """Test textbook cost filter options."""
        ztc_checkbox = index_html.find("input", {"id": "textbookCost1", "value": "ZTC"})
        ltc_checkbox = index_html.find("input", {"id": "textbookCost2", "value": "LTC"})

        assert ztc_checkbox is not None, "ZTC checkbox not found"
        assert ltc_checkbox is not None, "LTC checkbox not found"

    def test_transfer_requirement_dropdowns(self, index_html):
        """Test transfer requirement dropdown elements."""
        dropdowns = [
            ("csuge-list", "dropdownMenuButtonCSUGE"),
            ("igetc-list", "dropdownMenuButtonIGETC"),
            ("calgetc-list", "dropdownMenuButtonCALGETC"),
        ]

        for list_id, button_id in dropdowns:
            list_elem = index_html.find("ul", {"id": list_id})
            button = index_html.find("button", {"id": button_id})
            assert list_elem is not None, f"List with id '{list_id}' not found"
            assert button is not None, f"Button with id '{button_id}' not found"

    def test_search_results_container(self, index_html):
        """Test search results display structure."""
        results_container = index_html.find("div", {"id": "search-results-container"})
        assert results_container is not None, "Search results container not found"

        # Check for results list
        results_list = index_html.find("ul", {"id": "class-search-results"})
        assert results_list is not None, "Class search results list not found"

        # Check pagination
        pagination_prev = index_html.find(
            "button", {"id": "results-pagination-previous"}
        )
        pagination_next = index_html.find("button", {"id": "results-pagination-next"})
        assert pagination_prev is not None, "Previous pagination button not found"
        assert pagination_next is not None, "Next pagination button not found"

    def test_modals(self, index_html):
        """Test required modals exist."""
        # Section details modal
        section_modal = index_html.find("div", {"id": "section-details-modal"})
        assert section_modal is not None, "Section details modal not found"

        # Spinner modal
        spinner_modal = index_html.find("div", {"id": "spinner-modal"})
        assert spinner_modal is not None, "Spinner modal not found"

    def test_bootstrap_version(self, index_html):
        """Test that Bootstrap 5.0.2 is being used."""
        bootstrap_link = index_html.find(
            "link", href=lambda x: x and "bootstrap@5.0.2" in x
        )
        assert bootstrap_link is not None, "Bootstrap 5.0.2 CSS not found"

        bootstrap_script = index_html.find(
            "script", src=lambda x: x and "bootstrap@5.0.2" in x
        )
        assert bootstrap_script is not None, "Bootstrap 5.0.2 JS not found"

    def test_jquery_inclusion(self, index_html):
        """Test that jQuery is included."""
        jquery_script = index_html.find("script", src=lambda x: x and "jquery" in x)
        assert jquery_script is not None, "jQuery script not found"

    def test_responsive_meta_tag(self, index_html):
        """Test viewport meta tag for responsiveness."""
        viewport = index_html.find("meta", {"name": "viewport"})
        assert viewport is not None, "Viewport meta tag not found"
        assert "width=device-width" in viewport.get("content", ""), (
            "Viewport should include device-width"
        )
