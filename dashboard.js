import { dashboardData } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    let earningsChart; // To hold the chart instance

    // --- INITIALIZATION ---
    const initDashboard = () => {
        document.getElementById('profile-menu-name').textContent = dashboardData.mentorProfile.name;
        renderNotifications();
        renderRecentSessions();
        initChart('monthly');
        setupEventListeners();
        updateBadges();
    };

    // --- VIEW/NAVIGATION MANAGEMENT ---
    const switchView = (viewId) => {
        document.querySelectorAll('.dashboard-view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${viewId}-view`).classList.add('active');

        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
        document.querySelector(`.nav-link[data-view="${viewId}"]`).classList.add('active');
        
        updateHeader(viewId);
    };

    const updateHeader = (viewId) => {
        const headerTitle = document.getElementById('header-title');
        const headerSubtitle = document.getElementById('header-subtitle');
        const titles = {
            'dashboard-home': [`Welcome back, ${dashboardData.mentorProfile.name.split(' ')[0]}!`, 'Here\'s your performance overview for this month.'],
            'schedule': ['My Schedule', 'View and manage your upcoming sessions.'],
            'courses': ['My Courses', 'Manage your course listings and content.'],
            'messages': ['Messages', 'Communicate with your students.'],
            'analytics': ['Analytics', 'Track your performance and growth.'],
            'earnings': ['Earnings', 'View your transaction history and manage payouts.'],
            'profile': ['My Profile', 'Update your personal and professional information.'],
            'settings': ['Settings', 'Configure your account and notification preferences.'],
        };
        const [title, subtitle] = titles[viewId] || [viewId, ''];
        headerTitle.textContent = title;
        headerSubtitle.textContent = subtitle;
    };

    // --- DYNAMIC RENDERING ---
    const renderNotifications = () => {
        const dropdown = document.getElementById('notifications-dropdown');
        const unreadCount = dashboardData.notifications.filter(n => !n.read).length;
        let html = `<div class="dropdown-header">Notifications (${unreadCount} new)</div>`;
        dashboardData.notifications.forEach(n => {
            html += `
                <div class="notification-item ${n.read ? '' : 'unread'}">
                    <i class="fas ${n.icon}"></i>
                    <div class="notification-content">
                        <p>${n.text}</p>
                        <small>${n.time}</small>
                    </div>
                </div>
            `;
        });
        html += `<div class="dropdown-footer"><a href="#">View All Notifications</a></div>`;
        dropdown.innerHTML = html;
    };

    const renderRecentSessions = () => {
        const tableBody = document.querySelector('#recent-sessions-table tbody');
        let html = '';
        dashboardData.sessions.slice(0, 3).forEach(s => {
            html += `
                <tr>
                    <td>${s.student}</td>
                    <td>${s.subject}</td>
                    <td>${s.date}</td>
                    <td><span class="status ${s.status.toLowerCase()}">${s.status}</span></td>
                    <td><span class="coin-value">${s.earnings.toLocaleString()}</span></td>
                    <td><button class="btn-secondary btn-sm" data-session-id="${s.id}">Details</button></td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    };
    
    const renderSchedule = () => {
        const container = document.getElementById('schedule-container');
        let html = '<h3>Upcoming Sessions</h3>';
        dashboardData.sessions.filter(s => s.status === 'Upcoming').forEach(s => {
            html += `<div class="schedule-item"><span>${s.date} - ${s.student} (${s.subject})</span><button class="btn-secondary btn-sm">View Details</button></div>`;
        });
        html += '<h3>Past Sessions</h3>';
        dashboardData.sessions.filter(s => s.status !== 'Upcoming').forEach(s => {
            html += `<div class="schedule-item past"><span>${s.date} - ${s.student} (${s.subject})</span><span class="status ${s.status.toLowerCase()}">${s.status}</span></div>`;
        });
        container.innerHTML = html;
    };

    const renderCourses = () => {
        const container = document.getElementById('courses-container');
        let html = '';
        dashboardData.courses.forEach(c => {
            html += `
                <div class="course-manage-item">
                    <div class="course-info">
                        <h4>${c.title}</h4>
                        <p>
                            <span class="status ${c.status.toLowerCase()}">${c.status}</span>
                            <span>${c.students} students</span>
                            <span class="coin-value">${c.price}/session</span>
                        </p>
                    </div>
                    <div class="course-actions">
                        <button class="btn-secondary btn-sm"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn-secondary btn-sm"><i class="fas fa-users"></i> View Students</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    };

    const renderConversations = () => {
        const list = document.getElementById('conversations-list');
        let html = '';
        dashboardData.conversations.forEach(c => {
            html += `
                <div class="conversation-item ${c.unread > 0 ? 'unread' : ''}" data-conv-id="${c.id}">
                    <img src="${c.avatar}" alt="${c.student}">
                    <div class="conv-details">
                        <div class="conv-header">
                            <strong>${c.student}</strong>
                            <small>${c.timestamp}</small>
                        </div>
                        <p>${c.lastMessage}</p>
                    </div>
                    ${c.unread > 0 ? `<span class="unread-dot">${c.unread}</span>` : ''}
                </div>
            `;
        });
        list.innerHTML = html;
    };

    const renderMessages = (convId) => {
        const conversation = dashboardData.conversations.find(c => c.id == convId);
        if (!conversation) return;
        
        // Mark messages as read
        conversation.unread = 0;
        renderConversations(); // Re-render conversation list to remove unread dot
        updateBadges(); // Update main message badge

        const messages = dashboardData.messages[convId] || [];
        document.getElementById('chat-header').innerHTML = `Chat with <strong>${conversation.student}</strong>`;
        const body = document.getElementById('chat-body');
        let html = '';
        messages.forEach(m => {
            const isMe = m.sender === dashboardData.mentorProfile.name;
            html += `
                <div class="message ${isMe ? 'sent' : 'received'}">
                    <div class="message-bubble">
                        <p>${m.text}</p>
                        <small>${m.time}</small>
                    </div>
                </div>
            `;
        });
        body.innerHTML = html;
        body.scrollTop = body.scrollHeight;
    };
    
    const renderEarnings = () => {
        const container = document.getElementById('earnings-container');
        let html = `
            <div class="earnings-summary">
                <div>
                    <span>Available Balance</span>
                    <strong class="rupee-value">${dashboardData.earnings.balance.toLocaleString()}</strong>
                </div>
                <button class="btn-primary" id="withdraw-earnings-btn-2">Withdraw Funds</button>
            </div>
            <h3>Transaction History</h3>
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
                    <tbody>
        `;
        dashboardData.earnings.transactions.forEach(t => {
            html += `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.description}</td>
                    <td class="${t.type}"><span class="rupee-value">${Math.abs(t.amount).toLocaleString()}</span></td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    };

    const renderProfileForm = () => {
        const container = document.getElementById('profile-form-container');
        const { name, headline, bio, subjects } = dashboardData.mentorProfile;
        container.innerHTML = `
            <form class="profile-form">
                <div class="form-group">
                    <label for="profileName">Full Name</label>
                    <input type="text" id="profileName" value="${name}">
                </div>
                <div class="form-group">
                    <label for="profileHeadline">Headline</label>
                    <input type="text" id="profileHeadline" value="${headline}">
                </div>
                <div class="form-group">
                    <label for="profileBio">Biography</label>
                    <textarea id="profileBio" rows="5">${bio}</textarea>
                </div>
                <div class="form-group">
                    <label for="profileSubjects">Subjects (comma-separated)</label>
                    <input type="text" id="profileSubjects" value="${subjects.join(', ')}">
                </div>
                <div class="form-footer">
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        `;
    };

    const renderSettingsForm = () => {
        const container = document.getElementById('settings-form-container');
        const { notifications } = dashboardData.settings;
        container.innerHTML = `
            <form class="settings-form">
                <div class="settings-section">
                    <h3>Notification Settings</h3>
                    <div class="form-group">
                        <div class="toggle-switch">
                            <label for="notifNewBookings">New Bookings</label>
                            <input type="checkbox" id="notifNewBookings" ${notifications.newBookings ? 'checked' : ''}>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="toggle-switch">
                            <label for="notifCancellations">Cancellations</label>
                            <input type="checkbox" id="notifCancellations" ${notifications.cancellations ? 'checked' : ''}>
                        </div>
                    </div>
                     <div class="form-group">
                        <div class="toggle-switch">
                            <label for="notifNewMessage">New Messages</label>
                            <input type="checkbox" id="notifNewMessage" ${notifications.newMessage ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
                <div class="settings-section">
                    <h3>Security</h3>
                    <div class="form-group">
                        <label for="currentPassword">Current Password</label>
                        <input type="password" id="currentPassword">
                    </div>
                    <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <input type="password" id="newPassword">
                    </div>
                </div>
                <div class="form-footer">
                    <button type="submit" class="btn-primary">Save Settings</button>
                </div>
            </form>
        `;
    };

    const updateBadges = () => {
        const unreadMessages = dashboardData.conversations.reduce((sum, c) => sum + c.unread, 0);
        const messageBadge = document.getElementById('message-badge');
        messageBadge.textContent = unreadMessages;
        messageBadge.style.display = unreadMessages > 0 ? 'inline-block' : 'none';

        const unreadNotifications = dashboardData.notifications.filter(n => !n.read).length;
        const notificationBadge = document.getElementById('notification-badge');
        notificationBadge.textContent = unreadNotifications;
        notificationBadge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
    };

    // --- CHART LOGIC ---
    const initChart = (period) => {
        const ctx = document.getElementById('earningsChart');
        if (!ctx) return;

        const chartConfig = {
            type: 'line',
            data: {
                labels: dashboardData.chartData[period].labels,
                datasets: [{
                    label: 'Earnings',
                    data: dashboardData.chartData[period].data,
                    fill: true,
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    borderColor: 'rgba(147, 51, 234, 1)',
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(147, 51, 234, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, grid: { color: '#e2e8f0' } }, x: { grid: { display: false } } },
                plugins: { legend: { display: false } }
            }
        };

        if (earningsChart) {
            earningsChart.destroy();
        }
        earningsChart = new Chart(ctx, chartConfig);
    };

    // --- MODAL LOGIC ---
    const showModal = (title, body, footer) => {
        document.getElementById('modal-title').innerHTML = title;
        document.getElementById('modal-body').innerHTML = body;
        document.getElementById('modal-footer').innerHTML = footer || '<button class="btn-secondary" id="modal-cancel-btn">Close</button>';
        document.getElementById('generic-modal').style.display = 'flex';
    };

    const hideModal = () => {
        document.getElementById('generic-modal').style.display = 'none';
    };

    // --- EVENT LISTENERS ---
    const setupEventListeners = () => {
        // Sidebar Navigation
        document.querySelectorAll('.sidebar-nav .nav-link, .quick-actions .action-btn[data-view], a[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = e.currentTarget.dataset.view;
                switchView(viewId);
                // Pre-render content when switching views
                if (viewId === 'schedule') renderSchedule();
                if (viewId === 'courses') renderCourses();
                if (viewId === 'messages') renderConversations();
                if (viewId === 'earnings') renderEarnings();
                if (viewId === 'profile') renderProfileForm();
                if (viewId === 'settings') renderSettingsForm();
            });
        });

        // Header Dropdowns
        const notificationBtn = document.getElementById('notification-btn');
        const profileMenuBtn = document.getElementById('profile-menu-btn');
        notificationBtn.addEventListener('click', () => {
            document.getElementById('notifications-dropdown').classList.toggle('show');
            // Mark notifications as read
            dashboardData.notifications.forEach(n => n.read = true);
            renderNotifications();
            updateBadges();
        });
        profileMenuBtn.addEventListener('click', () => document.getElementById('profile-dropdown').classList.toggle('show'));

        // Close dropdowns if clicked outside
        window.addEventListener('click', (e) => {
            if (!notificationBtn.contains(e.target) && !e.target.closest('.notification-wrapper')) {
                document.getElementById('notifications-dropdown').classList.remove('show');
            }
            if (!profileMenuBtn.contains(e.target) && !e.target.closest('.profile-menu-wrapper')) {
                document.getElementById('profile-dropdown').classList.remove('show');
            }
        });

        // Chart Period Selector
        document.getElementById('earnings-period-select').addEventListener('change', (e) => initChart(e.target.value));

        // Course Creation
        const createCourseBtn = document.getElementById('create-course-btn');
        const wizardOverlay = document.getElementById('course-wizard-overlay');
        const closeWizardBtn = document.getElementById('close-wizard-btn');
        if (createCourseBtn) createCourseBtn.addEventListener('click', () => wizardOverlay.style.display = 'flex');
        if (closeWizardBtn) closeWizardBtn.addEventListener('click', () => wizardOverlay.style.display = 'none');

        // Modal close buttons
        document.body.addEventListener('click', (e) => {
            if (e.target.id === 'modal-cancel-btn' || e.target.id === 'close-modal-btn' || e.target.matches('.close-modal-btn i')) {
                hideModal();
            }
        });

        // Dynamic Event Listeners (using event delegation)
        document.body.addEventListener('click', (e) => {
            // Session Actions
            const actionBtn = e.target.closest('button[data-session-id]');
            if (actionBtn) {
                const sessionId = actionBtn.dataset.sessionId;
                const session = dashboardData.sessions.find(s => s.id == sessionId);
                showModal(
                    `Session with ${session.student}`,
                    `<p><strong>Subject:</strong> ${session.subject}</p><p><strong>Date:</strong> ${session.date}</p><p><strong>Status:</strong> ${session.status}</p>`,
                    `<button class="btn-secondary" id="modal-cancel-btn">Close</button><button class="btn-primary">Message Student</button>`
                );
            }
            
            // Withdraw Earnings
            if (e.target.id === 'withdraw-earnings-btn' || e.target.id === 'withdraw-earnings-btn-2') {
                 showModal(
                    'Withdraw Earnings',
                    `
                    <p>Your available balance is <strong class="rupee-value">${dashboardData.earnings.balance.toLocaleString()}</strong>.</p>
                    <div class="form-group">
                        <label for="withdraw-amount">Amount to withdraw</label>
                        <input type="number" id="withdraw-amount" placeholder="e.g., 5000">
                    </div>
                    <div class="form-group">
                        <label for="bank-account">Select Bank Account</label>
                        <select id="bank-account"><option>HDFC Bank - **** 1234</option></select>
                    </div>
                    `,
                    `<button class="btn-secondary" id="modal-cancel-btn">Cancel</button><button class="btn-primary">Confirm Withdrawal</button>`
                );
            }

            // Select Conversation
            const convItem = e.target.closest('.conversation-item');
            if (convItem) {
                document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
                convItem.classList.add('active');
                renderMessages(convItem.dataset.convId);
            }
        });
    };

    // --- RUN ---
    initDashboard();
});
