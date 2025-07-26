/**
 * Rio Hondo Modern Schedule Interface
 * Designed for young students with modern UX patterns
 */

class ModernSchedule {
    constructor() {
        this.courses = [];
        this.filteredCourses = [];
        this.currentView = 'cards';
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
        this.setupEventListeners();
        this.setupTheme();
        await this.loadData();
        this.updateStats();
        this.render();
    }
    
    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });
        
        // Filter chips
        document.querySelectorAll('.chip[data-filter]').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const filter = chip.dataset.filter;
                this.filters[filter] = chip.classList.contains('active');
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
        
        // Subject filter
        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter) {
            subjectFilter.addEventListener('change', (e) => {
                this.filters.subject = e.target.value;
                this.applyFilters();
            });
        }
        
        // Units filter
        const unitsFilter = document.getElementById('unitsFilter');
        if (unitsFilter) {
            unitsFilter.addEventListener('input', (e) => {
                this.filters.maxUnits = parseFloat(e.target.value);
                document.getElementById('unitsValue').textContent = `0-${e.target.value} units`;
                this.applyFilters();
            });
        }
        
        // View toggle
        document.querySelectorAll('.view-toggle button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-toggle button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.render();
            });
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }
    
    updateThemeIcon(theme) {
        const icon = document.getElementById('themeIcon');
        icon.className = theme === 'light' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    }
    
    async loadData() {
        try {
            // First fetch the symlink to get the actual filename
            const symlinkResponse = await fetch('https://raw.githubusercontent.com/jmcpheron/ccc-schedule-collector/main/data/schedule_202570_latest.json');
            const filename = (await symlinkResponse.text()).trim();
            
            // Then fetch the actual data
            const dataResponse = await fetch(`https://raw.githubusercontent.com/jmcpheron/ccc-schedule-collector/main/data/${filename}`);
            const data = await dataResponse.json();
            
            this.courses = data.courses || [];
            this.filteredCourses = [...this.courses];
            
            // Populate subject dropdown
            this.populateSubjectFilter();
            
            // Update last update time
            if (data.collection_timestamp) {
                const date = new Date(data.collection_timestamp);
                document.getElementById('lastUpdate').textContent = date.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                });
            }
            
            // Hide loading, show content
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('coursesGrid').style.display = 'grid';
            
        } catch (error) {
            console.error('Failed to load data:', error);
            document.getElementById('loadingState').innerHTML = `
                <div style="color: var(--danger);">
                    <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
                    <h3 style="margin-top: 1rem;">Failed to load schedule data</h3>
                    <p>Please check your internet connection and try again.</p>
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
        
        this.updateStats();
        this.render();
    }
    
    isOnline(course) {
        return course.delivery_method && (
            course.delivery_method.includes('Online') || 
            course.delivery_method === 'WEB'
        );
    }
    
    isInPerson(course) {
        return course.delivery_method && (
            course.delivery_method === 'In-Person' ||
            course.delivery_method === 'F2F' ||
            (!this.isOnline(course) && course.delivery_method !== 'Arranged')
        );
    }
    
    isEvening(course) {
        if (!course.meeting_times || course.meeting_times.length === 0) return false;
        const meeting = course.meeting_times[0];
        if (!meeting.start_time) return false;
        
        const hour = parseInt(meeting.start_time.split(':')[0]);
        const isPM = meeting.start_time.includes('pm');
        const hour24 = isPM && hour !== 12 ? hour + 12 : hour;
        
        return hour24 >= 17; // 5pm or later
    }
    
    getCourseDays(course) {
        if (!course.meeting_times || course.meeting_times.length === 0) return [];
        const days = course.meeting_times[0].days;
        if (!days || days === 'ARR' || days === 'TBA') return [];
        return days.split('');
    }
    
    updateStats() {
        document.getElementById('totalCourses').textContent = this.filteredCourses.length;
        document.getElementById('openCourses').textContent = 
            this.filteredCourses.filter(c => c.status === 'OPEN').length;
        document.getElementById('onlineCourses').textContent = 
            this.filteredCourses.filter(c => this.isOnline(c)).length;
    }
    
    render() {
        const container = document.getElementById('coursesGrid');
        const calendarView = document.getElementById('calendarView');
        const noResults = document.getElementById('noResults');
        
        // Hide all views first
        container.style.display = 'none';
        calendarView.style.display = 'none';
        noResults.style.display = 'none';
        
        if (this.filteredCourses.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        switch (this.currentView) {
            case 'cards':
                container.style.display = 'grid';
                container.innerHTML = this.filteredCourses.map(course => 
                    this.renderCourseCard(course)
                ).join('');
                this.attachCardEventListeners();
                break;
            case 'calendar':
                calendarView.style.display = 'block';
                this.renderCalendarView();
                break;
            case 'list':
                container.style.display = 'block';
                container.innerHTML = this.renderListView();
                this.attachCardEventListeners();
                break;
        }
    }
    
    renderCourseCard(course) {
        const enrollmentPercent = course.enrollment.capacity > 0 
            ? (course.enrollment.actual / course.enrollment.capacity) * 100 
            : 0;
        const enrollmentClass = enrollmentPercent >= 90 ? 'full' : enrollmentPercent >= 70 ? 'high' : '';
        
        const isSaved = this.savedCourses.includes(course.crn);
        const meeting = course.meeting_times[0] || {};
        const instructorInitial = course.instructor && course.instructor !== 'TBA' 
            ? course.instructor.charAt(0).toUpperCase() 
            : '?';
        
        return `
            <div class="course-card" data-crn="${course.crn}">
                <div class="course-header">
                    <div class="course-title-row">
                        <span class="course-code">${course.subject} ${course.course_number}</span>
                        <span class="course-status status-${course.status.toLowerCase()}">${course.status}</span>
                    </div>
                    <h3 class="course-title">${course.title}</h3>
                    <div class="course-meta">
                        <span><i class="bi bi-award"></i> ${course.units} units</span>
                        <span><i class="bi bi-calendar3"></i> ${course.section_type}</span>
                        ${course.zero_textbook_cost ? '<span><i class="bi bi-book"></i> ZTC</span>' : ''}
                    </div>
                </div>
                <div class="course-body">
                    <div class="instructor-info">
                        <div class="instructor-avatar">${instructorInitial}</div>
                        <div>
                            <div style="font-weight: 500;">${course.instructor || 'TBA'}</div>
                            ${course.instructor_email ? `<div style="font-size: 0.75rem; color: var(--gray-500);">${course.instructor_email}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="meeting-info">
                        <span class="meeting-label"><i class="bi bi-clock"></i></span>
                        <span>${this.formatMeetingTime(meeting)}</span>
                        <span class="meeting-label"><i class="bi bi-geo-alt"></i></span>
                        <span>${course.location || 'TBA'}</span>
                        <span class="meeting-label"><i class="bi bi-laptop"></i></span>
                        <span>${course.delivery_method}</span>
                    </div>
                    
                    <div class="enrollment-section">
                        <div class="enrollment-header">
                            <span>Enrollment</span>
                            <span>${course.enrollment.actual}/${course.enrollment.capacity} (${course.enrollment.remaining} open)</span>
                        </div>
                        <div class="enrollment-bar">
                            <div class="enrollment-fill ${enrollmentClass}" style="width: ${enrollmentPercent}%"></div>
                        </div>
                    </div>
                    
                    <div class="course-actions">
                        <button class="action-btn save-btn ${isSaved ? 'primary' : ''}" data-crn="${course.crn}">
                            <i class="bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>
                            ${isSaved ? 'Saved' : 'Save'}
                        </button>
                        <button class="action-btn" onclick="window.open('${course.book_link}', '_blank')">
                            <i class="bi bi-book"></i>
                            Books
                        </button>
                        <button class="action-btn share-btn" data-course='${JSON.stringify({
                            subject: course.subject,
                            number: course.course_number,
                            title: course.title,
                            crn: course.crn
                        }).replace(/'/g, '&apos;')}'>
                            <i class="bi bi-share"></i>
                            Share
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderListView() {
        return `
            <div style="background: white; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--gray-50); border-bottom: 1px solid var(--gray-200);">
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Course</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Instructor</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Time</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Location</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Status</th>
                            <th style="padding: 1rem; text-align: center; font-weight: 600;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredCourses.map(course => {
                            const meeting = course.meeting_times[0] || {};
                            return `
                                <tr style="border-bottom: 1px solid var(--gray-100);">
                                    <td style="padding: 1rem;">
                                        <div style="font-weight: 600; color: var(--primary);">${course.subject} ${course.course_number}</div>
                                        <div style="font-size: 0.875rem; color: var(--gray-600);">${course.title}</div>
                                        <div style="font-size: 0.75rem; color: var(--gray-500);">CRN: ${course.crn} • ${course.units} units</div>
                                    </td>
                                    <td style="padding: 1rem; font-size: 0.875rem;">${course.instructor || 'TBA'}</td>
                                    <td style="padding: 1rem; font-size: 0.875rem;">${this.formatMeetingTime(meeting)}</td>
                                    <td style="padding: 1rem; font-size: 0.875rem;">${course.location || 'TBA'}</td>
                                    <td style="padding: 1rem;">
                                        <span class="course-status status-${course.status.toLowerCase()}">${course.status}</span>
                                    </td>
                                    <td style="padding: 1rem; text-align: center;">
                                        <button class="action-btn save-btn" data-crn="${course.crn}" style="padding: 0.375rem 0.75rem;">
                                            <i class="bi bi-bookmark"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    renderCalendarView() {
        const container = document.getElementById('calendarView');
        const days = ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const times = [];
        
        // Generate time slots from 7am to 10pm
        for (let hour = 7; hour <= 22; hour++) {
            times.push(`${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`);
        }
        
        let html = '<div class="calendar-grid">';
        
        // Header
        days.forEach(day => {
            html += `<div class="calendar-header">${day}</div>`;
        });
        
        // Time slots and cells
        times.forEach((time, timeIndex) => {
            html += `<div class="time-slot">${time}</div>`;
            for (let day = 1; day <= 7; day++) {
                html += `<div class="calendar-cell" data-day="${day}" data-hour="${7 + timeIndex}"></div>`;
            }
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Add courses to calendar
        this.filteredCourses.forEach(course => {
            if (!course.meeting_times || course.meeting_times.length === 0) return;
            const meeting = course.meeting_times[0];
            if (!meeting.days || meeting.days === 'ARR' || meeting.days === 'TBA') return;
            if (!meeting.start_time || !meeting.end_time) return;
            
            const dayMap = { 'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5, 'S': 6, 'U': 7 };
            const days = meeting.days.split('');
            
            days.forEach(day => {
                const dayNum = dayMap[day];
                if (!dayNum) return;
                
                const startHour = this.parseTime(meeting.start_time);
                const endHour = this.parseTime(meeting.end_time);
                
                for (let hour = Math.floor(startHour); hour < Math.ceil(endHour); hour++) {
                    const cell = container.querySelector(`[data-day="${dayNum}"][data-hour="${hour}"]`);
                    if (cell) {
                        const event = document.createElement('div');
                        event.className = 'calendar-event';
                        event.style.top = `${(startHour - hour) * 100}%`;
                        event.style.height = `${Math.min(endHour - startHour, hour + 1 - startHour) * 100}%`;
                        event.innerHTML = `
                            <div style="font-weight: 600;">${course.subject} ${course.course_number}</div>
                            <div style="font-size: 0.625rem;">${course.location}</div>
                        `;
                        event.addEventListener('click', () => this.showCourseDetails(course));
                        cell.appendChild(event);
                    }
                }
            });
        });
    }
    
    parseTime(timeStr) {
        const [time, period] = timeStr.split(/(?=[ap]m)/i);
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        
        if (period.toLowerCase() === 'pm' && hours !== 12) {
            hour24 += 12;
        } else if (period.toLowerCase() === 'am' && hours === 12) {
            hour24 = 0;
        }
        
        return hour24 + (minutes / 60);
    }
    
    formatMeetingTime(meeting) {
        if (!meeting.days || meeting.days === 'ARR') return 'Arranged';
        if (meeting.days === 'TBA') return 'TBA';
        
        const days = meeting.days;
        const time = meeting.start_time && meeting.end_time 
            ? `${meeting.start_time} - ${meeting.end_time}` 
            : 'TBA';
        
        return `${days} ${time}`;
    }
    
    attachCardEventListeners() {
        // Save buttons
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSavedCourse(btn.dataset.crn);
            });
        });
        
        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const courseData = JSON.parse(btn.dataset.course.replace(/&apos;/g, "'"));
                this.shareCourse(courseData);
            });
        });
        
        // Card click for details
        document.querySelectorAll('.course-card').forEach(card => {
            card.addEventListener('click', () => {
                const course = this.courses.find(c => c.crn === card.dataset.crn);
                if (course) this.showCourseDetails(course);
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
        this.render();
    }
    
    loadSavedCourses() {
        const saved = localStorage.getItem('savedCourses');
        return saved ? JSON.parse(saved) : [];
    }
    
    shareCourse(course) {
        const text = `Check out ${course.subject} ${course.number}: ${course.title} (CRN: ${course.crn}) at Rio Hondo College!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Rio Hondo Course',
                text: text,
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                alert('Course info copied to clipboard!');
            });
        }
    }
    
    showCourseDetails(course) {
        // For now, just log - in a real app, this would show a modal
        console.log('Course details:', course);
        alert(`${course.subject} ${course.course_number}: ${course.title}\n\nCRN: ${course.crn}\nInstructor: ${course.instructor}\nStatus: ${course.status}`);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ModernSchedule();
});