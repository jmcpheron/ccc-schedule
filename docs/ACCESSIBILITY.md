# CCC Schedule Accessibility Guide

## Overview

The CCC Schedule application is designed to be fully accessible to all users, including those using assistive technologies. This document outlines the accessibility features, keyboard navigation patterns, and guidelines for maintaining accessibility compliance.

## WCAG 2.1 AA Compliance

This application aims to meet WCAG 2.1 AA standards, ensuring:
- All content is perceivable
- All interface components are operable
- Information and UI operation is understandable
- Content is robust enough to work with assistive technologies

## Keyboard Navigation

### Global Navigation
- `Tab` / `Shift+Tab` - Navigate forward/backward through interactive elements
- `Enter` / `Space` - Activate buttons and links
- `Escape` - Close modals, dropdowns, and dismiss notifications
- `Home` / `End` - Jump to first/last item in lists

### Search and Filters
- `Alt+S` - Focus main search input
- `Alt+F` - Toggle advanced filters
- `Alt+R` - Reset all filters
- `Arrow Keys` - Navigate through dropdown options
- `Enter` - Select dropdown option

### Course Results
- `Alt+N` / `Alt+P` - Navigate to next/previous page
- `Arrow Up/Down` - Navigate between course cards
- `Enter` / `Space` - Expand/collapse course sections
- `Alt+D` - Open section details modal

### Dropdown Menus
- `Space` / `Enter` - Open dropdown
- `Arrow Up/Down` - Navigate options
- `Home` / `End` - Jump to first/last option
- `Escape` - Close dropdown
- `Tab` - Close dropdown and move to next element

### Time Range Sliders
- `Arrow Left/Right` - Adjust by 30 minutes
- `Page Up/Down` - Adjust by 2 hours
- `Home` / `End` - Set to minimum/maximum

## Screen Reader Support

### Landmarks and Regions
- Main navigation: `<nav role="navigation" aria-label="Main navigation">`
- Search form: `<form role="search" aria-label="Course search">`
- Results: `<main role="main" aria-label="Search results">`
- Filters: `<aside role="complementary" aria-label="Search filters">`

### Live Regions
- Search results updates: `aria-live="polite"`
- Error messages: `aria-live="assertive"`
- Filter changes: `aria-live="polite"`

### Announcements
- Page changes: "Showing results X to Y of Z"
- Filter updates: "Filters updated. X courses found"
- Section expansion: "Course sections expanded/collapsed"
- Loading states: "Loading search results"

## Form Accessibility

### Labels and Instructions
- All form inputs have associated `<label>` elements
- Required fields marked with `aria-required="true"`
- Help text provided via `aria-describedby`
- Error messages linked with `aria-errormessage`

### Validation
- Real-time validation with clear error messages
- Errors announced to screen readers
- Focus management on validation errors
- Success confirmations for completed actions

## Color and Contrast

### Contrast Ratios
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum
- Focus indicators: 3:1 minimum

### Color Usage
- Color is never the only means of conveying information
- Status indicators use both color and icons/text
- All interactive elements have visible focus indicators

## Focus Management

### Focus Indicators
- Visible focus outlines on all interactive elements
- High contrast focus indicators (minimum 3:1)
- Focus trapped in modal dialogs
- Focus restored after modal close

### Skip Links
- "Skip to main content" link at page start
- "Skip to search" link for quick access
- "Skip to filters" for advanced options

## Dynamic Content

### ARIA Attributes
- `aria-expanded` for collapsible sections
- `aria-selected` for selected options
- `aria-busy` for loading states
- `aria-controls` for element relationships

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced features degrade gracefully
- Loading states clearly communicated

## Mobile Accessibility

### Touch Targets
- Minimum 44x44px touch targets
- Adequate spacing between interactive elements
- Gesture alternatives for all interactions

### Responsive Design
- Content reflows for zoom up to 400%
- No horizontal scrolling at standard zoom
- Text remains readable at all breakpoints

## Testing Accessibility

### Automated Testing
Run accessibility tests with:
```bash
uv run pytest tests/test_accessibility.py -v
```

### Manual Testing Checklist
1. Navigate entire application using only keyboard
2. Test with screen readers (NVDA, JAWS, VoiceOver)
3. Verify color contrast with browser tools
4. Test with 400% zoom
5. Disable CSS and verify content structure
6. Test with voice control software

### Browser Extensions
- axe DevTools
- WAVE (WebAIM)
- Lighthouse (Chrome DevTools)

## Development Guidelines

### Adding New Features
1. Include proper ARIA labels and descriptions
2. Ensure keyboard accessibility
3. Test with screen readers
4. Verify color contrast
5. Add to keyboard shortcut documentation
6. Update accessibility tests

### Common Patterns

#### Accessible Dropdown
```html
<div class="dropdown">
  <button 
    id="dropdown-button"
    aria-haspopup="true"
    aria-expanded="false"
    aria-controls="dropdown-menu">
    Options
  </button>
  <ul 
    id="dropdown-menu"
    role="menu"
    aria-labelledby="dropdown-button">
    <li role="menuitem">Option 1</li>
  </ul>
</div>
```

#### Accessible Modal
```html
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description">
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal content</p>
</div>
```

#### Loading State
```html
<div aria-live="polite" aria-busy="true">
  <span class="visually-hidden">Loading search results</span>
  <div class="spinner" aria-hidden="true"></div>
</div>
```

## Assistive Technology Support

### Screen Readers
- NVDA (Windows) - Fully supported
- JAWS (Windows) - Fully supported  
- VoiceOver (macOS/iOS) - Fully supported
- TalkBack (Android) - Fully supported

### Voice Control
- Dragon NaturallySpeaking - Supported
- Windows Speech Recognition - Supported
- macOS Voice Control - Supported

### Browser Support
- Chrome + ChromeVox
- Firefox + NVDA
- Safari + VoiceOver
- Edge + Narrator

## Reporting Accessibility Issues

If you encounter accessibility barriers:

1. Open an issue on GitHub with the "accessibility" label
2. Include:
   - Description of the barrier
   - Steps to reproduce
   - Assistive technology used
   - Browser and version
   - Expected vs actual behavior

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)