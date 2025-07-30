/**
 * CCC Schedule - Accessibility Enhancements
 * Keyboard navigation, screen reader support, and WCAG compliance
 */

(function() {
    'use strict';

    // Constants
    const KEYS = {
        ENTER: 'Enter',
        SPACE: ' ',
        ESCAPE: 'Escape',
        TAB: 'Tab',
        ARROW_UP: 'ArrowUp',
        ARROW_DOWN: 'ArrowDown',
        ARROW_LEFT: 'ArrowLeft',
        ARROW_RIGHT: 'ArrowRight',
        HOME: 'Home',
        END: 'End',
        PAGE_UP: 'PageUp',
        PAGE_DOWN: 'PageDown'
    };

    // Keyboard shortcuts
    const SHORTCUTS = {
        'Alt+S': 'search_input_main',
        'Alt+F': 'more-options',
        'Alt+R': 'reset-filters',
        'Alt+N': 'results-pagination-next',
        'Alt+P': 'results-pagination-previous',
        'Alt+D': 'section-details-modal'
    };

    /**
     * Initialize accessibility enhancements
     */
    function initAccessibility() {
        setupKeyboardShortcuts();
        setupDropdownKeyboardNavigation();
        setupTimeSliderKeyboardNavigation();
        setupModalFocusManagement();
        setupLiveRegions();
        setupFormValidation();
        enhanceSearchResults();
        setupSkipLinks();
    }

    /**
     * Setup global keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            const key = `${e.altKey ? 'Alt+' : ''}${e.key}`;
            
            if (SHORTCUTS[key]) {
                e.preventDefault();
                const element = document.getElementById(SHORTCUTS[key]);
                
                if (element) {
                    if (element.classList.contains('collapse')) {
                        // Toggle collapse
                        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(element);
                        bsCollapse.toggle();
                    } else {
                        // Focus element
                        element.focus();
                        element.click();
                    }
                }
            }
        });
    }

    /**
     * Setup keyboard navigation for dropdown menus
     */
    function setupDropdownKeyboardNavigation() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const button = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            const items = menu ? menu.querySelectorAll('.dropdown-item') : [];
            
            if (!button || !menu) return;
            
            let currentIndex = -1;
            
            // Button keyboard handling
            button.addEventListener('keydown', function(e) {
                switch(e.key) {
                    case KEYS.ARROW_DOWN:
                    case KEYS.ARROW_UP:
                        e.preventDefault();
                        if (!menu.classList.contains('show')) {
                            button.click();
                        }
                        currentIndex = e.key === KEYS.ARROW_DOWN ? 0 : items.length - 1;
                        if (items[currentIndex]) {
                            items[currentIndex].focus();
                        }
                        break;
                }
            });
            
            // Menu items keyboard handling
            items.forEach((item, index) => {
                item.setAttribute('tabindex', '0');
                
                item.addEventListener('keydown', function(e) {
                    switch(e.key) {
                        case KEYS.ARROW_DOWN:
                            e.preventDefault();
                            currentIndex = (index + 1) % items.length;
                            items[currentIndex].focus();
                            break;
                            
                        case KEYS.ARROW_UP:
                            e.preventDefault();
                            currentIndex = (index - 1 + items.length) % items.length;
                            items[currentIndex].focus();
                            break;
                            
                        case KEYS.HOME:
                            e.preventDefault();
                            currentIndex = 0;
                            items[currentIndex].focus();
                            break;
                            
                        case KEYS.END:
                            e.preventDefault();
                            currentIndex = items.length - 1;
                            items[currentIndex].focus();
                            break;
                            
                        case KEYS.ESCAPE:
                            e.preventDefault();
                            button.click();
                            button.focus();
                            break;
                            
                        case KEYS.ENTER:
                        case KEYS.SPACE:
                            e.preventDefault();
                            item.click();
                            break;
                            
                        case KEYS.TAB:
                            if (!e.shiftKey && index === items.length - 1) {
                                button.click();
                            }
                            break;
                    }
                });
            });
        });
    }

    /**
     * Setup keyboard navigation for time sliders
     */
    function setupTimeSliderKeyboardNavigation() {
        const sliders = document.querySelectorAll('input[type="range"]');
        
        sliders.forEach(slider => {
            slider.addEventListener('keydown', function(e) {
                const step = parseFloat(slider.step) || 0.5;
                const min = parseFloat(slider.min);
                const max = parseFloat(slider.max);
                let value = parseFloat(slider.value);
                
                switch(e.key) {
                    case KEYS.ARROW_LEFT:
                    case KEYS.ARROW_DOWN:
                        e.preventDefault();
                        value = Math.max(min, value - step);
                        break;
                        
                    case KEYS.ARROW_RIGHT:
                    case KEYS.ARROW_UP:
                        e.preventDefault();
                        value = Math.min(max, value + step);
                        break;
                        
                    case KEYS.PAGE_DOWN:
                        e.preventDefault();
                        value = Math.max(min, value - (step * 4));
                        break;
                        
                    case KEYS.PAGE_UP:
                        e.preventDefault();
                        value = Math.min(max, value + (step * 4));
                        break;
                        
                    case KEYS.HOME:
                        e.preventDefault();
                        value = min;
                        break;
                        
                    case KEYS.END:
                        e.preventDefault();
                        value = max;
                        break;
                        
                    default:
                        return;
                }
                
                slider.value = value;
                slider.setAttribute('aria-valuenow', value);
                
                // Update display and trigger change event
                const event = new Event('input', { bubbles: true });
                slider.dispatchEvent(event);
                
                // Update aria-valuetext
                updateSliderAriaValueText(slider);
            });
        });
    }

    /**
     * Update slider aria-valuetext
     */
    function updateSliderAriaValueText(slider) {
        const value = parseFloat(slider.value);
        const hours = Math.floor(value);
        const minutes = (value % 1) * 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        
        slider.setAttribute('aria-valuetext', timeString);
    }

    /**
     * Setup focus management for modals
     */
    function setupModalFocusManagement() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            let previousFocus = null;
            
            modal.addEventListener('shown.bs.modal', function() {
                // Store previous focus
                previousFocus = document.activeElement;
                
                // Focus first focusable element
                const focusable = getFocusableElements(modal);
                if (focusable.length > 0) {
                    focusable[0].focus();
                }
                
                // Trap focus
                trapFocus(modal);
            });
            
            modal.addEventListener('hidden.bs.modal', function() {
                // Restore previous focus
                if (previousFocus) {
                    previousFocus.focus();
                }
                
                // Remove focus trap
                removeFocusTrap(modal);
            });
        });
    }

    /**
     * Get focusable elements within a container
     */
    function getFocusableElements(container) {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        return Array.from(container.querySelectorAll(focusableSelectors.join(', ')));
    }

    /**
     * Trap focus within a container
     */
    function trapFocus(container) {
        const focusable = getFocusableElements(container);
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        
        container.addEventListener('keydown', function trapHandler(e) {
            if (e.key !== KEYS.TAB) return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });
        
        // Store handler for removal
        container._focusTrapHandler = trapHandler;
    }

    /**
     * Remove focus trap
     */
    function removeFocusTrap(container) {
        if (container._focusTrapHandler) {
            container.removeEventListener('keydown', container._focusTrapHandler);
            delete container._focusTrapHandler;
        }
    }

    /**
     * Setup live regions for dynamic content
     */
    function setupLiveRegions() {
        // Create announcement container
        const announcer = document.createElement('div');
        announcer.id = 'accessibility-announcer';
        announcer.className = 'visually-hidden';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
        
        // Monitor search results
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.id === 'class-search-results') {
                    const totalCount = document.getElementById('results-total-count');
                    const displayCount = document.getElementById('results-display-count');
                    
                    if (totalCount && displayCount) {
                        announce(`Showing ${displayCount.textContent} of ${totalCount.textContent} courses`);
                    }
                }
            });
        });
        
        const resultsContainer = document.getElementById('class-search-results');
        if (resultsContainer) {
            observer.observe(resultsContainer, { childList: true });
        }
    }

    /**
     * Announce message to screen readers
     */
    function announce(message, priority = 'polite') {
        const announcer = document.getElementById('accessibility-announcer');
        if (announcer) {
            announcer.setAttribute('aria-live', priority);
            announcer.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }

    /**
     * Setup form validation with accessibility
     */
    function setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Add aria-invalid on blur
                input.addEventListener('blur', function() {
                    validateInput(input);
                });
                
                // Remove error on input
                input.addEventListener('input', function() {
                    if (input.classList.contains('is-invalid')) {
                        clearError(input);
                    }
                });
            });
        });
    }

    /**
     * Validate input field
     */
    function validateInput(input) {
        const value = input.value.trim();
        const type = input.type;
        let isValid = true;
        let errorMessage = '';
        
        // Required field validation
        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Type-specific validation
        if (value) {
            switch(type) {
                case 'email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    }
                    break;
                    
                case 'number':
                    const min = parseFloat(input.min);
                    const max = parseFloat(input.max);
                    const num = parseFloat(value);
                    
                    if (isNaN(num)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid number';
                    } else if (!isNaN(min) && num < min) {
                        isValid = false;
                        errorMessage = `Value must be at least ${min}`;
                    } else if (!isNaN(max) && num > max) {
                        isValid = false;
                        errorMessage = `Value must be at most ${max}`;
                    }
                    break;
            }
        }
        
        if (!isValid) {
            showError(input, errorMessage);
        } else {
            clearError(input);
        }
        
        return isValid;
    }

    /**
     * Show error message for input
     */
    function showError(input, message) {
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        
        // Create or update error message
        let errorId = input.id + '-error';
        let errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            input.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        input.setAttribute('aria-describedby', errorId);
        
        // Announce error
        announce(message, 'assertive');
    }

    /**
     * Clear error message
     */
    function clearError(input) {
        input.classList.remove('is-invalid');
        input.setAttribute('aria-invalid', 'false');
        
        const errorId = input.id + '-error';
        const errorElement = document.getElementById(errorId);
        
        if (errorElement) {
            errorElement.remove();
            input.removeAttribute('aria-describedby');
        }
    }

    /**
     * Enhance search results accessibility
     */
    function enhanceSearchResults() {
        // Add keyboard navigation to course cards
        document.addEventListener('click', function(e) {
            if (e.target.matches('[data-bs-toggle="collapse"]')) {
                const expanded = e.target.getAttribute('aria-expanded') === 'true';
                announce(expanded ? 'Course sections collapsed' : 'Course sections expanded');
            }
        });
        
        // Add keyboard event handlers for course cards
        document.addEventListener('keydown', function(e) {
            if (e.target.matches('.course-card')) {
                if (e.key === KEYS.ENTER || e.key === KEYS.SPACE) {
                    e.preventDefault();
                    const showButton = e.target.querySelector('[data-bs-toggle="collapse"]');
                    if (showButton) {
                        showButton.click();
                    }
                }
            }
        });
        
        // Update aria-pressed states
        const searchButtons = document.querySelectorAll('#button-search, #button-search-open');
        searchButtons.forEach(button => {
            button.addEventListener('click', function() {
                searchButtons.forEach(btn => btn.setAttribute('aria-pressed', 'false'));
                button.setAttribute('aria-pressed', 'true');
            });
        });
    }

    /**
     * Setup skip links functionality
     */
    function setupSkipLinks() {
        const skipLinks = document.querySelectorAll('.skip-link');
        
        skipLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    target.scrollIntoView();
                    target.focus();
                    
                    // Ensure target is focusable
                    if (!target.hasAttribute('tabindex')) {
                        target.setAttribute('tabindex', '-1');
                    }
                }
            });
        });
    }

    /**
     * Initialize when DOM is ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessibility);
    } else {
        initAccessibility();
    }
    
    // Export for use in other scripts
    window.AccessibilityEnhancements = {
        announce: announce,
        validateInput: validateInput,
        showError: showError,
        clearError: clearError
    };
})();