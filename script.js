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

// Load data from localStorage
function loadData() {
    const savedAccounts = localStorage.getItem('rtls_accounts');
    const savedTools = localStorage.getItem('rtls_tools');
    const savedNews = localStorage.getItem('rtls_news');
    
    accounts = savedAccounts ? JSON.parse(savedAccounts) : [
        {
            id: 1,
            type: 'premium',
            platform: 'steam',
            title: 'GTA 5 Premium Account',
            email: 'gta5_premium@example.com',
            password: 'Gta5@2026',
            details: 'Full access account with all DLCs',
            date: formatDate(new Date()),
            imageUrl: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600'
        },
        {
            id: 2,
            type: 'free',
            platform: 'netflix',
            title: 'Netflix 4K Account',
            email: 'netflix_share@example.com',
            password: 'Netflix@2026',
            details: '4K Ultra HD - 1 month left',
            date: formatDate(new Date()),
            imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600'
        }
    ];
    
    tools = savedTools ? JSON.parse(savedTools) : [
        {
            id: 101,
            type: 'tool',
            title: 'System Cleaner Pro',
            downloadUrl: 'https://example.com/cleaner.zip',
            key: 'CLEANER-2026-FREE',
            details: 'Clean your system from junk files',
            date: formatDate(new Date()),
            imageUrl: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600'
        }
    ];
    
    news = savedNews ? JSON.parse(savedNews) : [
        {
            id: 201,
            type: 'news',
            title: '🎮 New Accounts Added',
            content: 'We just added 10 new Steam premium accounts!',
            imageUrl: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600',
            date: formatDate(new Date())
        }
    ];
}

// Format date
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

// Save data
function saveData() {
    localStorage.setItem('rtls_accounts', JSON.stringify(accounts));
    localStorage.setItem('rtls_tools', JSON.stringify(tools));
    localStorage.setItem('rtls_news', JSON.stringify(news));
    updateNotificationBadges();
}

// =============================================
// Authentication
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
        loadData();
        displayItems();
        updateNotificationBadges();
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
        errorMessage.style.display = 'none';
        checkAuth();
    } else {
        errorMessage.textContent = '❌ Invalid username or password';
        errorMessage.style.display = 'block';
    }
};

window.loginAsGuest = function() {
    sessionStorage.setItem('rtls_loggedIn', 'true');
    sessionStorage.setItem('rtls_admin', 'false');
    document.getElementById('errorMessage').style.display = 'none';
    checkAuth();
};

window.logout = function() {
    sessionStorage.removeItem('rtls_loggedIn');
    sessionStorage.removeItem('rtls_admin');
    checkAuth();
};

// =============================================
// Copy Function
// =============================================
window.copyToClipboard = function(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    });
};

// =============================================
// Edit Functions
// =============================================
window.editAccount = function(id) {
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    
    document.getElementById('editAccountId').value = account.id;
    document.getElementById('editAccountTitle').value = account.title;
    document.getElementById('editAccountEmail').value = account.email;
    document.getElementById('editAccountPassword').value = account.password;
    document.getElementById('editAccountDetails').value = account.details || '';
    document.getElementById('editAccountType').value = account.type;
    document.getElementById('editAccountPlatform').value = account.platform || 'other';
    document.getElementById('editAccountImage').value = account.imageUrl || '';
    
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
        imageUrl: document.getElementById('editAccountImage').value || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600'
    };
    
    saveData();
    closeEditModal();
    displayAdminItems('accounts');
    if (currentContent === 'accounts') displayItems();
};

// =============================================
// Filter Function
// =============================================
window.filterByPlatform = function(platform) {
    currentFilter = platform;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayItems();
};

// =============================================
// Admin Functions
// =============================================
window.addAccount = function() {
    if (sessionStorage.getItem('rtls_admin') !== 'true') {
        alert('❌ Admin access required');
        return;
    }
    
    const title = document.getElementById('accountTitle').value;
    const email = document.getElementById('accountEmail').value;
    const password = document.getElementById('accountPassword').value;
    const details = document.getElementById('accountDetails').value;
    const type = document.getElementById('accountType').value;
    const platform = document.getElementById('accountPlatform').value;
    const imageUrl = document.getElementById('accountImage').value;
    
    if (!title || !email || !password) {
        alert('Please fill all required fields');
        return;
    }
    
    const newAccount = {
        id: Date.now(),
        type: type,
        platform: platform,
        title: title,
        email: email,
        password: password,
        details: details,
        date: formatDate(new Date()),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600'
    };
    
    accounts.unshift(newAccount);
    saveData();
    
    // Clear form
    document.getElementById('accountTitle').value = '';
    document.getElementById('accountEmail').value = '';
    document.getElementById('accountPassword').value = '';
    document.getElementById('accountDetails').value = '';
    document.getElementById('accountImage').value = '';
    
    displayAdminItems('accounts');
    if (currentContent === 'accounts') displayItems();
};

window.addTool = function() {
    if (sessionStorage.getItem('rtls_admin') !== 'true') {
        alert('❌ Admin access required');
        return;
    }
    
    const title = document.getElementById('toolTitle').value;
    const downloadUrl = document.getElementById('toolDownloadUrl').value;
    const key = document.getElementById('toolKey').value;
    const details = document.getElementById('toolDetails').value;
    const imageUrl = document.getElementById('toolImage').value;
    
    if (!title || !downloadUrl) {
        alert('Please fill all required fields');
        return;
    }
    
    const newTool = {
        id: Date.now(),
        type: 'tool',
        title: title,
        downloadUrl: downloadUrl,
        key: key || 'No key required',
        details: details,
        date: formatDate(new Date()),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600'
    };
    
    tools.unshift(newTool);
    saveData();
    
    // Clear form
    document.getElementById('toolTitle').value = '';
    document.getElementById('toolDownloadUrl').value = '';
    document.getElementById('toolKey').value = '';
    document.getElementById('toolDetails').value = '';
    document.getElementById('toolImage').value = '';
    
    displayAdminItems('tools');
    if (currentContent === 'tools') displayItems();
};

window.addNews = function() {
    if (sessionStorage.getItem('rtls_admin') !== 'true') {
        alert('❌ Admin access required');
        return;
    }
    
    const title = document.getElementById('newsTitle').value;
    const content = document.getElementById('newsContent').value;
    const imageUrl = document.getElementById('newsImage').value;
    
    if (!title || !content) {
        alert('Please fill all required fields');
        return;
    }
    
    const newNews = {
        id: Date.now(),
        type: 'news',
        title: title,
        content: content,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600',
        date: formatDate(new Date())
    };
    
    news.unshift(newNews);
    saveData();
    
    // Clear form
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
    document.getElementById('newsImage').value = '';
    
    displayAdminItems('news');
    if (currentContent === 'news') displayItems();
};

window.deleteItem = function(type, id) {
    if (sessionStorage.getItem('rtls_admin') !== 'true') {
        alert('❌ Admin access required');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    if (type === 'accounts') {
        accounts = accounts.filter(item => item.id !== id);
    } else if (type === 'tools') {
        tools = tools.filter(item => item.id !== id);
    } else if (type === 'news') {
        news = news.filter(item => item.id !== id);
    }
    
    saveData();
    displayAdminItems(type);
    if (currentContent === type) displayItems();
};

function displayAdminItems(type) {
    const container = document.getElementById('adminItemsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    let items = [];
    if (type === 'accounts') items = accounts;
    else if (type === 'tools') items = tools;
    else if (type === 'news') items = news;
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-item-card';
        
        let platformIcon = '';
        if (item.platform) {
            const platforms = {
                'steam': '<i class="fab fa-steam"></i> Steam',
                'xbox': '<i class="fab fa-xbox"></i> Xbox',
                'netflix': '<i class="fas fa-film"></i> Netflix',
                'epic': '<i class="fab fa-epic-games"></i> Epic',
                'other': '<i class="fas fa-archive"></i> Other'
            };
            platformIcon = platforms[item.platform] || '';
        }
        
        card.innerHTML = `
            <button class="edit-btn" onclick="editAccount(${item.id})"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" onclick="deleteItem('${type}', ${item.id})"><i class="fas fa-trash"></i></button>
            <h4>${item.title}</h4>
            ${platformIcon ? `<p style="color: #667eea;">${platformIcon}</p>` : ''}
            <p><i class="far fa-clock"></i> ${item.date}</p>
        `;
        
        container.appendChild(card);
    });
}

window.switchAdminTab = function(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-form').forEach(f => f.style.display = 'none');
    
    event.target.classList.add('active');
    document.getElementById(`${tab}Form`).style.display = 'block';
    
    displayAdminItems(tab);
};

// =============================================
// Notification Badges
// =============================================
let lastVisit = {
    accounts: 0,
    tools: 0,
    news: 0
};

function loadLastVisit() {
    const saved = localStorage.getItem('rtls_lastVisit');
    if (saved) lastVisit = JSON.parse(saved);
}

function updateNotificationBadges() {
    const newAccounts = accounts.filter(a => new Date(a.date).getTime() > lastVisit.accounts).length;
    const newTools = tools.filter(t => new Date(t.date).getTime() > lastVisit.tools).length;
    const newNews = news.filter(n => new Date(n.date).getTime() > lastVisit.news).length;
    
    updateBadge('switch-accounts', newAccounts);
    updateBadge('switch-tools', newTools);
    updateBadge('switch-news', newNews);
}

function updateBadge(elementId, count) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const oldBadge = element.querySelector('.badge');
    if (oldBadge) oldBadge.remove();
    
    if (count > 0) {
        element.classList.add('notification-badge');
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = count;
        element.appendChild(badge);
    } else {
        element.classList.remove('notification-badge');
    }
}

window.updateLastVisit = function(content) {
    lastVisit[content] = Date.now();
    localStorage.setItem('rtls_lastVisit', JSON.stringify(lastVisit));
    updateNotificationBadges();
};

// =============================================
// Content Display
// =============================================
let currentContent = 'accounts';

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
    
    updateLastVisit(content);
    displayItems();
};

window.openFullscreen = function(imageUrl) {
    document.getElementById('imageModal').style.display = 'block';
    document.getElementById('modalImage').src = imageUrl;
};

window.closeModal = function() {
    document.getElementById('imageModal').style.display = 'none';
};

window.downloadTool = function(url) {
    window.open(url, '_blank');
};

function displayItems() {
    if (currentContent === 'news') {
        displayNews();
    } else if (currentContent === 'tools') {
        displayTools();
    } else {
        displayAccounts();
    }
}

function displayAccounts() {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '';
    
    let filteredAccounts = accounts;
    if (currentFilter !== 'all') {
        filteredAccounts = accounts.filter(a => a.platform === currentFilter);
    }
    
    filteredAccounts.forEach(account => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        const platforms = {
            'steam': '<i class="fab fa-steam"></i> Steam',
            'xbox': '<i class="fab fa-xbox"></i> Xbox',
            'netflix': '<i class="fas fa-film"></i> Netflix',
            'epic': '<i class="fab fa-epic-games"></i> Epic Games',
            'other': '<i class="fas fa-archive"></i> Other'
        };
        
        card.innerHTML = `
            <div class="item-type ${account.type}">
                ${account.type === 'premium' ? '✨ PREMIUM' : '🆓 FREE'}
            </div>
            <div class="item-image" onclick="openFullscreen('${account.imageUrl}')">
                <img src="${account.imageUrl}" alt="${account.title}" onerror="this.onerror=null; this.parentElement.classList.add('image-loading'); this.style.display='none';">
                <div class="fullscreen-icon" onclick="event.stopPropagation(); openFullscreen('${account.imageUrl}')">⛶</div>
            </div>
            <div class="item-content">
                <h3 class="item-title">${account.title}</h3>
                ${account.platform ? `<div class="platform-badge">${platforms[account.platform]}</div>` : ''}
                <div class="item-details">${account.details || ''}</div>
                <div class="item-info">
                    <div class="info-row">
                        <span><i class="fas fa-envelope"></i> ${account.email}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${account.email}', this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <div class="info-row">
                        <span><i class="fas fa-key"></i> ${account.password}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${account.password}', this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                </div>
                <div class="item-footer">
                    <span class="item-date"><i class="far fa-clock"></i> ${account.date}</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function displayTools() {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '';
    
    tools.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        card.innerHTML = `
            <div class="item-type tool">
                🛠️ TOOL
            </div>
            <div class="item-image" onclick="openFullscreen('${tool.imageUrl}')">
                <img src="${tool.imageUrl}" alt="${tool.title}" onerror="this.onerror=null; this.parentElement.classList.add('image-loading'); this.style.display='none';">
                <div class="fullscreen-icon" onclick="event.stopPropagation(); openFullscreen('${tool.imageUrl}')">⛶</div>
            </div>
            <div class="item-content">
                <h3 class="item-title">${tool.title}</h3>
                <div class="item-details">${tool.details || ''}</div>
                <div class="item-info">
                    <div><i class="fas fa-download"></i> Download: ${tool.downloadUrl}</div>
                    ${tool.key ? `<div><i class="fas fa-key"></i> Key: ${tool.key}</div>` : ''}
                </div>
                <div class="item-footer">
                    <span class="item-date"><i class="far fa-clock"></i> ${tool.date}</span>
                    <button class="btn-download" onclick="downloadTool('${tool.downloadUrl}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function displayNews() {
    const grid = document.getElementById('newsGrid');
    grid.innerHTML = '';
    
    news.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        card.innerHTML = `
            <div class="item-type news">
                📰 NEWS
            </div>
            <div class="item-image" onclick="openFullscreen('${item.imageUrl}')">
                <img src="${item.imageUrl}" alt="${item.title}" onerror="this.onerror=null; this.parentElement.classList.add('image-loading'); this.style.display='none';">
                <div class="fullscreen-icon" onclick="event.stopPropagation(); openFullscreen('${item.imageUrl}')">⛶</div>
            </div>
            <div class="item-content">
                <h3 class="item-title">${item.title}</h3>
                <div class="item-details">${item.content}</div>
                <div class="item-footer">
                    <span class="item-date"><i class="far fa-clock"></i> ${item.date}</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// =============================================
// Initialize
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    loadLastVisit();
    checkAuth();
    
    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeEditModal();
        }
    });
    
    // Image error handling
    window.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            e.target.style.display = 'none';
            e.target.parentElement.classList.add('image-loading');
        }
    }, true);
});