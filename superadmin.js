// Super Admin Panel JavaScript
// Firebase Configuration (Same as main app)
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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Default Super Admin Credentials
const DEFAULT_SUPER_ADMIN = {
    accessKey: 'superadmin@dev.com',
    securityCode: 'SuperAdmin@2024!'
};

// DOM Elements
const superLoginScreen = document.getElementById('superLoginScreen');
const superDashboard = document.getElementById('superDashboard');
const superLoginForm = document.getElementById('superLoginForm');
const superLoginError = document.getElementById('superLoginError');
const superLogoutBtn = document.getElementById('superLogoutBtn');
const superLastLogin = document.getElementById('superLastLogin');
const superToast = document.getElementById('superToast');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize default super admin credentials if not exists
    await initializeSuperAdmin();
    
    // Check for existing session
    const session = localStorage.getItem('superAdminSession');
    if (session) {
        const sessionData = JSON.parse(session);
        const now = Date.now();
        // Session valid for 4 hours
        if (now - sessionData.timestamp < 4 * 60 * 60 * 1000) {
            showDashboard();
            return;
        }
    }
    
    // Show login screen
    superLoginScreen.classList.remove('hidden');
});

// Initialize Super Admin
async function initializeSuperAdmin() {
    try {
        const snapshot = await db.ref('superAdmin/credentials').once('value');
        if (!snapshot.exists()) {
            await db.ref('superAdmin/credentials').set(DEFAULT_SUPER_ADMIN);
            console.log('Super admin credentials initialized');
        }
        
        // Initialize default restrictions
        const restrictionsSnapshot = await db.ref('superAdmin/restrictions').once('value');
        if (!restrictionsSnapshot.exists()) {
            await db.ref('superAdmin/restrictions').set({
                siteEnabled: true,
                maintenanceMessage: 'Site is under maintenance. Please try again later.',
                studentFeatures: {
                    notes: true,
                    tutes: true,
                    videos: true
                },
                adminFeatures: {
                    notes: true,
                    tutes: true,
                    videos: true,
                    students: true,
                    notices: true,
                    branding: true
                }
            });
        }
    } catch (error) {
        console.error('Error initializing super admin:', error);
    }
}

// Login Form Handler
superLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const accessKey = document.getElementById('superAccessKey').value;
    const securityCode = document.getElementById('superSecurityCode').value;
    
    try {
        const snapshot = await db.ref('superAdmin/credentials').once('value');
        const credentials = snapshot.val();
        
        if (credentials && credentials.accessKey === accessKey && credentials.securityCode === securityCode) {
            // Save session
            localStorage.setItem('superAdminSession', JSON.stringify({
                timestamp: Date.now()
            }));
            
            // Update last login
            await db.ref('superAdmin/lastLogin').set(new Date().toISOString());
            
            showDashboard();
        } else {
            superLoginError.textContent = 'Invalid credentials. Access denied.';
            superLoginError.classList.remove('hidden');
        }
    } catch (error) {
        superLoginError.textContent = 'Connection error. Please try again.';
        superLoginError.classList.remove('hidden');
    }
});

// Show Dashboard
async function showDashboard() {
    superLoginScreen.classList.add('hidden');
    superDashboard.classList.remove('hidden');
    
    // Load last login
    try {
        const snapshot = await db.ref('superAdmin/lastLogin').once('value');
        if (snapshot.exists()) {
            const date = new Date(snapshot.val());
            superLastLogin.textContent = `Last login: ${date.toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error loading last login:', error);
    }
    
    // Load current settings
    await loadRestrictions();
    await loadStatistics();
}

// Load Restrictions
async function loadRestrictions() {
    try {
        const snapshot = await db.ref('superAdmin/restrictions').once('value');
        const restrictions = snapshot.val() || {};
        
        // Site status
        document.getElementById('siteEnabledToggle').checked = restrictions.siteEnabled !== false;
        document.getElementById('maintenanceTitle').value = restrictions.maintenanceTitle || 'Site Under Maintenance';
        document.getElementById('maintenanceMessage').value = restrictions.maintenanceMessage || '';
        updateSiteStatusText(restrictions.siteEnabled !== false);
        
        // Student features
        const studentFeatures = restrictions.studentFeatures || {};
        document.getElementById('studentNotesToggle').checked = studentFeatures.notes !== false;
        document.getElementById('studentTutesToggle').checked = studentFeatures.tutes !== false;
        document.getElementById('studentVideosToggle').checked = studentFeatures.videos !== false;
        
        // Admin features
        const adminFeatures = restrictions.adminFeatures || {};
        document.getElementById('adminNotesToggle').checked = adminFeatures.notes !== false;
        document.getElementById('adminTutesToggle').checked = adminFeatures.tutes !== false;
        document.getElementById('adminVideosToggle').checked = adminFeatures.videos !== false;
        document.getElementById('adminStudentsToggle').checked = adminFeatures.students !== false;
        document.getElementById('adminNoticesToggle').checked = adminFeatures.notices !== false;
        document.getElementById('adminBrandingToggle').checked = adminFeatures.branding !== false;
        
        // Load teacher notices for control
        await loadTeacherNotices();
    } catch (error) {
        console.error('Error loading restrictions:', error);
    }
}

// Load Teacher Notices for Control
async function loadTeacherNotices() {
    try {
        const noticesSnapshot = await db.ref('notices').once('value');
        const notices = noticesSnapshot.val() || {};
        
        const restrictionsSnapshot = await db.ref('superAdmin/restrictions/noticeRestrictions').once('value');
        const noticeRestrictions = restrictionsSnapshot.val() || {};
        
        const container = document.getElementById('teacherNoticesList');
        
        if (Object.keys(notices).length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center;">No notices published by teacher yet.</p>';
            return;
        }
        
        container.innerHTML = Object.entries(notices).map(([id, notice]) => {
            const isEnabled = noticeRestrictions[id] !== false;
            return `
                <div class="notice-control-item">
                    <div class="notice-info">
                        <span class="notice-type-badge ${notice.type}">${notice.type}</span>
                        <span class="notice-title">${notice.type === 'text' ? notice.title : 'Image Banner'}</span>
                    </div>
                    <label class="toggle-switch small">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleNotice('${id}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading teacher notices:', error);
    }
}

// Toggle Individual Notice
async function toggleNotice(noticeId, enabled) {
    try {
        await db.ref(`superAdmin/restrictions/noticeRestrictions/${noticeId}`).set(enabled);
        showToast(`Notice ${enabled ? 'enabled' : 'disabled'} for students`, 'success');
    } catch (error) {
        showToast('Error updating notice', 'error');
    }
}

// Update site status text
function updateSiteStatusText(enabled) {
    const statusText = document.getElementById('siteStatusText');
    if (enabled) {
        statusText.textContent = 'Site is currently ONLINE';
        statusText.style.color = '#4ade80';
    } else {
        statusText.textContent = 'Site is currently OFFLINE';
        statusText.style.color = '#f87171';
    }
}

// Site status toggle listener
document.getElementById('siteEnabledToggle').addEventListener('change', function() {
    updateSiteStatusText(this.checked);
});

// Load Statistics
async function loadStatistics() {
    try {
        // Students
        const studentsSnapshot = await db.ref('students').once('value');
        const students = studentsSnapshot.val() || {};
        const studentsList = Object.values(students);
        document.getElementById('statStudents').textContent = studentsList.length;
        document.getElementById('statPaidStudents').textContent = studentsList.filter(s => s.isPaid).length;
        
        // Notes
        const notesSnapshot = await db.ref('notes').once('value');
        const notes = notesSnapshot.val() || {};
        document.getElementById('statNotes').textContent = Object.keys(notes).length;
        
        // Tutes
        const tutesSnapshot = await db.ref('tutorials').once('value');
        const tutes = tutesSnapshot.val() || {};
        document.getElementById('statTutes').textContent = Object.keys(tutes).length;
        
        // Videos
        const videosSnapshot = await db.ref('videos').once('value');
        const videos = videosSnapshot.val() || {};
        document.getElementById('statVideos').textContent = Object.keys(videos).length;
        
        // Notices
        const noticesSnapshot = await db.ref('notices').once('value');
        const notices = noticesSnapshot.val() || {};
        document.getElementById('statNotices').textContent = Object.keys(notices).length;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Save Site Status
document.getElementById('saveSiteStatus').addEventListener('click', async () => {
    const siteEnabled = document.getElementById('siteEnabledToggle').checked;
    const maintenanceTitle = document.getElementById('maintenanceTitle').value;
    const maintenanceMessage = document.getElementById('maintenanceMessage').value;
    
    try {
        await db.ref('superAdmin/restrictions/siteEnabled').set(siteEnabled);
        await db.ref('superAdmin/restrictions/maintenanceTitle').set(maintenanceTitle);
        await db.ref('superAdmin/restrictions/maintenanceMessage').set(maintenanceMessage);
        showToast('Site status saved successfully!', 'success');
    } catch (error) {
        showToast('Error saving site status', 'error');
    }
});

// Save Student Features
document.getElementById('saveStudentFeatures').addEventListener('click', async () => {
    const features = {
        notes: document.getElementById('studentNotesToggle').checked,
        tutes: document.getElementById('studentTutesToggle').checked,
        videos: document.getElementById('studentVideosToggle').checked
    };
    
    try {
        await db.ref('superAdmin/restrictions/studentFeatures').set(features);
        showToast('Student features saved successfully!', 'success');
    } catch (error) {
        showToast('Error saving student features', 'error');
    }
});

// Save Admin Features
document.getElementById('saveAdminFeatures').addEventListener('click', async () => {
    const features = {
        notes: document.getElementById('adminNotesToggle').checked,
        tutes: document.getElementById('adminTutesToggle').checked,
        videos: document.getElementById('adminVideosToggle').checked,
        students: document.getElementById('adminStudentsToggle').checked,
        notices: document.getElementById('adminNoticesToggle').checked,
        branding: document.getElementById('adminBrandingToggle').checked
    };
    
    try {
        await db.ref('superAdmin/restrictions/adminFeatures').set(features);
        showToast('Admin features saved successfully!', 'success');
    } catch (error) {
        showToast('Error saving admin features', 'error');
    }
});

// Export All Data
document.getElementById('exportAllData').addEventListener('click', async () => {
    try {
        const snapshot = await db.ref('/').once('value');
        const data = snapshot.val();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `full-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Data exported successfully!', 'success');
    } catch (error) {
        showToast('Error exporting data', 'error');
    }
});

// Import Data
document.getElementById('importDataFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (confirm('WARNING: This will replace ALL existing data. Are you sure you want to continue?')) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            await db.ref('/').set(data);
            showToast('Data imported successfully!', 'success');
            
            // Reload statistics
            await loadStatistics();
            await loadRestrictions();
        } catch (error) {
            showToast('Error importing data. Invalid file format.', 'error');
        }
    }
    
    e.target.value = '';
});

// Reset All Data
document.getElementById('resetAllData').addEventListener('click', async () => {
    const confirmation = prompt('This will DELETE ALL DATA permanently. Type "DELETE ALL" to confirm:');
    
    if (confirmation === 'DELETE ALL') {
        try {
            // Delete everything except super admin credentials
            const snapshot = await db.ref('superAdmin/credentials').once('value');
            const credentials = snapshot.val();
            
            await db.ref('/').set({
                superAdmin: {
                    credentials: credentials,
                    restrictions: {
                        siteEnabled: true,
                        maintenanceMessage: 'Site is under maintenance. Please try again later.',
                        studentFeatures: { notes: true, tutes: true, videos: true },
                        adminFeatures: { notes: true, tutes: true, videos: true, students: true, notices: true, branding: true }
                    }
                },
                admin: {
                    email: 'admin@admin.com',
                    password: 'admin123'
                }
            });
            
            showToast('All data has been reset!', 'success');
            await loadStatistics();
            await loadRestrictions();
        } catch (error) {
            showToast('Error resetting data', 'error');
        }
    } else if (confirmation !== null) {
        showToast('Reset cancelled. Confirmation text did not match.', 'error');
    }
});

// Change Credentials
document.getElementById('changeCredentialsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentKey = document.getElementById('currentKey').value;
    const currentCode = document.getElementById('currentCode').value;
    const newKey = document.getElementById('newKey').value;
    const newCode = document.getElementById('newCode').value;
    
    try {
        const snapshot = await db.ref('superAdmin/credentials').once('value');
        const credentials = snapshot.val();
        
        if (credentials.accessKey !== currentKey || credentials.securityCode !== currentCode) {
            showToast('Current credentials are incorrect', 'error');
            return;
        }
        
        await db.ref('superAdmin/credentials').set({
            accessKey: newKey,
            securityCode: newCode
        });
        
        showToast('Credentials updated successfully!', 'success');
        e.target.reset();
    } catch (error) {
        showToast('Error updating credentials', 'error');
    }
});

// Logout
superLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('superAdminSession');
    superDashboard.classList.add('hidden');
    superLoginScreen.classList.remove('hidden');
    document.getElementById('superAccessKey').value = '';
    document.getElementById('superSecurityCode').value = '';
    superLoginError.classList.add('hidden');
});

// Toast notification
function showToast(message, type = 'info') {
    superToast.textContent = message;
    superToast.className = `super-toast ${type}`;
    superToast.classList.remove('hidden');
    
    setTimeout(() => {
        superToast.classList.add('hidden');
    }, 4000);
}
