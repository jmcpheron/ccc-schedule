// CCC Schedule JavaScript
(function() {
    'use strict';

    // Global variables
    let scheduleData = null;
    let filteredCourses = [];
    let currentPage = 1;
    const itemsPerPage = 20;

    // DOM elements
    const elements = {
        searchInput: $('#searchInput'),
        termSelect: $('#termSelect'),
        collegeSelect: $('#collegeSelect'),
        subjectSelect: $('#subjectSelect'),
        modeSelect: $('#modeSelect'),
        minUnits: $('#minUnits'),
        maxUnits: $('#maxUnits'),
        startTime: $('#startTime'),
        endTime: $('#endTime'),
        openOnly: $('#openOnly'),
        resetFilters: $('#resetFilters'),
        loadingSpinner: $('#loadingSpinner'),
        resultsContainer: $('#resultsContainer'),
        noResults: $('#noResults'),
        resultCount: $('#resultCount'),
        cardView: $('#cardView'),
        tableView: $('#tableView'),
        cardViewContainer: $('#cardViewContainer'),
        tableViewContainer: $('#tableViewContainer'),
        pagination: $('#pagination')
    };

    // Initialize the application
    function init() {
        loadScheduleData();
        setupEventListeners();
        loadFiltersFromURL();
    }

    // Load schedule data
    function loadScheduleData() {
        $.ajax({
            url: 'data/schema.json',
            dataType: 'json',
            success: function(data) {
                scheduleData = data.schedule || data;
                populateFilters();
                applyFilters();
                elements.loadingSpinner.hide();
                elements.resultsContainer.show();
            },
            error: function(xhr, status, error) {
                console.error('Error loading schedule data:', error);
                elements.loadingSpinner.html(
                    '<div class="alert alert-danger">' +
                    '<i class="bi bi-exclamation-triangle"></i> ' +
                    'Error loading schedule data. Please try again later.' +
                    '</div>'
                );
            }
        });
    }

    // Populate filter dropdowns
    function populateFilters() {
        // Terms
        scheduleData.metadata.terms.forEach(term => {
            elements.termSelect.append(`<option value="${term.code}">${term.name}</option>`);
        });

        // Colleges
        scheduleData.metadata.colleges.forEach(college => {
            elements.collegeSelect.append(`<option value="${college.id}">${college.name}</option>`);
        });

        // Subjects
        scheduleData.subjects.sort((a, b) => a.code.localeCompare(b.code)).forEach(subject => {
            elements.subjectSelect.append(`<option value="${subject.code}">${subject.code} - ${subject.name}</option>`);
        });

        // Instruction modes
        const modes = new Set();
        scheduleData.courses.forEach(course => {
            course.sections.forEach(section => {
                modes.add(section.instruction_mode);
            });
        });
        Array.from(modes).sort().forEach(mode => {
            elements.modeSelect.append(`<option value="${mode}">${mode}</option>`);
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Filter change events
        $('.form-select, .form-control, .form-check-input, .btn-check').on('change input', debounce(applyFilters, 300));
        
        // Search input
        elements.searchInput.on('input', debounce(applyFilters, 300));

        // Reset filters
        elements.resetFilters.on('click', resetFilters);

        // View mode toggle
        $('input[name="viewMode"]').on('change', updateView);

        // Day selection
        $('.btn-check[id^="day"]').on('change', applyFilters);
    }

    // Apply filters to courses
    function applyFilters() {
        const filters = getFilters();
        filteredCourses = [];

        scheduleData.courses.forEach(course => {
            // Check course-level filters
            if (filters.subject && course.subject !== filters.subject) return;
            if (filters.minUnits && course.units < filters.minUnits) return;
            if (filters.maxUnits && course.units > filters.maxUnits) return;
            
            // Check keyword search
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matches = 
                    course.course_key.toLowerCase().includes(searchLower) ||
                    course.title.toLowerCase().includes(searchLower) ||
                    course.description.toLowerCase().includes(searchLower);
                if (!matches) return;
            }

            // Filter sections
            const filteredSections = course.sections.filter(section => {
                if (filters.term && section.term !== filters.term) return false;
                if (filters.college && section.college !== filters.college) return false;
                if (filters.mode && section.instruction_mode !== filters.mode) return false;
                if (filters.openOnly && section.status !== 'Open') return false;

                // Day filter
                if (filters.days.length > 0) {
                    const sectionDays = new Set();
                    section.meetings.forEach(meeting => {
                        meeting.days.forEach(day => sectionDays.add(day));
                    });
                    const hasMatchingDay = filters.days.some(day => sectionDays.has(day));
                    if (!hasMatchingDay) return false;
                }

                // Time filter
                if (filters.startTime || filters.endTime) {
                    let timeMatches = false;
                    section.meetings.forEach(meeting => {
                        if (filters.startTime && meeting.start_time < filters.startTime) return;
                        if (filters.endTime && meeting.end_time > filters.endTime) return;
                        timeMatches = true;
                    });
                    if (!timeMatches) return false;
                }

                return true;
            });

            if (filteredSections.length > 0) {
                filteredCourses.push({
                    ...course,
                    sections: filteredSections
                });
            }
        });

        currentPage = 1;
        updateView();
        updateURL();
    }

    // Get current filter values
    function getFilters() {
        const days = [];
        $('.btn-check[id^="day"]:checked').each(function() {
            days.push($(this).val());
        });

        return {
            search: elements.searchInput.val(),
            term: elements.termSelect.val(),
            college: elements.collegeSelect.val(),
            subject: elements.subjectSelect.val(),
            mode: elements.modeSelect.val(),
            minUnits: parseFloat(elements.minUnits.val()) || null,
            maxUnits: parseFloat(elements.maxUnits.val()) || null,
            days: days,
            startTime: elements.startTime.val(),
            endTime: elements.endTime.val(),
            openOnly: elements.openOnly.is(':checked')
        };
    }

    // Reset all filters
    function resetFilters() {
        elements.searchInput.val('');
        $('.form-select').val('');
        elements.minUnits.val('');
        elements.maxUnits.val('');
        elements.startTime.val('');
        elements.endTime.val('');
        elements.openOnly.prop('checked', false);
        $('.btn-check[id^="day"]').prop('checked', false);
        applyFilters();
    }

    // Update the view based on current filters and view mode
    function updateView() {
        const isCardView = elements.cardView.is(':checked');
        elements.cardViewContainer.toggle(isCardView);
        elements.tableViewContainer.toggle(!isCardView);

        const totalResults = filteredCourses.length;
        elements.resultCount.text(totalResults);

        if (totalResults === 0) {
            elements.noResults.show();
            elements.resultsContainer.hide();
            return;
        }

        elements.noResults.hide();
        elements.resultsContainer.show();

        // Paginate results
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalResults);
        const pageResults = filteredCourses.slice(startIndex, endIndex);

        if (isCardView) {
            renderCardView(pageResults);
        } else {
            renderTableView(pageResults);
        }

        renderPagination(totalResults);
    }

    // Render card view
    function renderCardView(courses) {
        elements.cardViewContainer.empty();
        
        courses.forEach(course => {
            const card = createCourseCard(course);
            elements.cardViewContainer.append(card);
        });
    }

    // Create course card HTML
    function createCourseCard(course) {
        const attributes = course.attributes || {};
        const transferable = attributes.transferable || {};
        const ge = attributes.general_education || {};
        
        let attributeBadges = '';
        if (transferable.csu) attributeBadges += '<span class="attribute-badge csu">CSU</span>';
        if (transferable.uc) attributeBadges += '<span class="attribute-badge uc">UC</span>';
        if (ge.igetc_area && ge.igetc_area.length > 0) {
            attributeBadges += '<span class="attribute-badge igetc">IGETC</span>';
        }

        const sections = course.sections.map(section => createSectionItem(section, course)).join('');

        return `
            <div class="col-lg-6 col-xl-4">
                <div class="card course-card">
                    <div class="course-header">
                        <div class="course-number">${course.course_key}</div>
                        <div class="course-title">${course.title}</div>
                        <div class="course-units">${course.units} units</div>
                    </div>
                    <div class="card-body">
                        ${attributeBadges ? `<div class="mb-2">${attributeBadges}</div>` : ''}
                        <p class="card-text small">${course.description}</p>
                        ${course.prerequisites ? `<p class="small mb-2"><strong>Prerequisites:</strong> ${course.prerequisites}</p>` : ''}
                        <h6 class="mb-2">Sections (${course.sections.length})</h6>
                        <div class="list-group">
                            ${sections}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Create section item HTML
    function createSectionItem(section, course) {
        const statusClass = section.status === 'Open' ? 'open' : 
                           section.status === 'Waitlist' ? 'waitlist' : 'closed';
        const statusBadge = section.status === 'Open' ? 'badge-open' : 
                           section.status === 'Waitlist' ? 'badge-waitlist' : 'badge-closed';
        
        const meeting = section.meetings[0] || {};
        const days = meeting.days ? meeting.days.join('') : 'TBA';
        const time = meeting.start_time ? `${formatTime(meeting.start_time)}-${formatTime(meeting.end_time)}` : 'TBA';
        
        const ztcBadge = section.textbook.cost_category === 'Zero' ? 
            '<span class="badge ztc-badge">ZTC</span>' : '';

        return `
            <a href="#" class="list-group-item list-group-item-action section-item ${statusClass}"
               onclick="showSectionDetails('${course.course_key}', '${section.crn}'); return false;">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>CRN ${section.crn}</strong> - ${section.instruction_mode}
                        <div class="meeting-time">${days} ${time}</div>
                    </div>
                    <div class="text-end">
                        <span class="badge ${statusBadge}">${section.status}</span>
                        ${ztcBadge}
                        <div class="small">${section.enrollment.enrolled}/${section.enrollment.capacity}</div>
                    </div>
                </div>
            </a>
        `;
    }

    // Render table view
    function renderTableView(courses) {
        const tbody = $('#tableBody').empty();
        
        courses.forEach(course => {
            const row = `
                <tr>
                    <td>${course.course_key}</td>
                    <td>${course.title}</td>
                    <td>${course.units}</td>
                    <td>${course.sections.length}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" 
                                onclick="showCourseDetails('${course.course_key}')">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    // Render pagination
    function renderPagination(totalResults) {
        const totalPages = Math.ceil(totalResults / itemsPerPage);
        const pagination = elements.pagination.empty();

        if (totalPages <= 1) return;

        // Previous button
        pagination.append(`
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
            </li>
        `);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                pagination.append(`
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `);
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                pagination.append('<li class="page-item disabled"><span class="page-link">...</span></li>');
            }
        }

        // Next button
        pagination.append(`
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
            </li>
        `);

        // Page click handler
        pagination.find('a').on('click', function(e) {
            e.preventDefault();
            const page = parseInt($(this).data('page'));
            if (page && page !== currentPage) {
                currentPage = page;
                updateView();
                window.scrollTo(0, 0);
            }
        });
    }

    // Show section details modal
    window.showSectionDetails = function(courseKey, crn) {
        const course = filteredCourses.find(c => c.course_key === courseKey);
        if (!course) return;

        const section = course.sections.find(s => s.crn === crn);
        if (!section) return;

        const instructor = scheduleData.instructors.find(i => section.instructors.includes(i.id));
        
        let meetingsHtml = '';
        section.meetings.forEach(meeting => {
            const days = meeting.days.join(', ');
            const time = `${formatTime(meeting.start_time)} - ${formatTime(meeting.end_time)}`;
            const location = `${meeting.location.building} ${meeting.location.room}`;
            meetingsHtml += `
                <div class="section-detail-row">
                    <span class="section-detail-label">${meeting.type}:</span>
                    ${days} ${time} in ${location}
                </div>
            `;
        });

        const modalBody = `
            <h6>${course.course_key}: ${course.title}</h6>
            <div class="section-detail-row">
                <span class="section-detail-label">CRN:</span> ${section.crn}
            </div>
            <div class="section-detail-row">
                <span class="section-detail-label">Status:</span> 
                <span class="badge badge-${section.status.toLowerCase()}">${section.status}</span>
            </div>
            <div class="section-detail-row">
                <span class="section-detail-label">Enrollment:</span> 
                ${section.enrollment.enrolled} / ${section.enrollment.capacity} 
                (Waitlist: ${section.enrollment.waitlist} / ${section.enrollment.waitlist_capacity})
            </div>
            <div class="section-detail-row">
                <span class="section-detail-label">Instructor:</span> 
                ${instructor ? instructor.name : 'Staff'}
            </div>
            <div class="section-detail-row">
                <span class="section-detail-label">Instruction Mode:</span> ${section.instruction_mode}
            </div>
            <div class="section-detail-row">
                <span class="section-detail-label">Dates:</span> 
                ${formatDate(section.dates.start)} - ${formatDate(section.dates.end)} 
                (${section.dates.duration_weeks} weeks)
            </div>
            ${meetingsHtml}
            <div class="section-detail-row">
                <span class="section-detail-label">Textbook:</span> 
                ${section.textbook.required ? 'Required' : 'Not Required'} - 
                ${section.textbook.cost_category} Cost
                ${section.textbook.details ? `<br><small>${section.textbook.details}</small>` : ''}
            </div>
            ${section.fees > 0 ? `
                <div class="section-detail-row">
                    <span class="section-detail-label">Fees:</span> $${section.fees.toFixed(2)}
                </div>
            ` : ''}
            ${section.notes ? `
                <div class="section-detail-row">
                    <span class="section-detail-label">Notes:</span> ${section.notes}
                </div>
            ` : ''}
        `;

        $('#sectionModalTitle').text('Section Details');
        $('#sectionModalBody').html(modalBody);
        $('#sectionModal').modal('show');
    };

    // Show course details (for table view)
    window.showCourseDetails = function(courseKey) {
        const course = filteredCourses.find(c => c.course_key === courseKey);
        if (!course) return;

        const card = createCourseCard(course);
        const modalBody = $(card).find('.card-body').html();

        $('#sectionModalTitle').text(`${course.course_key}: ${course.title}`);
        $('#sectionModalBody').html(modalBody);
        $('#sectionModal').modal('show');
    };

    // Utility functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // URL parameter handling
    function updateURL() {
        const filters = getFilters();
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '' && (!Array.isArray(value) || value.length > 0)) {
                if (Array.isArray(value)) {
                    params.set(key, value.join(','));
                } else if (typeof value === 'boolean') {
                    if (value) params.set(key, '1');
                } else {
                    params.set(key, value);
                }
            }
        });

        const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newURL);
    }

    function loadFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        params.forEach((value, key) => {
            switch(key) {
                case 'search':
                    elements.searchInput.val(value);
                    break;
                case 'term':
                    elements.termSelect.val(value);
                    break;
                case 'college':
                    elements.collegeSelect.val(value);
                    break;
                case 'subject':
                    elements.subjectSelect.val(value);
                    break;
                case 'mode':
                    elements.modeSelect.val(value);
                    break;
                case 'minUnits':
                    elements.minUnits.val(value);
                    break;
                case 'maxUnits':
                    elements.maxUnits.val(value);
                    break;
                case 'startTime':
                    elements.startTime.val(value);
                    break;
                case 'endTime':
                    elements.endTime.val(value);
                    break;
                case 'openOnly':
                    elements.openOnly.prop('checked', value === '1');
                    break;
                case 'days':
                    value.split(',').forEach(day => {
                        $(`#day${day}`).prop('checked', true);
                    });
                    break;
            }
        });
    }

    // Initialize on document ready
    $(document).ready(init);
})();