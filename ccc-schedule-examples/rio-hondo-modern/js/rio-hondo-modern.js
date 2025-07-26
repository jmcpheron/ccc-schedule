/**
 * Rio Hondo Modern Schedule Interface - Compact & Feature-Rich
 */

class ModernSchedule {
    constructor() {
        this.courses = [];
        this.filteredCourses = [];
        this.currentView = 'grid';
        this.currentSort = 'default';
        this.currentPage = 1;
        this.coursesPerPage = 20;
        
        this.filters = {
            search: '',
            open: false,
            online: false,
            inPerson: false,
            evening: false,
            ztc: false,
            subject: '',
            maxUnits: 5,
            days: []
        };
        
        this.savedCourses = this.loadSavedCourses();
        this.init();
    }
    
    async init() {
        this.setupTheme();
        this.setupEventListeners();
        await this.loadData();
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }
    
    updateThemeIcon(theme) {
        const icon = document.getElementById('themeToggle').querySelector('i');
        icon.className = theme === 'light' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    }
    
    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');
        
        searchInput.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            searchClear.style.display = e.target.value ? 'block' : 'none';
            this.applyFilters();
        });
        
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            this.filters.search = '';
            searchClear.style.display = 'none';
            this.applyFilters();
        });
        
        // Filter chips
        document.querySelectorAll('.chip[data-filter]').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const filter = chip.dataset.filter;
                this.filters[filter === 'in-person' ? 'inPerson' : filter] = chip.classList.contains('active');
                this.applyFilters();
            });
        });
        
        // Day filters
        document.querySelectorAll('.chip[data-day]').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const day = chip.dataset.day;
                if (chip.classList.contains('active')) {
                    this.filters.days.push(day);
                } else {
                    this.filters.days = this.filters.days.filter(d => d !== day);
                }
                this.applyFilters();
            });
        });
        
        // Advanced filters
        document.getElementById('moreFiltersBtn').addEventListener('click', () => {
            const advancedFilters = document.getElementById('advancedFilters');
            advancedFilters.style.display = advancedFilters.style.display === 'none' ? 'block' : 'none';
        });
        
        // Subject filter
        document.getElementById('subjectFilter').addEventListener('change', (e) => {
            this.filters.subject = e.target.value;
            this.applyFilters();
        });
        
        // Units filter
        const unitsFilter = document.getElementById('unitsFilter');
        unitsFilter.addEventListener('input', (e) => {
            this.filters.maxUnits = parseFloat(e.target.value);
            document.getElementById('unitsValue').textContent = e.target.value;
            this.applyFilters();
        });
        
        // Reset filters
        document.getElementById('resetFiltersBtn').addEventListener('click', () => {
            this.resetFilters();
        });
        
        // View toggle
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.render();
            });
        });
        
        // Sort
        const sortBtn = document.getElementById('sortBtn');
        const sortMenu = document.getElementById('sortMenu');
        
        sortBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sortMenu.classList.toggle('show');
        });
        
        document.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.currentSort = option.dataset.sort;
                sortMenu.classList.remove('show');
                this.applyFilters();
            });
        });
        
        // Click outside to close sort menu
        document.addEventListener('click', () => {
            sortMenu.classList.remove('show');
        });
        
        // Saved courses
        document.getElementById('savedCoursesBtn').addEventListener('click', () => {
            document.getElementById('savedSidebar').classList.toggle('show');
            this.renderSavedCourses();
        });
        
        document.getElementById('closeSidebarBtn').addEventListener('click', () => {
            document.getElementById('savedSidebar').classList.remove('show');
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }
    
    resetFilters() {
        // Reset all filters
        this.filters = {
            search: '',
            open: false,
            online: false,
            inPerson: false,
            evening: false,
            ztc: false,
            subject: '',
            maxUnits: 5,
            days: []
        };
        
        // Reset UI
        document.getElementById('searchInput').value = '';
        document.getElementById('searchClear').style.display = 'none';
        document.querySelectorAll('.chip[data-filter]').forEach(chip => chip.classList.remove('active'));
        document.querySelectorAll('.chip[data-day]').forEach(chip => chip.classList.remove('active'));
        document.getElementById('subjectFilter').value = '';
        document.getElementById('unitsFilter').value = 5;
        document.getElementById('unitsValue').textContent = '5';
        
        this.applyFilters();
    }
    
    async loadData() {
        try {
            // Fetch symlink first
            const symlinkResponse = await fetch('https://raw.githubusercontent.com/jmcpheron/ccc-schedule-collector/main/data/schedule_202570_latest.json');
            const filename = (await symlinkResponse.text()).trim();
            
            // Then fetch actual data
            const dataResponse = await fetch(`https://raw.githubusercontent.com/jmcpheron/ccc-schedule-collector/main/data/${filename}`);
            const data = await dataResponse.json();
            
            this.courses = data.courses || [];
            this.populateSubjectFilter();
            
            // Update last update time
            if (data.collection_timestamp) {
                const date = new Date(data.collection_timestamp);
                document.getElementById('lastUpdateTime').textContent = 
                    `Updated ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
            }
            
            // Initial render
            this.applyFilters();
            
        } catch (error) {
            console.error('Failed to load data:', error);
            document.getElementById('loadingState').innerHTML = `
                <div style="text-align: center; color: var(--danger);">
                    <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                    <h3>Failed to load schedule data</h3>
                </div>
            `;
        }
    }
    
    populateSubjectFilter() {
        const subjects = [...new Set(this.courses.map(c => c.subject))].sort();
        const select = document.getElementById('subjectFilter');
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            select.appendChild(option);
        });
    }
    
    applyFilters() {
        // Apply filters
        this.filteredCourses = this.courses.filter(course => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search;
                const matchesSearch = 
                    course.subject.toLowerCase().includes(searchTerm) ||
                    course.course_number.toLowerCase().includes(searchTerm) ||
                    course.title.toLowerCase().includes(searchTerm) ||
                    course.crn.includes(searchTerm) ||
                    (course.instructor && course.instructor.toLowerCase().includes(searchTerm));
                
                if (!matchesSearch) return false;
            }
            
            // Status filter
            if (this.filters.open && course.status !== 'OPEN') return false;
            
            // Delivery method filters
            if (this.filters.online && !this.isOnline(course)) return false;
            if (this.filters.inPerson && !this.isInPerson(course)) return false;
            
            // Evening filter
            if (this.filters.evening && !this.isEvening(course)) return false;
            
            // ZTC filter
            if (this.filters.ztc && !course.zero_textbook_cost) return false;
            
            // Subject filter
            if (this.filters.subject && course.subject !== this.filters.subject) return false;
            
            // Units filter
            if (course.units > this.filters.maxUnits) return false;
            
            // Days filter
            if (this.filters.days.length > 0) {
                const courseDays = this.getCourseDays(course);
                const hasDay = this.filters.days.some(day => courseDays.includes(day));
                if (!hasDay) return false;
            }
            
            return true;
        });
        
        // Apply sorting
        this.sortCourses();
        
        // Update UI
        this.updateFilterUI();
        this.updateStats();
        this.currentPage = 1;
        this.render();
    }
    
    sortCourses() {
        switch (this.currentSort) {
            case 'course':
                this.filteredCourses.sort((a, b) => {
                    const codeA = `${a.subject} ${a.course_number}`;
                    const codeB = `${b.subject} ${b.course_number}`;
                    return codeA.localeCompare(codeB);
                });
                break;
            case 'time':
                this.filteredCourses.sort((a, b) => {
                    const timeA = this.getStartTime(a);
                    const timeB = this.getStartTime(b);
                    return timeA - timeB;
                });
                break;
            case 'enrollment':
                this.filteredCourses.sort((a, b) => {
                    const percentA = a.enrollment.capacity > 0 ? a.enrollment.actual / a.enrollment.capacity : 0;
                    const percentB = b.enrollment.capacity > 0 ? b.enrollment.actual / b.enrollment.capacity : 0;
                    return percentA - percentB;
                });
                break;
            case 'units':
                this.filteredCourses.sort((a, b) => b.units - a.units);
                break;
            default:
                // Keep original order
                break;
        }
    }
    
    getStartTime(course) {
        if (!course.meeting_times || course.meeting_times.length === 0) return 9999;
        const meeting = course.meeting_times[0];
        if (!meeting.start_time) return 9999;
        
        const time = meeting.start_time;
        const [hours, minutes] = time.replace(/[^\d:]/g, '').split(':').map(Number);
        const isPM = time.toLowerCase().includes('pm');
        let hour24 = hours;
        if (isPM && hours !== 12) hour24 += 12;
        if (!isPM && hours === 12) hour24 = 0;
        
        return hour24 * 60 + minutes;
    }
    
    updateFilterUI() {
        // Count active filters
        let activeCount = 0;
        if (this.filters.search) activeCount++;
        if (this.filters.open) activeCount++;
        if (this.filters.online) activeCount++;
        if (this.filters.inPerson) activeCount++;
        if (this.filters.evening) activeCount++;
        if (this.filters.ztc) activeCount++;
        if (this.filters.subject) activeCount++;
        if (this.filters.maxUnits < 5) activeCount++;
        if (this.filters.days.length > 0) activeCount++;
        
        // Update reset button
        const resetBtn = document.getElementById('resetFiltersBtn');
        const filterCount = document.getElementById('activeFilterCount');
        
        if (activeCount > 0) {
            resetBtn.style.display = 'inline-flex';
            filterCount.textContent = activeCount;
        } else {
            resetBtn.style.display = 'none';
        }
        
        // Update open count chip
        const openCount = this.courses.filter(c => c.status === 'OPEN').length;
        document.getElementById('openCount').textContent = openCount;
    }
    
    updateStats() {
        document.getElementById('resultsCount').textContent = 
            `${this.filteredCourses.length} course${this.filteredCourses.length !== 1 ? 's' : ''} found`;
        
        // Update saved badge
        const savedBadge = document.getElementById('savedBadge');
        if (this.savedCourses.length > 0) {
            savedBadge.style.display = 'block';
            savedBadge.textContent = this.savedCourses.length;
        } else {
            savedBadge.style.display = 'none';
        }
    }
    
    render() {
        const grid = document.getElementById('coursesGrid');
        const list = document.getElementById('listView');
        const loading = document.getElementById('loadingState');
        const noResults = document.getElementById('noResults');
        const pagination = document.getElementById('pagination');
        
        // Hide all
        grid.style.display = 'none';
        list.style.display = 'none';
        loading.style.display = 'none';
        noResults.style.display = 'none';
        pagination.style.display = 'none';
        
        if (this.filteredCourses.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        // Paginate
        const start = (this.currentPage - 1) * this.coursesPerPage;
        const end = start + this.coursesPerPage;
        const pageCourses = this.filteredCourses.slice(start, end);
        
        if (this.currentView === 'grid') {
            grid.style.display = 'grid';
            grid.innerHTML = pageCourses.map(course => this.renderCourseCard(course)).join('');
        } else {
            list.style.display = 'block';
            this.renderListView(pageCourses);
        }
        
        // Render pagination
        if (this.filteredCourses.length > this.coursesPerPage) {
            pagination.style.display = 'flex';
            this.renderPagination();
        }
        
        // Attach event listeners
        this.attachEventListeners();
    }
    
    renderCourseCard(course) {
        const enrollmentPercent = course.enrollment.capacity > 0 
            ? (course.enrollment.actual / course.enrollment.capacity) * 100 
            : 0;
        const enrollmentClass = enrollmentPercent >= 90 ? 'full' : enrollmentPercent >= 70 ? 'high' : '';
        const isSaved = this.savedCourses.includes(course.crn);
        const meeting = course.meeting_times[0] || {};
        
        return `
            <div class="course-card" data-crn="${course.crn}">
                <div class="course-card-header">
                    <div class="course-main-info">
                        <div class="course-code-title">
                            <span class="course-code">${course.subject} ${course.course_number}</span>
                            <span class="course-title">${course.title}</span>
                        </div>
                        <div class="course-meta">
                            <span>CRN: ${course.crn}</span>
                            <span>${course.units} units</span>
                            ${course.zero_textbook_cost ? '<span><i class="bi bi-book"></i> ZTC</span>' : ''}
                        </div>
                    </div>
                    <span class="course-status status-${course.status.toLowerCase()}">${course.status}</span>
                </div>
                <div class="course-card-body">
                    <div class="course-info-group">
                        <i class="bi bi-person"></i>
                        <span>${course.instructor || 'TBA'}</span>
                    </div>
                    <div class="course-info-group">
                        <i class="bi bi-clock"></i>
                        <span>${this.formatMeetingTime(meeting)}</span>
                    </div>
                    <div class="course-info-group">
                        <i class="bi bi-geo-alt"></i>
                        <span>${course.location || 'TBA'}</span>
                    </div>
                    <div class="enrollment-info">
                        <span>${course.enrollment.actual}/${course.enrollment.capacity}</span>
                        <div class="enrollment-bar">
                            <div class="enrollment-fill ${enrollmentClass}" style="width: ${enrollmentPercent}%"></div>
                        </div>
                    </div>
                    <div class="quick-actions">
                        <button class="quick-action save-btn ${isSaved ? 'saved' : ''}" 
                                data-crn="${course.crn}" 
                                data-tooltip="${isSaved ? 'Remove' : 'Save'}">
                            <i class="bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>
                        </button>
                        <button class="quick-action" 
                                onclick="window.open('${course.book_link}', '_blank')"
                                data-tooltip="Books">
                            <i class="bi bi-book"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderListView(courses) {
        const container = document.getElementById('listView');
        container.innerHTML = `
            <div class="list-header">
                <div>Course</div>
                <div>Instructor</div>
                <div>Time</div>
                <div>Enrollment</div>
                <div>Actions</div>
            </div>
            ${courses.map(course => {
                const meeting = course.meeting_times[0] || {};
                const enrollmentPercent = course.enrollment.capacity > 0 
                    ? (course.enrollment.actual / course.enrollment.capacity) * 100 
                    : 0;
                const isSaved = this.savedCourses.includes(course.crn);
                
                return `
                    <div class="list-row">
                        <div>
                            <div style="font-weight: 600; color: var(--primary);">
                                ${course.subject} ${course.course_number}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--gray-600);">
                                ${course.title}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--gray-500);">
                                CRN: ${course.crn} • ${course.units} units
                                ${course.zero_textbook_cost ? ' • ZTC' : ''}
                            </div>
                        </div>
                        <div>${course.instructor || 'TBA'}</div>
                        <div>${this.formatMeetingTime(meeting)}</div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>${course.enrollment.actual}/${course.enrollment.capacity}</span>
                            <div class="enrollment-bar">
                                <div class="enrollment-fill" style="width: ${enrollmentPercent}%"></div>
                            </div>
                        </div>
                        <div class="quick-actions">
                            <button class="quick-action save-btn ${isSaved ? 'saved' : ''}" 
                                    data-crn="${course.crn}">
                                <i class="bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    }
    
    renderPagination() {
        const container = document.getElementById('pagination');
        const totalPages = Math.ceil(this.filteredCourses.length / this.coursesPerPage);
        
        let html = '';
        
        // Previous button
        html += `
            <button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="bi bi-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            html += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) html += `<span style="padding: 0 0.5rem;">...</span>`;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span style="padding: 0 0.5rem;">...</span>`;
            html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        // Next button
        html += `
            <button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="bi bi-chevron-right"></i>
            </button>
        `;
        
        container.innerHTML = html;
        
        // Add click handlers
        container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.render();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }
    
    renderSavedCourses() {
        const container = document.getElementById('savedCoursesContent');
        const savedCourseData = this.courses.filter(c => this.savedCourses.includes(c.crn));
        
        if (savedCourseData.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: var(--gray-500); padding: 2rem 0;">
                    No saved courses yet
                </p>
            `;
            return;
        }
        
        container.innerHTML = savedCourseData.map(course => `
            <div class="saved-course-item">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="font-weight: 600; color: var(--primary);">
                            ${course.subject} ${course.course_number}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--gray-600);">
                            ${course.title}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 0.25rem;">
                            CRN: ${course.crn} • ${course.units} units
                        </div>
                    </div>
                    <button class="quick-action" onclick="window.modernSchedule.toggleSavedCourse('${course.crn}')">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    formatMeetingTime(meeting) {
        if (!meeting.days || meeting.days === 'ARR') return 'Arranged';
        if (meeting.days === 'TBA') return 'TBA';
        
        const days = meeting.days;
        const time = meeting.start_time && meeting.end_time 
            ? `${meeting.start_time}-${meeting.end_time}` 
            : 'TBA';
        
        return `${days} ${time}`;
    }
    
    isOnline(course) {
        return course.delivery_method && (
            course.delivery_method.toLowerCase().includes('online') || 
            course.delivery_method.toLowerCase().includes('web')
        );
    }
    
    isInPerson(course) {
        return course.delivery_method && (
            course.delivery_method.toLowerCase().includes('person') ||
            course.delivery_method === 'F2F' ||
            (!this.isOnline(course) && course.delivery_method !== 'Arranged')
        );
    }
    
    isEvening(course) {
        if (!course.meeting_times || course.meeting_times.length === 0) return false;
        const meeting = course.meeting_times[0];
        if (!meeting.start_time) return false;
        
        const time = meeting.start_time.toLowerCase();
        if (time.includes('pm')) {
            const hour = parseInt(time.split(':')[0]);
            return hour >= 5 || hour === 12;
        }
        return false;
    }
    
    getCourseDays(course) {
        if (!course.meeting_times || course.meeting_times.length === 0) return [];
        const days = course.meeting_times[0].days;
        if (!days || days === 'ARR' || days === 'TBA') return [];
        return days.split('');
    }
    
    attachEventListeners() {
        // Save buttons
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSavedCourse(btn.dataset.crn);
            });
        });
    }
    
    toggleSavedCourse(crn) {
        const index = this.savedCourses.indexOf(crn);
        if (index > -1) {
            this.savedCourses.splice(index, 1);
        } else {
            this.savedCourses.push(crn);
        }
        
        localStorage.setItem('savedCourses', JSON.stringify(this.savedCourses));
        this.updateStats();
        this.render();
        
        // Update sidebar if open
        if (document.getElementById('savedSidebar').classList.contains('show')) {
            this.renderSavedCourses();
        }
    }
    
    loadSavedCourses() {
        const saved = localStorage.getItem('savedCourses');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.modernSchedule = new ModernSchedule();
});