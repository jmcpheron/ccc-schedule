/**
 * Rio Hondo College Schedule JavaScript
 * Fetches and displays data from the CCC Schedule Collector repository
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
});

/**
 * Initialize all event handlers
 */
function initializeEventHandlers() {
    // Search form submission
    $('#search-form').on('submit', function(e) {
        e.preventDefault();
        performSearch();
    });
    
    // Search input keyup
    $('#search_input_main').on('keyup', function() {
        if ($(this).val().length !== 1) {
            performSearch();
        }
    });
    
    // Search buttons
    $('#button-search').on('click', function(e) {
        e.preventDefault();
        $('#open-only').prop('checked', false);
        performSearch();
    });
    
    $('#button-search-open').on('click', function(e) {
        e.preventDefault();
        $('#open-only').prop('checked', true);
        performSearch();
    });
    
    // Filter changes
    $('#term-select, #subject-select, #units-min, #units-max').on('change', performSearch);
    $('#open-only, #ztc-only').on('change', performSearch);
    
    // Instructional mode checkboxes
    $('input[name="flexRadioInstrMethod"]').on('change', function() {
        updateDropdownButtonText();
        performSearch();
    });
    
    // Reset filters
    $('#reset-filters').on('click', function() {
        $('#search_input_main').val('');
        $('#subject-select').val('');
        $('#units-min').val('');
        $('#units-max').val('');
        $('#open-only').prop('checked', false);
        $('#ztc-only').prop('checked', false);
        $('input[name="flexRadioInstrMethod"]').prop('checked', false);
        updateDropdownButtonText();
        performSearch();
    });
    
    // View mode toggle
    $('input[name="view-mode"]').on('change', function() {
        displayResults();
    });
}

/**
 * Load initial data from GitHub repository
 */
function loadInitialData() {
    // Show loading status
    $('#data-status').html('<i class="bi bi-arrow-repeat spin"></i> Loading schedule data...');
    
    // Load course data from GitHub repository
    const symlinkUrl = 'https://raw.githubusercontent.com/jmcpheron/ccc-schedule-collector/main/data/schedule_202570_latest.json';
    
    // First, fetch the symlink content to get the actual filename
    $.ajax({
        url: symlinkUrl,
        dataType: 'text'
    })
    .done(function(filename) {
        // Trim whitespace and construct the actual data URL
        const actualFilename = filename.trim();
        const liveDataUrl = `https://raw.githubusercontent.com/jmcpheron/ccc-schedule-collector/main/data/${actualFilename}`;
        
        // Now fetch the actual data
        $.getJSON(liveDataUrl)
        .done(function(data) {
            if (data.courses && Array.isArray(data.courses)) {
                // Handle the direct courses array format
                const courseMap = new Map();
                
                // Group sections by course
                data.courses.forEach(section => {
                    const courseKey = `${section.subject}_${section.course_number}`;
                    
                    if (!courseMap.has(courseKey)) {
                        courseMap.set(courseKey, {
                            subject: section.subject,
                            courseNumber: section.course_number,
                            courseId: section.course_id,
                            title: section.title,
                            units: section.units,
                            description: section.description,
                            sections: []
                        });
                    }
                    
                    courseMap.get(courseKey).sections.push({
                        crn: section.crn,
                        status: section.status || 'Open',
                        instructionMode: section.instruction_mode || 'TBA',
                        instructor: section.instructor || 'TBA',
                        instructorEmail: section.instructor_email || null,
                        enrolled: section.enrollment ? section.enrollment.actual : 0,
                        capacity: section.enrollment ? section.enrollment.capacity : 0,
                        available: section.enrollment ? section.enrollment.remaining : 0,
                        meetings: section.meeting_times || [],
                        startDate: section.start_date || null,
                        endDate: section.end_date || null,
                        textbookCost: section.zero_textbook_cost ? 'ZTC' : ''
                    });
                });
                
                allCourses = Array.from(courseMap.values());
                
                // Update data status with metadata
                if (data.metadata) {
                    const collectedDate = data.metadata.collected_at ? 
                        new Date(data.metadata.collected_at).toLocaleString() : 
                        'Unknown';
                    const courseCount = allCourses.length;
                    $('#data-status').html(
                        `<i class="bi bi-check-circle text-success"></i> Data loaded | ` +
                        `Last updated: ${collectedDate} | ${courseCount} courses available`
                    );
                } else if (data.collection_timestamp) {
                    // Handle the new format with collection_timestamp at root level
                    const collectedDate = new Date(data.collection_timestamp).toLocaleString();
                    const sectionCount = data.courses.length;
                    const courseCount = allCourses.length;
                    $('#data-status').html(
                        `<i class="bi bi-check-circle text-success"></i> Data loaded | ` +
                        `Last updated: ${collectedDate} | ${courseCount} courses with ${sectionCount} sections`
                    );
                } else {
                    $('#data-status').html(
                        `<i class="bi bi-check-circle text-success"></i> Data loaded | ${allCourses.length} courses available`
                    );
                }
            } else if (data.schedule && data.schedule.courses) {
                // Handle standardized format (fallback)
                allCourses = data.schedule.courses.map(course => ({
                    subject: course.subject,
                    courseNumber: course.course_number,
                    courseId: course.course_id,
                    title: course.title,
                    units: course.units,
                    description: course.description,
                    sections: course.sections.map(section => ({
                        crn: section.crn,
                        status: section.status,
                        instructionMode: section.instruction_mode,
                        instructor: section.instructor ? section.instructor.name : 'TBA',
                        instructorEmail: section.instructor ? section.instructor.email : null,
                        enrolled: section.enrollment.enrolled,
                        capacity: section.enrollment.capacity,
                        available: section.enrollment.available,
                        meetings: section.meetings,
                        startDate: section.dates.start,
                        endDate: section.dates.end,
                        textbookCost: section.fees && section.fees.zero_textbook_cost ? 'ZTC' : ''
                    }))
                }));
                
                populateDropdowns();
                $('#loading-spinner').hide();
                $('#results-container').show();
                performSearch();
            } else {
                throw new Error('Unexpected data format');
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Failed to load data:', textStatus, errorThrown);
            $('#loading-spinner').html(
                '<div class="alert alert-danger">' +
                '<h5><i class="bi bi-exclamation-triangle-fill"></i> Failed to Load Schedule Data</h5>' +
                '<p>Unable to fetch schedule data from the repository.</p>' +
                '<p class="mb-2">Error: ' + (errorThrown || textStatus) + '</p>' +
                '<a href="../rio-hondo/" class="btn btn-primary btn-sm">View Cached Version</a>' +
                '</div>'
            );
            $('#data-status').html(
                '<i class="bi bi-x-circle text-danger"></i> Data unavailable'
            );
        });
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to fetch symlink:', textStatus, errorThrown);
        $('#loading-spinner').html(
            '<div class="alert alert-danger">' +
            '<h5><i class="bi bi-exclamation-triangle-fill"></i> Failed to Load Schedule Data</h5>' +
            '<p>Unable to fetch schedule data from the repository.</p>' +
            '<p class="mb-2">Error: ' + (errorThrown || textStatus) + '</p>' +
            '<a href="../rio-hondo/" class="btn btn-primary btn-sm">View Cached Version</a>' +
            '</div>'
        );
        $('#data-status').html(
            '<i class="bi bi-x-circle text-danger"></i> Data unavailable'
        );
    });
}

/**
 * Populate dropdown options
 */
function populateDropdowns() {
    const subjects = [...new Set(allCourses.map(c => c.subject).filter(Boolean))];
    
    // Populate subject dropdown
    $('#subject-select').empty().append('<option value="">All Subjects</option>');
    subjects.sort().forEach(subject => {
        $('#subject-select').append(`<option value="${subject}">${subject}</option>`);
    });
}

/**
 * Update instructional mode dropdown button text
 */
function updateDropdownButtonText() {
    const checked = $('input[name="flexRadioInstrMethod"]:checked');
    if (checked.length === 0) {
        $('#instr-method-button').text('All Modes');
    } else if (checked.length === 1) {
        $('#instr-method-button').text(checked.next('label').text().trim());
    } else {
        $('#instr-method-button').text(`${checked.length} selected`);
    }
}

/**
 * Perform search with all filters
 */
function performSearch() {
    const searchTerm = $('#search_input_main').val().toLowerCase();
    const selectedSubject = $('#subject-select').val();
    const minUnits = parseFloat($('#units-min').val()) || 0;
    const maxUnits = parseFloat($('#units-max').val()) || 999;
    const openOnly = $('#open-only').is(':checked');
    const ztcOnly = $('#ztc-only').is(':checked');
    
    const selectedModes = [];
    $('input[name="flexRadioInstrMethod"]:checked').each(function() {
        selectedModes.push($(this).val());
    });
    
    // Filter courses
    filteredCourses = allCourses.filter(course => {
        // Search term filter
        if (searchTerm) {
            const matchesSearch = 
                (course.subject && course.subject.toLowerCase().includes(searchTerm)) ||
                (course.courseNumber && course.courseNumber.toLowerCase().includes(searchTerm)) ||
                (course.title && course.title.toLowerCase().includes(searchTerm)) ||
                (course.description && course.description.toLowerCase().includes(searchTerm)) ||
                (course.sections && course.sections.some(s => s.crn && s.crn.includes(searchTerm)));
            
            if (!matchesSearch) return false;
        }
        
        // Subject filter
        if (selectedSubject && course.subject !== selectedSubject) return false;
        
        // Units filter
        if (course.units < minUnits || course.units > maxUnits) return false;
        
        // Section-based filters
        const hasMatchingSection = course.sections.some(section => {
            // Open only filter
            if (openOnly && section.status !== 'Open') return false;
            
            // ZTC filter
            if (ztcOnly && section.textbookCost !== 'ZTC') return false;
            
            // Instructional mode filter
            if (selectedModes.length > 0) {
                const modeMap = {
                    'In Person': ['INP', 'F2F'],
                    'Hybrid': ['HYB'],
                    'Online': ['ONL', 'AON', 'SON'],
                    'Arranged': ['ARR']
                };
                
                let matchesMode = false;
                for (const mode of selectedModes) {
                    if (modeMap[mode] && modeMap[mode].includes(section.instructionMode)) {
                        matchesMode = true;
                        break;
                    }
                }
                if (!matchesMode) return false;
            }
            
            return true;
        });
        
        return hasMatchingSection;
    });
    
    // Reset to first page
    currentPage = 1;
    
    // Display results
    displayResults();
}

/**
 * Display search results
 */
function displayResults() {
    const start = (currentPage - 1) * resultsPerPage;
    const end = start + resultsPerPage;
    const pageResults = filteredCourses.slice(start, end);
    
    // Update result count
    $('#result-count').text(`${filteredCourses.length} courses found`);
    
    // Show/hide no results message
    if (filteredCourses.length === 0) {
        $('#no-results').show();
        $('#card-view-container').hide();
        $('#table-view-container').hide();
        $('#pagination').hide();
    } else {
        $('#no-results').hide();
        if ($('#card-view').is(':checked')) {
            $('#card-view-container').show();
            $('#table-view-container').hide();
        } else {
            $('#card-view-container').hide();
            $('#table-view-container').show();
        }
        $('#pagination').show();
    }
    
    // Clear previous results
    $('#card-view-container').empty();
    $('#table-body').empty();
    
    // Display courses
    pageResults.forEach(course => {
        if ($('#card-view').is(':checked')) {
            displayCourseCard(course);
        } else {
            displayCourseTableRows(course);
        }
    });
    
    // Update pagination
    updatePagination();
}

/**
 * Display course as card
 */
function displayCourseCard(course) {
    const courseCard = $('<div class="col-12 mb-3">');
    const card = $('<div class="card">');
    
    // Card header
    const header = $(`
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">${course.subject} ${course.courseNumber}: ${course.title}</h5>
            <small>${course.units} Units</small>
        </div>
    `);
    
    // Card body
    const body = $('<div class="card-body">');
    
    if (course.description) {
        body.append(`<p class="card-text">${course.description}</p>`);
    }
    
    // Sections table
    const sectionsTable = $(`
        <table class="table table-sm mb-0">
            <thead>
                <tr>
                    <th>CRN</th>
                    <th>Instructor</th>
                    <th>Days/Times</th>
                    <th>Location</th>
                    <th>Mode</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    `);
    
    course.sections.forEach(section => {
        const meetingInfo = formatMeetingInfo(section.meetings);
        const location = formatLocation(section.meetings);
        const instructorDisplay = section.instructor + 
            (section.instructorEmail && section.instructorEmail !== 'to.be..assigned@riohondo.edu' ? 
                ` <a href="mailto:${section.instructorEmail}" title="Email instructor"><i class="bi bi-envelope-fill"></i></a>` : 
                '');
        
        const row = $(`
            <tr>
                <td>${section.crn}</td>
                <td>${instructorDisplay}</td>
                <td>${meetingInfo}</td>
                <td>${location}</td>
                <td>${formatInstructionMode(section.instructionMode)}</td>
                <td>
                    <span class="badge ${section.status === 'Open' ? 'bg-success' : 'bg-danger'}">
                        ${section.status}
                    </span>
                    ${section.textbookCost === 'ZTC' ? '<span class="badge bg-info ms-1">ZTC</span>' : ''}
                </td>
            </tr>
        `);
        sectionsTable.find('tbody').append(row);
    });
    
    body.append(sectionsTable);
    card.append(header).append(body);
    courseCard.append(card);
    $('#card-view-container').append(courseCard);
}

/**
 * Display course as table rows
 */
function displayCourseTableRows(course) {
    course.sections.forEach(section => {
        const meetingInfo = formatMeetingInfo(section.meetings);
        const location = formatLocation(section.meetings);
        const instructorDisplay = section.instructor + 
            (section.instructorEmail && section.instructorEmail !== 'to.be..assigned@riohondo.edu' ? 
                ` <a href="mailto:${section.instructorEmail}" title="Email instructor"><i class="bi bi-envelope-fill"></i></a>` : 
                '');
        
        const row = $(`
            <tr>
                <td>${section.crn}</td>
                <td>${course.subject} ${course.courseNumber}</td>
                <td>${course.title}</td>
                <td>${instructorDisplay}</td>
                <td>${meetingInfo}</td>
                <td>${location}</td>
                <td>${course.units}</td>
                <td>
                    <span class="badge ${section.status === 'Open' ? 'bg-success' : 'bg-danger'}">
                        ${section.status}
                    </span>
                    ${section.textbookCost === 'ZTC' ? '<span class="badge bg-info ms-1">ZTC</span>' : ''}
                </td>
            </tr>
        `);
        $('#table-body').append(row);
    });
}

/**
 * Format meeting information
 */
function formatMeetingInfo(meetings) {
    if (!meetings || meetings.length === 0) return 'TBA';
    
    const meeting = meetings[0];
    
    // Handle both formats - object with days array or string days
    if (!meeting.days || meeting.days.length === 0 || meeting.is_arranged) {
        return 'Arranged';
    }
    
    const days = Array.isArray(meeting.days) ? meeting.days.join('') : meeting.days;
    const time = meeting.start_time && meeting.end_time ? 
        `${formatTime(meeting.start_time)} - ${formatTime(meeting.end_time)}` : 
        'TBA';
    
    return `${days} ${time}`;
}

/**
 * Format time from 24-hour to 12-hour format
 */
function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayHours}:${minutes} ${period}`;
}

/**
 * Format instruction mode
 */
function formatInstructionMode(mode) {
    const modeMap = {
        'INP': 'In-Person',
        'F2F': 'In-Person',
        'HYB': 'Hybrid',
        'ONL': 'Online',
        'AON': 'Online Async',
        'SON': 'Online Sync',
        'ARR': 'Arranged'
    };
    return modeMap[mode] || mode;
}

/**
 * Format location information
 */
function formatLocation(meetings) {
    if (!meetings || meetings.length === 0) return 'TBA';
    
    const meeting = meetings[0];
    
    // Handle both formats - object with building/room or simple string location
    if (meeting.location) {
        if (typeof meeting.location === 'object') {
            const building = meeting.location.building || 'TBA';
            const room = meeting.location.room || '';
            
            if (building === 'Online' || building === 'TBD') {
                return building;
            }
            
            return room ? `${building} ${room}` : building;
        } else {
            return meeting.location;
        }
    }
    
    return 'TBA';
}

/**
 * Update pagination
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredCourses.length / resultsPerPage);
    
    $('#pagination').empty();
    
    // Previous button
    const prevClass = currentPage === 1 ? 'disabled' : '';
    $('#pagination').append(`
        <li class="page-item ${prevClass}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
        </li>
    `);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const activeClass = i === currentPage ? 'active' : '';
            $('#pagination').append(`
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            $('#pagination').append('<li class="page-item disabled"><span class="page-link">...</span></li>');
        }
    }
    
    // Next button
    const nextClass = currentPage === totalPages ? 'disabled' : '';
    $('#pagination').append(`
        <li class="page-item ${nextClass}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
        </li>
    `);
    
    // Pagination click handlers
    $('#pagination').on('click', 'a.page-link', function(e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        if (page && page !== currentPage && page >= 1 && page <= totalPages) {
            currentPage = page;
            displayResults();
            $('html, body').animate({ scrollTop: $('#results-container').offset().top - 100 }, 300);
        }
    });
}