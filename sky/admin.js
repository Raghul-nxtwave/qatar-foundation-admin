const captchas = { login:'', signup:'', forgot:'' };
function generateCaptcha(type) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    captchas[type] = code;
    document.getElementById(type + 'CaptchaText').textContent = code;
}
generateCaptcha('login');
generateCaptcha('signup');
generateCaptcha('forgot');

// ===== PAGE NAVIGATION =====
function showPage(pageId) {
    document.querySelectorAll('.form-page').forEach(p => p.classList.remove('active'));
    setTimeout(() => document.getElementById(pageId).classList.add('active'), 50);
    document.querySelectorAll('.error-msg').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('input').forEach(i => i.classList.remove('error'));
}

function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass
        ? '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

// ===== HELPERS =====
function showError(id, msg) {
    const el = document.getElementById(id);
    if (msg) el.querySelector('span').textContent = msg;
    el.classList.add('show');
}
function clearAllErrors(formId) {
    document.querySelectorAll('#' + formId + ' .error-msg').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('#' + formId + ' input').forEach(i => i.classList.remove('error'));
}
function shakeForm(formId) {
    const form = document.getElementById(formId);
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 400);
}
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function showToast(msg) {
    document.getElementById('toastMsg').textContent = msg;
    document.getElementById('toast').classList.add('show');
    setTimeout(() => document.getElementById('toast').classList.remove('show'), 3000);
}
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function checkStrength(val) {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const labels = ['','Weak','Medium','Strong','Very Strong'];
    const classes = ['','weak','medium','strong','very-strong'];
    for (let i = 1; i <= 4; i++) {
        const bar = document.getElementById('str' + i);
        bar.className = 'strength-bar';
        if (i <= score) bar.classList.add(classes[score]);
    }
    document.getElementById('strengthLabel').textContent = val.length > 0 ? labels[score] : '';
}

// ===== API BASE =====
const API = 'https://qatar-foundation-admin.onrender.com/api';

// ===== SHOW DASHBOARD =====
function showDashboard(adminData) {
    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('dashboardWrapper').classList.add('active');
    document.body.style.alignItems = 'stretch';

    const displayName = adminData.full_name || adminData.email.split('@')[0];
    document.getElementById('dashName').textContent = displayName;
    document.getElementById('dashAvatar').textContent = displayName.substring(0, 2).toUpperCase();

    if (window.innerWidth <= 768) {
        document.getElementById('menuToggle').style.display = 'flex';
    }

    // Load opportunities from backend
    loadOpportunities();
}

async function handleLogout() {
    try {
        await fetch(API + '/logout', { method: 'POST', credentials: 'include' });
    } catch(e) {}
    document.getElementById('dashboardWrapper').classList.remove('active');
    document.getElementById('authWrapper').style.display = 'flex';
    document.body.style.alignItems = '';
    showToast('Signed out successfully');
    showPage('loginPage');
}

// ===== NAV ITEMS =====
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', function() {
        const page = this.getAttribute('data-page');
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
        if (page === 'dashboard') {
            document.getElementById('dashboardSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Dashboard';
        } else if (page === 'learner') {
            document.getElementById('learnerSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Learner Management';
        } else if (page === 'verifier') {
            document.getElementById('verifierSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Verifier Management';
        } else if (page === 'collaborator') {
            document.getElementById('collaboratorSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Collaborator Management';
        } else if (page === 'opportunity') {
            document.getElementById('opportunitySection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Opportunity Management';
            loadOpportunities();
        } else if (page === 'reports') {
            document.getElementById('reportsSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Reports and Analytics';
        }
    });
});

// ===== TABS =====
function changeChartPeriod(period) {
    document.querySelectorAll('.tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === period) btn.classList.add('active');
    });
    const chartData = {
        daily: 'M0,120 Q50,110 100,90 T200,70 T300,50 T400,40',
        weekly: 'M0,110 Q50,95 100,85 T200,65 T300,45 T400,35',
        monthly: 'M0,100 Q50,85 100,75 T200,55 T300,40 T400,30',
        quarterly: 'M0,90 Q50,75 100,65 T200,50 T300,35 T400,25',
        yearly: 'M0,80 Q50,65 100,55 T200,40 T300,30 T400,20'
    };
    const path = chartData[period];
    document.getElementById('linePath').setAttribute('d', path);
    document.getElementById('lineArea').setAttribute('d', path + ' L400,150 L0,150 Z');
}

// ===== NOTIFICATIONS =====
function toggleNotifications() {
    document.getElementById('notificationDropdown').classList.toggle('active');
}
function markAllRead() {
    document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
    showToast('All notifications marked as read');
}
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.getElementById('notifBtn');
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// ===== THEME =====
function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    const icon = document.getElementById('themeIcon');
    if (newTheme === 'dark') {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    } else {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    }
}

// ===== SEARCH =====
function openSearch() {
    document.getElementById('searchContainer').classList.add('active');
    document.getElementById('searchInput').focus();
}
function closeSearch() {
    document.getElementById('searchContainer').classList.remove('active');
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSearch();
        closeCourseModal();
        closeOpportunityModal();
        closeOpportunityDetailsModal();
        closeCollaboratorCoursesModal();
        closeQuickAddModal();
        closeBulkUploadModal();
        closeQuickAddVerifierModal();
        closeBulkUploadVerifierModal();
        closeVerifierDetailsModal();
    }
});
document.getElementById('searchContainer').addEventListener('click', function(e) {
    if (e.target === this) closeSearch();
});

// ===== COURSE MODAL =====
function openCourseDetails(courseName, stats) {
    document.getElementById('modalCourseTitle').textContent = courseName;
    document.getElementById('modalEnrolled').textContent = stats.enrolled;
    document.getElementById('modalCompleted').textContent = stats.completed;
    document.getElementById('modalInProgress').textContent = stats.inProgress;
    document.getElementById('modalHalfDone').textContent = stats.halfDone;
    document.getElementById('courseModal').classList.add('active');
}
function closeCourseModal() {
    document.getElementById('courseModal').classList.remove('active');
}
document.getElementById('courseModal').addEventListener('click', function(e) {
    if (e.target === this) closeCourseModal();
});

// ===== OPPORTUNITY DETAILS MODAL =====
function openOpportunityDetails(title, details) {
    document.getElementById('opportunityDetailTitle').textContent = title;
    document.getElementById('opportunityDetailDuration').textContent = details.duration;
    document.getElementById('opportunityDetailStartDate').textContent = details.startDate;
    document.getElementById('opportunityDetailApplicants').textContent = details.applicants || 'N/A';
    document.getElementById('opportunityDetailDescription').textContent = details.description;
    document.getElementById('opportunityDetailFuture').textContent = details.futureOpportunities;
    document.getElementById('opportunityDetailPrereqs').textContent = details.prerequisites || '';
    const skillsContainer = document.getElementById('opportunityDetailSkills');
    skillsContainer.innerHTML = '';
    details.skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        skillsContainer.appendChild(tag);
    });
    document.getElementById('opportunityDetailsModal').classList.add('active');
}
function closeOpportunityDetailsModal() {
    document.getElementById('opportunityDetailsModal').classList.remove('active');
}
function applyToOpportunity() {
    showToast('Application submitted successfully!');
    closeOpportunityDetailsModal();
}
document.getElementById('opportunityDetailsModal').addEventListener('click', function(e) {
    if (e.target === this) closeOpportunityDetailsModal();
});

// ===== COLLABORATOR MODAL =====
function openCollaboratorCourses(name, role) {
    document.getElementById('collaboratorName').textContent = name + "'s Submitted Courses";
    document.getElementById('collaboratorRole').textContent = 'Role: ' + role;
    document.getElementById('collaboratorCoursesModal').classList.add('active');
}
function closeCollaboratorCoursesModal() {
    document.getElementById('collaboratorCoursesModal').classList.remove('active');
}
function approveCourse(courseName) { showToast(courseName + ' has been approved!'); }
function rejectCourse(courseName) { showToast(courseName + ' has been rejected.'); }
function viewCourseDetails(courseName) { showToast('Viewing details for ' + courseName); }
document.getElementById('collaboratorCoursesModal').addEventListener('click', function(e) {
    if (e.target === this) closeCollaboratorCoursesModal();
});

// ===== OPPORTUNITY MODAL (Create / Edit) =====
let editingOpportunityId = null;

function openOpportunityModal(oppData) {
    editingOpportunityId = oppData ? oppData.id : null;
    const form = document.getElementById('opportunityForm');
    form.reset();

    // Change modal title based on mode
    const modalTitle = document.querySelector('#opportunityModal h3') ||
                       document.querySelector('#opportunityModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = oppData ? 'Edit Opportunity' : 'Add New Opportunity';
    }

    if (oppData) {
        document.getElementById('oppName').value = oppData.name || '';
        document.getElementById('oppDuration').value = oppData.duration || '';
        document.getElementById('oppStartDate').value = oppData.start_date || '';
        document.getElementById('oppDescription').value = oppData.description || '';
        document.getElementById('oppSkills').value = oppData.skills || '';
        document.getElementById('oppCategory').value = oppData.category || '';
        document.getElementById('oppFuture').value = oppData.future_opportunities || '';
        document.getElementById('oppMaxApplicants').value = oppData.max_applicants || '';
    }

    document.getElementById('opportunityModal').classList.add('active');
}

function closeOpportunityModal() {
    document.getElementById('opportunityModal').classList.remove('active');
    editingOpportunityId = null;
}
document.getElementById('opportunityModal').addEventListener('click', function(e) {
    if (e.target === this) closeOpportunityModal();
});

// ===== OPPORTUNITY FORM SUBMIT =====
document.getElementById('opportunityForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('oppName').value.trim();
    const duration = document.getElementById('oppDuration').value.trim();
    const startDate = document.getElementById('oppStartDate').value;
    const description = document.getElementById('oppDescription').value.trim();
    const skillsRaw = document.getElementById('oppSkills').value.trim();
    const category = document.getElementById('oppCategory').value;
    const futureOpportunities = document.getElementById('oppFuture').value.trim();
    const maxApplicants = document.getElementById('oppMaxApplicants').value.trim();

    if (!name || !duration || !startDate || !description || !skillsRaw || !category || !futureOpportunities) {
        showToast('Please fill all required fields');
        return;
    }

    const payload = {
        name, duration, start_date: startDate, description,
        skills: skillsRaw, category, future_opportunities: futureOpportunities,
        max_applicants: maxApplicants ? parseInt(maxApplicants) : null
    };

    try {
        let response;
        if (editingOpportunityId) {
            response = await fetch(API + '/opportunities/' + editingOpportunityId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch(API + '/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();
        if (!response.ok) {
            showToast(data.error || 'Something went wrong');
            return;
        }

        showToast(editingOpportunityId ? 'Opportunity updated!' : 'Opportunity created successfully!');
        closeOpportunityModal();
        loadOpportunities();
    } catch (err) {
        showToast('Network error. Please try again.');
    }
});

// ===== LOAD OPPORTUNITIES FROM BACKEND =====
async function loadOpportunities() {
    const grid = document.querySelector('.opportunities-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="color:var(--text-secondary)">Loading...</p>';

    try {
        const response = await fetch(API + '/opportunities', {
            credentials: 'include'
        });

        if (response.status === 401) {
            grid.innerHTML = '<p style="color:var(--text-secondary)">Please log in to view opportunities.</p>';
            return;
        }

        const opportunities = await response.json();
        grid.innerHTML = '';

        if (opportunities.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-secondary); padding:2rem;">No opportunities created yet. Click "Add New Opportunity" to get started.</p>';
            return;
        }

        opportunities.forEach(opp => {
            grid.appendChild(buildOpportunityCard(opp));
        });

    } catch (err) {
        grid.innerHTML = '<p style="color:var(--text-secondary)">Failed to load opportunities.</p>';
    }
}

// ===== BUILD OPPORTUNITY CARD =====
function buildOpportunityCard(opp) {
    const card = document.createElement('div');
    card.className = 'opportunity-card';
    card.setAttribute('data-id', opp.id);

    const skills = opp.skills ? opp.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const applicantsText = opp.max_applicants ? opp.max_applicants + ' applicants' : '0 applicants';

    card.innerHTML = `
        <div class="opportunity-card-header">
            <h5>${escapeHtml(opp.name)}</h5>
            <div class="opportunity-meta">
                <span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escapeHtml(opp.duration)}</span>
                <span><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(opp.start_date)}</span>
                <span style="background:var(--primary-light,#e8f0fe);color:var(--primary,#4f46e5);padding:2px 8px;border-radius:4px;font-size:12px;">${escapeHtml(opp.category)}</span>
            </div>
        </div>
        <p class="opportunity-description">${escapeHtml(opp.description)}</p>
        <div class="opportunity-skills">
            <div class="opportunity-skills-label">Skills You'll Gain</div>
            <div class="skills-tags">
                ${skills.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
            </div>
        </div>
        <div class="opportunity-footer">
            <span class="applicants-count">${escapeHtml(applicantsText)}</span>
            <div style="display:flex;gap:8px;">
                <button class="view-course-btn btn-view" style="width:auto;padding:8px 16px;">View Details</button>
                <button class="view-course-btn btn-edit" style="width:auto;padding:8px 16px;background:#f59e0b;">Edit</button>
                <button class="view-course-btn btn-delete" style="width:auto;padding:8px 16px;background:#ef4444;">Delete</button>
            </div>
        </div>
    `;

    // View Details
    card.querySelector('.btn-view').addEventListener('click', () => {
        openOpportunityDetails(opp.name, {
            duration: opp.duration,
            startDate: opp.start_date,
            description: opp.description,
            skills: skills,
            applicants: opp.max_applicants || 0,
            futureOpportunities: opp.future_opportunities,
            prerequisites: ''
        });
    });

    // Edit
    card.querySelector('.btn-edit').addEventListener('click', () => {
        openOpportunityModal(opp);
    });

    // Delete
    card.querySelector('.btn-delete').addEventListener('click', () => {
        deleteOpportunity(opp.id, card);
    });

    return card;
}

// ===== DELETE OPPORTUNITY =====
async function deleteOpportunity(id, cardElement) {
    if (!confirm('Are you sure you want to delete this opportunity? This cannot be undone.')) return;

    try {
        const response = await fetch(API + '/opportunities/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) {
            showToast(data.error || 'Delete failed');
            return;
        }

        cardElement.remove();
        showToast('Opportunity deleted successfully');

        // Show empty state if no cards left
        const grid = document.querySelector('.opportunities-grid');
        if (grid && grid.children.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-secondary); padding:2rem;">No opportunities created yet. Click "Add New Opportunity" to get started.</p>';
        }
    } catch (err) {
        showToast('Network error. Please try again.');
    }
}

// ===== QUICK ADD STUDENT =====
function openQuickAddModal() { document.getElementById('quickAddModal').classList.add('active'); }
function closeQuickAddModal() { document.getElementById('quickAddModal').classList.remove('active'); }
document.getElementById('quickAddModal').addEventListener('click', function(e) { if (e.target === this) closeQuickAddModal(); });
document.getElementById('quickAddForm').addEventListener('submit', function(e) {
    e.preventDefault();
    showToast('Student added successfully! Email invitation sent.');
    closeQuickAddModal(); this.reset();
});

// ===== BULK UPLOAD =====
function openBulkUploadModal() { document.getElementById('bulkUploadModal').classList.add('active'); }
function closeBulkUploadModal() { document.getElementById('bulkUploadModal').classList.remove('active'); }
document.getElementById('bulkUploadModal').addEventListener('click', function(e) { if (e.target === this) closeBulkUploadModal(); });
document.getElementById('bulkUploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput.files.length === 0) { showToast('Please select a CSV file'); return; }
    showToast('Students uploaded successfully!');
    closeBulkUploadModal(); this.reset();
    document.getElementById('fileName').textContent = '';
});
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) document.getElementById('fileName').textContent = '✔ Selected: ' + file.name;
}
function downloadSampleCSV() {
    const csvContent = 'First Name,Last Name,Email\nJohn,Doe,john.doe@example.com\nJane,Smith,jane.smith@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sample_students.csv'; a.click();
    window.URL.revokeObjectURL(url);
}

// ===== QUICK ADD VERIFIER =====
function openQuickAddVerifierModal() { document.getElementById('quickAddVerifierModal').classList.add('active'); }
function closeQuickAddVerifierModal() { document.getElementById('quickAddVerifierModal').classList.remove('active'); }
document.getElementById('quickAddVerifierModal').addEventListener('click', function(e) { if (e.target === this) closeQuickAddVerifierModal(); });
document.getElementById('quickAddVerifierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    showToast('Verifier added successfully!');
    closeQuickAddVerifierModal(); this.reset();
});

// ===== BULK UPLOAD VERIFIER =====
function openBulkUploadVerifierModal() { document.getElementById('bulkUploadVerifierModal').classList.add('active'); }
function closeBulkUploadVerifierModal() { document.getElementById('bulkUploadVerifierModal').classList.remove('active'); }
document.getElementById('bulkUploadVerifierModal').addEventListener('click', function(e) { if (e.target === this) closeBulkUploadVerifierModal(); });
document.getElementById('bulkUploadVerifierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('csvVerifierFileInput');
    if (fileInput.files.length === 0) { showToast('Please select a CSV file'); return; }
    showToast('Verifiers uploaded successfully!');
    closeBulkUploadVerifierModal(); this.reset();
    document.getElementById('verifierFileName').textContent = '';
});
function handleVerifierFileSelect(event) {
    const file = event.target.files[0];
    if (file) document.getElementById('verifierFileName').textContent = '✔ Selected: ' + file.name;
}
function downloadSampleVerifierCSV() {
    const csvContent = 'First Name,Last Name,Email,Subject\nDr. John,Doe,john.doe@qf.edu.qa,Mathematics';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sample_verifiers.csv'; a.click();
    window.URL.revokeObjectURL(url);
}

// ===== VERIFIER DETAILS =====
function openVerifierDetails(name, stats) {
    document.getElementById('verifierName').textContent = name;
    document.getElementById('verifierTotalStudents').textContent = stats.totalStudents;
    document.getElementById('verifierCertified').textContent = stats.certified;
    document.getElementById('verifierInProgress').textContent = stats.inProgress;
    const container = document.getElementById('subjectsContainer');
    container.innerHTML = '';
    stats.subjects.forEach(subject => {
        const div = document.createElement('div');
        div.className = 'subject-item';
        div.innerHTML = `<span class="subject-name">${subject.name}</span><span class="subject-students">${subject.students} students</span>`;
        container.appendChild(div);
    });
    document.getElementById('verifierDetailsModal').classList.add('active');
}
function closeVerifierDetailsModal() { document.getElementById('verifierDetailsModal').classList.remove('active'); }
document.getElementById('verifierDetailsModal').addEventListener('click', function(e) { if (e.target === this) closeVerifierDetailsModal(); });

// ===== FILTERS =====
function filterStudents() {
    const statusFilter = document.getElementById('statusFilter').value;
    document.querySelectorAll('#studentsTableBody tr').forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        row.style.display = (statusFilter === 'all' || rowStatus === statusFilter) ? '' : 'none';
    });
}
function filterVerifiers() {
    const statusFilter = document.getElementById('verifierStatusFilter').value;
    document.querySelectorAll('#verifiersTableBody tr').forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        row.style.display = (statusFilter === 'all' || rowStatus === statusFilter) ? '' : 'none';
    });
}

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('loginForm');
    let valid = true;
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const rememberMe = document.getElementById('loginRemember') ? document.getElementById('loginRemember').checked : false;
    const captchaInput = document.getElementById('loginCaptchaInput').value.trim();

    if (!email || !isValidEmail(email)) { showError('loginEmailErr'); document.getElementById('loginEmail').classList.add('error'); valid = false; }
    if (!password) { showError('loginPasswordErr','Please enter your password'); document.getElementById('loginPassword').classList.add('error'); valid = false; }
    if (!captchaInput) { showError('loginCaptchaErr','Please enter the captcha code'); valid = false; }
    else if (captchaInput !== captchas.login) { showError('loginCaptchaErr','Captcha does not match. Please try again.'); valid = false; generateCaptcha('login'); }

    if (!valid) { shakeForm('loginForm'); return; }

    try {
        const response = await fetch(API + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password, remember_me: rememberMe })
        });

        const data = await response.json();

        if (!response.ok) {
            showError('loginPasswordErr', data.error || 'Invalid email or password');
            document.getElementById('loginPassword').classList.add('error');
            shakeForm('loginForm');
            generateCaptcha('login');
            return;
        }

        showToast('Login successful! Redirecting...');
        generateCaptcha('login');
        setTimeout(() => showDashboard(data.admin), 1200);

    } catch (err) {
        showToast('Network error. Is the server running?');
    }
});

// ===== SIGNUP =====
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('signupForm');
    let valid = true;
    const full_name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirm_password = document.getElementById('signupConfirmPassword').value.trim();
    const captchaInput = document.getElementById('signupCaptchaInput').value.trim();

    if (!full_name) { showError('signupNameErr'); document.getElementById('signupName').classList.add('error'); valid = false; }
    if (!email || !isValidEmail(email)) { showError('signupEmailErr'); document.getElementById('signupEmail').classList.add('error'); valid = false; }
    if (!password || password.length < 8) { showError('signupPasswordErr'); document.getElementById('signupPassword').classList.add('error'); valid = false; }
    if (!confirm_password || password !== confirm_password) { showError('signupConfirmPasswordErr'); document.getElementById('signupConfirmPassword').classList.add('error'); valid = false; }
    if (!captchaInput) { showError('signupCaptchaErr','Please enter the captcha code'); valid = false; }
    else if (captchaInput !== captchas.signup) { showError('signupCaptchaErr','Captcha does not match.'); valid = false; generateCaptcha('signup'); }

    if (!valid) { shakeForm('signupForm'); return; }

    try {
        const response = await fetch(API + '/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ full_name, email, password, confirm_password })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.error && data.error.toLowerCase().includes('email')) {
                showError('signupEmailErr', data.error);
                document.getElementById('signupEmail').classList.add('error');
            } else {
                showToast(data.error || 'Signup failed');
            }
            shakeForm('signupForm');
            generateCaptcha('signup');
            return;
        }

        showToast('Account created successfully!');
        generateCaptcha('signup');
        this.reset();
        checkStrength('');
        setTimeout(() => showPage('loginPage'), 1500);

    } catch (err) {
        showToast('Network error. Is the server running?');
    }
});

// ===== FORGOT PASSWORD =====
document.getElementById('forgotForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('forgotForm');
    let valid = true;
    const email = document.getElementById('forgotEmail').value.trim();
    const captchaInput = document.getElementById('forgotCaptchaInput').value.trim();

    if (!email || !isValidEmail(email)) { showError('forgotEmailErr'); document.getElementById('forgotEmail').classList.add('error'); valid = false; }
    if (!captchaInput) { showError('forgotCaptchaErr','Please enter the captcha code'); valid = false; }
    else if (captchaInput !== captchas.forgot) { showError('forgotCaptchaErr','Captcha does not match.'); valid = false; generateCaptcha('forgot'); }

    if (!valid) { shakeForm('forgotForm'); return; }

    try {
        await fetch(API + '/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        showToast('If this email is registered, a reset link has been sent.');
        generateCaptcha('forgot');
        this.reset();
    } catch (err) {
        showToast('Network error. Is the server running?');
    }
});

// Clear errors on input
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
        this.classList.remove('error');
        const err = this.closest('.form-group')?.querySelector('.error-msg');
        if (err) err.classList.remove('show');
    });
});

// Responsive sidebar
window.addEventListener('resize', () => {
    const toggle = document.getElementById('menuToggle');
    if (toggle) toggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
});