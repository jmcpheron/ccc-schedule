# CCC Schedule Workflow Guardrails

## Overview

This document outlines workflow guardrails designed to prevent common user errors, guide users through complex processes, and ensure a smooth experience when using the CCC Schedule application.

## Search Workflow Guardrails

### 1. Intelligent Search Assistance

#### Empty Search Results
**Guardrail**: When search returns no results, provide helpful suggestions
```javascript
// Automatically triggered when results.length === 0
Suggestions displayed:
- "Try searching for a subject code (e.g., 'MATH' or 'CS')"
- "Remove some filters to broaden your search"
- "Check spelling of instructor names"
- Show popular searches or subjects
```

#### Typo Detection
**Guardrail**: Detect and suggest corrections for common typos
```javascript
Common corrections:
- "comp sci" → "CS" (Computer Science)
- "calc" → "MATH" (Calculus courses)
- "bio" → "BIOL" (Biology)
- Fuzzy matching for instructor names
```

#### Search History
**Guardrail**: Maintain recent searches for quick access
- Store last 10 searches locally
- Quick access dropdown below search bar
- Clear history option for privacy

### 2. Filter Conflict Prevention

#### Conflicting Filters
**Guardrail**: Warn when filters conflict
```javascript
Examples:
- Selecting "Asynchronous Online" + specific meeting times
- Choosing "Zero Textbook Cost" for lab courses that require materials
- Setting time range that excludes all selected days
```

#### Smart Filter Ordering
**Guardrail**: Guide users through logical filter progression
1. Term → College → Subject (narrows choices progressively)
2. Disable unavailable options based on previous selections
3. Show count of results next to each filter option

### 3. Search State Management

#### Filter Persistence
**Guardrail**: Remember user preferences
- Save filter state in session storage
- Restore on page refresh
- "Reset Filters" clearly indicated with count of active filters

#### Search Feedback
**Guardrail**: Provide immediate feedback
```javascript
Visual indicators:
- Loading spinner with "Searching..." message
- Result count updates in real-time
- "No changes" message if filters don't affect results
- Highlight which filters are active
```

## Course Selection Workflow Guardrails

### 1. Enrollment Status Clarity

#### Visual Indicators
**Guardrail**: Clear status communication
```
✅ Open (Green) - XX seats available
⚠️ Waitlist (Yellow) - XX on waitlist
❌ Closed (Red) - Class full
```

#### Real-time Updates
**Guardrail**: Warn about stale data
- Show "Last updated: X minutes ago"
- Refresh button for current enrollment
- Warning if data is >1 hour old

### 2. Section Comparison

#### Side-by-Side View
**Guardrail**: Easy comparison of similar sections
- Compare button appears for multiple sections
- Highlights differences (time, instructor, mode)
- Pin sections for comparison across searches

#### Conflict Detection
**Guardrail**: Prevent time conflicts
```javascript
When selecting multiple courses:
- Highlight time conflicts in red
- Show visual schedule grid
- Suggest alternative sections
```

### 3. Registration Readiness

#### Checklist Display
**Guardrail**: Ensure students have needed information
```
Before registration checklist:
✓ CRN copied to clipboard
✓ Prerequisites verified
✓ Time conflicts checked
✓ Registration period confirmed
```

#### Missing Information Alerts
**Guardrail**: Flag incomplete data
- "Instructor TBA" highlighted
- "Room TBA" with note to check back
- Missing textbook information noted

## Data Entry Workflow Guardrails

### 1. Progressive Disclosure

#### Step-by-Step Forms
**Guardrail**: Break complex forms into manageable steps
```
Step 1: Basic Course Info
Step 2: Section Details
Step 3: Meeting Times
Step 4: Enrollment Settings
Step 5: Review & Submit
```

#### Context-Sensitive Help
**Guardrail**: Provide help where needed
- ℹ️ icons next to complex fields
- Tooltips with examples
- Link to detailed documentation

### 2. Real-time Validation

#### Inline Validation
**Guardrail**: Catch errors immediately
```javascript
Field-level validation:
- CRN: Must be 5 digits (auto-pad zeros)
- Time: Suggest AM/PM based on typical class times
- Email: Validate format and suggest domain
- Course ID: Auto-format (cs101 → CS101)
```

#### Smart Defaults
**Guardrail**: Reduce repetitive entry
- Copy from previous section
- Suggest common values
- Auto-fill based on patterns

### 3. Error Prevention

#### Confirmation Dialogs
**Guardrail**: Prevent accidental actions
```javascript
Require confirmation for:
- Deleting courses/sections
- Bulk changes
- Overwriting existing data
- Submitting with warnings
```

#### Undo Functionality
**Guardrail**: Allow error recovery
- Undo last action (Ctrl+Z)
- Revision history for 24 hours
- "Restore previous version" option

## Accessibility Workflow Guardrails

### 1. Keyboard Navigation

#### Focus Management
**Guardrail**: Never trap or lose focus
- Visible focus indicators
- Logical tab order
- Skip links for efficiency
- Focus returns after modal close

#### Shortcut Conflicts
**Guardrail**: Prevent browser shortcut override
- Document all shortcuts
- Avoid common browser shortcuts
- Provide alternative access methods

### 2. Screen Reader Support

#### Dynamic Updates
**Guardrail**: Announce all changes
```javascript
Announcements for:
- Search result updates
- Filter changes
- Error messages
- Success confirmations
```

#### Context Preservation
**Guardrail**: Maintain user orientation
- Announce current location
- Provide breadcrumbs
- Clear section headings

## Mobile Workflow Guardrails

### 1. Touch Interaction

#### Touch Target Size
**Guardrail**: Ensure tappable elements are 44x44px minimum
- Spacing between targets
- Expand small targets' tap area
- Group related actions

#### Gesture Conflicts
**Guardrail**: Avoid conflicting with system gestures
- No swipe actions near edges
- Long-press shows context menu
- Pinch-to-zoom works on schedule grid

### 2. Responsive Design

#### Content Prioritization
**Guardrail**: Show most important info first
```
Mobile hierarchy:
1. Course title and CRN
2. Time and status
3. Instructor
4. Additional details (collapsible)
```

#### Offline Capability
**Guardrail**: Handle connection issues
- Cache recent searches
- Show offline indicator
- Queue actions for when online

## Performance Guardrails

### 1. Search Optimization

#### Debouncing
**Guardrail**: Prevent excessive API calls
- 300ms delay after typing stops
- Cancel pending requests
- Show searching indicator

#### Result Pagination
**Guardrail**: Manage large result sets
- Load 20 results initially
- Infinite scroll or "Load More"
- Jump to page navigation

### 2. Memory Management

#### DOM Optimization
**Guardrail**: Prevent memory leaks
- Remove event listeners
- Clear unused references
- Limit DOM node count

## Implementation Examples

### Search Guardrail Implementation
```javascript
// Detect empty results and show suggestions
function handleSearchResults(results) {
    if (results.length === 0) {
        showSearchSuggestions();
        checkForTypos(searchQuery);
        suggestFilterChanges();
    }
}

// Conflict detection
function validateFilters(filters) {
    if (filters.instructionMode === 'AON' && filters.meetingDays) {
        showWarning('Asynchronous courses don\'t have meeting days');
    }
}
```

### Form Validation Implementation
```javascript
// Real-time CRN validation
function validateCRN(input) {
    const value = input.value;
    if (value.length < 5 && /^\d+$/.test(value)) {
        input.value = value.padStart(5, '0');
        showHelper('CRN padded with zeros');
    }
}

// Time conflict detection
function checkTimeConflicts(newSection, existingSections) {
    const conflicts = existingSections.filter(section => 
        hasTimeOverlap(newSection, section)
    );
    
    if (conflicts.length > 0) {
        highlightConflicts(conflicts);
        suggestAlternatives(newSection);
    }
}
```

### Accessibility Implementation
```javascript
// Announcement system
function announceToScreenReader(message, priority = 'polite') {
    const announcer = document.getElementById('accessibility-announcer');
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
}

// Focus management
function trapFocus(container) {
    const focusableElements = container.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    container.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
}
```

## Testing Guardrails

### 1. Automated Testing
```bash
# Run guardrail tests
uv run pytest tests/test_workflow_guardrails.py -v

# Test accessibility guardrails
uv run pytest tests/test_accessibility.py -v
```

### 2. Manual Testing Checklist
- [ ] Search with typos shows suggestions
- [ ] Conflicting filters show warnings
- [ ] Time conflicts are highlighted
- [ ] Form validation prevents errors
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all changes
- [ ] Mobile touch targets are adequate
- [ ] Performance remains smooth with many results

## Continuous Improvement

### User Feedback Integration
1. Monitor common error patterns
2. Track guardrail effectiveness
3. A/B test new guardrails
4. Regular usability testing

### Metrics to Track
- Error rate reduction
- Task completion time
- User satisfaction scores
- Accessibility compliance
- Performance benchmarks

## Conclusion

These workflow guardrails create a safety net that allows users to explore and use the CCC Schedule system confidently. By preventing errors before they occur and providing clear guidance throughout the user journey, we ensure a positive experience for all users regardless of their technical expertise or abilities.