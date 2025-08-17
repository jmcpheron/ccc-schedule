/**
 * RHE (Rio Hondo Enhanced) Schedule JavaScript
 * Handles the detailed feed format with enhanced course information
 */

// Global variables
let allCourses = [];
let filteredCourses = [];
let currentPage = 1;
const resultsPerPage = 20;
let rawScheduleData = null; // Store the raw data for detailed views

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
 * Load initial data from the detailed feed
 */
function loadInitialData() {
    // Fetch the detailed data directly from the new feed
    $.getJSON('https://raw.githubusercontent.com/jmcpheron/ccc-schedule-collector/refs/heads/main/data/rio-hondo/schedule_detailed_202570_20250817_064204.json')
        .done(function(data) {
            if (data.courses) {
                rawScheduleData = data; // Store raw data for detailed views
                
                // Transform the detailed data to match expected format
                allCourses = transformDetailedData(data);
                
                // Update the data collection date in the UI
                updateDataCollectionDate(data.collection_timestamp);
                
                populateDropdowns();
                $('#loading-spinner').hide();
                $('#results-container').show();
                performSearch();
            }
        })
        .fail(function() {
            $('#loading-spinner').html('<div class="alert alert-danger">Failed to load detailed schedule data</div>');
        });
}

/**
 * Transform detailed feed data to expected structure
 */
function transformDetailedData(data) {
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
                description: course.description || '',
                prerequisites: course.prerequisites || '',
                advisory: course.advisory || '',
                transfersTo: course.transfers_to || '',
                sections: []
            };
        }
        
        // Use the status directly from the data
        let status = course.status || 'OPEN';
        
        // Map delivery method to instruction mode
        let instructionMode = 'ARR';
        if (course.delivery_method) {
            if (course.delivery_method.includes('Online SYNC')) {
                instructionMode = 'ONL';
            } else if (course.delivery_method.includes('Online')) {
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
        
        // Create enhanced section object with detailed data
        const section = {
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
            textbookCost: course.zero_textbook_cost ? 'ZTC' : '',
            // Enhanced fields from detailed feed
            deliveryMethod: course.delivery_method,
            weeks: course.weeks,
            additionalHours: course.additional_hours,
            bookLink: course.book_link,
            syllabusLink: course.syllabus_link,
            criticalDates: course.critical_dates || {},
            seatingDetail: course.seating_detail || {},
            detailFetchedAt: course.detail_fetched_at,
            sectionType: course.section_type,
            instructionalMethod: course.instructional_method,
            sectionCorequisites: course.section_corequisites,
            formerCourseNumber: course.former_course_number
        };
        
        courseMap[courseKey].sections.push(section);
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
        $('#data-collection-info').html(
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
        // Search term filter - now includes prerequisites and description
        if (searchTerm) {
            const matchesSearch = 
                (course.subject && course.subject.toLowerCase().includes(searchTerm)) ||
                (course.courseNumber && course.courseNumber.toLowerCase().includes(searchTerm)) ||
                (course.title && course.title.toLowerCase().includes(searchTerm)) ||
                (course.description && course.description.toLowerCase().includes(searchTerm)) ||
                (course.prerequisites && course.prerequisites.toLowerCase().includes(searchTerm)) ||
                (course.advisory && course.advisory.toLowerCase().includes(searchTerm)) ||
                (course.sections && course.sections.some(s => s.crn && s.crn.includes(searchTerm)));
            
            if (!matchesSearch) return false;
        }
        
        // Subject filter
        if (selectedSubject && course.subject !== selectedSubject) return false;
        
        // Units filter
        if (course.units < minUnits || course.units > maxUnits) return false;
        
        // Section-based filters
        const hasMatchingSection = course.sections.some(section => {
            // Open only filter (case-insensitive check)
            if (openOnly && section.status.toLowerCase() !== 'open') return false;
            
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
    
    currentPage = 1;
    displayResults();
}

/**
 * Display search results
 */
function displayResults() {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const coursesToShow = filteredCourses.slice(startIndex, endIndex);
    
    // Update result count
    $('#result-count').text(`${filteredCourses.length} courses found`);
    
    // Show/hide no results message
    if (filteredCourses.length === 0) {
        $('#no-results').show();
        $('#card-view-container').empty();
        $('#table-body').empty();
        $('#pagination').empty();
        return;
    } else {
        $('#no-results').hide();
    }
    
    // Display based on selected view mode
    if ($('#card-view').is(':checked')) {
        displayCardView(coursesToShow);
        $('#card-view-container').show();
        $('#table-view-container').hide();
    } else {
        displayTableView(coursesToShow);
        $('#card-view-container').hide();
        $('#table-view-container').show();
    }
    
    // Update pagination
    updatePagination();
}

/**
 * Display results in card view
 */
function displayCardView(courses) {
    let html = '';
    
    courses.forEach(course => {
        // Check if any section has enhanced data
        const hasEnhancedData = course.sections.some(s => s.criticalDates && Object.keys(s.criticalDates).length > 0);
        
        html += `
            <div class="col-lg-6 col-xl-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title mb-1">${course.subject} ${course.courseNumber}</h5>
                        <p class="card-text mb-0 text-muted">${course.title}</p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="badge bg-primary">${course.units} units</span>
                            ${hasEnhancedData ? '<span class="badge bg-info"><i class="bi bi-info-circle"></i> Enhanced</span>' : ''}
                        </div>
                    </div>
                    <div class="card-body">
                        ${course.description ? `<p class="card-text small text-muted">${course.description.substring(0, 150)}${course.description.length > 150 ? '...' : ''}</p>` : ''}
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>CRN</th>
                                        <th>Instructor</th>
                                        <th>Days/Times</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>`;
        
        course.sections.forEach(section => {
            const daysTimesList = section.meetings.map(meeting => {
                if (meeting.days.length === 0) {
                    return 'ARR';
                }
                const daysStr = meeting.days.join('');
                if (meeting.start_time && meeting.end_time) {
                    return `${daysStr} ${meeting.start_time}-${meeting.end_time}`;
                }
                return daysStr;
            }).join('<br>');
            
            const statusBadge = getStatusBadge(section.status);
            const ztcBadge = section.textbookCost === 'ZTC' ? ' <span class="badge badge-ztc">ZTC</span>' : '';
            
            html += `
                <tr class="section-clickable" onclick="showSectionDetails('${section.crn}')">
                    <td>${section.crn}</td>
                    <td class="text-truncate" style="max-width: 120px;" title="${section.instructor}">${section.instructor}</td>
                    <td>${daysTimesList}</td>
                    <td>${statusBadge}${ztcBadge}</td>
                </tr>`;
        });
        
        html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    
    $('#card-view-container').html(html);
}

/**
 * Display results in table view
 */
function displayTableView(courses) {
    let html = '';
    
    courses.forEach(course => {
        course.sections.forEach((section, index) => {
            const daysTimesList = section.meetings.map(meeting => {
                if (meeting.days.length === 0) {
                    return 'ARR';
                }
                const daysStr = meeting.days.join('');
                if (meeting.start_time && meeting.end_time) {
                    return `${daysStr} ${meeting.start_time}-${meeting.end_time}`;
                }
                return daysStr;
            }).join(', ');
            
            const location = section.meetings.length > 0 ? section.meetings[0].location.building : 'TBA';
            const statusBadge = getStatusBadge(section.status);
            const ztcBadge = section.textbookCost === 'ZTC' ? ' <span class="badge badge-ztc">ZTC</span>' : '';
            
            html += `
                <tr class="section-clickable" onclick="showSectionDetails('${section.crn}')">
                    <td>${section.crn}</td>
                    <td>${course.subject} ${course.courseNumber}</td>
                    <td>${course.title}</td>
                    <td>${section.instructor}</td>
                    <td>${daysTimesList}</td>
                    <td>${location}</td>
                    <td>${course.units}</td>
                    <td>${statusBadge}${ztcBadge}</td>
                </tr>`;
        });
    });
    
    $('#table-body').html(html);
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'open') {
        return '<span class="badge bg-success">Open</span>';
    } else if (statusLower === 'waitlisted') {
        return '<span class="badge bg-warning">Waitlist</span>';
    } else if (statusLower === 'cancelled') {
        return '<span class="badge bg-danger">Cancelled</span>';
    } else {
        return `<span class="badge bg-secondary">${status}</span>`;
    }
}

/**
 * Show enhanced section details in modal
 */
function showSectionDetails(crn) {
    // Find the section data from raw data
    let sectionData = null;
    if (rawScheduleData) {
        sectionData = rawScheduleData.courses.find(course => course.crn === crn);
    }
    
    if (!sectionData) {
        $('#sectionDetailsBody').html('<p>Section details not available.</p>');
        $('#sectionDetailsModal').modal('show');
        return;
    }
    
    // Find the course info from processed data
    let courseInfo = null;
    for (const course of allCourses) {
        const section = course.sections.find(s => s.crn === crn);
        if (section) {
            courseInfo = { ...course, selectedSection: section };
            break;
        }
    }
    
    const modalContent = generateEnhancedSectionModal(sectionData, courseInfo);
    $('#sectionDetailsBody').html(modalContent);
    $('#sectionDetailsModalLabel').text(`${sectionData.subject} ${sectionData.course_number} - ${sectionData.title}`);
    $('#sectionDetailsModal').modal('show');
}

/**
 * Generate enhanced section modal content
 */
function generateEnhancedSectionModal(sectionData, courseInfo) {
    let html = '';
    
    // Basic section information
    html += `
        <div class="section-detail-group">
            <h6><i class="bi bi-info-circle"></i> Section Information</h6>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>CRN:</strong> ${sectionData.crn}</p>
                    <p><strong>Course:</strong> ${sectionData.subject} ${sectionData.course_number}</p>
                    <p><strong>Title:</strong> ${sectionData.title}</p>
                    <p><strong>Units:</strong> ${sectionData.units}</p>
                    <p><strong>Section Type:</strong> ${sectionData.section_type || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Instructor:</strong> ${sectionData.instructor || 'TBA'}</p>
                    ${sectionData.instructor_email ? `<p><strong>Email:</strong> <a href="mailto:${sectionData.instructor_email}">${sectionData.instructor_email}</a></p>` : ''}
                    <p><strong>Delivery Method:</strong> ${sectionData.delivery_method || 'N/A'}</p>
                    <p><strong>Duration:</strong> ${sectionData.weeks || 'N/A'} weeks</p>
                    <p><strong>Status:</strong> ${getStatusBadge(sectionData.status)}</p>
                </div>
            </div>
        </div>`;
    
    // Meeting times and location
    if (sectionData.meeting_times && sectionData.meeting_times.length > 0) {
        html += `
            <div class="section-detail-group">
                <h6><i class="bi bi-clock"></i> Meeting Times</h6>`;
        
        sectionData.meeting_times.forEach(meeting => {
            html += `
                <div class="mb-2">
                    <strong>Days:</strong> ${meeting.days || 'TBA'} | 
                    <strong>Time:</strong> ${meeting.start_time && meeting.end_time ? `${meeting.start_time} - ${meeting.end_time}` : 'TBA'} | 
                    <strong>Location:</strong> ${sectionData.location || 'TBA'}
                </div>`;
        });
        
        html += `</div>`;
    }
    
    // Enrollment information
    if (sectionData.enrollment || sectionData.seating_detail) {
        html += `
            <div class="section-detail-group">
                <h6><i class="bi bi-people"></i> Enrollment</h6>
                <div class="row">`;
        
        if (sectionData.enrollment) {
            const enrollment = sectionData.enrollment;
            html += `
                    <div class="col-md-6">
                        <p><strong>Capacity:</strong> ${enrollment.capacity || 0}</p>
                        <p><strong>Enrolled:</strong> ${enrollment.actual || 0}</p>
                        <p><strong>Available:</strong> ${enrollment.remaining || 0}</p>
                    </div>`;
        }
        
        if (sectionData.seating_detail) {
            const seating = sectionData.seating_detail;
            const fillPercentage = seating.capacity > 0 ? (seating.taken / seating.capacity) * 100 : 0;
            html += `
                    <div class="col-md-6">
                        <p><strong>Detailed Seating:</strong></p>
                        <div class="seating-progress mb-2">
                            <div class="seating-fill" style="width: ${fillPercentage}%"></div>
                        </div>
                        <small>${seating.taken || 0} of ${seating.capacity || 0} seats taken (${seating.available || 0} available)</small>
                    </div>`;
        }
        
        html += `</div></div>`;
    }
    
    // Course description
    if (sectionData.description) {
        html += `
            <div class="section-detail-group">
                <h6><i class="bi bi-card-text"></i> Course Description</h6>
                <p>${sectionData.description}</p>
            </div>`;
    }
    
    // Prerequisites and advisories
    if (sectionData.prerequisites || sectionData.advisory) {
        html += `
            <div class="section-detail-group">
                <h6><i class="bi bi-list-check"></i> Prerequisites & Advisories</h6>`;
        
        if (sectionData.prerequisites) {
            html += `<p><strong>Prerequisites:</strong> ${sectionData.prerequisites}</p>`;
        }
        
        if (sectionData.advisory) {
            html += `<p><strong>Advisory:</strong> ${sectionData.advisory}</p>`;
        }
        
        if (sectionData.section_corequisites) {
            html += `<p><strong>Section Corequisites:</strong> ${sectionData.section_corequisites}</p>`;
        }
        
        html += `</div>`;
    }
    
    // Transfer information
    if (sectionData.transfers_to) {
        html += `
            <div class="section-detail-group">
                <h6><i class="bi bi-arrow-up-right"></i> Transfer Information</h6>
                <p><strong>Transfers to:</strong> ${sectionData.transfers_to}</p>
                ${sectionData.former_course_number ? `<p><strong>Former Course Number:</strong> ${sectionData.former_course_number}</p>` : ''}
            </div>`;
    }
    
    // Critical dates
    if (sectionData.critical_dates && Object.keys(sectionData.critical_dates).length > 0) {
        html += `
            <div class="section-detail-group">
                <h6><i class="bi bi-calendar-event"></i> Important Dates</h6>
                <div class="critical-dates-grid">`;
        
        Object.entries(sectionData.critical_dates).forEach(([label, date]) => {
            if (date) {
                html += `
                    <div class="critical-date-item">
                        <span class="critical-date-label">${label}:</span>
                        ${date}
                    </div>`;
            }
        });
        
        html += `</div></div>`;
    }
    
    // Additional information
    if (sectionData.start_date || sectionData.end_date || sectionData.additional_hours) {
        html += `
            <div class="section-detail-group">
                <h6><i class="bi bi-calendar-range"></i> Session Details</h6>`;
        
        if (sectionData.start_date || sectionData.end_date) {
            html += `<p><strong>Session Dates:</strong> ${sectionData.start_date || 'TBA'} - ${sectionData.end_date || 'TBA'}</p>`;
        }
        
        if (sectionData.additional_hours) {
            html += `<p><strong>Additional Hours:</strong> ${sectionData.additional_hours}</p>`;
        }
        
        if (sectionData.instructional_method) {
            html += `<p><strong>Instructional Method:</strong> ${sectionData.instructional_method}</p>`;
        }
        
        html += `</div>`;
    }
    
    // Links section
    let hasLinks = false;
    let linksHtml = `
        <div class="section-detail-group">
            <h6><i class="bi bi-link-45deg"></i> Resources</h6>
            <div class="d-flex gap-2 flex-wrap">`;
    
    if (sectionData.syllabus_link && !sectionData.syllabus_link.includes('javascript:void(0)')) {
        linksHtml += `<a href="${sectionData.syllabus_link}" target="_blank" class="btn btn-outline-primary btn-sm"><i class="bi bi-file-text"></i> Syllabus</a>`;
        hasLinks = true;
    }
    
    if (sectionData.book_link && !sectionData.book_link.includes('JavaScript:')) {
        linksHtml += `<a href="${sectionData.book_link}" target="_blank" class="btn btn-outline-info btn-sm"><i class="bi bi-book"></i> Textbooks</a>`;
        hasLinks = true;
    }
    
    if (sectionData.zero_textbook_cost) {
        linksHtml += `<span class="badge badge-ztc"><i class="bi bi-check-circle"></i> Zero Textbook Cost</span>`;
        hasLinks = true;
    }
    
    linksHtml += `</div></div>`;
    
    if (hasLinks) {
        html += linksHtml;
    }
    
    // Data freshness
    if (sectionData.detail_fetched_at) {
        const fetchDate = new Date(sectionData.detail_fetched_at);
        const formattedFetchDate = fetchDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZone: 'America/Los_Angeles'
        });
        
        html += `
            <div class="section-detail-group">
                <h6><i class="bi bi-clock-history"></i> Data Freshness</h6>
                <p><small class="text-muted">Detailed information last updated: ${formattedFetchDate} PT</small></p>
            </div>`;
    }
    
    return html;
}

/**
 * Update pagination
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredCourses.length / resultsPerPage);
    
    if (totalPages <= 1) {
        $('#pagination').empty();
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
             </li>`;
    
    // Page numbers (show max 5 pages around current)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1)">1</a></li>`;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                 </li>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
    }
    
    // Next button
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
             </li>`;
    
    $('#pagination').html(html);
}

/**
 * Change page
 */
function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredCourses.length / resultsPerPage)) {
        return;
    }
    
    currentPage = page;
    displayResults();
    
    // Scroll to top of results
    $('#results-container')[0].scrollIntoView({ behavior: 'smooth' });
}