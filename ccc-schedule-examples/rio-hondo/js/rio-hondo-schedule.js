/**
 * Rio Hondo College Schedule JavaScript
 * Handles the specific data structure from the standardized schedule format
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
    
    // Handle window resize to update card display
    let resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if ($('#card-view').is(':checked')) {
                displayResults();
            }
        }, 250);
    });
}

/**
 * Load initial data
 */
function loadInitialData() {
    // Fetch the latest data directly from the JSON file
    $.getJSON('https://raw.githubusercontent.com/jmcpheron/ccc-schedule-collector/main/data/schedule_202570_latest.json')
        .done(function(data) {
            if (data.courses) {
                // Transform the live data to match expected format
                allCourses = transformLiveData(data);
                
                // Update the data collection date in the UI
                updateDataCollectionDate(data.collection_timestamp);
                
                populateDropdowns();
                $('#loading-spinner').hide();
                $('#results-container').show();
                performSearch();
            }
        })
        .fail(function() {
            $('#loading-spinner').html('<div class="alert alert-danger">Failed to load schedule data</div>');
        });
}

/**
 * Transform live data format to expected structure
 */
function transformLiveData(data) {
    // Group courses by subject and course number
    const courseMap = {};
    
    data.courses.forEach(course => {
        const courseKey = `${course.subject}-${course.course_number}`;
        
        if (!courseMap[courseKey]) {
            courseMap[courseKey] = {
                subject: course.subject,
                courseNumber: course.course_number,
                courseId: courseKey,
                title: course.title,
                units: course.units,
                description: '',
                sections: []
            };
        }
        
        // Determine status based on enrollment
        let status = 'Open';
        if (course.enrollment_actual >= course.enrollment_capacity) {
            status = 'Closed';
        } else if (course.waitlist_actual > 0) {
            status = 'Waitlisted';
        }
        
        // Transform instruction mode
        let instructionMode = 'ARR';
        if (course.instruction_mode) {
            if (course.instruction_mode.includes('Online')) {
                instructionMode = 'ONL';
            } else if (course.instruction_mode.includes('Hybrid')) {
                instructionMode = 'HYB';
            } else if (course.instruction_mode.includes('Person') || course.instruction_mode.includes('Campus')) {
                instructionMode = 'INP';
            }
        }
        
        // Transform meetings
        const meetings = [];
        if (course.meeting_times && course.meeting_times.length > 0) {
            course.meeting_times.forEach(meeting => {
                meetings.push({
                    days: meeting.days ? (meeting.days === 'ARR' ? [] : meeting.days.split('')) : [],
                    start_time: meeting.start_time,
                    end_time: meeting.end_time,
                    location: {
                        building: meeting.building || 'TBA',
                        room: meeting.room || ''
                    }
                });
            });
        }
        
        courseMap[courseKey].sections.push({
            crn: course.crn,
            status: status,
            instructionMode: instructionMode,
            instructor: course.instructor || 'TBA',
            instructorEmail: course.instructor_email,
            enrolled: course.enrollment_actual || 0,
            capacity: course.enrollment_capacity || 0,
            available: (course.enrollment_capacity || 0) - (course.enrollment_actual || 0),
            meetings: meetings,
            startDate: course.start_date,
            endDate: course.end_date,
            textbookCost: course.textbook_cost === 0 || course.zero_textbook_cost ? 'ZTC' : ''
        });
    });
    
    return Object.values(courseMap);
}

/**
 * Update data collection date in the UI
 */
function updateDataCollectionDate(timestamp) {
    if (timestamp) {
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Count total sections (which is what was originally meant by "courses")
        let totalSections = 0;
        allCourses.forEach(course => {
            totalSections += course.sections.length;
        });
        
        // Update the demo notice with the actual collection date and section count
        $('.text-muted:contains("Data collected on")').html(
            `Data collected on: ${formattedDate} | ${totalSections} courses available`
        );
    }
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
    const courseCard = $('<div class="col-12">');
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
        body.append(`<p class="card-text small">${course.description}</p>`);
    }
    
    // Check if mobile view
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        // Mobile-friendly section display
        course.sections.forEach(section => {
            const sectionDiv = $('<div class="section-mobile mb-3 p-2 border rounded">');
            
            // CRN and Status on same line
            const headerRow = $('<div class="d-flex justify-content-between align-items-center mb-1">');
            headerRow.append(`<strong>CRN: ${section.crn}</strong>`);
            headerRow.append(`
                <div>
                    <span class="badge ${section.status === 'Open' ? 'bg-success' : 'bg-danger'}">
                        ${section.status}
                    </span>
                    ${section.textbookCost === 'ZTC' ? '<span class="badge bg-info ms-1">ZTC</span>' : ''}
                </div>
            `);
            sectionDiv.append(headerRow);
            
            // Instructor
            const instructorDisplay = section.instructor + 
                (section.instructorEmail && section.instructorEmail !== 'to.be..assigned@riohondo.edu' ? 
                    ` <a href="mailto:${section.instructorEmail}" title="Email"><i class="bi bi-envelope-fill"></i></a>` : 
                    '');
            sectionDiv.append(`<div class="small"><strong>Instructor:</strong> ${instructorDisplay}</div>`);
            
            // Meeting info
            const meetingInfo = formatMeetingInfo(section.meetings);
            const location = formatLocation(section.meetings);
            sectionDiv.append(`<div class="small"><strong>Time:</strong> ${meetingInfo}</div>`);
            sectionDiv.append(`<div class="small"><strong>Location:</strong> ${location}</div>`);
            sectionDiv.append(`<div class="small"><strong>Mode:</strong> ${formatInstructionMode(section.instructionMode)}</div>`);
            
            body.append(sectionDiv);
        });
    } else {
        // Desktop table view
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
    }
    
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
    
    if (!meeting.days || meeting.days.length === 0) {
        return 'Arranged';
    }
    
    const days = meeting.days.join('');
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
    if (!meeting.location) return 'TBA';
    
    const building = meeting.location.building || 'TBA';
    const room = meeting.location.room || '';
    
    if (building === 'Online' || building === 'TBD') {
        return building;
    }
    
    return room ? `${building} ${room}` : building;
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