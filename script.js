// =============================================
// حماية الملف - منع فتحه مباشرة
// =============================================
(function() {
    // منع فتح الملف مباشرة
    if (window.location.href.includes('script.js')) {
        window.location.href = '/';
        return;
    }
    
    // منع console.log من عرض المعلومات
    const noop = function() {};
    if (typeof console !== 'undefined') {
        console.log = noop;
        console.info = noop;
        console.warn = noop;
        console.error = noop;
    }
    
    // كشف محاولة فتح الأدوات
    setInterval(function() {
        const before = new Date();
        debugger;
        const after = new Date();
        if (after - before > 100) {
            document.body.innerHTML = '<div style="height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;"><h1>Access Denied</h1></div>';
            throw new Error('Dev Tools Detected');
        }
    }, 1000);
})();

// =============================================
// Admin Credentials
// =============================================
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

// =============================================
// Data Storage
// =============================================
let accounts = [];
let tools = [];
let news = [];
let currentFilter = 'all';
let currentContent = 'accounts';
let currentUser = null;
let users = [];
let activityLog = [];
let accountRowCount = 0;
let lastVisit = { accounts: 0, tools: 0, news: 0 };

// Load data from localStorage
function loadData() {
    const savedAccounts = localStorage.getItem('rtls_accounts');
    const savedTools = localStorage.getItem('rtls_tools');
    const savedNews = localStorage.getItem('rtls_news');
    const savedUsers = localStorage.getItem('rtls_users');
    const savedActivity = localStorage.getItem('rtls_activity');
    
    accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
    tools = savedTools ? JSON.parse(savedTools) : [];
    news = savedNews ? JSON.parse(savedNews) : [];
    users = savedUsers ? JSON.parse(savedUsers) : [
        { id: 1, username: 'admin', email: 'admin@rtls.com', password: 'admin123', isAdmin: true, createdAt: new Date().toISOString() }
    ];
    activityLog = savedActivity ? JSON.parse(savedActivity) : [];
}

// Save data
function saveData() {
    localStorage.setItem('rtls_accounts', JSON.stringify(accounts));
    localStorage.setItem('rtls_tools', JSON.stringify(tools));
    localStorage.setItem('rtls_news', JSON.stringify(news));
    localStorage.setItem('rtls_users', JSON.stringify(users));
    localStorage.setItem('rtls_activity', JSON.stringify(activityLog));
    updateNotificationBadges();
    if (sessionStorage.getItem('rtls_admin') === 'true') {
        displayActivityLog();
        displayUserManagement();
    }
}

function formatDate(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

// Activity Logger
function logActivity(action, username, details = '') {
    const entry = {
        id: Date.now(),
        action: action,
        username: username,
        details: details,
        timestamp: new Date().toISOString(),
        formattedDate: formatDate(new Date())
    };
    activityLog.unshift(entry);
    if (activityLog.length > 100) activityLog.pop();
    localStorage.setItem('rtls_activity', JSON.stringify(activityLog));
}

// =============================================
// Auth Functions
// =============================================
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('rtls_loggedIn');
    const isAdmin = sessionStorage.getItem('rtls_admin');
    const loginContainer = document.getElementById('loginContainer');
    const mainContainer = document.getElementById('mainContainer');
    const adminPanel = document.getElementById('adminPanel');
    
    if (isLoggedIn === 'true') {
        loginContainer.style.display = 'none';
        mainContainer.style.display = 'block';
        adminPanel.style.display = isAdmin === 'true' ? 'block' : 'none';
        const userData = sessionStorage.getItem('rtls_user');
        if (userData) {
            const user = JSON.parse(userData);
            document.getElementById('currentUsername').textContent = user.username;
        }
        loadData();
        displayItems();
        updateNotificationBadges();
        if (isAdmin === 'true') {
            displayActivityLog();
            displayUserManagement();
            if (document.getElementById('accountsContainer').children.length === 0) {
                addAccountRow();
            }
        }
    } else {
        loginContainer.style.display = 'flex';
        mainContainer.style.display = 'none';
    }
}

window.login = function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('rtls_loggedIn', 'true');
        sessionStorage.setItem('rtls_admin', 'true');
        sessionStorage.setItem('rtls_user', JSON.stringify({ username: 'admin', isAdmin: true, id: 1 }));
        logActivity('Admin Login', 'admin', 'Logged in as administrator');
        errorMessage.style.display = 'none';
        checkAuth();
        return;
    }
    
    const user = users.find(u => (u.username === username || u.email === username) && u.password === password);
    if (user) {
        sessionStorage.setItem('rtls_loggedIn', 'true');
        sessionStorage.setItem('rtls_admin', 'false');
        sessionStorage.setItem('rtls_user', JSON.stringify({ username: user.username, isAdmin: false, id: user.id }));
        logActivity('User Login', user.username, 'Logged in successfully');
        errorMessage.style.display = 'none';
        checkAuth();
    } else {
        errorMessage.textContent = '❌ Invalid username or password';
        errorMessage.style.display = 'block';
    }
};

window.loginAsGuest = function() {
    const guestId = 'guest_' + Date.now();
    sessionStorage.setItem('rtls_loggedIn', 'true');
    sessionStorage.setItem('rtls_admin', 'false');
    sessionStorage.setItem('rtls_user', JSON.stringify({ username: 'Guest', isAdmin: false, id: guestId }));
    logActivity('Guest Visit', 'Guest', 'Visited as guest');
    checkAuth();
};

window.logout = function() {
    const userData = sessionStorage.getItem('rtls_user');
    if (userData) {
        const user = JSON.parse(userData);
        logActivity('Logout', user.username, 'Logged out');
    }
    sessionStorage.clear();
    checkAuth();
};

window.registerUser = function() {
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    if (!username || !email || !password) return alert('Please fill all fields');
    if (password !== confirm) return alert('Passwords do not match');
    if (password.length < 4) return alert('Password must be at least 4 characters');
    if (users.find(u => u.username === username)) return alert('Username exists');
    if (users.find(u => u.email === email)) return alert('Email exists');
    
    const newUser = { 
        id: Date.now(), 
        username, 
        email, 
        password, 
        isAdmin: false, 
        createdAt: new Date().toISOString() 
    };
    users.push(newUser);
    saveData();
    logActivity('New Account', username, 'Created new account');
    alert('Account created! Please login.');
    closeCreateAccountModal();
    document.getElementById('newUsername').value = '';
    document.getElementById('newEmail').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
};

window.showCreateAccountModal = function() {
    document.getElementById('createAccountModal').style.display = 'block';
};

window.closeCreateAccountModal = function() {
    document.getElementById('createAccountModal').style.display = 'none';
};

// =============================================
// User Management (Admin Only)
// =============================================
function displayActivityLog() {
    const container = document.getElementById('activityLogList');
    if (!container) return;
    
    if (activityLog.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No activity yet</p>';
        return;
    }
    
    container.innerHTML = activityLog.map(log => `
        <div class="activity-item">
            <div class="activity-icon ${log.action.includes('Login') ? 'login' : log.action.includes('Account') ? 'register' : 'comment'}">
                <i class="fas ${log.action.includes('Login') ? 'fa-sign-in-alt' : log.action.includes('Account') ? 'fa-user-plus' : log.action.includes('Comment') ? 'fa-comment' : 'fa-clock'}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-user">${escapeHtml(log.username)}</div>
                <div class="activity-action">${escapeHtml(log.action)} ${log.details ? `- ${escapeHtml(log.details)}` : ''}</div>
                <div class="activity-time"><i class="far fa-clock"></i> ${log.formattedDate}</div>
            </div>
        </div>
    `).join('');
}

function displayUserManagement() {
    const container = document.getElementById('userManagementList');
    if (!container) return;
    
    const regularUsers = users.filter(u => !u.isAdmin);
    if (regularUsers.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No registered users yet</p>';
        return;
    }
    
    container.innerHTML = regularUsers.map(user => `
        <div class="user-card">
            <div class="user-card-header">
                <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name" id="user-name-${user.id}">${escapeHtml(user.username)}</div>
                    <div class="user-email">${escapeHtml(user.email)}</div>
                    <div class="user-date">Joined: ${formatDate(new Date(user.createdAt))}</div>
                </div>
            </div>
            <div class="user-card-actions">
                <button class="user-edit-btn" onclick="editUsername(${user.id})"><i class="fas fa-edit"></i> Edit Name</button>
                <button class="user-delete-btn" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i> Delete User</button>
            </div>
        </div>
    `).join('');
}

window.editUsername = function(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newName = prompt('Enter new username:', user.username);
    if (!newName || newName.trim() === '') return;
    if (newName === user.username) return;
    
    if (users.find(u => u.username === newName && u.id !== userId)) {
        alert('Username already exists!');
        return;
    }
    
    const oldName = user.username;
    user.username = newName;
    saveData();
    
    accounts.forEach(account => {
        if (account.comments) {
            account.comments.forEach(comment => {
                if (comment.username === oldName) {
                    comment.username = newName;
                }
            });
        }
    });
    saveData();
    
    logActivity('Username Changed', newName, `Changed from ${oldName} to ${newName}`);
    displayUserManagement();
    if (currentContent === 'accounts') displayItems();
    alert('✅ Username updated successfully!');
};

window.deleteUser = function(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to delete user "${user.username}"? All their comments will be deleted.`)) return;
    
    accounts.forEach(account => {
        if (account.comments) {
            account.comments = account.comments.filter(c => c.username !== user.username);
        }
    });
    
    users = users.filter(u => u.id !== userId);
    saveData();
    
    logActivity('User Deleted', 'Admin', `Deleted user: ${user.username}`);
    displayUserManagement();
    if (currentContent === 'accounts') displayItems();
    alert('✅ User deleted successfully!');
};

// =============================================
// Comment Management (Admin Only)
// =============================================
function displayCommentManagement() {
    const container = document.getElementById('commentManagementList');
    if (!container) return;
    
    let allComments = [];
    accounts.forEach(account => {
        if (account.comments && account.comments.length > 0) {
            account.comments.forEach(comment => {
                allComments.push({
                    ...comment,
                    accountId: account.id,
                    accountTitle: account.title
                });
            });
        }
    });
    
    if (allComments.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No comments yet</p>';
        return;
    }
    
    container.innerHTML = allComments.map(comment => `
        <div class="comment-card">
            <div class="comment-card-header">
                <div class="comment-avatar">${comment.username.charAt(0).toUpperCase()}</div>
                <div class="comment-info">
                    <div class="comment-username">${escapeHtml(comment.username)}</div>
                    <div class="comment-account">on: ${escapeHtml(comment.accountTitle)}</div>
                    <div class="comment-date">${comment.date}</div>
                </div>
                <button class="comment-delete-btn" onclick="deleteComment(${comment.accountId}, ${comment.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
        </div>
    `).join('');
}

window.deleteComment = function(accountId, commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    const account = accounts.find(a => a.id === accountId);
    if (account && account.comments) {
        account.comments = account.comments.filter(c => c.id !== commentId);
        saveData();
        logActivity('Comment Deleted', 'Admin', `Deleted comment from account: ${account.title}`);
        displayCommentManagement();
        if (currentContent === 'accounts') displayItems();
        alert('✅ Comment deleted successfully!');
    }
};

// =============================================
// Admin Tab Switcher
// =============================================
window.switchAdminTab = function(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('accountsForm').style.display = 'none';
    document.getElementById('toolsForm').style.display = 'none';
    document.getElementById('newsForm').style.display = 'none';
    document.getElementById('activityLogForm').style.display = 'none';
    document.getElementById('userManagementForm').style.display = 'none';
    document.getElementById('commentManagementForm').style.display = 'none';
    
    if (tab === 'accounts') {
        document.getElementById('accountsForm').style.display = 'block';
    } else if (tab === 'tools') {
        document.getElementById('toolsForm').style.display = 'block';
    } else if (tab === 'news') {
        document.getElementById('newsForm').style.display = 'block';
    } else if (tab === 'activity') {
        document.getElementById('activityLogForm').style.display = 'block';
        displayActivityLog();
    } else if (tab === 'users') {
        document.getElementById('userManagementForm').style.display = 'block';
        displayUserManagement();
    } else if (tab === 'comments') {
        document.getElementById('commentManagementForm').style.display = 'block';
        displayCommentManagement();
    }
    
    displayAdminItems(tab);
};

// =============================================
// UI Functions
// =============================================
window.filterByPlatform = function(platform) {
    currentFilter = platform;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    displayItems();
};

window.switchContent = function(content) {
    currentContent = content;
    document.getElementById('switch-accounts').classList.remove('active');
    document.getElementById('switch-tools').classList.remove('active');
    document.getElementById('switch-news').classList.remove('active');
    
    if (content === 'accounts') {
        document.getElementById('switch-accounts').classList.add('active');
        document.getElementById('itemsGrid').style.display = 'grid';
        document.getElementById('newsGrid').style.display = 'none';
    } else if (content === 'tools') {
        document.getElementById('switch-tools').classList.add('active');
        document.getElementById('itemsGrid').style.display = 'grid';
        document.getElementById('newsGrid').style.display = 'none';
    } else {
        document.getElementById('switch-news').classList.add('active');
        document.getElementById('itemsGrid').style.display = 'none';
        document.getElementById('newsGrid').style.display = 'grid';
    }
    displayItems();
};

window.openFullscreen = function(url) {
    document.getElementById('imageModal').style.display = 'block';
    document.getElementById('modalImage').src = url;
};

window.closeModal = function() {
    document.getElementById('imageModal').style.display = 'none';
};

window.copyToClipboard = function(text, btn) {
    navigator.clipboard.writeText(text);
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => btn.innerHTML = original, 1500);
};

// =============================================
// Admin Functions (Add, Edit, Delete)
// =============================================
window.addAccountRow = function() {
    accountRowCount++;
    const container = document.getElementById('accountsContainer');
    const row = document.createElement('div');
    row.className = 'account-row';
    row.id = `row-${accountRowCount}`;
    row.innerHTML = `
        <div class="row-header"><span>Account #${accountRowCount}</span><button class="btn-remove-row" onclick="document.getElementById('row-${accountRowCount}').remove()"><i class="fas fa-times"></i></button></div>
        <div class="form-group"><input type="text" id="title_${accountRowCount}" class="account-title" placeholder="Title (optional)"></div>
        <div class="form-row"><div class="form-group"><input type="text" id="email_${accountRowCount}" class="account-email" placeholder="Email *"></div><div class="form-group"><input type="text" id="pass_${accountRowCount}" class="account-password" placeholder="Password *"></div></div>
        <div class="form-group"><textarea id="details_${accountRowCount}" class="account-details" placeholder="Details (optional)" rows="2"></textarea></div>
    `;
    container.appendChild(row);
};

window.addBulkAccounts = function() {
    if (sessionStorage.getItem('rtls_admin') !== 'true') return alert('Admin only');
    
    const platform = document.getElementById('bulkAccountPlatform').value;
    const type = document.getElementById('bulkAccountType').value;
    const bulkTitle = document.getElementById('bulkAccountTitle').value;
    const bulkDetails = document.getElementById('bulkAccountDetails').value;
    const bulkImage = document.getElementById('bulkAccountImage').value;
    
    const rows = document.querySelectorAll('.account-row');
    if (!rows.length) return alert('Add at least one account');
    
    let added = 0;
    rows.forEach(row => {
        const title = row.querySelector('.account-title')?.value || bulkTitle;
        const email = row.querySelector('.account-email')?.value;
        const password = row.querySelector('.account-password')?.value;
        const details = row.querySelector('.account-details')?.value || bulkDetails;
        if (!email || !password) return;
        
        accounts.unshift({
            id: Date.now() + added,
            type, platform,
            title: title || `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${type === 'premium' ? 'Premium' : 'Free'} Account`,
            email, password, details,
            date: formatDate(new Date()),
            imageUrl: bulkImage || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600',
            likes: [], dislikes: [], comments: []
        });
        added++;
    });
    
    saveData();
    logActivity('Accounts Published', 'Admin', `Published ${added} new accounts`);
    document.getElementById('accountsContainer').innerHTML = '';
    accountRowCount = 0;
    addAccountRow();
    displayAdminItems('accounts');
    if (currentContent === 'accounts') displayItems();
    alert(`✅ Published ${added} accounts!`);
};

window.addTool = function() {
    if (sessionStorage.getItem('rtls_admin') !== 'true') return alert('Admin only');
    const title = document.getElementById('toolTitle').value;
    const url = document.getElementById('toolDownloadUrl').value;
    if (!title || !url) return alert('Fill required fields');
    
    tools.unshift({
        id: Date.now(), type: 'tool', title, downloadUrl: url,
        key: document.getElementById('toolKey').value || 'No key',
        details: document.getElementById('toolDetails').value,
        date: formatDate(new Date()),
        imageUrl: document.getElementById('toolImage').value || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600'
    });
    saveData();
    logActivity('Tool Added', 'Admin', `Added tool: ${title}`);
    document.getElementById('toolTitle').value = '';
    document.getElementById('toolDownloadUrl').value = '';
    document.getElementById('toolKey').value = '';
    document.getElementById('toolDetails').value = '';
    document.getElementById('toolImage').value = '';
    displayAdminItems('tools');
    if (currentContent === 'tools') displayItems();
    alert('✅ Tool added');
};

window.addNews = function() {
    if (sessionStorage.getItem('rtls_admin') !== 'true') return alert('Admin only');
    const title = document.getElementById('newsTitle').value;
    const content = document.getElementById('newsContent').value;
    if (!title || !content) return alert('Fill required fields');
    
    news.unshift({
        id: Date.now(), type: 'news', title, content,
        date: formatDate(new Date()),
        imageUrl: document.getElementById('newsImage').value || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600'
    });
    saveData();
    logActivity('News Added', 'Admin', `Added news: ${title}`);
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
    document.getElementById('newsImage').value = '';
    displayAdminItems('news');
    if (currentContent === 'news') displayItems();
    alert('✅ News added');
};

window.deleteItem = function(type, id) {
    if (sessionStorage.getItem('rtls_admin') !== 'true') return alert('Admin only');
    if (!confirm('Delete?')) return;
    if (type === 'accounts') accounts = accounts.filter(i => i.id !== id);
    else if (type === 'tools') tools = tools.filter(i => i.id !== id);
    else if (type === 'news') news = news.filter(i => i.id !== id);
    saveData();
    logActivity('Item Deleted', 'Admin', `Deleted ${type.slice(0,-1)} item`);
    displayAdminItems(type);
    if (currentContent === type) displayItems();
};

window.editAccount = function(id) {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    document.getElementById('editAccountId').value = acc.id;
    document.getElementById('editAccountTitle').value = acc.title;
    document.getElementById('editAccountEmail').value = acc.email;
    document.getElementById('editAccountPassword').value = acc.password;
    document.getElementById('editAccountDetails').value = acc.details || '';
    document.getElementById('editAccountType').value = acc.type;
    document.getElementById('editAccountPlatform').value = acc.platform;
    document.getElementById('editAccountImage').value = acc.imageUrl || '';
    document.getElementById('editModal').style.display = 'block';
};

window.closeEditModal = function() {
    document.getElementById('editModal').style.display = 'none';
};

window.saveAccountChanges = function() {
    const id = parseInt(document.getElementById('editAccountId').value);
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) return;
    accounts[index] = {
        ...accounts[index],
        title: document.getElementById('editAccountTitle').value,
        email: document.getElementById('editAccountEmail').value,
        password: document.getElementById('editAccountPassword').value,
        details: document.getElementById('editAccountDetails').value,
        type: document.getElementById('editAccountType').value,
        platform: document.getElementById('editAccountPlatform').value,
        imageUrl: document.getElementById('editAccountImage').value
    };
    saveData();
    logActivity('Account Edited', 'Admin', `Edited account: ${accounts[index].title}`);
    closeEditModal();
    displayAdminItems('accounts');
    if (currentContent === 'accounts') displayItems();
    alert('✅ Updated');
};

function displayAdminItems(type) {
    const container = document.getElementById('adminItemsList');
    if (!container) return;
    let items = type === 'accounts' ? accounts : type === 'tools' ? tools : news;
    container.innerHTML = items.map(item => `
        <div class="admin-item-card">
            <button class="edit-btn" onclick="editAccount(${item.id})"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" onclick="deleteItem('${type}', ${item.id})"><i class="fas fa-trash"></i></button>
            <h4>${escapeHtml(item.title)}</h4>
            <p><i class="far fa-clock"></i> ${item.date}</p>
        </div>
    `).join('');
}

// =============================================
// Display Functions
// =============================================
function displayItems() {
    if (currentContent === 'news') displayNews();
    else if (currentContent === 'tools') displayTools();
    else displayAccounts();
}

function displayAccounts() {
    const grid = document.getElementById('itemsGrid');
    if (!grid) return;
    let filtered = currentFilter === 'all' ? accounts : accounts.filter(a => a.platform === currentFilter);
    if (!filtered.length) { grid.innerHTML = '<p style="text-align:center;color:white;padding:50px;">No accounts</p>'; return; }
    
    const userData = JSON.parse(sessionStorage.getItem('rtls_user') || '{}');
    const userId = userData.id;
    const isAdmin = sessionStorage.getItem('rtls_admin') === 'true';
    
    grid.innerHTML = filtered.map(acc => {
        const liked = acc.likes?.includes(userId);
        const disliked = acc.dislikes?.includes(userId);
        const platforms = { steam:'Steam', xbox:'Xbox', netflix:'Netflix', epic:'Epic Games', other:'Other' };
        
        return `
            <div class="item-card">
                <div class="item-type ${acc.type}">${acc.type === 'premium' ? '✨ PREMIUM' : '🆓 FREE'}</div>
                <div class="item-image" onclick="openFullscreen('${acc.imageUrl}')">
                    <img src="${acc.imageUrl}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    <div class="fullscreen-icon" onclick="event.stopPropagation();openFullscreen('${acc.imageUrl}')">⛶</div>
                </div>
                <div class="item-content">
                    <h3 class="item-title">${escapeHtml(acc.title)}</h3>
                    <div class="platform-badge"><i class="fab fa-${acc.platform === 'steam' ? 'steam' : acc.platform === 'xbox' ? 'xbox' : acc.platform === 'epic' ? 'epic-games' : 'archive'}"></i> ${platforms[acc.platform] || 'Other'}</div>
                    <div class="account-info-section">
                        <div class="info-row"><span><i class="fas fa-envelope"></i> ${escapeHtml(acc.email)}</span><button class="copy-btn" onclick="copyToClipboard('${acc.email}', this)"><i class="fas fa-copy"></i> Copy</button></div>
                        <div class="info-row"><span><i class="fas fa-key"></i> ${escapeHtml(acc.password)}</span><button class="copy-btn" onclick="copyToClipboard('${acc.password}', this)"><i class="fas fa-copy"></i> Copy</button></div>
                    </div>
                    <div class="interaction-buttons">
                        <button class="like-btn ${liked ? 'liked' : ''}" onclick="likeAccount(${acc.id})"><i class="fas fa-thumbs-up"></i> <span>${acc.likes?.length || 0}</span></button>
                        <button class="dislike-btn ${disliked ? 'disliked' : ''}" onclick="dislikeAccount(${acc.id})"><i class="fas fa-thumbs-down"></i> <span>${acc.dislikes?.length || 0}</span></button>
                    </div>
                    <div class="comments-section">
                        <h4><i class="fas fa-comments"></i> Comments (${acc.comments?.length || 0})</h4>
                        <div class="comments-list">${(acc.comments || []).map(c => `
                            <div class="comment-item">
                                <div class="comment-avatar">${escapeHtml(c.username.charAt(0).toUpperCase())}</div>
                                <div class="comment-content">
                                    <div class="comment-username">${escapeHtml(c.username)}</div>
                                    <div class="comment-text">${escapeHtml(c.text)}</div>
                                    <div class="comment-date">${c.date}</div>
                                </div>
                                ${isAdmin ? `<button class="comment-admin-delete" onclick="deleteComment(${acc.id}, ${c.id})"><i class="fas fa-trash"></i></button>` : ''}
                            </div>
                        `).join('')}</div>
                        <div class="add-comment"><input type="text" id="comment-${acc.id}" placeholder="Write a comment..."><button onclick="addComment(${acc.id})"><i class="fas fa-paper-plane"></i> Send</button></div>
                    </div>
                    <div class="item-footer"><span class="item-date"><i class="far fa-clock"></i> ${acc.date}</span></div>
                </div>
            </div>
        `;
    }).join('');
}

function displayTools() {
    const grid = document.getElementById('itemsGrid');
    if (!grid) return;
    if (!tools.length) { grid.innerHTML = '<p style="text-align:center;color:white;padding:50px;">No tools</p>'; return; }
    grid.innerHTML = tools.map(tool => `
        <div class="item-card">
            <div class="item-type tool">🛠️ TOOL</div>
            <div class="item-image" onclick="openFullscreen('${tool.imageUrl}')"><img src="${tool.imageUrl}" onerror="this.src='https://via.placeholder.com/300x200?text=Tool'"><div class="fullscreen-icon" onclick="event.stopPropagation();openFullscreen('${tool.imageUrl}')">⛶</div></div>
            <div class="item-content"><h3 class="item-title">${escapeHtml(tool.title)}</h3><div class="item-details">${escapeHtml(tool.details || '')}</div><div class="item-info"><div><i class="fas fa-download"></i> ${tool.downloadUrl}</div>${tool.key ? `<div><i class="fas fa-key"></i> ${tool.key}</div>` : ''}</div><div class="item-footer"><span class="item-date"><i class="far fa-clock"></i> ${tool.date}</span><button class="btn-download" onclick="window.open('${tool.downloadUrl}','_blank')"><i class="fas fa-download"></i> Download</button></div></div>
        </div>
    `).join('');
}

function displayNews() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    if (!news.length) { grid.innerHTML = '<p style="text-align:center;color:white;padding:50px;">No news</p>'; return; }
    grid.innerHTML = news.map(n => `
        <div class="item-card">
            <div class="item-type news">📰 NEWS</div>
            <div class="item-image" onclick="openFullscreen('${n.imageUrl}')"><img src="${n.imageUrl}" onerror="this.src='https://via.placeholder.com/600x400?text=News'"><div class="fullscreen-icon" onclick="event.stopPropagation();openFullscreen('${n.imageUrl}')">⛶</div></div>
            <div class="item-content"><h3 class="item-title">${escapeHtml(n.title)}</h3><div class="item-details">${escapeHtml(n.content)}</div><div class="item-footer"><span class="item-date"><i class="far fa-clock"></i> ${n.date}</span></div></div>
        </div>
    `).join('');
}

// =============================================
// Interactions
// =============================================
window.addComment = function(id) {
    const userData = JSON.parse(sessionStorage.getItem('rtls_user') || '{}');
    if (!userData.username) return alert('Login to comment');
    const text = document.getElementById(`comment-${id}`).value.trim();
    if (!text) return;
    const acc = accounts.find(a => a.id === id);
    if (acc) {
        acc.comments = acc.comments || [];
        acc.comments.push({ id: Date.now(), username: userData.username, text, date: new Date().toLocaleString() });
        saveData();
        logActivity('Comment Added', userData.username, `Commented on: ${acc.title}`);
        displayItems();
    }
};

window.likeAccount = function(id) {
    const userData = JSON.parse(sessionStorage.getItem('rtls_user') || '{}');
    if (!userData.id) return alert('Login to like');
    const acc = accounts.find(a => a.id === id);
    if (acc) {
        acc.likes = acc.likes || [];
        acc.dislikes = acc.dislikes || [];
        if (acc.likes.includes(userData.id)) acc.likes = acc.likes.filter(i => i !== userData.id);
        else { acc.dislikes = acc.dislikes.filter(i => i !== userData.id); acc.likes.push(userData.id); }
        saveData();
        displayItems();
    }
};

window.dislikeAccount = function(id) {
    const userData = JSON.parse(sessionStorage.getItem('rtls_user') || '{}');
    if (!userData.id) return alert('Login to dislike');
    const acc = accounts.find(a => a.id === id);
    if (acc) {
        acc.likes = acc.likes || [];
        acc.dislikes = acc.dislikes || [];
        if (acc.dislikes.includes(userData.id)) acc.dislikes = acc.dislikes.filter(i => i !== userData.id);
        else { acc.likes = acc.likes.filter(i => i !== userData.id); acc.dislikes.push(userData.id); }
        saveData();
        displayItems();
    }
};

// =============================================
// Export/Import
// =============================================
window.exportData = function() {
    const data = { accounts, tools, news, users, activityLog };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `rtls_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    logActivity('Data Exported', 'Admin', 'Exported all data');
};

window.importData = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.accounts) accounts = data.accounts;
            if (data.tools) tools = data.tools;
            if (data.news) news = data.news;
            if (data.users) users = data.users;
            if (data.activityLog) activityLog = data.activityLog;
            saveData();
            displayItems();
            displayAdminItems('accounts');
            logActivity('Data Imported', 'Admin', 'Imported all data');
            alert('✅ Imported successfully');
        } catch { alert('Invalid file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
};

// =============================================
// Notifications
// =============================================
function loadLastVisit() {
    const saved = localStorage.getItem('rtls_lastVisit');
    if (saved) lastVisit = JSON.parse(saved);
}

function updateNotificationBadges() {
    const newAcc = accounts.filter(a => new Date(a.date).getTime() > lastVisit.accounts).length;
    const newTools = tools.filter(t => new Date(t.date).getTime() > lastVisit.tools).length;
    const newNews = news.filter(n => new Date(n.date).getTime() > lastVisit.news).length;
    updateBadge('switch-accounts', newAcc);
    updateBadge('switch-tools', newTools);
    updateBadge('switch-news', newNews);
}

function updateBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    const old = el.querySelector('.badge');
    if (old) old.remove();
    if (count > 0) {
        el.classList.add('notification-badge');
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = count;
        el.appendChild(badge);
    } else el.classList.remove('notification-badge');
}

window.updateLastVisit = function(content) {
    lastVisit[content] = Date.now();
    localStorage.setItem('rtls_lastVisit', JSON.stringify(lastVisit));
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================
// Initialize
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    loadLastVisit();
    checkAuth();
    addAccountRow();
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeEditModal(); closeCreateAccountModal(); } });
});
