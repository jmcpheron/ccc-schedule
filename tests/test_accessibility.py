"""
Accessibility tests for CCC Schedule application.
Tests WCAG 2.1 AA compliance, keyboard navigation, and screen reader support.
"""

import pytest
from typing import List, Dict, Any
import re
from bs4 import BeautifulSoup
from pathlib import Path


class TestAccessibilityCompliance:
    """Test suite for WCAG 2.1 AA compliance."""
    
    def setup_method(self):
        """Load the HTML file for testing."""
        html_path = Path(__file__).parent.parent / "index.html"
        with open(html_path, 'r', encoding='utf-8') as f:
            self.html_content = f.read()
        self.soup = BeautifulSoup(self.html_content, 'html.parser')
    
    def test_page_has_lang_attribute(self):
        """Test that the HTML element has a lang attribute."""
        html_tag = self.soup.find('html')
        assert html_tag is not None, "HTML tag not found"
        assert html_tag.get('lang') is not None, "HTML tag missing lang attribute"
        assert html_tag.get('lang') == 'en', "HTML lang should be 'en'"
    
    def test_page_has_title(self):
        """Test that the page has a title element."""
        title = self.soup.find('title')
        assert title is not None, "Page missing title element"
        assert title.text.strip() != "", "Page title is empty"
    
    def test_skip_links_present(self):
        """Test that skip navigation links are present."""
        skip_links = self.soup.find_all('a', class_='skip-link')
        assert len(skip_links) >= 3, "Should have at least 3 skip links"
        
        # Check skip link targets
        expected_targets = ['#main-content', '#search-form', '#search-results-container']
        actual_targets = [link.get('href') for link in skip_links]
        for target in expected_targets:
            assert target in actual_targets, f"Missing skip link to {target}"
    
    def test_heading_hierarchy(self):
        """Test that headings follow proper hierarchy."""
        headings = self.soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        
        # Track heading levels
        prev_level = 0
        for heading in headings:
            level = int(heading.name[1])
            # Allow skipping from h3 to h1 (new section), but not h1 to h3
            if prev_level > 0 and level > prev_level + 1:
                assert False, f"Heading hierarchy broken: {heading.name} follows h{prev_level}"
            prev_level = level
    
    def test_images_have_alt_text(self):
        """Test that all images have alt attributes."""
        images = self.soup.find_all('img')
        for img in images:
            assert img.get('alt') is not None, f"Image missing alt attribute: {img.get('src', 'unknown')}"
    
    def test_form_labels(self):
        """Test that all form inputs have associated labels."""
        inputs = self.soup.find_all(['input', 'select', 'textarea'])
        
        for inp in inputs:
            input_type = inp.get('type', 'text')
            # Skip hidden inputs
            if input_type == 'hidden':
                continue
                
            input_id = inp.get('id')
            
            # Check for label
            if input_id:
                label = self.soup.find('label', {'for': input_id})
                if not label:
                    # Check if input has aria-label or aria-labelledby
                    aria_label = inp.get('aria-label') or inp.get('aria-labelledby')
                    assert aria_label is not None, f"Input #{input_id} missing label or aria-label"
            else:
                # Input without ID should have aria-label
                aria_label = inp.get('aria-label')
                assert aria_label is not None, f"Input without ID missing aria-label"
    
    def test_aria_attributes(self):
        """Test that ARIA attributes are properly used."""
        # Test aria-label and aria-labelledby
        elements_with_aria = self.soup.find_all(attrs={'aria-label': True})
        elements_with_aria.extend(self.soup.find_all(attrs={'aria-labelledby': True}))
        
        assert len(elements_with_aria) > 0, "No elements with aria-label or aria-labelledby found"
        
        # Test dropdowns have proper ARIA
        dropdowns = self.soup.find_all('button', class_='dropdown-toggle')
        for dropdown in dropdowns:
            assert dropdown.get('aria-expanded') is not None, "Dropdown missing aria-expanded"
            assert dropdown.get('aria-haspopup') == 'true', "Dropdown missing aria-haspopup"
    
    def test_buttons_have_accessible_names(self):
        """Test that all buttons have accessible names."""
        buttons = self.soup.find_all('button')
        
        for button in buttons:
            # Check for text content
            text_content = button.get_text(strip=True)
            aria_label = button.get('aria-label')
            title = button.get('title')
            
            assert text_content or aria_label or title, \
                f"Button missing accessible name: {button}"
    
    def test_navigation_landmarks(self):
        """Test that proper landmark roles are used."""
        # Check for main landmark
        main = self.soup.find(['main', '[role="main"]'])
        assert main is not None, "Page missing main landmark"
        
        # Check for navigation landmark
        nav = self.soup.find(['nav', '[role="navigation"]'])
        assert nav is not None, "Page missing navigation landmark"
        
        # Check for banner (header)
        banner = self.soup.find('[role="banner"]')
        assert banner is not None, "Page missing banner landmark"
        
        # Check for contentinfo (footer)
        footer = self.soup.find(['footer', '[role="contentinfo"]'])
        assert footer is not None, "Page missing contentinfo landmark"
    
    def test_modal_accessibility(self):
        """Test that modals have proper accessibility attributes."""
        modals = self.soup.find_all(class_='modal')
        
        for modal in modals:
            # Check for role
            assert modal.get('role') == 'dialog', "Modal missing role='dialog'"
            
            # Check for aria-modal
            assert modal.get('aria-modal') == 'true', "Modal missing aria-modal='true'"
            
            # Check for aria-labelledby
            assert modal.get('aria-labelledby') is not None, "Modal missing aria-labelledby"
            
            # Check that close button has accessible label
            close_button = modal.find('button', class_='btn-close')
            if close_button:
                assert close_button.get('aria-label') is not None, \
                    "Modal close button missing aria-label"
    
    def test_form_required_fields(self):
        """Test that required fields are properly marked."""
        required_inputs = self.soup.find_all(['input', 'select', 'textarea'], required=True)
        
        for inp in required_inputs:
            # Should have aria-required
            aria_required = inp.get('aria-required')
            assert aria_required == 'true' or inp.get('required') is not None, \
                f"Required field missing proper marking: {inp.get('id', 'unknown')}"
    
    def test_live_regions(self):
        """Test that live regions are properly configured."""
        # Check for results announcement region
        results_announcement = self.soup.find(id='results-announcement')
        assert results_announcement is not None, "Results announcement region missing"
        assert results_announcement.get('aria-live') == 'polite', \
            "Results announcement should have aria-live='polite'"
        
        # Check for time displays have aria-live
        time_displays = ['start-time-result', 'end-time-result']
        for display_id in time_displays:
            element = self.soup.find(id=display_id)
            assert element is not None, f"Time display #{display_id} not found"
            assert element.get('aria-live') == 'polite', \
                f"Time display #{display_id} missing aria-live"
    
    def test_focus_indicators_css(self):
        """Test that CSS includes focus indicators."""
        css_path = Path(__file__).parent.parent / "css" / "accessibility.css"
        assert css_path.exists(), "accessibility.css file not found"
        
        with open(css_path, 'r', encoding='utf-8') as f:
            css_content = f.read()
        
        # Check for focus styles
        assert '*:focus' in css_content, "Missing universal focus styles"
        assert 'outline:' in css_content, "Missing outline styles for focus"
        assert 'outline-offset:' in css_content, "Missing outline-offset for focus"
    
    def test_color_contrast_classes(self):
        """Test that proper color contrast classes are defined."""
        css_path = Path(__file__).parent.parent / "css" / "accessibility.css"
        with open(css_path, 'r', encoding='utf-8') as f:
            css_content = f.read()
        
        # Check for high contrast support
        assert '@media (prefers-contrast: high)' in css_content, \
            "Missing high contrast media query"
    
    def test_reduced_motion_support(self):
        """Test that reduced motion preferences are respected."""
        css_path = Path(__file__).parent.parent / "css" / "accessibility.css"
        with open(css_path, 'r', encoding='utf-8') as f:
            css_content = f.read()
        
        assert '@media (prefers-reduced-motion: reduce)' in css_content, \
            "Missing reduced motion support"


class TestKeyboardNavigation:
    """Test keyboard navigation functionality."""
    
    def setup_method(self):
        """Load JavaScript files for testing."""
        js_path = Path(__file__).parent.parent / "js" / "accessibility-enhancements.js"
        with open(js_path, 'r', encoding='utf-8') as f:
            self.js_content = f.read()
    
    def test_keyboard_shortcuts_defined(self):
        """Test that keyboard shortcuts are defined."""
        shortcuts = [
            'Alt+S',  # Search
            'Alt+F',  # Filters
            'Alt+R',  # Reset
            'Alt+N',  # Next page
            'Alt+P',  # Previous page
        ]
        
        for shortcut in shortcuts:
            assert f"'{shortcut}'" in self.js_content, \
                f"Keyboard shortcut {shortcut} not defined"
    
    def test_escape_key_handling(self):
        """Test that Escape key is handled for closing elements."""
        assert 'ESCAPE' in self.js_content, "Escape key constant not defined"
        assert "case KEYS.ESCAPE:" in self.js_content, "Escape key handling not implemented"
    
    def test_arrow_key_navigation(self):
        """Test that arrow keys are handled for navigation."""
        arrow_keys = ['ARROW_UP', 'ARROW_DOWN', 'ARROW_LEFT', 'ARROW_RIGHT']
        
        for key in arrow_keys:
            assert key in self.js_content, f"{key} constant not defined"
    
    def test_focus_trap_implementation(self):
        """Test that focus trap is implemented for modals."""
        assert 'trapFocus' in self.js_content, "Focus trap function not defined"
        assert 'removeFocusTrap' in self.js_content, "Remove focus trap function not defined"
        assert 'getFocusableElements' in self.js_content, \
            "Get focusable elements function not defined"


class TestFormValidation:
    """Test form validation and error handling."""
    
    def setup_method(self):
        """Load JavaScript for testing."""
        js_path = Path(__file__).parent.parent / "js" / "accessibility-enhancements.js"
        with open(js_path, 'r', encoding='utf-8') as f:
            self.js_content = f.read()
    
    def test_validation_functions_exist(self):
        """Test that validation functions are defined."""
        functions = ['validateInput', 'showError', 'clearError']
        
        for func in functions:
            assert f'function {func}' in self.js_content, \
                f"Validation function {func} not defined"
    
    def test_error_announcement(self):
        """Test that errors are announced to screen readers."""
        assert "announce(message, 'assertive')" in self.js_content, \
            "Errors not announced with assertive priority"
    
    def test_aria_invalid_handling(self):
        """Test that aria-invalid is properly set."""
        assert "setAttribute('aria-invalid', 'true')" in self.js_content, \
            "aria-invalid not set to true on error"
        assert "setAttribute('aria-invalid', 'false')" in self.js_content, \
            "aria-invalid not cleared on success"


class TestScreenReaderSupport:
    """Test screen reader support features."""
    
    def setup_method(self):
        """Load files for testing."""
        html_path = Path(__file__).parent.parent / "index.html"
        with open(html_path, 'r', encoding='utf-8') as f:
            self.html_content = f.read()
        self.soup = BeautifulSoup(self.html_content, 'html.parser')
    
    def test_visually_hidden_class(self):
        """Test that visually-hidden class is used appropriately."""
        visually_hidden = self.soup.find_all(class_='visually-hidden')
        assert len(visually_hidden) > 0, "No visually-hidden elements found"
        
        # Check for help text
        help_texts = self.soup.find_all(id=re.compile(r'.*-help$'))
        for help_text in help_texts:
            assert 'visually-hidden' in help_text.get('class', []), \
                f"Help text {help_text.get('id')} not visually hidden"
    
    def test_aria_describedby_usage(self):
        """Test that aria-describedby is used for additional context."""
        elements_with_describedby = self.soup.find_all(attrs={'aria-describedby': True})
        assert len(elements_with_describedby) > 0, "No elements using aria-describedby"
        
        # Verify referenced elements exist
        for element in elements_with_describedby:
            describedby_id = element.get('aria-describedby')
            referenced = self.soup.find(id=describedby_id)
            assert referenced is not None, \
                f"aria-describedby references non-existent element: {describedby_id}"
    
    def test_loading_states(self):
        """Test that loading states are accessible."""
        spinners = self.soup.find_all(class_='spinner-border')
        
        for spinner in spinners:
            assert spinner.get('role') == 'status', "Spinner missing role='status'"
            
            # Check for visually hidden loading text
            sr_text = spinner.find(class_='visually-hidden')
            assert sr_text is not None, "Spinner missing screen reader text"
            assert sr_text.text.strip() != "", "Spinner screen reader text is empty"


class TestResponsiveAccessibility:
    """Test accessibility in responsive design."""
    
    def setup_method(self):
        """Load CSS for testing."""
        css_path = Path(__file__).parent.parent / "css" / "accessibility.css"
        with open(css_path, 'r', encoding='utf-8') as f:
            self.css_content = f.read()
    
    def test_touch_target_sizes(self):
        """Test that touch targets meet minimum size requirements."""
        # Check for minimum height/width styles
        assert 'min-height: 44px' in self.css_content, \
            "Touch targets missing minimum height"
        assert 'min-width: 44px' in self.css_content, \
            "Touch targets missing minimum width"
    
    def test_print_accessibility(self):
        """Test that print styles maintain accessibility."""
        assert '@media print' in self.css_content, "Print media query missing"
        
        # Check that hidden content becomes visible in print
        assert '.visually-hidden' in self.css_content and \
               'position: static !important' in self.css_content, \
               "Visually hidden content not made visible for print"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])