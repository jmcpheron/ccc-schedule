/**
 * Citrus College Schedule JavaScript
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
    $.getJSON('https://raw.githubusercontent.com/jmcpheron/ccc-schedule-collector/main/data/citrus/schedule_202620_latest.json')
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
        
        // Use the status directly from the data
        let status = course.status || 'OPEN';
        
        // Use delivery method from the data
        let instructionMode = 'ARR';
        if (course.delivery_method) {
            if (course.delivery_method.includes('Online')) {
                instructionMode = 'ONL';
            } else if (course.delivery_method.includes('Hybrid')) {
                instructionMode = 'HYB';
            } else if (course.delivery_method.includes('Person')) {
                instructionMode = 'INP';
            } else if (course.delivery_method === 'Arranged') {
                instructionMode = 'ARR';
            }
        }
        
        // Transform meetings
        const meetings = [];
        if (course.meeting_times && course.meeting_times.length > 0) {
            course.meeting_times.forEach(meeting => {
                meetings.push({
                    days: meeting.days ? (meeting.days === 'ARR' || meeting.days === 'TBA' ? [] : meeting.days.split('')) : [],
                    start_time: meeting.start_time,
                    end_time: meeting.end_time,
                    location: {
                        building: course.location || 'TBA',
                        room: ''
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
            enrolled: course.enrollment?.actual || 0,
            capacity: course.enrollment?.capacity || 0,
            available: course.enrollment?.remaining || 0,
            meetings: meetings,
            startDate: course.start_date,
            endDate: course.end_date,
            textbookCost: course.textbook_cost === 0 || course.zero_textbook_cost ? 'ZTC' : '',
            sectionType: course.section_type || '',
            weeks: course.weeks || '',
            bookLink: course.book_link || ''
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
        // Force Pacific Time for California schools
        const formattedDate = date.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZone: 'America/Los_Angeles',
            timeZoneName: 'short'
        });
        
        // Count total sections (which is what was originally meant by "courses")
        let totalSections = 0;
        allCourses.forEach(course => {
            totalSections += course.sections.length;
        });
        
        // Update the demo notice with the actual collection date and section count
        $('.text-muted:contains("Data collected on")').html(
            `Data collected on: ${formattedDate} | ${totalSections} sections available (${allCourses.length} unique courses)`
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
                (course.sections && course.sections.some(s => 
                    (s.instructor && s.instructor.toLowerCase().includes(searchTerm)) ||
                    (s.sectionType && s.sectionType.toLowerCase().includes(searchTerm))
                )) ||
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
    let filteredSections = 0;
    filteredCourses.forEach(course => {
        filteredSections += course.sections.length;
    });
    $('#result-count').text(`${filteredCourses.length} courses found (${filteredSections} sections)`);
    
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
            const sectionDiv = $('<div class="section-mobile section-clickable mb-3 p-2 border rounded">');
            
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
                (section.instructorEmail && section.instructorEmail !== 'to.be..assigned@riohondo.edu' && section.instructorEmail !== null ? 
                    ` <a href="mailto:${section.instructorEmail}" title="Email" class="email-link"><i class="bi bi-envelope-fill"></i></a>` : 
                    '');
            sectionDiv.append(`<div class="small"><strong>Instructor:</strong> ${instructorDisplay}</div>`);
            
            // Meeting info
            const meetingInfo = formatMeetingInfo(section.meetings);
            const location = formatLocation(section.meetings);
            sectionDiv.append(`<div class="small"><strong>Time:</strong> ${meetingInfo}</div>`);
            sectionDiv.append(`<div class="small"><strong>Location:</strong> ${location}</div>`);
            sectionDiv.append(`<div class="small"><strong>Type:</strong> ${section.sectionType || 'LEC'}</div>`);
            sectionDiv.append(`<div class="small"><strong>Mode:</strong> ${formatInstructionMode(section.instructionMode)}</div>`);
            if (section.weeks) {
                sectionDiv.append(`<div class="small"><strong>Duration:</strong> ${section.weeks} weeks</div>`);
            }
            
            // Add click handler for this section
            sectionDiv.on('click', function(e) {
                if (!$(e.target).closest('.email-link').length) {
                    e.preventDefault();
                    e.stopPropagation();
                    showSectionDetails(course, section);
                }
            });
            
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
                        <th>Type</th>
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
                (section.instructorEmail && section.instructorEmail !== 'to.be..assigned@riohondo.edu' && section.instructorEmail !== null ? 
                    ` <a href="mailto:${section.instructorEmail}" title="Email instructor" class="email-link"><i class="bi bi-envelope-fill"></i></a>` : 
                    '');
            
            const row = $(`
                <tr class="section-clickable">
                    <td>${section.crn}</td>
                    <td>${instructorDisplay}</td>
                    <td>${meetingInfo}</td>
                    <td>${location}</td>
                    <td>${section.sectionType || 'LEC'}</td>
                    <td>${formatInstructionMode(section.instructionMode)}</td>
                    <td>
                        <span class="badge ${section.status === 'Open' ? 'bg-success' : 'bg-danger'}">
                            ${section.status}
                        </span>
                        ${section.textbookCost === 'ZTC' ? '<span class="badge bg-info ms-1">ZTC</span>' : ''}
                    </td>
                </tr>
            `);
            
            // Add click handler for this row
            row.on('click', function(e) {
                if (!$(e.target).closest('.email-link').length) {
                    e.preventDefault();
                    e.stopPropagation();
                    showSectionDetails(course, section);
                }
            });
            
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
                ` <a href="mailto:${section.instructorEmail}" title="Email instructor" class="email-link"><i class="bi bi-envelope-fill"></i></a>` : 
                '');
        
        const row = $(`
            <tr class="section-clickable">
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
        
        // Add click handler
        row.on('click', function(e) {
            // Prevent click on email links from opening modal
            if ($(e.target).closest('.email-link').length === 0) {
                showSectionDetails(course, section);
            }
        });
        
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
    // Citrus data already includes AM/PM format
    return time;
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

/**
 * Show section details in modal
 */
function showSectionDetails(course, section) {
    console.log('showSectionDetails called', course, section);
    
    // Build the modal content
    let modalContent = `
        <div class="container-fluid">
            <div class="row mb-3">
                <div class="col-12">
                    <h4>${course.subject} ${course.courseNumber}: ${course.title}</h4>
                    <p class="text-muted mb-0">${course.units} Units</p>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2">Section Information</h6>
                    <dl class="row">
                        <dt class="col-sm-4">CRN:</dt>
                        <dd class="col-sm-8">${section.crn}</dd>
                        
                        <dt class="col-sm-4">Status:</dt>
                        <dd class="col-sm-8">
                            <span class="badge ${section.status === 'Open' ? 'bg-success' : 'bg-danger'}">
                                ${section.status}
                            </span>
                        </dd>
                        
                        <dt class="col-sm-4">Section Type:</dt>
                        <dd class="col-sm-8">${section.sectionType || 'LEC'}</dd>
                        
                        <dt class="col-sm-4">Enrollment:</dt>
                        <dd class="col-sm-8">${section.enrolled} / ${section.capacity} (${section.available} available)</dd>
                        
                        <dt class="col-sm-4">Instruction Mode:</dt>
                        <dd class="col-sm-8">${formatInstructionMode(section.instructionMode)}</dd>
                        
                        ${section.textbookCost === 'ZTC' ? `
                        <dt class="col-sm-4">Textbook:</dt>
                        <dd class="col-sm-8"><span class="badge bg-info">Zero Textbook Cost</span></dd>
                        ` : ''}
                    </dl>
                </div>
                
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2">Instructor & Schedule</h6>
                    <dl class="row">
                        <dt class="col-sm-4">Instructor:</dt>
                        <dd class="col-sm-8">
                            ${section.instructor}
                            ${section.instructorEmail && section.instructorEmail !== 'to.be..assigned@riohondo.edu' ? 
                                `<br><a href="mailto:${section.instructorEmail}"><i class="bi bi-envelope-fill"></i> ${section.instructorEmail}</a>` : 
                                ''}
                        </dd>
                        
                        <dt class="col-sm-4">Days/Times:</dt>
                        <dd class="col-sm-8">${formatMeetingInfo(section.meetings)}</dd>
                        
                        <dt class="col-sm-4">Location:</dt>
                        <dd class="col-sm-8">${formatLocation(section.meetings)}</dd>
                        
                        ${section.startDate ? `
                        <dt class="col-sm-4">Dates:</dt>
                        <dd class="col-sm-8">${section.startDate} - ${section.endDate}</dd>
                        ` : ''}
                        
                        ${section.weeks ? `
                        <dt class="col-sm-4">Duration:</dt>
                        <dd class="col-sm-8">${section.weeks} weeks</dd>
                        ` : ''}
                        
                        ${section.bookLink ? `
                        <dt class="col-sm-4">Textbook:</dt>
                        <dd class="col-sm-8"><a href="${section.bookLink}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-book"></i> View Book Info</a></dd>
                        ` : ''}
                    </dl>
                </div>
            </div>
            
            ${course.description ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6 class="border-bottom pb-2">Course Description</h6>
                    <p>${course.description}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Update modal title and body
    $('#sectionDetailsModalLabel').text(`${course.subject} ${course.courseNumber} - Section ${section.crn}`);
    $('#sectionDetailsBody').html(modalContent);
    
    // Show the modal
    try {
        const modalElement = document.getElementById('sectionDetailsModal');
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        console.log('Modal shown');
    } catch (error) {
        console.error('Error showing modal:', error);
    }
}