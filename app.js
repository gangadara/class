// ============================================
// Media Studies A/L - Online Learning Portal
// Complete JavaScript Application
// ============================================

// ============================================
// Data Manager - LocalStorage Operations
// ============================================

const DataManager = {
    // Keys
    KEYS: {
        BRANDING: 'portal_branding',
        ADMIN: 'portal_admin',
        STUDENTS: 'portal_students',
        NOTES: 'portal_notes',
        TUTORIALS: 'portal_tutorials',
        VIDEOS: 'portal_videos',
        NOTICES: 'portal_notices',
        SESSION: 'portal_session'
    },

    // Default Data
    defaults: {
        branding: {
            siteName: 'Media Studies A/L',
            teacherName: '',
            className: '',
            tagline: 'Online Learning Portal',
            logo: '',
            primaryColor: '#6366f1',
            secondaryColor: '#8b5cf6',
            contactEmail: '',
            contactPhone: '',
            whatsapp: '',
            facebook: '',
            youtube: '',
            footerText: ''
        },
        admin: {
            email: 'admin@admin.com',
            password: 'admin123'
        }
    },

    // Initialize
    init() {
        if (!localStorage.getItem(this.KEYS.ADMIN)) {
            this.set(this.KEYS.ADMIN, this.defaults.admin);
        }
        if (!localStorage.getItem(this.KEYS.BRANDING)) {
            this.set(this.KEYS.BRANDING, this.defaults.branding);
        }
        if (!localStorage.getItem(this.KEYS.STUDENTS)) {
            this.set(this.KEYS.STUDENTS, []);
        }
        if (!localStorage.getItem(this.KEYS.NOTES)) {
            this.set(this.KEYS.NOTES, []);
        }
        if (!localStorage.getItem(this.KEYS.TUTORIALS)) {
            this.set(this.KEYS.TUTORIALS, []);
        }
        if (!localStorage.getItem(this.KEYS.VIDEOS)) {
            this.set(this.KEYS.VIDEOS, []);
        }
        if (!localStorage.getItem(this.KEYS.NOTICES)) {
            this.set(this.KEYS.NOTICES, []);
        }
    },

    // Get data
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // Set data
    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Session management
    saveSession(type, user) {
        this.set(this.KEYS.SESSION, { type, user, timestamp: Date.now() });
    },

    getSession() {
        return this.get(this.KEYS.SESSION);
    },

    clearSession() {
        localStorage.removeItem(this.KEYS.SESSION);
    },

    // Generate ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// ============================================
// Application State
// ============================================

const App = {
    currentUser: null,
    isAdmin: false,
    theme: localStorage.getItem('theme') || 'light',

    // Initialize app
    init() {
        DataManager.init();
        this.applyTheme();
        this.bindEvents();
        this.checkSession();
        this.applyBranding();
    },

    // Check for existing session
    checkSession() {
        const session = DataManager.getSession();
        if (session) {
            // Check if session is less than 24 hours old
            const hoursSinceLogin = (Date.now() - session.timestamp) / (1000 * 60 * 60);
            if (hoursSinceLogin < 24) {
                if (session.type === 'admin') {
                    this.isAdmin = true;
                    this.currentUser = session.user;
                    this.showAdminDashboard();
                } else if (session.type === 'student') {
                    this.currentUser = session.user;
                    this.showStudentDashboard();
                }
                return;
            }
        }
        this.showLoginPage();
    },

    // Apply theme
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    },

    // Toggle theme
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    },

    // Apply branding
    applyBranding() {
        const branding = DataManager.get(DataManager.KEYS.BRANDING);
        if (!branding) return;

        // Update CSS variables
        document.documentElement.style.setProperty('--primary', branding.primaryColor);
        document.documentElement.style.setProperty('--secondary', branding.secondaryColor);

        // Update login page
        document.getElementById('loginSiteName').textContent = branding.siteName;
        document.getElementById('loginTagline').textContent = branding.tagline;

        // Update header
        const headerSiteName = document.getElementById('headerSiteName');
        if (headerSiteName) headerSiteName.textContent = branding.siteName;

        // Update logo
        if (branding.logo) {
            const loginLogo = document.getElementById('loginLogo');
            const headerLogo = document.getElementById('headerLogo');
            
            if (loginLogo) {
                loginLogo.innerHTML = `<img src="${branding.logo}" alt="Logo">`;
            }
            if (headerLogo) {
                headerLogo.innerHTML = `<img src="${branding.logo}" alt="Logo">`;
            }
        }
    },

    // Show pages
    showLoginPage() {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('loginPage').classList.add('active');
    },

    showStudentDashboard() {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('studentDashboard').classList.add('active');
        this.updateStudentUI();
        this.loadStudentDashboard();
    },

    showAdminDashboard() {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('adminDashboard').classList.add('active');
        this.loadAdminOverview();
    },

    // Update student UI
    updateStudentUI() {
        if (!this.currentUser) return;

        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('welcomeName').textContent = this.currentUser.name.split(' ')[0];
        document.getElementById('userAvatar').textContent = this.currentUser.name.charAt(0).toUpperCase();

        const statusBadge = document.querySelector('#studentStatus .status-badge');
        if (this.currentUser.isPaid) {
            statusBadge.textContent = 'Paid Student';
            statusBadge.className = 'status-badge paid';
        } else {
            statusBadge.textContent = 'Free Student';
            statusBadge.className = 'status-badge free';
        }
    },

    // Logout
    logout() {
        this.currentUser = null;
        this.isAdmin = false;
        DataManager.clearSession();
        this.showLoginPage();
    },

    // Bind events
    bindEvents() {
        // Theme toggles
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
        document.getElementById('adminThemeToggle')?.addEventListener('click', () => this.toggleTheme());

        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleStudentLogin(e));

        // Admin login
        document.getElementById('adminLoginBtn')?.addEventListener('click', () => {
            document.getElementById('adminLoginModal').classList.add('active');
        });
        document.getElementById('closeAdminLogin')?.addEventListener('click', () => {
            document.getElementById('adminLoginModal').classList.remove('active');
        });
        document.getElementById('adminLoginForm')?.addEventListener('submit', (e) => this.handleAdminLogin(e));

        // Logout buttons
        document.getElementById('studentLogoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('adminLogoutBtn')?.addEventListener('click', () => this.logout());

        // Mobile menu
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
        document.getElementById('adminMobileMenuBtn')?.addEventListener('click', () => {
            document.getElementById('adminSidebar').classList.toggle('open');
        });

        // Student navigation
        document.querySelectorAll('#sidebar .nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateStudent(page);
            });
        });

        // Admin navigation
        document.querySelectorAll('#adminSidebar .nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.adminPage;
                this.navigateAdmin(page);
            });
        });

        // Admin add buttons
        document.getElementById('addStudentBtn')?.addEventListener('click', () => openModal('student'));
        document.getElementById('addNoteBtn')?.addEventListener('click', () => openModal('note'));
        document.getElementById('addTutorialBtn')?.addEventListener('click', () => openModal('tutorial'));
        document.getElementById('addVideoBtn')?.addEventListener('click', () => openModal('video'));
        document.getElementById('addNoticeBtn')?.addEventListener('click', () => openModal('notice'));

        // Forms
        document.getElementById('studentForm')?.addEventListener('submit', (e) => this.saveStudent(e));
        document.getElementById('noteForm')?.addEventListener('submit', (e) => this.saveNote(e));
        document.getElementById('tutorialForm')?.addEventListener('submit', (e) => this.saveTutorial(e));
        document.getElementById('videoForm')?.addEventListener('submit', (e) => this.saveVideo(e));
        document.getElementById('noticeForm')?.addEventListener('submit', (e) => this.saveNotice(e));
        document.getElementById('brandingForm')?.addEventListener('submit', (e) => this.saveBranding(e));
        document.getElementById('adminCredentialsForm')?.addEventListener('submit', (e) => this.saveAdminCredentials(e));

        // Video type toggle
        document.getElementById('videoType')?.addEventListener('change', (e) => {
            const isYoutube = e.target.value === 'youtube';
            document.getElementById('youtubeUrlGroup').style.display = isYoutube ? 'block' : 'none';
            document.getElementById('videoFileGroup').style.display = isYoutube ? 'none' : 'block';
        });

        // Notice type toggle
        document.getElementById('noticeType')?.addEventListener('change', (e) => {
            const isBanner = e.target.value === 'banner';
            document.getElementById('bannerImageGroup').style.display = isBanner ? 'block' : 'none';
        });

        // File inputs
        this.bindFileInputs();

        // Filters
        this.bindFilters();

        // Export/Import
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('importDataFile')?.addEventListener('change', (e) => this.importData(e));
        document.getElementById('resetAllDataBtn')?.addEventListener('click', () => this.resetAllData());

        // Close modals
        document.getElementById('closeVideoPlayer')?.addEventListener('click', () => {
            document.getElementById('videoPlayerModal').classList.remove('active');
            document.getElementById('videoContainer').innerHTML = '';
        });

        document.getElementById('closePdfViewer')?.addEventListener('click', () => {
            document.getElementById('pdfViewerModal').classList.remove('active');
            document.getElementById('pdfFrame').src = '';
        });

        // Logo handling
        document.getElementById('logoFile')?.addEventListener('change', (e) => this.handleLogoUpload(e));
        document.getElementById('removeLogo')?.addEventListener('click', () => this.removeLogo());

        // Color inputs sync
        document.getElementById('primaryColor')?.addEventListener('input', (e) => {
            document.getElementById('primaryColorText').value = e.target.value;
        });
        document.getElementById('primaryColorText')?.addEventListener('input', (e) => {
            document.getElementById('primaryColor').value = e.target.value;
        });
        document.getElementById('secondaryColor')?.addEventListener('input', (e) => {
            document.getElementById('secondaryColorText').value = e.target.value;
        });
        document.getElementById('secondaryColorText')?.addEventListener('input', (e) => {
            document.getElementById('secondaryColor').value = e.target.value;
        });

        // Color presets
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const primary = preset.dataset.primary;
                const secondary = preset.dataset.secondary;
                document.getElementById('primaryColor').value = primary;
                document.getElementById('primaryColorText').value = primary;
                document.getElementById('secondaryColor').value = secondary;
                document.getElementById('secondaryColorText').value = secondary;
            });
        });
    },

    // Bind file inputs
    bindFileInputs() {
        const fileInputs = [
            { input: 'noteFile', display: 'noteFileName' },
            { input: 'tutorialFile', display: 'tutorialFileName' },
            { input: 'videoFile', display: 'videoFileName' },
            { input: 'videoThumbnail', display: 'videoThumbnailName' },
            { input: 'bannerImage', display: 'bannerImageName' }
        ];

        fileInputs.forEach(({ input, display }) => {
            document.getElementById(input)?.addEventListener('change', (e) => {
                const fileName = e.target.files[0]?.name || 'No file selected';
                document.getElementById(display).textContent = fileName;
            });
        });
    },

    // Bind filters
    bindFilters() {
        // Notes filters
        document.getElementById('notesAccessFilter')?.addEventListener('change', () => this.loadNotes());
        document.getElementById('notesMonthFilter')?.addEventListener('change', () => this.loadNotes());

        // Tutorials filters
        document.getElementById('tutorialsTypeFilter')?.addEventListener('change', () => this.loadTutorials());
        document.getElementById('tutorialsAccessFilter')?.addEventListener('change', () => this.loadTutorials());
        document.getElementById('tutorialsMonthFilter')?.addEventListener('change', () => this.loadTutorials());

        // Videos filters
        document.getElementById('videosAccessFilter')?.addEventListener('change', () => this.loadVideos());
        document.getElementById('videosMonthFilter')?.addEventListener('change', () => this.loadVideos());
    },

    // Handle student login
    handleStudentLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const students = DataManager.get(DataManager.KEYS.STUDENTS) || [];
        const student = students.find(s => s.email === email && s.password === password);

        if (student) {
            // Check expiry for paid students
            if (student.isPaid && student.expiryDate) {
                const expiry = new Date(student.expiryDate);
                if (expiry < new Date()) {
                    student.isPaid = false;
                    DataManager.set(DataManager.KEYS.STUDENTS, students);
                    showToast('Your paid subscription has expired', 'warning');
                }
            }

            this.currentUser = student;
            DataManager.saveSession('student', student);
            this.showStudentDashboard();
            showToast('Welcome back, ' + student.name + '!', 'success');
        } else {
            showToast('Invalid email or password', 'error');
        }
    },

    // Handle admin login
    handleAdminLogin(e) {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        const admin = DataManager.get(DataManager.KEYS.ADMIN);

        if (admin && admin.email === email && admin.password === password) {
            this.isAdmin = true;
            this.currentUser = { email: admin.email, name: 'Admin' };
            DataManager.saveSession('admin', this.currentUser);
            document.getElementById('adminLoginModal').classList.remove('active');
            this.showAdminDashboard();
            showToast('Welcome, Admin!', 'success');
        } else {
            showToast('Invalid admin credentials', 'error');
        }
    },

    // Navigate student pages
    navigateStudent(page) {
        document.querySelectorAll('#sidebar .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(page + 'Section').classList.add('active');
        document.getElementById('sidebar').classList.remove('open');

        // Load content
        switch(page) {
            case 'dashboard': this.loadStudentDashboard(); break;
            case 'notes': this.loadNotes(); break;
            case 'tutorials': this.loadTutorials(); break;
            case 'videos': this.loadVideos(); break;
        }
    },

    // Navigate admin pages
    navigateAdmin(page) {
        document.querySelectorAll('#adminSidebar .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.adminPage === page);
        });
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        const sectionMap = {
            'overview': 'overviewSection',
            'branding': 'brandingSection',
            'notices': 'noticesSection',
            'students': 'studentsSection',
            'admin-notes': 'adminNotesSection',
            'admin-tutorials': 'adminTutorialsSection',
            'admin-videos': 'adminVideosSection',
            'settings': 'settingsSection'
        };

        document.getElementById(sectionMap[page]).classList.add('active');
        document.getElementById('adminSidebar').classList.remove('open');

        // Load content
        switch(page) {
            case 'overview': this.loadAdminOverview(); break;
            case 'branding': this.loadBrandingForm(); break;
            case 'notices': this.loadAdminNotices(); break;
            case 'students': this.loadAdminStudents(); break;
            case 'admin-notes': this.loadAdminNotes(); break;
            case 'admin-tutorials': this.loadAdminTutorials(); break;
            case 'admin-videos': this.loadAdminVideos(); break;
        }
    },

    // ============================================
    // Student Dashboard Functions
    // ============================================

    loadStudentDashboard() {
        const notes = DataManager.get(DataManager.KEYS.NOTES) || [];
        const tutorials = DataManager.get(DataManager.KEYS.TUTORIALS) || [];
        const videos = DataManager.get(DataManager.KEYS.VIDEOS) || [];
        const notices = DataManager.get(DataManager.KEYS.NOTICES) || [];
        const isPaid = this.currentUser?.isPaid;

        // Filter content based on paid status
        const accessibleNotes = notes.filter(n => !n.paidOnly || isPaid);
        const accessibleTutorials = tutorials.filter(t => !t.paidOnly || isPaid);
        const accessibleVideos = videos.filter(v => !v.paidOnly || isPaid);

        // Update stats
        document.getElementById('statNotes').textContent = accessibleNotes.length;
        document.getElementById('statTutorials').textContent = accessibleTutorials.length;
        document.getElementById('statVideos').textContent = accessibleVideos.length;

        // Load notices and banners
        this.loadNoticesBanners(notices);

        // Load recent items
        this.loadRecentNotes(notes.slice(-3).reverse());
        this.loadRecentVideos(videos.slice(-3).reverse());

        // Populate month filters
        this.populateMonthFilters();
    },

    loadNoticesBanners(notices) {
        const container = document.getElementById('noticesBanners');
        const activeNotices = notices.filter(n => n.active);

        if (activeNotices.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = activeNotices.map(notice => {
            if (notice.type === 'banner' && notice.image) {
                return `<div class="banner-item"><img src="${notice.image}" alt="${notice.title}"></div>`;
            } else {
                return `
                    <div class="notice-item ${notice.priority}">
                        <svg class="notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${notice.priority === 'urgent' ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' : '<path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>'}
                        </svg>
                        <div class="notice-content">
                            <h4>${notice.title}</h4>
                            ${notice.content ? `<p>${notice.content}</p>` : ''}
                        </div>
                    </div>
                `;
            }
        }).join('');
    },

    loadRecentNotes(notes) {
        const container = document.getElementById('recentNotes');
        if (notes.length === 0) {
            container.innerHTML = '<p class="empty-state">No notes available yet</p>';
            return;
        }

        container.innerHTML = notes.map(note => `
            <div class="recent-item">
                <div class="recent-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <div class="recent-item-info">
                    <div class="recent-item-title">${note.title}</div>
                    <div class="recent-item-meta">${note.paidOnly ? 'Paid' : 'Free'} • ${formatMonth(note.month)}</div>
                </div>
            </div>
        `).join('');
    },

    loadRecentVideos(videos) {
        const container = document.getElementById('recentVideos');
        if (videos.length === 0) {
            container.innerHTML = '<p class="empty-state">No videos available yet</p>';
            return;
        }

        container.innerHTML = videos.map(video => `
            <div class="recent-item">
                <div class="recent-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                </div>
                <div class="recent-item-info">
                    <div class="recent-item-title">${video.title}</div>
                    <div class="recent-item-meta">${video.duration || 'N/A'} • ${formatMonth(video.month)}</div>
                </div>
            </div>
        `).join('');
    },

    populateMonthFilters() {
        const notes = DataManager.get(DataManager.KEYS.NOTES) || [];
        const tutorials = DataManager.get(DataManager.KEYS.TUTORIALS) || [];
        const videos = DataManager.get(DataManager.KEYS.VIDEOS) || [];

        const allMonths = new Set();
        [...notes, ...tutorials, ...videos].forEach(item => {
            if (item.month) allMonths.add(item.month);
        });

        const sortedMonths = Array.from(allMonths).sort().reverse();
        const monthOptions = '<option value="all">All Months</option>' + 
            sortedMonths.map(m => `<option value="${m}">${formatMonth(m)}</option>`).join('');

        document.getElementById('notesMonthFilter').innerHTML = monthOptions;
        document.getElementById('tutorialsMonthFilter').innerHTML = monthOptions;
        document.getElementById('videosMonthFilter').innerHTML = monthOptions;
    },

    // Load Notes
    loadNotes() {
        const notes = DataManager.get(DataManager.KEYS.NOTES) || [];
        const container = document.getElementById('notesList');
        const accessFilter = document.getElementById('notesAccessFilter').value;
        const monthFilter = document.getElementById('notesMonthFilter').value;
        const isPaid = this.currentUser?.isPaid;

        let filtered = notes;

        // Apply access filter
        if (accessFilter === 'free') {
            filtered = filtered.filter(n => !n.paidOnly);
        } else if (accessFilter === 'paid') {
            filtered = filtered.filter(n => n.paidOnly);
        }

        // Apply month filter
        if (monthFilter !== 'all') {
            filtered = filtered.filter(n => n.month === monthFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">No notes found</p>';
            return;
        }

        container.innerHTML = filtered.map(note => {
            const isLocked = note.paidOnly && !isPaid;
            return `
                <div class="content-card ${isLocked ? 'locked' : ''}">
                    <div class="card-thumbnail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        ${isLocked ? `
                            <div class="locked-overlay">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <span>Paid Students Only</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-body">
                        <span class="card-badge ${note.paidOnly ? 'paid' : 'free'}">${note.paidOnly ? 'Paid' : 'Free'}</span>
                        <h3 class="card-title">${note.title}</h3>
                        <p class="card-description">${note.description || 'No description'}</p>
                        <div class="card-meta">
                            <span>📅 ${formatMonth(note.month)}</span>
                        </div>
                        ${!isLocked ? `
                            <div class="card-actions">
                                <button class="btn btn-secondary btn-sm" onclick="App.viewPdf('${note.id}', 'note')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    View
                                </button>
                                ${note.downloadable ? `
                                    <button class="btn btn-primary btn-sm" onclick="App.downloadFile('${note.id}', 'note')">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        Download
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    // Load Tutorials
    loadTutorials() {
        const tutorials = DataManager.get(DataManager.KEYS.TUTORIALS) || [];
        const container = document.getElementById('tutorialsList');
        const typeFilter = document.getElementById('tutorialsTypeFilter').value;
        const accessFilter = document.getElementById('tutorialsAccessFilter').value;
        const monthFilter = document.getElementById('tutorialsMonthFilter').value;
        const isPaid = this.currentUser?.isPaid;

        let filtered = tutorials;

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // Apply access filter
        if (accessFilter === 'free') {
            filtered = filtered.filter(t => !t.paidOnly);
        } else if (accessFilter === 'paid') {
            filtered = filtered.filter(t => t.paidOnly);
        }

        // Apply month filter
        if (monthFilter !== 'all') {
            filtered = filtered.filter(t => t.month === monthFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">No tutorials found</p>';
            return;
        }

        container.innerHTML = filtered.map(tutorial => {
            const isLocked = tutorial.paidOnly && !isPaid;
            return `
                <div class="content-card ${isLocked ? 'locked' : ''}">
                    <div class="card-thumbnail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        ${isLocked ? `
                            <div class="locked-overlay">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <span>Paid Students Only</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-body">
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <span class="card-badge ${tutorial.type}">${tutorial.type === 'new' ? 'New' : 'Old Paper'}</span>
                            <span class="card-badge ${tutorial.paidOnly ? 'paid' : 'free'}">${tutorial.paidOnly ? 'Paid' : 'Free'}</span>
                        </div>
                        <h3 class="card-title">${tutorial.title}</h3>
                        <p class="card-description">${tutorial.description || 'No description'}</p>
                        <div class="card-meta">
                            <span>📅 ${formatMonth(tutorial.month)}</span>
                        </div>
                        ${!isLocked ? `
                            <div class="card-actions">
                                <button class="btn btn-secondary btn-sm" onclick="App.viewPdf('${tutorial.id}', 'tutorial')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    View
                                </button>
                                ${tutorial.downloadable ? `
                                    <button class="btn btn-primary btn-sm" onclick="App.downloadFile('${tutorial.id}', 'tutorial')">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        Download
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    // Load Videos
    loadVideos() {
        const videos = DataManager.get(DataManager.KEYS.VIDEOS) || [];
        const container = document.getElementById('videosList');
        const accessFilter = document.getElementById('videosAccessFilter').value;
        const monthFilter = document.getElementById('videosMonthFilter').value;
        const isPaid = this.currentUser?.isPaid;

        let filtered = videos;

        // Apply access filter
        if (accessFilter === 'free') {
            filtered = filtered.filter(v => !v.paidOnly);
        } else if (accessFilter === 'paid') {
            filtered = filtered.filter(v => v.paidOnly);
        }

        // Apply month filter
        if (monthFilter !== 'all') {
            filtered = filtered.filter(v => v.month === monthFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">No videos found</p>';
            return;
        }

        container.innerHTML = filtered.map(video => {
            const isLocked = video.paidOnly && !isPaid;
            const thumbnail = video.thumbnail || this.getYoutubeThumbnail(video.youtubeUrl);
            
            return `
                <div class="content-card ${isLocked ? 'locked' : ''}">
                    <div class="card-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${video.title}">` : `
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                        `}
                        ${!isLocked ? `
                            <div class="card-play-btn" onclick="App.playVideo('${video.id}')">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                            </div>
                        ` : `
                            <div class="locked-overlay">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <span>Paid Students Only</span>
                            </div>
                        `}
                        ${video.duration ? `<span class="card-duration">${video.duration}</span>` : ''}
                    </div>
                    <div class="card-body">
                        <span class="card-badge ${video.paidOnly ? 'paid' : 'free'}">${video.paidOnly ? 'Paid' : 'Free'}</span>
                        <h3 class="card-title">${video.title}</h3>
                        <p class="card-description">${video.description || 'No description'}</p>
                        <div class="card-meta">
                            <span>📅 ${formatMonth(video.month)}</span>
                            ${video.duration ? `<span>⏱️ ${video.duration}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Get YouTube thumbnail
    getYoutubeThumbnail(url) {
        if (!url) return null;
        const videoId = this.extractYoutubeId(url);
        return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
    },

    // Extract YouTube video ID
    extractYoutubeId(url) {
        if (!url) return null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    },

    // Play video
    playVideo(id) {
        const videos = DataManager.get(DataManager.KEYS.VIDEOS) || [];
        const video = videos.find(v => v.id === id);
        if (!video) return;

        const modal = document.getElementById('videoPlayerModal');
        const container = document.getElementById('videoContainer');
        const title = document.getElementById('videoPlayerTitle');
        const watermark = document.getElementById('videoWatermark');

        title.textContent = video.title;
        
        const branding = DataManager.get(DataManager.KEYS.BRANDING);
        watermark.textContent = branding?.siteName || 'Protected Content';

        if (video.type === 'youtube' && video.youtubeUrl) {
            const videoId = this.extractYoutubeId(video.youtubeUrl);
            if (videoId) {
                container.innerHTML = `
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
            } else {
                showToast('Invalid YouTube URL', 'error');
                return;
            }
        } else if (video.file) {
            const downloadAttr = video.downloadable ? '' : 'controlsList="nodownload"';
            container.innerHTML = `
                <video ${downloadAttr} controls autoplay oncontextmenu="return false;">
                    <source src="${video.file}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }

        modal.classList.add('active');

        // Disable right-click
        container.oncontextmenu = () => false;
    },

    // View PDF
    viewPdf(id, type) {
        const key = type === 'note' ? DataManager.KEYS.NOTES : DataManager.KEYS.TUTORIALS;
        const items = DataManager.get(key) || [];
        const item = items.find(i => i.id === id);
        if (!item || !item.file) {
            showToast('File not found', 'error');
            return;
        }

        const modal = document.getElementById('pdfViewerModal');
        const frame = document.getElementById('pdfFrame');
        const title = document.getElementById('pdfViewerTitle');
        const downloadBtn = document.getElementById('pdfDownloadBtn');

        title.textContent = item.title;
        frame.src = item.file;

        if (item.downloadable) {
            downloadBtn.style.display = 'inline-flex';
            downloadBtn.onclick = () => this.downloadFile(id, type);
        } else {
            downloadBtn.style.display = 'none';
        }

        modal.classList.add('active');
    },

    // Download file
    downloadFile(id, type) {
        const key = type === 'note' ? DataManager.KEYS.NOTES : DataManager.KEYS.TUTORIALS;
        const items = DataManager.get(key) || [];
        const item = items.find(i => i.id === id);
        if (!item || !item.file) {
            showToast('File not found', 'error');
            return;
        }

        if (!item.downloadable) {
            showToast('Download not allowed for this file', 'error');
            return;
        }

        const link = document.createElement('a');
        link.href = item.file;
        link.download = item.title + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Download started', 'success');
    },

    // ============================================
    // Admin Functions
    // ============================================

    loadAdminOverview() {
        const students = DataManager.get(DataManager.KEYS.STUDENTS) || [];
        const notes = DataManager.get(DataManager.KEYS.NOTES) || [];
        const tutorials = DataManager.get(DataManager.KEYS.TUTORIALS) || [];
        const videos = DataManager.get(DataManager.KEYS.VIDEOS) || [];

        document.getElementById('adminStatStudents').textContent = students.length;
        document.getElementById('adminStatPaid').textContent = students.filter(s => s.isPaid).length;
        document.getElementById('adminStatNotes').textContent = notes.length;
        document.getElementById('adminStatVideos').textContent = videos.length;
    },

    loadBrandingForm() {
        const branding = DataManager.get(DataManager.KEYS.BRANDING);
        if (!branding) return;

        document.getElementById('siteName').value = branding.siteName || '';
        document.getElementById('teacherName').value = branding.teacherName || '';
        document.getElementById('className').value = branding.className || '';
        document.getElementById('tagline').value = branding.tagline || '';
        document.getElementById('primaryColor').value = branding.primaryColor || '#6366f1';
        document.getElementById('primaryColorText').value = branding.primaryColor || '#6366f1';
        document.getElementById('secondaryColor').value = branding.secondaryColor || '#8b5cf6';
        document.getElementById('secondaryColorText').value = branding.secondaryColor || '#8b5cf6';
        document.getElementById('contactEmail').value = branding.contactEmail || '';
        document.getElementById('contactPhone').value = branding.contactPhone || '';
        document.getElementById('whatsapp').value = branding.whatsapp || '';
        document.getElementById('facebook').value = branding.facebook || '';
        document.getElementById('youtube').value = branding.youtube || '';
        document.getElementById('footerText').value = branding.footerText || '';

        if (branding.logo) {
            document.getElementById('logoPreview').innerHTML = `<img src="${branding.logo}" alt="Logo">`;
        }
    },

    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('logoPreview').innerHTML = `<img src="${event.target.result}" alt="Logo">`;
        };
        reader.readAsDataURL(file);
    },

    removeLogo() {
        document.getElementById('logoPreview').innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `;
        document.getElementById('logoFile').value = '';
    },

    saveBranding(e) {
        e.preventDefault();
        
        const logoPreview = document.getElementById('logoPreview').querySelector('img');
        const logo = logoPreview ? logoPreview.src : '';

        const branding = {
            siteName: document.getElementById('siteName').value,
            teacherName: document.getElementById('teacherName').value,
            className: document.getElementById('className').value,
            tagline: document.getElementById('tagline').value,
            logo: logo,
            primaryColor: document.getElementById('primaryColor').value,
            secondaryColor: document.getElementById('secondaryColor').value,
            contactEmail: document.getElementById('contactEmail').value,
            contactPhone: document.getElementById('contactPhone').value,
            whatsapp: document.getElementById('whatsapp').value,
            facebook: document.getElementById('facebook').value,
            youtube: document.getElementById('youtube').value,
            footerText: document.getElementById('footerText').value
        };

        DataManager.set(DataManager.KEYS.BRANDING, branding);
        this.applyBranding();
        showToast('Branding saved successfully!', 'success');
    },

    // Admin Notices
    loadAdminNotices() {
        const notices = DataManager.get(DataManager.KEYS.NOTICES) || [];
        const tbody = document.getElementById('noticesTableBody');

        if (notices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No notices added yet</td></tr>';
            return;
        }

        tbody.innerHTML = notices.map(notice => `
            <tr>
                <td>${notice.title}</td>
                <td><span class="table-badge ${notice.type}">${notice.type}</span></td>
                <td><span class="table-badge ${notice.active ? 'active' : 'inactive'}">${notice.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="App.editNotice('${notice.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteNotice('${notice.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    saveNotice(e) {
        e.preventDefault();
        const id = document.getElementById('noticeId').value;
        const notices = DataManager.get(DataManager.KEYS.NOTICES) || [];

        const bannerImageInput = document.getElementById('bannerImage');
        let bannerImage = '';
        
        if (bannerImageInput.files[0]) {
            // This would need async handling in real implementation
            const reader = new FileReader();
            reader.onload = (event) => {
                bannerImage = event.target.result;
                this.finishSaveNotice(id, notices, bannerImage);
            };
            reader.readAsDataURL(bannerImageInput.files[0]);
        } else {
            // Keep existing image if editing
            const existing = notices.find(n => n.id === id);
            bannerImage = existing?.image || '';
            this.finishSaveNotice(id, notices, bannerImage);
        }
    },

    finishSaveNotice(id, notices, bannerImage) {
        const notice = {
            id: id || DataManager.generateId(),
            title: document.getElementById('noticeTitle').value,
            content: document.getElementById('noticeContent').value,
            type: document.getElementById('noticeType').value,
            priority: document.getElementById('noticePriority').value,
            active: document.getElementById('noticeActive').checked,
            image: bannerImage
        };

        if (id) {
            const index = notices.findIndex(n => n.id === id);
            notices[index] = notice;
        } else {
            notices.push(notice);
        }

        DataManager.set(DataManager.KEYS.NOTICES, notices);
        closeModal('noticeModal');
        this.loadAdminNotices();
        showToast('Notice saved successfully!', 'success');
    },

    editNotice(id) {
        const notices = DataManager.get(DataManager.KEYS.NOTICES) || [];
        const notice = notices.find(n => n.id === id);
        if (!notice) return;

        document.getElementById('noticeId').value = notice.id;
        document.getElementById('noticeTitle').value = notice.title;
        document.getElementById('noticeContent').value = notice.content || '';
        document.getElementById('noticeType').value = notice.type;
        document.getElementById('noticePriority').value = notice.priority;
        document.getElementById('noticeActive').checked = notice.active;
        document.getElementById('noticeModalTitle').textContent = 'Edit Notice/Banner';
        
        document.getElementById('bannerImageGroup').style.display = notice.type === 'banner' ? 'block' : 'none';

        openModal('notice');
    },

    deleteNotice(id) {
        if (!confirm('Are you sure you want to delete this notice?')) return;

        const notices = DataManager.get(DataManager.KEYS.NOTICES) || [];
        const filtered = notices.filter(n => n.id !== id);
        DataManager.set(DataManager.KEYS.NOTICES, filtered);
        this.loadAdminNotices();
        showToast('Notice deleted', 'success');
    },

    // Admin Students
    loadAdminStudents() {
        const students = DataManager.get(DataManager.KEYS.STUDENTS) || [];
        const tbody = document.getElementById('studentsTableBody');

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No students added yet</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(student => `
            <tr>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td><span class="table-badge ${student.isPaid ? 'paid' : 'free'}">${student.isPaid ? 'Paid' : 'Free'}</span></td>
                <td>${student.expiryDate || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="App.editStudent('${student.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteStudent('${student.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    saveStudent(e) {
        e.preventDefault();
        const id = document.getElementById('studentId').value;
        const students = DataManager.get(DataManager.KEYS.STUDENTS) || [];

        const student = {
            id: id || DataManager.generateId(),
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value,
            password: document.getElementById('studentPassword').value || (students.find(s => s.id === id)?.password) || '123456',
            isPaid: document.getElementById('studentPaid').checked,
            expiryDate: document.getElementById('studentExpiry').value
        };

        if (id) {
            const index = students.findIndex(s => s.id === id);
            students[index] = student;
        } else {
            students.push(student);
        }

        DataManager.set(DataManager.KEYS.STUDENTS, students);
        closeModal('studentModal');
        this.loadAdminStudents();
        showToast('Student saved successfully!', 'success');
    },

    editStudent(id) {
        const students = DataManager.get(DataManager.KEYS.STUDENTS) || [];
        const student = students.find(s => s.id === id);
        if (!student) return;

        document.getElementById('studentId').value = student.id;
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentEmail').value = student.email;
        document.getElementById('studentPassword').value = '';
        document.getElementById('studentPassword').placeholder = 'Leave blank to keep current';
        document.getElementById('studentPaid').checked = student.isPaid;
        document.getElementById('studentExpiry').value = student.expiryDate || '';
        document.getElementById('studentModalTitle').textContent = 'Edit Student';

        openModal('student');
    },

    deleteStudent(id) {
        if (!confirm('Are you sure you want to delete this student?')) return;

        const students = DataManager.get(DataManager.KEYS.STUDENTS) || [];
        const filtered = students.filter(s => s.id !== id);
        DataManager.set(DataManager.KEYS.STUDENTS, filtered);
        this.loadAdminStudents();
        showToast('Student deleted', 'success');
    },

    // Admin Notes
    loadAdminNotes() {
        const notes = DataManager.get(DataManager.KEYS.NOTES) || [];
        const tbody = document.getElementById('notesTableBody');

        if (notes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No notes added yet</td></tr>';
            return;
        }

        tbody.innerHTML = notes.map(note => `
            <tr>
                <td>${note.title}</td>
                <td>${formatMonth(note.month)}</td>
                <td><span class="table-badge ${note.paidOnly ? 'paid' : 'free'}">${note.paidOnly ? 'Paid' : 'Free'}</span></td>
                <td><span class="table-badge ${note.downloadable ? 'yes' : 'no'}">${note.downloadable ? 'Yes' : 'No'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="App.editNote('${note.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteNote('${note.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    saveNote(e) {
        e.preventDefault();
        const id = document.getElementById('noteId').value;
        const notes = DataManager.get(DataManager.KEYS.NOTES) || [];

        const fileInput = document.getElementById('noteFile');
        const existingNote = notes.find(n => n.id === id);

        if (fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.finishSaveNote(id, notes, event.target.result);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            this.finishSaveNote(id, notes, existingNote?.file || '');
        }
    },

    finishSaveNote(id, notes, fileData) {
        const note = {
            id: id || DataManager.generateId(),
            title: document.getElementById('noteTitle').value,
            description: document.getElementById('noteDescription').value,
            month: document.getElementById('noteMonth').value,
            file: fileData,
            paidOnly: document.getElementById('notePaidOnly').checked,
            downloadable: document.getElementById('noteDownloadable').checked
        };

        if (id) {
            const index = notes.findIndex(n => n.id === id);
            notes[index] = note;
        } else {
            notes.push(note);
        }

        DataManager.set(DataManager.KEYS.NOTES, notes);
        closeModal('noteModal');
        this.loadAdminNotes();
        showToast('Note saved successfully!', 'success');
    },

    editNote(id) {
        const notes = DataManager.get(DataManager.KEYS.NOTES) || [];
        const note = notes.find(n => n.id === id);
        if (!note) return;

        document.getElementById('noteId').value = note.id;
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteDescription').value = note.description || '';
        document.getElementById('noteMonth').value = note.month || '';
        document.getElementById('notePaidOnly').checked = note.paidOnly;
        document.getElementById('noteDownloadable').checked = note.downloadable;
        document.getElementById('noteFileName').textContent = note.file ? 'File uploaded' : 'No file selected';
        document.getElementById('noteModalTitle').textContent = 'Edit Note';

        openModal('note');
    },

    deleteNote(id) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        const notes = DataManager.get(DataManager.KEYS.NOTES) || [];
        const filtered = notes.filter(n => n.id !== id);
        DataManager.set(DataManager.KEYS.NOTES, filtered);
        this.loadAdminNotes();
        showToast('Note deleted', 'success');
    },

    // Admin Tutorials
    loadAdminTutorials() {
        const tutorials = DataManager.get(DataManager.KEYS.TUTORIALS) || [];
        const tbody = document.getElementById('tutorialsTableBody');

        if (tutorials.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No tutorials added yet</td></tr>';
            return;
        }

        tbody.innerHTML = tutorials.map(tutorial => `
            <tr>
                <td>${tutorial.title}</td>
                <td><span class="table-badge ${tutorial.type}">${tutorial.type === 'new' ? 'New' : 'Old'}</span></td>
                <td>${formatMonth(tutorial.month)}</td>
                <td><span class="table-badge ${tutorial.paidOnly ? 'paid' : 'free'}">${tutorial.paidOnly ? 'Paid' : 'Free'}</span></td>
                <td><span class="table-badge ${tutorial.downloadable ? 'yes' : 'no'}">${tutorial.downloadable ? 'Yes' : 'No'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="App.editTutorial('${tutorial.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteTutorial('${tutorial.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    saveTutorial(e) {
        e.preventDefault();
        const id = document.getElementById('tutorialId').value;
        const tutorials = DataManager.get(DataManager.KEYS.TUTORIALS) || [];

        const fileInput = document.getElementById('tutorialFile');
        const existingTutorial = tutorials.find(t => t.id === id);

        if (fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.finishSaveTutorial(id, tutorials, event.target.result);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            this.finishSaveTutorial(id, tutorials, existingTutorial?.file || '');
        }
    },

    finishSaveTutorial(id, tutorials, fileData) {
        const tutorial = {
            id: id || DataManager.generateId(),
            title: document.getElementById('tutorialTitle').value,
            description: document.getElementById('tutorialDescription').value,
            type: document.getElementById('tutorialType').value,
            month: document.getElementById('tutorialMonth').value,
            file: fileData,
            paidOnly: document.getElementById('tutorialPaidOnly').checked,
            downloadable: document.getElementById('tutorialDownloadable').checked
        };

        if (id) {
            const index = tutorials.findIndex(t => t.id === id);
            tutorials[index] = tutorial;
        } else {
            tutorials.push(tutorial);
        }

        DataManager.set(DataManager.KEYS.TUTORIALS, tutorials);
        closeModal('tutorialModal');
        this.loadAdminTutorials();
        showToast('Tutorial saved successfully!', 'success');
    },

    editTutorial(id) {
        const tutorials = DataManager.get(DataManager.KEYS.TUTORIALS) || [];
        const tutorial = tutorials.find(t => t.id === id);
        if (!tutorial) return;

        document.getElementById('tutorialId').value = tutorial.id;
        document.getElementById('tutorialTitle').value = tutorial.title;
        document.getElementById('tutorialDescription').value = tutorial.description || '';
        document.getElementById('tutorialType').value = tutorial.type;
        document.getElementById('tutorialMonth').value = tutorial.month || '';
        document.getElementById('tutorialPaidOnly').checked = tutorial.paidOnly;
        document.getElementById('tutorialDownloadable').checked = tutorial.downloadable;
        document.getElementById('tutorialFileName').textContent = tutorial.file ? 'File uploaded' : 'No file selected';
        document.getElementById('tutorialModalTitle').textContent = 'Edit Tutorial';

        openModal('tutorial');
    },

    deleteTutorial(id) {
        if (!confirm('Are you sure you want to delete this tutorial?')) return;

        const tutorials = DataManager.get(DataManager.KEYS.TUTORIALS) || [];
        const filtered = tutorials.filter(t => t.id !== id);
        DataManager.set(DataManager.KEYS.TUTORIALS, filtered);
        this.loadAdminTutorials();
        showToast('Tutorial deleted', 'success');
    },

    // Admin Videos
    loadAdminVideos() {
        const videos = DataManager.get(DataManager.KEYS.VIDEOS) || [];
        const tbody = document.getElementById('videosTableBody');

        if (videos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No videos added yet</td></tr>';
            return;
        }

        tbody.innerHTML = videos.map(video => `
            <tr>
                <td>${video.title}</td>
                <td>${video.type === 'youtube' ? 'YouTube' : 'File'}</td>
                <td>${formatMonth(video.month)}</td>
                <td>${video.duration || '-'}</td>
                <td><span class="table-badge ${video.paidOnly ? 'paid' : 'free'}">${video.paidOnly ? 'Paid' : 'Free'}</span></td>
                <td><span class="table-badge ${video.downloadable ? 'yes' : 'no'}">${video.downloadable ? 'Yes' : 'No'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="App.editVideo('${video.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteVideo('${video.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    saveVideo(e) {
        e.preventDefault();
        const id = document.getElementById('videoId').value;
        const videos = DataManager.get(DataManager.KEYS.VIDEOS) || [];
        const videoType = document.getElementById('videoType').value;

        const existingVideo = videos.find(v => v.id === id);
        const thumbnailInput = document.getElementById('videoThumbnail');
        const videoFileInput = document.getElementById('videoFile');

        // Handle thumbnail
        const handleThumbnail = (callback) => {
            if (thumbnailInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => callback(e.target.result);
                reader.readAsDataURL(thumbnailInput.files[0]);
            } else {
                callback(existingVideo?.thumbnail || '');
            }
        };

        // Handle video file
        const handleVideoFile = (thumbnail, callback) => {
            if (videoType === 'file' && videoFileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => callback(thumbnail, e.target.result);
                reader.readAsDataURL(videoFileInput.files[0]);
            } else {
                callback(thumbnail, existingVideo?.file || '');
            }
        };

        handleThumbnail((thumbnail) => {
            handleVideoFile(thumbnail, (thumb, videoFile) => {
                this.finishSaveVideo(id, videos, thumb, videoFile);
            });
        });
    },

    finishSaveVideo(id, videos, thumbnail, videoFile) {
        const videoType = document.getElementById('videoType').value;
        
        const video = {
            id: id || DataManager.generateId(),
            title: document.getElementById('videoTitle').value,
            description: document.getElementById('videoDescription').value,
            duration: document.getElementById('videoDuration').value,
            month: document.getElementById('videoMonth').value,
            type: videoType,
            youtubeUrl: videoType === 'youtube' ? document.getElementById('videoYoutubeUrl').value : '',
            file: videoType === 'file' ? videoFile : '',
            thumbnail: thumbnail,
            paidOnly: document.getElementById('videoPaidOnly').checked,
            downloadable: document.getElementById('videoDownloadable').checked
        };

        if (id) {
            const index = videos.findIndex(v => v.id === id);
            videos[index] = video;
        } else {
            videos.push(video);
        }

        DataManager.set(DataManager.KEYS.VIDEOS, videos);
        closeModal('videoModal');
        this.loadAdminVideos();
        showToast('Video saved successfully!', 'success');
    },

    editVideo(id) {
        const videos = DataManager.get(DataManager.KEYS.VIDEOS) || [];
        const video = videos.find(v => v.id === id);
        if (!video) return;

        document.getElementById('videoId').value = video.id;
        document.getElementById('videoTitle').value = video.title;
        document.getElementById('videoDescription').value = video.description || '';
        document.getElementById('videoDuration').value = video.duration || '';
        document.getElementById('videoMonth').value = video.month || '';
        document.getElementById('videoType').value = video.type;
        document.getElementById('videoYoutubeUrl').value = video.youtubeUrl || '';
        document.getElementById('videoPaidOnly').checked = video.paidOnly;
        document.getElementById('videoDownloadable').checked = video.downloadable;
        document.getElementById('videoModalTitle').textContent = 'Edit Video';

        // Toggle video source fields
        document.getElementById('youtubeUrlGroup').style.display = video.type === 'youtube' ? 'block' : 'none';
        document.getElementById('videoFileGroup').style.display = video.type === 'file' ? 'block' : 'none';

        openModal('video');
    },

    deleteVideo(id) {
        if (!confirm('Are you sure you want to delete this video?')) return;

        const videos = DataManager.get(DataManager.KEYS.VIDEOS) || [];
        const filtered = videos.filter(v => v.id !== id);
        DataManager.set(DataManager.KEYS.VIDEOS, filtered);
        this.loadAdminVideos();
        showToast('Video deleted', 'success');
    },

    // Admin Credentials
    saveAdminCredentials(e) {
        e.preventDefault();
        const email = document.getElementById('newAdminEmail').value;
        const password = document.getElementById('newAdminPassword').value;
        const confirm = document.getElementById('confirmAdminPassword').value;

        if (!email && !password) {
            showToast('Please enter new credentials', 'error');
            return;
        }

        if (password && password !== confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }

        const admin = DataManager.get(DataManager.KEYS.ADMIN);
        if (email) admin.email = email;
        if (password) admin.password = password;

        DataManager.set(DataManager.KEYS.ADMIN, admin);
        showToast('Admin credentials updated', 'success');

        // Clear form
        document.getElementById('newAdminEmail').value = '';
        document.getElementById('newAdminPassword').value = '';
        document.getElementById('confirmAdminPassword').value = '';
    },

    // Export/Import
    exportData() {
        const data = {
            branding: DataManager.get(DataManager.KEYS.BRANDING),
            admin: DataManager.get(DataManager.KEYS.ADMIN),
            students: DataManager.get(DataManager.KEYS.STUDENTS),
            notes: DataManager.get(DataManager.KEYS.NOTES),
            tutorials: DataManager.get(DataManager.KEYS.TUTORIALS),
            videos: DataManager.get(DataManager.KEYS.VIDEOS),
            notices: DataManager.get(DataManager.KEYS.NOTICES)
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portal_backup_' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported successfully', 'success');
    },

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.branding) DataManager.set(DataManager.KEYS.BRANDING, data.branding);
                if (data.admin) DataManager.set(DataManager.KEYS.ADMIN, data.admin);
                if (data.students) DataManager.set(DataManager.KEYS.STUDENTS, data.students);
                if (data.notes) DataManager.set(DataManager.KEYS.NOTES, data.notes);
                if (data.tutorials) DataManager.set(DataManager.KEYS.TUTORIALS, data.tutorials);
                if (data.videos) DataManager.set(DataManager.KEYS.VIDEOS, data.videos);
                if (data.notices) DataManager.set(DataManager.KEYS.NOTICES, data.notices);

                this.applyBranding();
                this.loadAdminOverview();
                showToast('Data imported successfully', 'success');
            } catch (error) {
                showToast('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    },

    resetAllData() {
        if (!confirm('Are you sure? This will delete ALL data permanently!')) return;
        if (!confirm('This action cannot be undone. Continue?')) return;

        localStorage.clear();
        DataManager.init();
        this.applyBranding();
        this.logout();
        showToast('All data has been reset', 'success');
    }
};

// ============================================
// Helper Functions
// ============================================

function openModal(type) {
    const modalId = type + 'Modal';
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Reset form
    const form = modal.querySelector('form');
    if (form) form.reset();

    // Reset hidden inputs
    const hiddenInput = modal.querySelector('input[type="hidden"]');
    if (hiddenInput) hiddenInput.value = '';

    // Reset file names
    modal.querySelectorAll('.file-upload-area span').forEach(span => {
        span.textContent = 'No file selected';
    });

    // Reset title
    const title = modal.querySelector('.modal-header h2');
    if (title) {
        const titleMap = {
            'student': 'Add Student',
            'note': 'Add Note',
            'tutorial': 'Add Tutorial',
            'video': 'Add Video',
            'notice': 'Add Notice/Banner'
        };
        title.textContent = titleMap[type] || 'Add Item';
    }

    // Reset video type fields
    if (type === 'video') {
        document.getElementById('youtubeUrlGroup').style.display = 'block';
        document.getElementById('videoFileGroup').style.display = 'none';
    }

    // Reset notice type fields
    if (type === 'notice') {
        document.getElementById('bannerImageGroup').style.display = 'none';
    }

    modal.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatMonth(monthStr) {
    if (!monthStr) return 'N/A';
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
}

function navigateTo(page) {
    App.navigateStudent(page);
}

function navigateAdmin(page) {
    App.navigateAdmin(page);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Prevent keyboard shortcuts for downloading/inspecting
document.addEventListener('keydown', (e) => {
    // Prevent Ctrl+S, Ctrl+Shift+I, F12
    if ((e.ctrlKey && e.key === 's') || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        e.key === 'F12') {
        e.preventDefault();
    }
});
