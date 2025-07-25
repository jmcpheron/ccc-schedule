/**
 * Enhanced CCC Schedule JavaScript
 * Implements search, filtering, and display functionality
 */

// Global variables
let allCourses = [];
let filteredCourses = [];
let currentPage = 1;
const resultsPerPage = 20;

// Initialize on document ready
$(document).ready(function() {
    initializeEventHandlers();
    loadInitialData();
    setupTimeSliders();
    setupInstructorSearch();
});

// Make loadCosmicCactusDemo available globally
window.loadCosmicCactusDemo = function() {
    // Show the search form and hide the hero content
    $('#search-form').removeClass('d-none');
    
    // Show the more options section
    const moreOptionsElement = document.getElementById('more-options');
    if (moreOptionsElement && moreOptionsElement.parentElement && moreOptionsElement.parentElement.parentElement) {
        moreOptionsElement.parentElement.parentElement.classList.remove('d-none');
    }
    
    // Load the demo data
    $('#term-select').val('Spring 2025').trigger('change');
    $('#college-select').val('Cosmic Cactus').trigger('change');
    
    // Scroll to search area smoothly
    $('html, body').animate({
        scrollTop: $('#search-form').offset().top - 100
    }, 500);
    
    // Trigger a search to show all Cosmic Cactus courses
    performSearch();
};

/**
 * Initialize all event handlers
 */
function initializeEventHandlers() {
    // Search form submission
    $('#search-form').on('submit', function(e) {
        e.preventDefault();
        performSearch();
    });
    
    // Keyup search functionality - match production behavior
    $('#search_input_main').on('keyup', function() {
        // Only trigger search if length is not 1 (to avoid searching on single character)
        if ($(this).val().length !== 1) {
            performSearch();
        }
    });
    
    // Search buttons
    $('#button-search').on('click', function(e) {
        e.preventDefault();
        $('#button-search-open').removeClass('active');
        $(this).addClass('active');
        performSearch();
    });
    
    $('#button-search-open').on('click', function(e) {
        e.preventDefault();
        $('#button-search').removeClass('active');
        $(this).addClass('active');
        performSearch();
    });
    
    // Dropdown changes
    $('#term-select, #college-select, #subject-select, #credit-select').on('change', function() {
        // Add visual indicator for active filters
        if ($(this).val()) {
            $(this).addClass('has-value');
        } else {
            $(this).removeClass('has-value');
        }
        performSearch();
    });
    
    // Instructional mode checkboxes
    $('input[name="flexRadioInstrMethod"]').on('change', function() {
        updateDropdownButtonText('instr-method-button', 'flexRadioInstrMethod', 'All Modes');
        performSearch();
    });
    
    // Meeting days checkboxes
    $('input[name="flexRadioMeetingDays"]').on('change', function() {
        updateDropdownButtonText('meetingDropdown', 'flexRadioMeetingDays', 'Any Days');
        performSearch();
    });
    
    // Textbook cost checkboxes
    $('input[name="textbookCost"]').on('change', function() {
        updateDropdownButtonText('textbookDropDown', 'textbookCost', 'Any Cost');
        performSearch();
    });
    
    // Time sliders
    $('#start-time, #end-time').on('input', function() {
        updateTimeDisplay($(this));
        performSearch();
    });
    
    // Session length radio buttons
    $('input[name="flexRadioSessions"]').on('change', function() {
        const selected = $(this).next('label').text().trim();
        $('#dropdownMenuButtonSessions').text(selected);
        performSearch();
    });
    
    // Reset filters button
    $('#reset-filters').on('click', function() {
        resetAllFilters();
    });
    
    // Pagination
    $('#results-pagination-previous, #results-pagination-previous-bottom').on('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayResults();
        }
    });
    
    $('#results-pagination-next, #results-pagination-next-bottom').on('click', function() {
        const totalPages = Math.ceil(filteredCourses.length / resultsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayResults();
        }
    });
    
    // Show/hide sections buttons
    $(document).on('click', '[id^="course-"][id$="-sections-show"]', function() {
        const courseId = $(this).attr('id').replace('-sections-show', '');
        $(this).hide();
        $(`#${courseId}-sections-hide`).show();
    });
    
    $(document).on('click', '[id^="course-"][id$="-sections-hide"]', function() {
        const courseId = $(this).attr('id').replace('-sections-hide', '');
        $(this).hide();
        $(`#${courseId}-sections-show`).show();
    });
    
    // Section details modal
    $(document).on('click', '[id^="course-"][id$="-details-button"]', function() {
        const sectionData = $(this).data('section');
        populateSectionDetailsModal(sectionData);
    });
}

/**
 * Load initial data
 */
function loadInitialData() {
    // Get spinner modal instance using Bootstrap 5 API
    let spinnerModal = null;
    const spinnerModalElement = document.getElementById('spinner-modal');
    if (spinnerModalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        try {
            spinnerModal = new bootstrap.Modal(spinnerModalElement);
            
            // Show loading spinner
            spinnerModal.show();
            
            // Set a timeout to hide spinner after 500ms (matching production behavior)
            setTimeout(function() {
                if (spinnerModal) spinnerModal.hide();
            }, 500);
        } catch (e) {
            console.error('Error with spinner modal:', e);
        }
    }
    
    // Load course data
    $.getJSON('data/courses.json')
        .done(function(data) {
            allCourses = data.courses || [];
            populateDropdowns();
            // Ensure spinner is hidden
            if (spinnerModal) spinnerModal.hide();
        })
        .fail(function() {
            // Try loading example data
            $.getJSON('data/example.json')
                .done(function(data) {
                    allCourses = data.courses || [];
                    populateDropdowns();
                    if (spinnerModal) spinnerModal.hide();
                })
                .fail(function() {
                    if (spinnerModal) spinnerModal.hide();
                    alert('Failed to load course data');
                });
        });
}

/**
 * Populate dropdown options from course data
 */
function populateDropdowns() {
    const terms = [...new Set(allCourses.map(c => c.term).filter(Boolean))];
    const colleges = [...new Set(allCourses.map(c => c.college).filter(Boolean))];
    const subjects = [...new Set(allCourses.map(c => c.subj).filter(Boolean))];
    
    // Populate term dropdown
    $('#term-select').empty().append('<option value="">All Terms</option>');
    terms.sort().forEach(term => {
        $('#term-select').append(`<option value="${term}">${term}</option>`);
    });
    
    // Populate college dropdown
    $('#college-select').empty().append('<option value="">All Colleges</option>');
    colleges.sort().forEach(college => {
        $('#college-select').append(`<option value="${college}">${college}</option>`);
    });
    
    // Populate subject dropdown
    $('#subject-select').empty().append('<option value="">All Subjects</option>');
    subjects.sort().forEach(subject => {
        $('#subject-select').append(`<option value="${subject}">${subject}</option>`);
    });
    
    // Populate transfer requirement dropdowns
    populateTransferRequirements();
}

/**
 * Setup time range sliders
 */
function setupTimeSliders() {
    $('#start-time, #end-time').each(function() {
        updateTimeDisplay($(this));
    });
}

/**
 * Update time display for slider
 */
function updateTimeDisplay($slider) {
    const value = parseFloat($slider.val());
    const hours = Math.floor(value);
    const minutes = (value % 1) * 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    
    if ($slider.attr('id') === 'start-time') {
        $('#start-time-result').text(timeString);
    } else {
        $('#end-time-result').text(timeString);
    }
}

/**
 * Setup instructor search autocomplete
 */
function setupInstructorSearch() {
    const instructors = [];
    allCourses.forEach(course => {
        if (course.sections) {
            course.sections.forEach(section => {
                if (section.instructorName && section.instructorEmail) {
                    const instructor = {
                        name: section.instructorName,
                        email: section.instructorEmail
                    };
                    if (!instructors.find(i => i.email === instructor.email)) {
                        instructors.push(instructor);
                    }
                }
            });
        }
    });
    
    $('#instructor-input').on('input', function() {
        const query = $(this).val().toLowerCase();
        
        if (query.length === 0) {
            $('#instructor-input-email').val('');
            $('#instructor-drop-down').hide();
            performSearch();
            return;
        }
        
        const matches = instructors.filter(i => 
            i.name.toLowerCase().includes(query) || 
            i.email.toLowerCase().includes(query)
        );
        
        $('#instructor-drop-down').empty();
        matches.slice(0, 10).forEach(instructor => {
            $('#instructor-drop-down').append(`
                <li class="dropdown-item" data-email="${instructor.email}">
                    ${instructor.name} (${instructor.email})
                </li>
            `);
        });
        
        if (matches.length > 0) {
            $('#instructor-drop-down').addClass('show');
        } else {
            $('#instructor-drop-down').removeClass('show');
        }
        
        // Clear email if no exact match
        const exactMatch = instructors.find(i => 
            i.name.toLowerCase() === query || 
            i.email.toLowerCase() === query
        );
        if (!exactMatch) {
            $('#instructor-input-email').val('');
        }
        
        // Trigger search on typing
        performSearch();
    });
    
    $(document).on('click', '#instructor-drop-down li', function() {
        const email = $(this).data('email');
        const text = $(this).text();
        $('#instructor-input').val(text);
        $('#instructor-input-email').val(email);
        $('#instructor-drop-down').hide();
        performSearch();
    });
}

/**
 * Update dropdown button text based on selections
 */
function updateDropdownButtonText(buttonId, checkboxName, defaultText) {
    const checked = $(`input[name="${checkboxName}"]:checked`);
    const $button = $(`#${buttonId}`);
    
    if (checked.length === 0) {
        $button.text(defaultText).removeClass('has-selection');
    } else if (checked.length === 1) {
        $button.text(checked.first().next('label').text().trim()).addClass('has-selection');
    } else {
        $button.text(`${checked.length} selected`).addClass('has-selection');
    }
}

/**
 * Reset all filters to default state
 */
function resetAllFilters() {
    // Clear search input
    $('#search_input_main').val('');
    
    // Reset dropdowns
    $('#term-select').val('');
    $('#college-select').val('');
    $('#subject-select').val('');
    $('#credit-select').val('');
    
    // Uncheck all instructional methods
    $('input[name="flexRadioInstrMethod"]').prop('checked', false);
    $('#instr-method-button').text('All Modes');
    
    // Uncheck all meeting days
    $('input[name="flexRadioMeetingDays"]').prop('checked', false);
    $('#meetingDropdown').text('Any Days');
    
    // Reset time sliders
    $('#start-time').val('5');
    $('#end-time').val('24');
    updateTimeDisplay($('#start-time'));
    updateTimeDisplay($('#end-time'));
    
    // Uncheck all textbook costs
    $('input[name="textbookCost"]').prop('checked', false);
    $('#textbookDropDown').text('Any Cost');
    
    // Reset session length
    $('input[name="flexRadioSessions"]').prop('checked', false);
    $('#dropdownMenuButtonSessions').text('Any Length');
    
    // Clear instructor
    $('#instructor-input').val('');
    $('#instructor-input-email').val('');
    $('#instructor-drop-down').removeClass('show');
    
    // Reset buttons
    $('#button-search').addClass('active');
    $('#button-search-open').removeClass('active');
    
    // Reset GE requirement dropdowns (if any are selected)
    $('#dropdownMenuButtonCSUGE').text('Any');
    $('#dropdownMenuButtonIGETC').text('Any');
    $('#dropdownMenuButtonWVM').text('Any');
    $('#dropdownMenuButtonCALGETC').text('Any');
    
    // Clear any selected GE requirements
    $('input[name="csuge"]').prop('checked', false);
    $('input[name="igetc"]').prop('checked', false);
    $('input[name="wvm"]').prop('checked', false);
    $('input[name="calgetc"]').prop('checked', false);
    
    // Reset visual indicators
    $('.form-select').removeClass('has-value');
    $('.dropdown-toggle').removeClass('has-selection');
    
    // Trigger search to show all results
    performSearch();
    
    // Provide visual feedback
    const $resetBtn = $('#reset-filters');
    const originalHtml = $resetBtn.html();
    $resetBtn.html('<i class="bi bi-check"></i> Reset!').addClass('btn-success').removeClass('btn-outline-secondary');
    setTimeout(() => {
        $resetBtn.html(originalHtml).removeClass('btn-success').addClass('btn-outline-secondary');
    }, 1000);
}

/**
 * Count active filters
 */
function countActiveFilters() {
    let count = 0;
    
    // Count search input
    if ($('#search_input_main').val()) count++;
    
    // Count dropdowns
    if ($('#term-select').val()) count++;
    if ($('#college-select').val()) count++;
    if ($('#subject-select').val()) count++;
    if ($('#credit-select').val()) count++;
    
    // Count checkboxes
    if ($('input[name="flexRadioInstrMethod"]:checked').length > 0) count++;
    if ($('input[name="flexRadioMeetingDays"]:checked').length > 0) count++;
    if ($('input[name="textbookCost"]:checked').length > 0) count++;
    if ($('input[name="flexRadioSessions"]:checked').length > 0) count++;
    
    // Count instructor
    if ($('#instructor-input').val()) count++;
    
    // Count time range (if not default)
    if ($('#start-time').val() !== '5' || $('#end-time').val() !== '24') count++;
    
    // Count if Open Only is active
    if ($('#button-search-open').hasClass('active')) count++;
    
    return count;
}

/**
 * Update reset button to show filter count
 */
function updateResetButton() {
    const count = countActiveFilters();
    const $resetBtn = $('#reset-filters');
    const activeFilters = [];
    
    // Collect active filter names
    if ($('#search_input_main').val()) activeFilters.push('Search');
    if ($('#term-select').val()) activeFilters.push('Term');
    if ($('#college-select').val()) activeFilters.push('College');
    if ($('#subject-select').val()) activeFilters.push('Subject');
    if ($('#credit-select').val()) activeFilters.push('Credit Type');
    if ($('input[name="flexRadioInstrMethod"]:checked').length > 0) activeFilters.push('Mode');
    if ($('input[name="flexRadioMeetingDays"]:checked').length > 0) activeFilters.push('Days');
    if ($('input[name="textbookCost"]:checked').length > 0) activeFilters.push('Textbook');
    if ($('input[name="flexRadioSessions"]:checked').length > 0) activeFilters.push('Length');
    if ($('#instructor-input').val()) activeFilters.push('Instructor');
    if ($('#start-time').val() !== '5' || $('#end-time').val() !== '24') activeFilters.push('Time');
    if ($('#button-search-open').hasClass('active')) activeFilters.push('Open Only');
    
    if (count > 0) {
        $resetBtn.html(`<i class="bi bi-arrow-clockwise"></i> Reset (${count})`);
        $resetBtn.removeClass('btn-outline-secondary').addClass('btn-warning');
        
        // Show filter summary
        $('#active-filters-text').text(activeFilters.join(', '));
        $('#active-filters-summary').show();
    } else {
        $resetBtn.html('<i class="bi bi-arrow-clockwise"></i> Reset');
        $resetBtn.removeClass('btn-warning').addClass('btn-outline-secondary');
        
        // Hide filter summary
        $('#active-filters-summary').hide();
    }
}

/**
 * Perform search with all filters
 */
function performSearch() {
    // Update reset button
    updateResetButton();
    
    // Show search results container
    $('#search-results-container').removeClass('d-none');
    $('#search-results-spinner').show();
    
    // Apply filters
    filteredCourses = allCourses.filter(course => {
        // Search term filter
        const searchTerm = $('#search_input_main').val().toLowerCase();
        if (searchTerm) {
            const matchesSearch = 
                (course.subj && course.subj.toLowerCase().includes(searchTerm)) ||
                (course.crse && course.crse.toLowerCase().includes(searchTerm)) ||
                (course.title && course.title.toLowerCase().includes(searchTerm)) ||
                (course.description && course.description.toLowerCase().includes(searchTerm)) ||
                (course.sections && course.sections.some(section => 
                    (section.instructorName && section.instructorName.toLowerCase().includes(searchTerm)) ||
                    (section.crn && section.crn.toLowerCase().includes(searchTerm))
                ));
            
            if (!matchesSearch) return false;
        }
        
        // Term filter
        const selectedTerm = $('#term-select').val();
        if (selectedTerm && course.term !== selectedTerm) return false;
        
        // College filter
        const selectedCollege = $('#college-select').val();
        if (selectedCollege && course.college !== selectedCollege) return false;
        
        // Subject filter
        const selectedSubject = $('#subject-select').val();
        if (selectedSubject && course.subj !== selectedSubject) return false;
        
        // Credit type filter
        const selectedCredit = $('#credit-select').val();
        if (selectedCredit && course.creditType !== selectedCredit) return false;
        
        // Section-level filters - course must have at least one section that matches all filters
        if (course.sections && course.sections.length > 0) {
            const hasMatchingSection = course.sections.some(section => {
                // Instructional method filter
                const selectedMethods = $('input[name="flexRadioInstrMethod"]:checked').map(function() {
                    return $(this).val();
                }).get();
                if (selectedMethods.length > 0 && !selectedMethods.includes(section.instrMethod)) {
                    return false;
                }
                
                // Meeting days filter
                const selectedDays = $('input[name="flexRadioMeetingDays"]:checked').map(function() {
                    return $(this).val();
                }).get();
                if (selectedDays.length > 0 && section.days) {
                    const sectionDays = section.days.split('');
                    const hasAllDays = selectedDays.every(day => sectionDays.includes(day));
                    if (!hasAllDays) return false;
                }
                
                // Time filter
                const startTimeValue = parseFloat($('#start-time').val());
                const endTimeValue = parseFloat($('#end-time').val());
                if (section.startTime && section.endTime) {
                    const sectionStart = parseFloat(section.startTime.replace(':', '.'));
                    const sectionEnd = parseFloat(section.endTime.replace(':', '.'));
                    if (sectionStart < startTimeValue || sectionEnd > endTimeValue) {
                        return false;
                    }
                }
                
                // Textbook cost filter
                const selectedTextbookCosts = $('input[name="textbookCost"]:checked').map(function() {
                    return $(this).val();
                }).get();
                if (selectedTextbookCosts.length > 0 && section.textbookCost && 
                    !selectedTextbookCosts.includes(section.textbookCost)) {
                    return false;
                }
                
                // Class length filter
                const selectedSession = $('input[name="flexRadioSessions"]:checked').val();
                if (selectedSession && selectedSession !== 'x') {
                    if (selectedSession === '1' && section.length !== 'Full Term') return false;
                    if (selectedSession === 'S' && section.length === 'Full Term') return false;
                }
                
                // Instructor filter
                const instructorEmail = $('#instructor-input-email').val();
                const instructorQuery = $('#instructor-input').val().toLowerCase();
                
                // If email is set, use exact match
                if (instructorEmail && section.instructorEmail !== instructorEmail) {
                    return false;
                }
                
                // If no email but there's a query, do partial match on name
                if (!instructorEmail && instructorQuery && section.instructorName) {
                    if (!section.instructorName.toLowerCase().includes(instructorQuery)) {
                        return false;
                    }
                }
                
                // Enrollment status filter (for "Open Only" button)
                const openOnlyActive = $('#button-search-open').hasClass('active');
                if (openOnlyActive && section.enrollStatus !== 'Open') {
                    return false;
                }
                
                return true;
            });
            
            if (!hasMatchingSection) return false;
        }
        
        return true;
    });
    
    // Reset to first page
    currentPage = 1;
    
    // Display results
    setTimeout(() => {
        $('#search-results-spinner').hide();
        displayResults();
    }, 300);
}

/**
 * Display search results
 */
function displayResults() {
    const start = (currentPage - 1) * resultsPerPage;
    const end = start + resultsPerPage;
    const pageResults = filteredCourses.slice(start, end);
    
    // Update counts
    $('#results-total-count, #results-total-count-bottom').text(filteredCourses.length);
    $('#results-display-count, #results-display-count-bottom').text(
        `${start + 1}-${Math.min(end, filteredCourses.length)}`
    );
    
    // Clear previous results
    $('#class-search-results').empty();
    
    // Display courses
    pageResults.forEach((course, index) => {
        const courseIndex = start + index;
        displayCourse(course, courseIndex);
    });
    
    // Update pagination buttons
    updatePaginationButtons();
}

/**
 * Display a single course
 */
function displayCourse(course, index) {
    const courseId = `course-${index}`;
    const sections = course.sections || [];
    const sectionCount = sections.length;
    const sectionLabel = sectionCount === 1 ? ' Section' : ' Sections';
    
    const courseCard = $(`
        <li>
            <div class="card mb-4 course-card" id="${courseId}-card">
                <div class="card-header bg-primary text-white">
                    <div class="row">
                        <div class="col-9 align-self-start">
                            <h3 class="fs-5 text-white m-auto">
                                <span id="${courseId}-subj">${course.subj || ''}</span>
                                <span id="${courseId}-crse">${course.crse || course.course_id || ''}</span>:
                                <span id="${courseId}-title">${course.title || ''}</span>
                            </h3>
                        </div>
                        <div class="col-3 align-self-end text-end">
                            <span id="${courseId}-units">${course.units || 0} Units</span>
                        </div>
                    </div>
                </div>
                <div class="card-header bg-light text-dark">
                    <div class="row">
                        <div class="col align-self-start">
                            <span id="${courseId}-college">${course.college || 'College'}</span>
                        </div>
                    </div>
                    <div>
                        <span id="${courseId}-description">${course.description || ''}</span>
                    </div>
                </div>
                <div class="p-3">
                    <button id="${courseId}-sections-show" data-bs-toggle="collapse" 
                            data-bs-target="#${courseId}-sections" 
                            class="btn btn-primary bi-caret-down-fill" 
                            aria-expanded="false" 
                            aria-controls="${courseId}-sections">
                        Show Sections
                    </button>
                    <button id="${courseId}-sections-hide" data-bs-toggle="collapse" 
                            data-bs-target="#${courseId}-sections" 
                            class="btn btn-primary bi-caret-up-fill" 
                            aria-expanded="false" 
                            aria-controls="${courseId}-sections" 
                            style="display: none;">
                        Hide Sections
                    </button>
                    <span class="badge bg-success">${sectionCount}${sectionLabel}</span>
                </div>
                <div>
                    <ul class="list-group collapse" id="${courseId}-sections">
                    </ul>
                </div>
            </div>
        </li>
    `);
    
    $('#class-search-results').append(courseCard);
    
    // Add sections if they exist
    if (sections.length > 0) {
        sections.forEach((section, sectionIndex) => {
            displaySection(course, section, courseId, sectionIndex);
        });
    }
}

/**
 * Display a single section
 */
function displaySection(course, section, courseId, sectionIndex) {
    const sectionId = `${courseId}-section-${sectionIndex}`;
    
    const sectionCard = $(`
        <li class="list-group-item section-card" id="${sectionId}-card">
            <div class="card-header bg-light text-dark" id="${sectionId}-card-header">
                <div class="row" id="${sectionId}-row">
                    <div>
                        <h4>Section / CRN: <span id="${sectionId}-crn">${section.crn || 'N/A'}</span></h4>
                    </div>
                    <div class="col-sm">
                        <div>Instructor <span id="${sectionId}-instructors">${section.instructorName || 'TBA'}</span></div>
                    </div>
                    <div class="col-sm">
                        <div>Instructional Mode</div>
                        <div><span id="${sectionId}-mode">${getInstructionalModeLabel(section.instrMethod)}</span></div>
                    </div>
                    <div class="col-sm">
                        <div>Length</div>
                        <div><span id="${sectionId}-length">${section.length || 'Full Term'}</span></div>
                    </div>
                    <div class="col-sm">
                        <div>Availability</div>
                        <div class="position-relative">
                            <span id="${sectionId}-availability-icon">${getAvailabilityIcon(section.enrollStatus)}</span>
                            <span class="ps-1">
                                <span id="${sectionId}-availability">${section.enrollStatus || 'Open'}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-body card-body-meeting" id="${sectionId}-card-body">
                <table class="table">
                    <caption>Meeting Schedule</caption>
                    <thead>
                        <tr>
                            <th scope="col">Location</th>
                            <th scope="col">Dates</th>
                            <th scope="col">Days</th>
                            <th scope="col">Times</th>
                        </tr>
                    </thead>
                    <tbody id="${sectionId}-meeting-table-body">
                        <tr>
                            <td><span id="${sectionId}-meeting-0-room">${section.location || 'TBA'}</span></td>
                            <td><span id="${sectionId}-meeting-0-dates">${section.dates || 'TBA'}</span></td>
                            <td><span id="${sectionId}-meeting-0-days">${formatMeetingDays(section.days)}</span></td>
                            <td><span id="${sectionId}-meeting-0-time">${formatMeetingTime(section.startTime, section.endTime)}</span></td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">
                    <button id="${sectionId}-details-button" 
                            data-bs-toggle="modal" 
                            data-bs-target="#section-details-modal" 
                            class="btn btn-primary" 
                            aria-expanded="false" 
                            aria-controls="section-details-modal"
                            data-section='${JSON.stringify({course, section})}'>
                        Section Details
                    </button>
                </div>
            </div>
        </li>
    `);
    
    $(`#${courseId}-sections`).append(sectionCard);
}

/**
 * Get instructional mode label
 */
function getInstructionalModeLabel(mode) {
    const modes = {
        'INP': 'In-Person',
        'HYB': 'Hybrid',
        'FLX': 'Flexible',
        'AON': 'Asynchronous Online',
        'SON': 'Synchronous Online',
        'TUT': 'Tutorial',
        'WRK': 'Work Experience'
    };
    return modes[mode] || mode || 'TBA';
}

/**
 * Get availability icon
 */
function getAvailabilityIcon(status) {
    if (status === 'Open') {
        return '<i class="bi bi-circle-fill text-success"></i>';
    } else if (status === 'Waitlist') {
        return '<i class="bi bi-circle-fill text-warning"></i>';
    } else {
        return '<i class="bi bi-circle-fill text-danger"></i>';
    }
}

/**
 * Format meeting days
 */
function formatMeetingDays(days) {
    if (!days) return 'TBA';
    
    const dayMap = {
        'M': 'Mon',
        'T': 'Tue',
        'W': 'Wed',
        'R': 'Thu',
        'F': 'Fri',
        'S': 'Sat',
        'U': 'Sun'
    };
    
    return days.split('').map(d => {
        const label = dayMap[d] || d;
        return `<span class="badge bg-secondary badge-${label.toLowerCase()}">${label}</span>`;
    }).join(' ');
}

/**
 * Format meeting time
 */
function formatMeetingTime(startTime, endTime) {
    if (!startTime || !endTime) return 'TBA';
    
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHours = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${displayHours}:${minutes} ${period}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Update pagination buttons
 */
function updatePaginationButtons() {
    const totalPages = Math.ceil(filteredCourses.length / resultsPerPage);
    
    // Previous buttons
    $('#results-pagination-previous, #results-pagination-previous-bottom')
        .prop('disabled', currentPage === 1);
    
    // Next buttons
    $('#results-pagination-next, #results-pagination-next-bottom')
        .prop('disabled', currentPage >= totalPages);
}

/**
 * Populate section details modal
 */
function populateSectionDetailsModal(data) {
    const { course, section } = data;
    
    $('#section-details-college').text(course.college || '');
    $('#section-details-subj').text(course.subj || '');
    $('#section-details-crse').text(course.crse || course.course_id || '');
    $('#section-details-title').text(course.title || '');
    $('#section-details-crn').text(section.crn || 'N/A');
    $('#section-details-units').text(course.units || '0');
    $('#section-details-length').text(section.length || 'Full Term');
    $('#section-details-description').text(course.description || '');
    
    // Instructor information
    $('#section-details-instructors').html(`
        <h5>Instructor</h5>
        <div>${section.instructorName || 'TBA'}</div>
        ${section.instructorEmail ? `<div>${section.instructorEmail}</div>` : ''}
    `);
    
    // Textbook information
    if (section.textbookCost) {
        $('#section-details-bookstore-link').html(`
            <span class="badge ${section.textbookCost === 'ZTC' ? 'bg-success' : 'bg-warning'}">
                ${section.textbookCost}
            </span>
        `);
    } else {
        $('#section-details-bookstore-link').text('Check bookstore for details');
    }
}

/**
 * Populate transfer requirement dropdowns
 */
function populateTransferRequirements() {
    // These would be populated from actual data
    const csugeOptions = ['Area A', 'Area B', 'Area C', 'Area D', 'Area E'];
    const igetcOptions = ['Area 1', 'Area 2', 'Area 3', 'Area 4', 'Area 5'];
    const calgetcOptions = ['Area 1', 'Area 2', 'Area 3', 'Area 4'];
    
    // CSU GE
    $('#csuge-list').empty();
    csugeOptions.forEach((option, index) => {
        $('#csuge-list').append(createDropdownCheckbox('csuge', option, index));
    });
    
    // IGETC
    $('#igetc-list').empty();
    igetcOptions.forEach((option, index) => {
        $('#igetc-list').append(createDropdownCheckbox('igetc', option, index));
    });
    
    // CalGETC
    $('#calgetc-list').empty();
    calgetcOptions.forEach((option, index) => {
        $('#calgetc-list').append(createDropdownCheckbox('calgetc', option, index));
    });
}

/**
 * Create dropdown checkbox item
 */
function createDropdownCheckbox(nameId, label, index) {
    return `
        <li class="dropdown-item">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="${nameId}" value="${label}" id="${nameId}${index}">
                <label class="form-check-label" for="${nameId}${index}">${label}</label>
            </div>
        </li>
    `;
}