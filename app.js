// ============================================
// Firebase Configuration & Initialization
// ============================================
let db = null;

// Hardcoded Firebase Configuration for Production
const firebaseConfig = {
    apiKey: "AIzaSyBq985tA8gVnbP6SzmFHBW09k7DClSUJ5o",
    authDomain: "thashmila-55fdf.firebaseapp.com",
    databaseURL: "https://thashmila-55fdf-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "thashmila-55fdf",
    storageBucket: "thashmila-55fdf.firebasestorage.app",
    messagingSenderId: "698960373298",
    appId: "1:698960373298:web:e6ebe8d67182cad0763e2b",
    measurementId: "G-YVS407538H"
};

// Initialize Firebase
function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return false;
        }
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

// Initialize default data in Firebase
async function initializeDefaultData() {
    try {
        const snapshot = await db.ref('admin').once('value');
        if (!snapshot.exists()) {
            await db.ref('admin').set({
                email: 'admin@admin.com',
                password: 'admin123'
            });
            console.log('Default admin credentials created: admin@admin.com / admin123');
        }

        const brandingSnapshot = await db.ref('branding').once('value');
        if (!brandingSnapshot.exists()) {
            await db.ref('branding').set({
                siteName: 'Media Studies A/L',
                teacherName: '',
                className: '',
                tagline: 'Online Learning Portal',
                logo: '',
                primaryColor: '#6366f1',
                secondaryColor: '#8b5cf6',
                email: '',
                phone: '',
                whatsapp: '',
                facebook: '',
                youtube: '',
                footer: '© 2024 Media Studies A/L. All rights reserved.'
            });
        }
        return true;
    } catch (error) {
        console.error('Error initializing default data:', error);
        return false;
    }
}

// ============================================
// Database Operations
// ============================================
async function getData(path) {
    try {
        const snapshot = await db.ref(path).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('Error getting data:', error);
        return null;
    }
}

async function setData(path, data) {
    try {
        await db.ref(path).set(data);
        return true;
    } catch (error) {
        console.error('Error setting data:', error);
        return false;
    }
}

async function pushData(path, data) {
    try {
        const ref = await db.ref(path).push(data);
        return ref.key;
    } catch (error) {
        console.error('Error pushing data:', error);
        return null;
    }
}

async function updateData(path, data) {
    try {
        await db.ref(path).update(data);
        return true;
    } catch (error) {
        console.error('Error updating data:', error);
        return false;
    }
}

async function deleteData(path) {
    try {
        await db.ref(path).remove();
        return true;
    } catch (error) {
        console.error('Error deleting data:', error);
        return false;
    }
}

// ============================================
// Session Management
// ============================================
function saveSession(user, type) {
    const session = {
        user: user,
        type: type,
        timestamp: Date.now()
    };
    localStorage.setItem('session', JSON.stringify(session));
}

function getSession() {
    const session = localStorage.getItem('session');
    if (session) {
        const parsed = JSON.parse(session);
        // Session expires after 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            return parsed;
        }
        localStorage.removeItem('session');
    }
    return null;
}

function clearSession() {
    localStorage.removeItem('session');
}

// ============================================
// Theme Management
// ============================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    });
}

// ============================================
// App Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    initTheme();
    
    try {
        // Initialize Firebase directly (no setup screen needed)
        const firebaseReady = initializeFirebase();
        
        if (firebaseReady) {
            // Wait for Firebase to be ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Ensure default data exists
            await initializeDefaultData();
            
            // Check for existing session
            const session = getSession();
            if (session) {
                if (session.type === 'admin') {
                    await showAdminDashboard();
                } else {
                    currentStudent = session.user;
                    await showStudentDashboard();
                }
            } else {
                showLoginPage();
            }
        } else {
            // Firebase failed to initialize
            showFirebaseError();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showFirebaseError();
    }

    // Setup event listeners
    setupEventListeners();
});

function showFirebaseError() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-primary);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem; display: block;"></i>
                <h2 style="margin-bottom: 1rem;">Connection Error</h2>
                <p style="margin-bottom: 1rem;">Failed to connect to the database. Please check your internet connection and refresh.</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class="fas fa-sync"></i> Refresh Page
                </button>
            </div>
        `;
    }
}

function setupEventListeners() {
    // Login tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Navigation items - Student
    document.querySelectorAll('#studentDashboard .nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            showPage(page);
            document.querySelectorAll('#studentDashboard .nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            if (window.innerWidth <= 1024) {
                document.querySelector('#studentDashboard .sidebar').classList.remove('open');
            }
        });
    });

    // Navigation items - Admin
    document.querySelectorAll('#adminDashboard .nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            showAdminPage(page);
            document.querySelectorAll('#adminDashboard .nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            if (window.innerWidth <= 1024) {
                document.querySelector('#adminDashboard .sidebar').classList.remove('open');
            }
        });
    });

    // Form submissions
    document.getElementById('studentForm').addEventListener('submit', handleStudentSubmit);
    document.getElementById('noteForm').addEventListener('submit', handleNoteSubmit);
    document.getElementById('tuteForm').addEventListener('submit', handleTuteSubmit);
    document.getElementById('videoForm').addEventListener('submit', handleVideoSubmit);
    document.getElementById('noticeForm').addEventListener('submit', handleNoticeSubmit);
}

// ============================================
// Page Navigation
// ============================================
function showLoginPage() {
    document.getElementById('loadingScreen').classList.add('hidden');
    const setupScreen = document.getElementById('setupScreen');
    if (setupScreen) setupScreen.classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    loadBrandingForLogin();
}

async function showStudentDashboard() {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.getElementById('studentDashboard').classList.remove('hidden');
    
    await loadBranding();
    await loadStudentDashboard();
}

async function showAdminDashboard() {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    
    await loadAdminOverview();
}

function showPage(pageName) {
    document.getElementById('pageTitle').textContent = 
        pageName.charAt(0).toUpperCase() + pageName.slice(1);
    
    document.querySelectorAll('#studentDashboard .page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageName + 'Page').classList.remove('hidden');

    // Load content based on page
    if (pageName === 'dashboard') loadStudentDashboard();
    if (pageName === 'notes') loadNotes();
    if (pageName === 'tutorials') loadTutes();
    if (pageName === 'videos') loadVideos();
}

function showAdminPage(pageName) {
    const title = pageName.replace('admin-', '').charAt(0).toUpperCase() + 
                  pageName.replace('admin-', '').slice(1);
    document.getElementById('adminPageTitle').textContent = title;
    
    document.querySelectorAll('#adminDashboard .page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageName + 'Page').classList.remove('hidden');

    // Load content based on page
    if (pageName === 'admin-overview') loadAdminOverview();
    if (pageName === 'admin-branding') loadBrandingForm();
    if (pageName === 'admin-notices') loadAdminNotices();
    if (pageName === 'admin-students') loadAdminStudents();
    if (pageName === 'admin-notes') loadAdminNotes();
    if (pageName === 'admin-tutes') loadAdminTutes();
    if (pageName === 'admin-videos') loadAdminVideos();
    if (pageName === 'admin-settings') loadAdminSettings();
}

function toggleSidebar() {
    const dashboard = document.querySelector('.dashboard:not(.hidden)');
    const sidebar = dashboard.querySelector('.sidebar');
    sidebar.classList.toggle('open');
}

// ============================================
// Authentication
// ============================================
let currentStudent = null;

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const isAdmin = document.querySelector('.tab-btn.active').dataset.tab === 'admin';
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.add('hidden');

    if (!db) {
        errorDiv.textContent = 'Database not connected. Please refresh and try again.';
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        if (isAdmin) {
            const admin = await getData('admin');
            console.log('Admin data:', admin);
            
            if (!admin) {
                // Try to create default admin
                await db.ref('admin').set({
                    email: 'admin@admin.com',
                    password: 'admin123'
                });
                errorDiv.textContent = 'Admin initialized. Try: admin@admin.com / admin123';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            if (admin.email === email && admin.password === password) {
                saveSession({ email }, 'admin');
                showAdminDashboard();
            } else {
                errorDiv.textContent = 'Invalid admin credentials';
                errorDiv.classList.remove('hidden');
            }
        } else {
            const students = await getData('students');
            if (students) {
                const studentEntry = Object.entries(students).find(([id, s]) => 
                    s.email === email && s.password === password
                );
                if (studentEntry) {
                    currentStudent = { id: studentEntry[0], ...studentEntry[1] };
                    saveSession(currentStudent, 'student');
                    showStudentDashboard();
                } else {
                    errorDiv.textContent = 'Invalid email or password';
                    errorDiv.classList.remove('hidden');
                }
            } else {
                errorDiv.textContent = 'No students registered. Please contact admin.';
                errorDiv.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Login failed. Please check your connection.';
        errorDiv.classList.remove('hidden');
    }
}

function logout() {
    clearSession();
    currentStudent = null;
    
    // Hide all screens
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    
    // Show login page
    document.getElementById('loginPage').classList.remove('hidden');
    
    // Reset login form
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').classList.add('hidden');
    
    // Load branding for login page
    loadBrandingForLogin();
}

// ============================================
// Branding
// ============================================
async function loadBrandingForLogin() {
    const branding = await getData('branding');
    if (branding) {
        document.getElementById('loginSiteName').textContent = branding.siteName || 'Media Studies A/L';
        document.getElementById('loginTagline').textContent = branding.tagline || 'Online Learning Portal';
        document.getElementById('loginFooterText').textContent = branding.footer || '© 2024 Media Studies A/L';
        
        if (branding.logo) {
            document.getElementById('loginLogo').innerHTML = `<img src="${branding.logo}" alt="Logo">`;
        }

        // Apply colors
        if (branding.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
        }
        if (branding.secondaryColor) {
            document.documentElement.style.setProperty('--secondary-color', branding.secondaryColor);
        }
    }
}

async function loadBranding() {
    const branding = await getData('branding');
    if (branding) {
        document.getElementById('studentSiteName').textContent = branding.siteName || 'Media Studies A/L';
        
        if (branding.logo) {
            document.getElementById('studentLogo').innerHTML = `<img src="${branding.logo}" alt="Logo">`;
        }

        // Apply colors
        if (branding.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
        }
        if (branding.secondaryColor) {
            document.documentElement.style.setProperty('--secondary-color', branding.secondaryColor);
        }
    }
}

async function loadBrandingForm() {
    const branding = await getData('branding');
    if (branding) {
        document.getElementById('brandSiteName').value = branding.siteName || '';
        document.getElementById('brandTeacherName').value = branding.teacherName || '';
        document.getElementById('brandClassName').value = branding.className || '';
        document.getElementById('brandTagline').value = branding.tagline || '';
        document.getElementById('brandPrimaryColor').value = branding.primaryColor || '#6366f1';
        document.getElementById('brandSecondaryColor').value = branding.secondaryColor || '#8b5cf6';
        document.getElementById('brandEmail').value = branding.email || '';
        document.getElementById('brandPhone').value = branding.phone || '';
        document.getElementById('brandWhatsApp').value = branding.whatsapp || '';
        document.getElementById('brandFacebook').value = branding.facebook || '';
        document.getElementById('brandYouTube').value = branding.youtube || '';
        document.getElementById('brandFooter').value = branding.footer || '';

        if (branding.logo) {
            document.getElementById('logoPreview').innerHTML = `<img src="${branding.logo}" alt="Logo">`;
        }
    }
}

async function saveBranding() {
    const branding = {
        siteName: document.getElementById('brandSiteName').value,
        teacherName: document.getElementById('brandTeacherName').value,
        className: document.getElementById('brandClassName').value,
        tagline: document.getElementById('brandTagline').value,
        primaryColor: document.getElementById('brandPrimaryColor').value,
        secondaryColor: document.getElementById('brandSecondaryColor').value,
        email: document.getElementById('brandEmail').value,
        phone: document.getElementById('brandPhone').value,
        whatsapp: document.getElementById('brandWhatsApp').value,
        facebook: document.getElementById('brandFacebook').value,
        youtube: document.getElementById('brandYouTube').value,
        footer: document.getElementById('brandFooter').value
    };

    // Get existing logo
    const existing = await getData('branding');
    if (existing && existing.logo) {
        branding.logo = existing.logo;
    }

    await setData('branding', branding);
    
    // Apply colors immediately
    document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', branding.secondaryColor);
    
    showToast('Branding saved successfully!');
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const logoData = e.target.result;
            document.getElementById('logoPreview').innerHTML = `<img src="${logoData}" alt="Logo">`;
            
            // Save logo to branding
            const branding = await getData('branding') || {};
            branding.logo = logoData;
            await setData('branding', branding);
            
            showToast('Logo uploaded!');
        };
        reader.readAsDataURL(file);
    }
}

async function removeLogo() {
    const branding = await getData('branding') || {};
    branding.logo = '';
    await setData('branding', branding);
    document.getElementById('logoPreview').innerHTML = '<i class="fas fa-graduation-cap"></i>';
    showToast('Logo removed');
}

function applyColorPreset(primary, secondary) {
    document.getElementById('brandPrimaryColor').value = primary;
    document.getElementById('brandSecondaryColor').value = secondary;
}

// ============================================
// Student Dashboard
// ============================================
async function loadStudentDashboard() {
    if (!currentStudent) return;

    document.getElementById('studentName').textContent = currentStudent.name;
    document.getElementById('welcomeName').textContent = currentStudent.name.split(' ')[0];
    
    const isPaid = currentStudent.status === 'paid';
    const badge = document.getElementById('studentBadge');
    badge.textContent = isPaid ? 'Paid' : 'Free';
    badge.className = 'badge ' + (isPaid ? 'badge-success' : 'badge-warning');

    // Load stats
    const notes = await getData('notes') || {};
    const tutes = await getData('tutes') || {};
    const videos = await getData('videos') || {};

    const accessibleNotes = Object.values(notes).filter(n => isPaid || n.access === 'free').length;
    const accessibleTutes = Object.values(tutes).filter(t => isPaid || t.access === 'free').length;
    const accessibleVideos = Object.values(videos).filter(v => isPaid || v.access === 'free').length;

    document.getElementById('statNotes').textContent = accessibleNotes;
    document.getElementById('statTutes').textContent = accessibleTutes;
    document.getElementById('statVideos').textContent = accessibleVideos;

    // Load notices
    await loadStudentNotices();
    
    // Load about teacher section
    await loadAboutTeacher();
}

async function loadAboutTeacher() {
    const branding = await getData('branding');
    const aboutSection = document.getElementById('aboutTeacherSection');
    
    if (!branding || (!branding.teacherName && !branding.email && !branding.phone)) {
        aboutSection.classList.add('hidden');
        return;
    }
    
    aboutSection.classList.remove('hidden');
    
    // Build contact items
    let contactItems = '';
    
    if (branding.email) {
        contactItems += `
            <a href="mailto:${branding.email}" class="teacher-contact-item">
                <i class="fas fa-envelope"></i>
                <span>${branding.email}</span>
            </a>
        `;
    }
    
    if (branding.phone) {
        contactItems += `
            <a href="tel:${branding.phone}" class="teacher-contact-item">
                <i class="fas fa-phone"></i>
                <span>${branding.phone}</span>
            </a>
        `;
    }
    
    if (branding.whatsapp) {
        contactItems += `
            <a href="https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="teacher-contact-item">
                <i class="fab fa-whatsapp"></i>
                <span>WhatsApp</span>
            </a>
        `;
    }
    
    if (branding.facebook) {
        contactItems += `
            <a href="${branding.facebook}" target="_blank" class="teacher-contact-item">
                <i class="fab fa-facebook"></i>
                <span>Facebook</span>
            </a>
        `;
    }
    
    if (branding.youtube) {
        contactItems += `
            <a href="${branding.youtube}" target="_blank" class="teacher-contact-item">
                <i class="fab fa-youtube"></i>
                <span>YouTube</span>
            </a>
        `;
    }
    
    aboutSection.innerHTML = `
        <h3><i class="fas fa-chalkboard-teacher"></i> About Your Teacher</h3>
        <div class="teacher-profile">
            ${branding.logo ? 
                `<img src="${branding.logo}" alt="Teacher" class="teacher-avatar">` : 
                `<div class="teacher-avatar-placeholder"><i class="fas fa-user"></i></div>`
            }
            <div class="teacher-info">
                <h4>${branding.teacherName || 'Your Teacher'}</h4>
                ${branding.className ? `<p class="class-name">${branding.className}</p>` : ''}
                ${branding.tagline ? `<p class="tagline">"${branding.tagline}"</p>` : ''}
                ${contactItems ? `<div class="teacher-contact-grid">${contactItems}</div>` : ''}
            </div>
        </div>
    `;
}

async function loadStudentNotices() {
    const notices = await getData('notices') || {};
    const activeNotices = Object.entries(notices)
        .filter(([id, n]) => n.active === true || n.active === 'true')
        .map(([id, n]) => ({ id, ...n }));

    const noticesSection = document.getElementById('noticesSection');
    const bannersContainer = document.getElementById('bannersContainer');
    const noticesContainer = document.getElementById('noticesContainer');

    if (activeNotices.length === 0) {
        noticesSection.classList.add('hidden');
        return;
    }

    noticesSection.classList.remove('hidden');

    // Separate banners and text notices
    const banners = activeNotices.filter(n => n.type === 'banner');
    const textNotices = activeNotices.filter(n => n.type === 'text');

    // Render banners
    bannersContainer.innerHTML = banners.map(b => `
        <div class="banner-item" ${b.link ? `onclick="window.open('${b.link}', '_blank')"` : ''}>
            <img src="${b.image}" alt="Banner">
        </div>
    `).join('');

    // Render text notices
    noticesContainer.innerHTML = textNotices.map(n => `
        <div class="notice-item ${n.priority || 'normal'}">
            <i class="fas ${n.priority === 'urgent' ? 'fa-exclamation-circle' : n.priority === 'important' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <div class="notice-content">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// Content Loading Helper
// ============================================
function showContentLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="content-loading">
            <i class="fas fa-spinner"></i>
            <p>Loading content...</p>
        </div>
    `;
}

// ============================================
// Notes
// ============================================
async function loadNotes() {
    showContentLoading('notesList');
    
    const notes = await getData('notes') || {};
    const isPaid = currentStudent && currentStudent.status === 'paid';

    // Populate month filter
    const months = [...new Set(Object.values(notes).map(n => n.month).filter(Boolean))].sort().reverse();
    const monthFilter = document.getElementById('notesMonthFilter');
    monthFilter.innerHTML = '<option value="all">All Months</option>' + 
        months.map(m => `<option value="${m}">${formatMonth(m)}</option>`).join('');

    filterNotes();
}

function filterNotes() {
    const accessFilter = document.getElementById('notesAccessFilter').value;
    const monthFilter = document.getElementById('notesMonthFilter').value;
    
    showContentLoading('notesList');
    
    getData('notes').then(notes => {
        const isPaid = currentStudent && currentStudent.status === 'paid';
        let notesList = Object.entries(notes || {}).map(([id, n]) => ({ id, ...n }));

        // Apply filters
        if (accessFilter !== 'all') {
            notesList = notesList.filter(n => n.access === accessFilter);
        }
        if (monthFilter !== 'all') {
            notesList = notesList.filter(n => n.month === monthFilter);
        }

        // Sort by newest first (createdAt timestamp or by ID which is chronological in Firebase)
        notesList.sort((a, b) => {
            const dateA = a.createdAt || 0;
            const dateB = b.createdAt || 0;
            return dateB - dateA;
        });

        renderNotes(notesList, isPaid);
    });
}

function renderNotes(notes, isPaid) {
    const container = document.getElementById('notesList');
    
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>No notes found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notes.map(note => {
        const locked = note.access === 'paid' && !isPaid;
        return `
            <div class="content-card ${locked ? 'locked' : ''}">
                <div class="card-thumbnail">
                    <i class="fas fa-file-pdf"></i>
                    ${locked ? `
                        <div class="locked-overlay">
                            <i class="fas fa-lock"></i>
                            <span>Paid Students Only</span>
                        </div>
                    ` : ''}
                </div>
                <div class="card-content">
                    <div class="card-badges">
                        <span class="badge ${note.access === 'paid' ? 'badge-warning' : 'badge-success'}">
                            ${note.access === 'paid' ? 'Paid' : 'Free'}
                        </span>
                        ${note.month ? `<span class="badge badge-info">${formatMonth(note.month)}</span>` : ''}
                    </div>
                    <h4>${note.title}</h4>
                    <p>${note.description || 'No description'}</p>
                    ${!locked ? `
                        <div class="card-actions">
                            <button class="btn btn-primary btn-sm" onclick="viewPdf('${note.id}', 'notes')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            ${note.downloadable === true || note.downloadable === 'true' ? `
                                <button class="btn btn-outline btn-sm" onclick="downloadPdf('${note.id}', 'notes')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// Tutorials
// ============================================
async function loadTutes() {
    showContentLoading('tutesList');
    
    const tutes = await getData('tutes') || {};
    const isPaid = currentStudent && currentStudent.status === 'paid';

    // Populate month filter
    const months = [...new Set(Object.values(tutes).map(t => t.month).filter(Boolean))].sort().reverse();
    const monthFilter = document.getElementById('tutesMonthFilter');
    monthFilter.innerHTML = '<option value="all">All Months</option>' + 
        months.map(m => `<option value="${m}">${formatMonth(m)}</option>`).join('');

    filterTutes();
}

function filterTutes() {
    const typeFilter = document.getElementById('tutesTypeFilter').value;
    const accessFilter = document.getElementById('tutesAccessFilter').value;
    const monthFilter = document.getElementById('tutesMonthFilter').value;
    
    showContentLoading('tutesList');
    
    getData('tutes').then(tutes => {
        const isPaid = currentStudent && currentStudent.status === 'paid';
        let tutesList = Object.entries(tutes || {}).map(([id, t]) => ({ id, ...t }));

        // Apply filters
        if (typeFilter !== 'all') {
            tutesList = tutesList.filter(t => t.type === typeFilter);
        }
        if (accessFilter !== 'all') {
            tutesList = tutesList.filter(t => t.access === accessFilter);
        }
        if (monthFilter !== 'all') {
            tutesList = tutesList.filter(t => t.month === monthFilter);
        }

        // Sort by newest first
        tutesList.sort((a, b) => {
            const dateA = a.createdAt || 0;
            const dateB = b.createdAt || 0;
            return dateB - dateA;
        });

        renderTutes(tutesList, isPaid);
    });
}

function renderTutes(tutes, isPaid) {
    const container = document.getElementById('tutesList');
    
    if (tutes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>No tutorials found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tutes.map(tute => {
        const locked = tute.access === 'paid' && !isPaid;
        return `
            <div class="content-card ${locked ? 'locked' : ''}">
                <div class="card-thumbnail">
                    <i class="fas fa-book-open"></i>
                    ${locked ? `
                        <div class="locked-overlay">
                            <i class="fas fa-lock"></i>
                            <span>Paid Students Only</span>
                        </div>
                    ` : ''}
                </div>
                <div class="card-content">
                    <div class="card-badges">
                        <span class="badge ${tute.type === 'new' ? 'badge-success' : 'badge-info'}">
                            ${tute.type === 'new' ? 'New' : 'Old Paper'}
                        </span>
                        <span class="badge ${tute.access === 'paid' ? 'badge-warning' : 'badge-success'}">
                            ${tute.access === 'paid' ? 'Paid' : 'Free'}
                        </span>
                        ${tute.month ? `<span class="badge badge-info">${formatMonth(tute.month)}</span>` : ''}
                    </div>
                    <h4>${tute.title}</h4>
                    <p>${tute.description || 'No description'}</p>
                    ${!locked ? `
                        <div class="card-actions">
                            <button class="btn btn-primary btn-sm" onclick="viewPdf('${tute.id}', 'tutes')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            ${tute.downloadable === true || tute.downloadable === 'true' ? `
                                <button class="btn btn-outline btn-sm" onclick="downloadPdf('${tute.id}', 'tutes')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// Videos
// ============================================
async function loadVideos() {
    showContentLoading('videosList');
    
    const videos = await getData('videos') || {};
    const isPaid = currentStudent && currentStudent.status === 'paid';

    // Populate month filter
    const months = [...new Set(Object.values(videos).map(v => v.month).filter(Boolean))].sort().reverse();
    const monthFilter = document.getElementById('videosMonthFilter');
    monthFilter.innerHTML = '<option value="all">All Months</option>' + 
        months.map(m => `<option value="${m}">${formatMonth(m)}</option>`).join('');

    filterVideos();
}

function filterVideos() {
    const accessFilter = document.getElementById('videosAccessFilter').value;
    const monthFilter = document.getElementById('videosMonthFilter').value;
    
    showContentLoading('videosList');
    
    getData('videos').then(videos => {
        const isPaid = currentStudent && currentStudent.status === 'paid';
        let videosList = Object.entries(videos || {}).map(([id, v]) => ({ id, ...v }));

        // Apply filters
        if (accessFilter !== 'all') {
            videosList = videosList.filter(v => v.access === accessFilter);
        }
        if (monthFilter !== 'all') {
            videosList = videosList.filter(v => v.month === monthFilter);
        }

        // Sort by newest first
        videosList.sort((a, b) => {
            const dateA = a.createdAt || 0;
            const dateB = b.createdAt || 0;
            return dateB - dateA;
        });

        renderVideos(videosList, isPaid);
    });
}

function renderVideos(videos, isPaid) {
    const container = document.getElementById('videosList');
    
    if (videos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video"></i>
                <p>No videos found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = videos.map(video => {
        const locked = video.access === 'paid' && !isPaid;
        const thumbnail = video.thumbnail || getVideoThumbnail(video);
        return `
            <div class="content-card ${locked ? 'locked' : ''}">
                <div class="card-thumbnail" ${!locked ? `onclick="playVideo('${video.id}')"` : ''} style="cursor: ${locked ? 'not-allowed' : 'pointer'}">
                    ${thumbnail ? `<img src="${thumbnail}" alt="${video.title}">` : '<i class="fas fa-video"></i>'}
                    ${!locked ? '<div class="play-overlay"><i class="fas fa-play-circle"></i></div>' : ''}
                    ${locked ? `
                        <div class="locked-overlay">
                            <i class="fas fa-lock"></i>
                            <span>Paid Students Only</span>
                        </div>
                    ` : ''}
                </div>
                <div class="card-content">
                    <div class="card-badges">
                        <span class="badge ${video.access === 'paid' ? 'badge-warning' : 'badge-success'}">
                            ${video.access === 'paid' ? 'Paid' : 'Free'}
                        </span>
                        <span class="badge badge-info">${getVideoSourceLabel(video)}</span>
                        ${video.month ? `<span class="badge badge-info">${formatMonth(video.month)}</span>` : ''}
                    </div>
                    <h4>${video.title}</h4>
                    <p>${video.description || 'No description'}</p>
                </div>
            </div>
        `;
    }).join('');
}

function getVideoSourceLabel(video) {
    if (video.source === 'youtube') return 'YouTube';
    if (video.source === 'gdrive') return 'Google Drive';
    return 'Video';
}

function getVideoThumbnail(video) {
    if (video.thumbnail) return video.thumbnail;
    if (video.source === 'youtube' && video.youtube) {
        const videoId = extractYouTubeId(video.youtube);
        return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
    }
    return null;
}

function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function extractGoogleDriveId(url) {
    if (!url) return null;
    // Match various Google Drive URL formats
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

async function playVideo(videoId) {
    const video = await getData(`videos/${videoId}`);
    if (!video) return;

    const modal = document.getElementById('videoModal');
    const container = document.getElementById('videoContainer');
    const title = document.getElementById('videoModalTitle');
    const watermark = document.getElementById('videoWatermark');

    title.textContent = video.title;

    // Get branding for watermark
    const branding = await getData('branding');
    watermark.textContent = branding?.siteName || 'Media Studies A/L';

    if (video.source === 'youtube' && video.youtube) {
        const videoIdYT = extractYouTubeId(video.youtube);
        if (videoIdYT) {
            container.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoIdYT}?rel=0&modestbranding=1&autoplay=1&cc_load_policy=0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
        } else {
            container.innerHTML = '<p style="color: white; text-align: center; padding: 2rem;">Invalid YouTube URL</p>';
        }
    } else if (video.source === 'gdrive' && video.gdrive) {
        const driveId = extractGoogleDriveId(video.gdrive);
        if (driveId) {
            // Google Drive with blocker overlay to hide "Open in new window" button
            container.innerHTML = `
                <div class="gdrive-top-bar"></div>
                <div class="gdrive-blocker"><i class="fas fa-shield-alt"></i></div>
                <iframe 
                    src="https://drive.google.com/file/d/${driveId}/preview" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen
                    sandbox="allow-scripts allow-same-origin">
                </iframe>
            `;
        } else {
            container.innerHTML = '<p style="color: white; text-align: center; padding: 2rem;">Invalid Google Drive URL</p>';
        }
    } else if (video.file) {
        const controls = video.downloadable === true || video.downloadable === 'true' ? 'controls' : 'controls controlsList="nodownload"';
        container.innerHTML = `
            <video ${controls} autoplay oncontextmenu="return false;">
                <source src="${video.file}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    }

    modal.classList.remove('hidden');

    // Prevent right-click on video
    container.addEventListener('contextmenu', e => e.preventDefault());
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('videoContainer');
    container.innerHTML = '';
    modal.classList.add('hidden');
}

// ============================================
// PDF Viewing
// ============================================
let currentPdfData = null;
let currentPdfName = null;

async function viewPdf(id, type) {
    const item = await getData(`${type}/${id}`);
    if (!item || !item.file) {
        showToast('File not found', true);
        return;
    }

    currentPdfData = item.file;
    currentPdfName = item.title + '.pdf';

    const modal = document.getElementById('pdfModal');
    const viewer = document.getElementById('pdfViewer');
    const title = document.getElementById('pdfModalTitle');
    const downloadBtn = document.getElementById('pdfDownloadBtn');

    title.textContent = item.title;
    viewer.src = item.file;

    if (item.downloadable === true || item.downloadable === 'true') {
        downloadBtn.classList.remove('hidden');
    } else {
        downloadBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closePdfModal() {
    const modal = document.getElementById('pdfModal');
    const viewer = document.getElementById('pdfViewer');
    viewer.src = '';
    currentPdfData = null;
    currentPdfName = null;
    modal.classList.add('hidden');
}

function downloadCurrentPdf() {
    if (currentPdfData && currentPdfName) {
        const link = document.createElement('a');
        link.href = currentPdfData;
        link.download = currentPdfName;
        link.click();
    }
}

async function downloadPdf(id, type) {
    const item = await getData(`${type}/${id}`);
    if (!item || !item.file) {
        showToast('File not found', true);
        return;
    }

    const link = document.createElement('a');
    link.href = item.file;
    link.download = item.title + '.pdf';
    link.click();
}

// ============================================
// Admin Functions
// ============================================
async function loadAdminOverview() {
    const students = await getData('students') || {};
    const notes = await getData('notes') || {};
    const tutes = await getData('tutes') || {};
    const videos = await getData('videos') || {};
    const notices = await getData('notices') || {};

    const studentList = Object.values(students);
    const paidStudents = studentList.filter(s => s.status === 'paid').length;
    const activeNotices = Object.values(notices).filter(n => n.active === true || n.active === 'true').length;

    document.getElementById('adminStatStudents').textContent = studentList.length;
    document.getElementById('adminStatPaid').textContent = paidStudents;
    document.getElementById('adminStatNotes').textContent = Object.keys(notes).length;
    document.getElementById('adminStatTutes').textContent = Object.keys(tutes).length;
    document.getElementById('adminStatVideos').textContent = Object.keys(videos).length;
    document.getElementById('adminStatNotices').textContent = activeNotices;
}

// Admin Settings
async function loadAdminSettings() {
    const admin = await getData('admin');
    if (admin) {
        document.getElementById('adminEmail').value = admin.email || '';
    }
}

async function updateAdminCredentials() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (!email) {
        showToast('Email is required', true);
        return;
    }

    const admin = await getData('admin') || {};
    admin.email = email;
    if (password) {
        admin.password = password;
    }

    await setData('admin', admin);
    showToast('Admin credentials updated!');
}

// ============================================
// Backup & Restore
// ============================================
async function exportBackup() {
    try {
        const data = {
            admin: await getData('admin'),
            branding: await getData('branding'),
            students: await getData('students'),
            notes: await getData('notes'),
            tutes: await getData('tutes'),
            videos: await getData('videos'),
            notices: await getData('notices'),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        showToast('Backup exported successfully!');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export backup', true);
    }
}

function importBackup() {
    document.getElementById('backupFileInput').click();
}

async function handleBackupFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!confirm('This will replace ALL existing data. Are you sure?')) {
            return;
        }
        
        // Restore all data
        if (data.admin) await setData('admin', data.admin);
        if (data.branding) await setData('branding', data.branding);
        if (data.students) await setData('students', data.students);
        if (data.notes) await setData('notes', data.notes);
        if (data.tutes) await setData('tutes', data.tutes);
        if (data.videos) await setData('videos', data.videos);
        if (data.notices) await setData('notices', data.notices);
        
        showToast('Backup restored successfully! Refreshing...');
        
        setTimeout(() => {
            location.reload();
        }, 1500);
    } catch (error) {
        console.error('Import error:', error);
        showToast('Failed to import backup. Invalid file format.', true);
    }
    
    // Reset file input
    event.target.value = '';
}

async function resetAllData() {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone!')) {
        if (confirm('This will delete all students, notes, tutorials, videos, and notices. Continue?')) {
            await deleteData('students');
            await deleteData('notes');
            await deleteData('tutes');
            await deleteData('videos');
            await deleteData('notices');
            showToast('All data has been reset');
            loadAdminOverview();
        }
    }
}

// ============================================
// Admin - Notices
// ============================================
async function loadAdminNotices() {
    const notices = await getData('notices') || {};
    const tbody = document.getElementById('noticesTableBody');

    if (Object.keys(notices).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No notices yet</td></tr>';
        return;
    }

    tbody.innerHTML = Object.entries(notices).map(([id, notice]) => `
        <tr>
            <td><span class="badge badge-info">${notice.type}</span></td>
            <td>${notice.type === 'text' ? notice.title : 'Image Banner'}</td>
            <td>${notice.type === 'text' ? `<span class="badge badge-${notice.priority === 'urgent' ? 'danger' : notice.priority === 'important' ? 'warning' : 'info'}">${notice.priority}</span>` : '-'}</td>
            <td><span class="badge ${notice.active === true || notice.active === 'true' ? 'badge-success' : 'badge-danger'}">${notice.active === true || notice.active === 'true' ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="editNotice('${id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteNotice('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddNoticeModal() {
    document.getElementById('noticeModalTitle').textContent = 'Add Notice';
    document.getElementById('noticeForm').reset();
    document.getElementById('noticeId').value = '';
    document.getElementById('bannerPreview').classList.add('hidden');
    toggleNoticeFields();
    document.getElementById('noticeModal').classList.remove('hidden');
}

function toggleNoticeFields() {
    const type = document.getElementById('noticeFormType').value;
    document.getElementById('textNoticeFields').classList.toggle('hidden', type !== 'text');
    document.getElementById('bannerNoticeFields').classList.toggle('hidden', type !== 'banner');
}

function handleBannerUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('noticeFormImageData').value = e.target.result;
            document.getElementById('bannerPreview').innerHTML = `<img src="${e.target.result}" alt="Banner">`;
            document.getElementById('bannerPreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

async function handleNoticeSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('noticeId').value;
    const type = document.getElementById('noticeFormType').value;
    
    const notice = {
        type: type,
        active: document.getElementById('noticeFormActive').value === 'true'
    };

    if (type === 'text') {
        notice.title = document.getElementById('noticeFormTitle').value;
        notice.message = document.getElementById('noticeFormMessage').value;
        notice.priority = document.getElementById('noticeFormPriority').value;
    } else {
        notice.image = document.getElementById('noticeFormImageData').value;
        notice.link = document.getElementById('noticeFormLink').value;
    }

    if (id) {
        await updateData(`notices/${id}`, notice);
    } else {
        await pushData('notices', notice);
    }

    closeNoticeModal();
    loadAdminNotices();
    showToast('Notice saved successfully!');
}

async function editNotice(id) {
    const notice = await getData(`notices/${id}`);
    if (!notice) return;

    document.getElementById('noticeModalTitle').textContent = 'Edit Notice';
    document.getElementById('noticeId').value = id;
    document.getElementById('noticeFormType').value = notice.type;
    document.getElementById('noticeFormActive').value = String(notice.active);
    
    toggleNoticeFields();

    if (notice.type === 'text') {
        document.getElementById('noticeFormTitle').value = notice.title || '';
        document.getElementById('noticeFormMessage').value = notice.message || '';
        document.getElementById('noticeFormPriority').value = notice.priority || 'normal';
    } else {
        document.getElementById('noticeFormImageData').value = notice.image || '';
        document.getElementById('noticeFormLink').value = notice.link || '';
        if (notice.image) {
            document.getElementById('bannerPreview').innerHTML = `<img src="${notice.image}" alt="Banner">`;
            document.getElementById('bannerPreview').classList.remove('hidden');
        }
    }

    document.getElementById('noticeModal').classList.remove('hidden');
}

async function deleteNotice(id) {
    if (confirm('Are you sure you want to delete this notice?')) {
        await deleteData(`notices/${id}`);
        loadAdminNotices();
        showToast('Notice deleted');
    }
}

function closeNoticeModal() {
    document.getElementById('noticeModal').classList.add('hidden');
}

// ============================================
// Admin - Students
// ============================================
async function loadAdminStudents() {
    const students = await getData('students') || {};
    const tbody = document.getElementById('studentsTableBody');

    if (Object.keys(students).length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No students yet</td></tr>';
        return;
    }

    tbody.innerHTML = Object.entries(students).map(([id, student]) => `
        <tr>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.phone || '-'}</td>
            <td><span class="badge ${student.status === 'paid' ? 'badge-success' : 'badge-warning'}">${student.status === 'paid' ? 'Paid' : 'Free'}</span></td>
            <td>${student.expiry || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="editStudent('${id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteStudent('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddStudentModal() {
    document.getElementById('studentModalTitle').textContent = 'Add Student';
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('studentFormPassword').required = true;
    document.getElementById('studentModal').classList.remove('hidden');
}

async function editStudent(id) {
    const student = await getData(`students/${id}`);
    if (!student) return;

    document.getElementById('studentModalTitle').textContent = 'Edit Student';
    document.getElementById('studentId').value = id;
    document.getElementById('studentFormName').value = student.name;
    document.getElementById('studentFormEmail').value = student.email;
    document.getElementById('studentFormPassword').value = '';
    document.getElementById('studentFormPassword').required = false;
    document.getElementById('studentFormPhone').value = student.phone || '';
    document.getElementById('studentFormStatus').value = student.status;
    document.getElementById('studentFormExpiry').value = student.expiry || '';

    document.getElementById('studentModal').classList.remove('hidden');
}

async function handleStudentSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('studentId').value;
    const student = {
        name: document.getElementById('studentFormName').value,
        email: document.getElementById('studentFormEmail').value,
        phone: document.getElementById('studentFormPhone').value,
        status: document.getElementById('studentFormStatus').value,
        expiry: document.getElementById('studentFormExpiry').value
    };

    const password = document.getElementById('studentFormPassword').value;
    if (password) {
        student.password = password;
    } else if (id) {
        // Keep existing password
        const existing = await getData(`students/${id}`);
        if (existing) {
            student.password = existing.password;
        }
    }

    if (id) {
        await updateData(`students/${id}`, student);
    } else {
        await pushData('students', student);
    }

    closeStudentModal();
    loadAdminStudents();
    showToast('Student saved successfully!');
}

async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        await deleteData(`students/${id}`);
        loadAdminStudents();
        showToast('Student deleted');
    }
}

function closeStudentModal() {
    document.getElementById('studentModal').classList.add('hidden');
}

// ============================================
// Admin - Notes
// ============================================
async function loadAdminNotes() {
    const notes = await getData('notes') || {};
    const tbody = document.getElementById('notesTableBody');

    if (Object.keys(notes).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No notes yet</td></tr>';
        return;
    }

    tbody.innerHTML = Object.entries(notes).map(([id, note]) => `
        <tr>
            <td>${note.title}</td>
            <td>${note.month ? formatMonth(note.month) : '-'}</td>
            <td><span class="badge ${note.access === 'paid' ? 'badge-warning' : 'badge-success'}">${note.access === 'paid' ? 'Paid' : 'Free'}</span></td>
            <td>${note.downloadable === true || note.downloadable === 'true' ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="editNote('${id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteNote('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddNoteModal() {
    document.getElementById('noteModalTitle').textContent = 'Add Note';
    document.getElementById('noteForm').reset();
    document.getElementById('noteId').value = '';
    document.getElementById('noteFormFileData').value = '';
    document.getElementById('noteFileName').textContent = '';
    document.getElementById('noteModal').classList.remove('hidden');
}

function handleNoteFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('noteFormFileData').value = e.target.result;
            document.getElementById('noteFileName').textContent = file.name;
        };
        reader.readAsDataURL(file);
    }
}

async function editNote(id) {
    const note = await getData(`notes/${id}`);
    if (!note) return;

    document.getElementById('noteModalTitle').textContent = 'Edit Note';
    document.getElementById('noteId').value = id;
    document.getElementById('noteFormTitle').value = note.title;
    document.getElementById('noteFormDescription').value = note.description || '';
    document.getElementById('noteFormMonth').value = note.month || '';
    document.getElementById('noteFormAccess').value = note.access;
    document.getElementById('noteFormDownloadable').value = String(note.downloadable);
    document.getElementById('noteFormFileData').value = note.file || '';
    document.getElementById('noteFileName').textContent = note.file ? 'File uploaded' : '';

    document.getElementById('noteModal').classList.remove('hidden');
}

async function handleNoteSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('noteId').value;
    const fileData = document.getElementById('noteFormFileData').value;

    if (!fileData && !id) {
        showToast('Please upload a PDF file', true);
        return;
    }

    const note = {
        title: document.getElementById('noteFormTitle').value,
        description: document.getElementById('noteFormDescription').value,
        month: document.getElementById('noteFormMonth').value,
        access: document.getElementById('noteFormAccess').value,
        downloadable: document.getElementById('noteFormDownloadable').value === 'true'
    };

    if (fileData) {
        note.file = fileData;
    } else if (id) {
        const existing = await getData(`notes/${id}`);
        if (existing) {
            note.file = existing.file;
        }
    }

    if (id) {
        // Keep original createdAt
        const existing = await getData(`notes/${id}`);
        if (existing && existing.createdAt) {
            note.createdAt = existing.createdAt;
        }
        await updateData(`notes/${id}`, note);
    } else {
        note.createdAt = Date.now();
        await pushData('notes', note);
    }

    closeNoteModal();
    loadAdminNotes();
    showToast('Note saved successfully!');
}

async function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        await deleteData(`notes/${id}`);
        loadAdminNotes();
        showToast('Note deleted');
    }
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.add('hidden');
}

// ============================================
// Admin - Tutorials
// ============================================
async function loadAdminTutes() {
    const tutes = await getData('tutes') || {};
    const tbody = document.getElementById('tutesTableBody');

    if (Object.keys(tutes).length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No tutorials yet</td></tr>';
        return;
    }

    tbody.innerHTML = Object.entries(tutes).map(([id, tute]) => `
        <tr>
            <td>${tute.title}</td>
            <td><span class="badge badge-info">${tute.type === 'new' ? 'New' : 'Old'}</span></td>
            <td>${tute.month ? formatMonth(tute.month) : '-'}</td>
            <td><span class="badge ${tute.access === 'paid' ? 'badge-warning' : 'badge-success'}">${tute.access === 'paid' ? 'Paid' : 'Free'}</span></td>
            <td>${tute.downloadable === true || tute.downloadable === 'true' ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="editTute('${id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTute('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddTuteModal() {
    document.getElementById('tuteModalTitle').textContent = 'Add Tutorial';
    document.getElementById('tuteForm').reset();
    document.getElementById('tuteId').value = '';
    document.getElementById('tuteFormFileData').value = '';
    document.getElementById('tuteFileName').textContent = '';
    document.getElementById('tuteModal').classList.remove('hidden');
}

function handleTuteFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('tuteFormFileData').value = e.target.result;
            document.getElementById('tuteFileName').textContent = file.name;
        };
        reader.readAsDataURL(file);
    }
}

async function editTute(id) {
    const tute = await getData(`tutes/${id}`);
    if (!tute) return;

    document.getElementById('tuteModalTitle').textContent = 'Edit Tutorial';
    document.getElementById('tuteId').value = id;
    document.getElementById('tuteFormTitle').value = tute.title;
    document.getElementById('tuteFormDescription').value = tute.description || '';
    document.getElementById('tuteFormType').value = tute.type;
    document.getElementById('tuteFormMonth').value = tute.month || '';
    document.getElementById('tuteFormAccess').value = tute.access;
    document.getElementById('tuteFormDownloadable').value = String(tute.downloadable);
    document.getElementById('tuteFormFileData').value = tute.file || '';
    document.getElementById('tuteFileName').textContent = tute.file ? 'File uploaded' : '';

    document.getElementById('tuteModal').classList.remove('hidden');
}

async function handleTuteSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('tuteId').value;
    const fileData = document.getElementById('tuteFormFileData').value;

    if (!fileData && !id) {
        showToast('Please upload a PDF file', true);
        return;
    }

    const tute = {
        title: document.getElementById('tuteFormTitle').value,
        description: document.getElementById('tuteFormDescription').value,
        type: document.getElementById('tuteFormType').value,
        month: document.getElementById('tuteFormMonth').value,
        access: document.getElementById('tuteFormAccess').value,
        downloadable: document.getElementById('tuteFormDownloadable').value === 'true'
    };

    if (fileData) {
        tute.file = fileData;
    } else if (id) {
        const existing = await getData(`tutes/${id}`);
        if (existing) {
            tute.file = existing.file;
        }
    }

    if (id) {
        // Keep original createdAt
        const existing = await getData(`tutes/${id}`);
        if (existing && existing.createdAt) {
            tute.createdAt = existing.createdAt;
        }
        await updateData(`tutes/${id}`, tute);
    } else {
        tute.createdAt = Date.now();
        await pushData('tutes', tute);
    }

    closeTuteModal();
    loadAdminTutes();
    showToast('Tutorial saved successfully!');
}

async function deleteTute(id) {
    if (confirm('Are you sure you want to delete this tutorial?')) {
        await deleteData(`tutes/${id}`);
        loadAdminTutes();
        showToast('Tutorial deleted');
    }
}

function closeTuteModal() {
    document.getElementById('tuteModal').classList.add('hidden');
}

// ============================================
// Admin - Videos
// ============================================
async function loadAdminVideos() {
    const videos = await getData('videos') || {};
    const tbody = document.getElementById('videosTableBody');

    if (Object.keys(videos).length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No videos yet</td></tr>';
        return;
    }

    tbody.innerHTML = Object.entries(videos).map(([id, video]) => `
        <tr>
            <td>${video.title}</td>
            <td><span class="badge badge-info">${video.source === 'youtube' ? 'YouTube' : video.source === 'gdrive' ? 'Google Drive' : 'File'}</span></td>
            <td>${video.month ? formatMonth(video.month) : '-'}</td>
            <td><span class="badge ${video.access === 'paid' ? 'badge-warning' : 'badge-success'}">${video.access === 'paid' ? 'Paid' : 'Free'}</span></td>
            <td>${video.downloadable === true || video.downloadable === 'true' ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="editVideo('${id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteVideo('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddVideoModal() {
    document.getElementById('videoFormModalTitle').textContent = 'Add Video';
    document.getElementById('videoForm').reset();
    document.getElementById('videoId').value = '';
    document.getElementById('videoFormFileData').value = '';
    document.getElementById('videoFormThumbnailData').value = '';
    document.getElementById('videoFileName').textContent = '';
    document.getElementById('thumbnailPreview').classList.add('hidden');
    document.getElementById('videoFormSource').value = 'youtube';
    switchVideoSource('youtube');
    document.getElementById('videoFormModal').classList.remove('hidden');
}

function switchVideoSource(source) {
    document.getElementById('videoFormSource').value = source;
    
    // Update tab active states
    document.getElementById('tabYoutube').classList.toggle('active', source === 'youtube');
    document.getElementById('tabGdrive').classList.toggle('active', source === 'gdrive');
    document.getElementById('tabFile').classList.toggle('active', source === 'file');
    
    // Show/hide the corresponding input fields
    document.getElementById('youtubeSourceInput').classList.toggle('hidden', source !== 'youtube');
    document.getElementById('gdriveSourceInput').classList.toggle('hidden', source !== 'gdrive');
    document.getElementById('fileSourceInput').classList.toggle('hidden', source !== 'file');
}

function handleVideoFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 50 * 1024 * 1024) {
            showToast('Video file is too large. Max 50MB for file upload. Consider using YouTube or Google Drive instead.', true);
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('videoFormFileData').value = e.target.result;
            document.getElementById('videoFileName').textContent = file.name;
        };
        reader.readAsDataURL(file);
    }
}

function handleThumbnailUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('videoFormThumbnailData').value = e.target.result;
            document.getElementById('thumbnailPreview').innerHTML = `<img src="${e.target.result}" alt="Thumbnail">`;
            document.getElementById('thumbnailPreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

async function editVideo(id) {
    const video = await getData(`videos/${id}`);
    if (!video) return;

    document.getElementById('videoFormModalTitle').textContent = 'Edit Video';
    document.getElementById('videoId').value = id;
    document.getElementById('videoFormTitle').value = video.title;
    document.getElementById('videoFormDescription').value = video.description || '';
    document.getElementById('videoFormMonth').value = video.month || '';
    document.getElementById('videoFormAccess').value = video.access;
    document.getElementById('videoFormDownloadable').value = String(video.downloadable);
    document.getElementById('videoFormSource').value = video.source;
    
    switchVideoSource(video.source);
    
    if (video.source === 'youtube') {
        document.getElementById('videoFormYouTube').value = video.youtube || '';
    } else if (video.source === 'gdrive') {
        document.getElementById('videoFormGDrive').value = video.gdrive || '';
    } else {
        document.getElementById('videoFormFileData').value = video.file || '';
        document.getElementById('videoFileName').textContent = video.file ? 'Video uploaded' : '';
    }

    if (video.thumbnail) {
        document.getElementById('videoFormThumbnailData').value = video.thumbnail;
        document.getElementById('thumbnailPreview').innerHTML = `<img src="${video.thumbnail}" alt="Thumbnail">`;
        document.getElementById('thumbnailPreview').classList.remove('hidden');
    }

    document.getElementById('videoFormModal').classList.remove('hidden');
}

async function handleVideoSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('videoId').value;
    const source = document.getElementById('videoFormSource').value;
    const youtubeUrl = document.getElementById('videoFormYouTube').value;
    const gdriveUrl = document.getElementById('videoFormGDrive').value;
    const fileData = document.getElementById('videoFormFileData').value;

    if (source === 'youtube' && !youtubeUrl) {
        showToast('Please enter a YouTube URL', true);
        return;
    }

    if (source === 'gdrive' && !gdriveUrl) {
        showToast('Please enter a Google Drive URL', true);
        return;
    }

    if (source === 'file' && !fileData && !id) {
        showToast('Please upload a video file', true);
        return;
    }

    const video = {
        title: document.getElementById('videoFormTitle').value,
        description: document.getElementById('videoFormDescription').value,
        month: document.getElementById('videoFormMonth').value,
        access: document.getElementById('videoFormAccess').value,
        downloadable: document.getElementById('videoFormDownloadable').value === 'true',
        source: source
    };

    if (source === 'youtube') {
        video.youtube = youtubeUrl;
        const ytId = extractYouTubeId(youtubeUrl);
        if (ytId) {
            video.thumbnail = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
        }
    } else if (source === 'gdrive') {
        video.gdrive = gdriveUrl;
    } else {
        if (fileData) {
            video.file = fileData;
        } else if (id) {
            const existing = await getData(`videos/${id}`);
            if (existing) {
                video.file = existing.file;
            }
        }
    }

    const thumbnailData = document.getElementById('videoFormThumbnailData').value;
    if (thumbnailData) {
        video.thumbnail = thumbnailData;
    }

    if (id) {
        // Keep original createdAt
        const existing = await getData(`videos/${id}`);
        if (existing && existing.createdAt) {
            video.createdAt = existing.createdAt;
        }
        await updateData(`videos/${id}`, video);
    } else {
        video.createdAt = Date.now();
        await pushData('videos', video);
    }

    closeVideoFormModal();
    loadAdminVideos();
    showToast('Video saved successfully!');
}

async function deleteVideo(id) {
    if (confirm('Are you sure you want to delete this video?')) {
        await deleteData(`videos/${id}`);
        loadAdminVideos();
        showToast('Video deleted');
    }
}

function closeVideoFormModal() {
    document.getElementById('videoFormModal').classList.add('hidden');
}

// ============================================
// Utility Functions
// ============================================
function formatMonth(monthStr) {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.toggle('error', isError);
    toast.querySelector('i').className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Keyboard shortcut prevention for protected content
document.addEventListener('keydown', function(e) {
    // Check if video modal is open
    const videoModal = document.getElementById('videoModal');
    if (!videoModal.classList.contains('hidden')) {
        // Prevent Ctrl+S, Ctrl+U, F12
        if ((e.ctrlKey && (e.key === 's' || e.key === 'u')) || e.key === 'F12') {
            e.preventDefault();
            return false;
        }
    }
});
