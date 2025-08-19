import { CourseService } from './courseService.js';
import { AuthService } from './authService.js';

let currentUser = null;
let userProfile = null;
let dashboardData = {};

document.addEventListener('DOMContentLoaded', () => {
    let earningsChart; // To hold the chart instance

    // --- INITIALIZATION ---
    const initDashboard = async () => {
        await initAuth();
        
        // Check if user is mentor
        if (!userProfile || userProfile.role !== 'mentor') {
            window.location.href = '/index.html';
            return;
        }
        
        await loadDashboardData();
        setupEventListeners();
        renderDashboard();
    };
    
    const initAuth = async () => {
        try {
            currentUser = await AuthService.getCurrentUser();
            if (currentUser) {
                userProfile = await AuthService.getUserProfile();
            } else {
                window.location.href = '/index.html';
                return;
            }
        } catch (error) {
            console.error('Auth error:', error);
            window.location.href = '/index.html';
        }
    };
    
    const loadDashboardData = async () => {
        try {
            // Load mentor's courses
            const courses = await CourseService.getMentorCourses(currentUser.id);
            
            // Load course sessions
            const allSessions = [];
            for (const course of courses) {
                const sessions = await CourseService.getCourseSessions(course.id, currentUser.id);
                allSessions.push(...sessions.map(session => ({
                    ...session,
                    course_title: course.title
                })));
            }
            
            // Load course messages
            const allMessages = [];
            for (const course of courses) {
                const messages = await CourseService.getCourseMessages(course.id);
                allMessages.push(...messages);
            }
            
            // Structure dashboard data
            dashboardData = {
                mentorProfile: {
                    name: userProfile.full_name,
                    headline: userProfile.headline || 'Expert Mentor',
                    bio: userProfile.bio || '',
                    subjects: courses.map(c => c.subject),
                    avatar: userProfile.avatar_url
                },
                courses: courses,
                sessions: allSessions,
                messages: allMessages,
                notifications: [], // Will be loaded separately
                earnings: {
                    balance: userProfile.excel_coin_balance || 0,
                    transactions: [] // Will be loaded separately
                }
            };
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };
    
    const renderDashboard = () => {
        document.getElementById('profile-menu-name').textContent = dashboardData.mentorProfile.name;
        renderNotifications();
        renderRecentSessions();
        initChart('monthly');
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
        const recentSessions = dashboardData.sessions?.slice(0, 3) || [];
        recentSessions.forEach(s => {
            const scheduledDate = new Date(s.scheduled_start).toLocaleDateString();
            const studentName = s.enrollment?.student?.full_name || 'Unknown Student';
            html += `
                <tr>
                    <td>${studentName}</td>
                    <td>${s.course_title || s.title}</td>
                    <td>${scheduledDate}</td>
                    <td><span class="status ${s.status.toLowerCase()}">${s.status}</span></td>
                    <td><span class="coin-value">-</span></td>
                    <td><button class="btn-secondary btn-sm" data-session-id="${s.id}">Details</button></td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    };
    
    const renderSchedule = () => {
        const container = document.getElementById('schedule-container');
        let html = '<h3>Upcoming Sessions</h3>';
        const upcomingSessions = dashboardData.sessions?.filter(s => s.status === 'scheduled') || [];
        upcomingSessions.forEach(s => {
            const scheduledDate = new Date(s.scheduled_start).toLocaleDateString();
            const studentName = s.enrollment?.student?.full_name || 'Unknown Student';
            html += `<div class="schedule-item"><span>${scheduledDate} - ${studentName} (${s.course_title})</span><button class="btn-secondary btn-sm">View Details</button></div>`;
        });
        html += '<h3>Past Sessions</h3>';
        const pastSessions = dashboardData.sessions?.filter(s => s.status !== 'scheduled') || [];
        pastSessions.forEach(s => {
            const scheduledDate = new Date(s.scheduled_start).toLocaleDateString();
            const studentName = s.enrollment?.student?.full_name || 'Unknown Student';
            html += `<div class="schedule-item past"><span>${scheduledDate} - ${studentName} (${s.course_title})</span><span class="status ${s.status.toLowerCase()}">${s.status}</span></div>`;
        });
        container.innerHTML = html;
    };

    const renderCourses = () => {
        const container = document.getElementById('courses-container');
        let html = '';
        const courses = dashboardData.courses || [];
        courses.forEach(c => {
            html += `
                <div class="course-manage-item">
                    <div class="course-info">
                        <h4>${c.title}</h4>
                        <p>
                            <span class="status ${c.is_active ? 'published' : 'draft'}">${c.is_active ? 'Published' : 'Draft'}</span>
                            <span>${c.enrollment_count || 0} students</span>
                            <span class="coin-value">${c.price_per_session}/session</span>
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
        
        // Group messages by course
        const courseMessages = {};
        (dashboardData.messages || []).forEach(msg => {
            if (!courseMessages[msg.course_id]) {
                courseMessages[msg.course_id] = {
                    course_id: msg.course_id,
                    messages: [],
                    lastMessage: null,
                    unread: 0
                };
            }
            courseMessages[msg.course_id].messages.push(msg);
            if (!msg.is_read && msg.sender_id !== currentUser.id) {
                courseMessages[msg.course_id].unread++;
            }
        });
        
        Object.values(courseMessages).forEach(c => {
            const lastMsg = c.messages[c.messages.length - 1];
            const course = dashboardData.courses?.find(course => course.id === c.course_id);
            html += `
                <div class="conversation-item ${c.unread > 0 ? 'unread' : ''}" data-conv-id="${c.course_id}">
                    <img src="${course?.course_image_url || 'https://via.placeholder.com/48x48'}" alt="${course?.title}">
                    <div class="conv-details">
                        <div class="conv-header">
                            <strong>${course?.title || 'Course Chat'}</strong>
                            <small>${lastMsg ? new Date(lastMsg.created_at).toLocaleDateString() : ''}</small>
                        </div>
                        <p>${lastMsg?.message_text || 'No messages yet'}</p>
                    </div>
                    ${c.unread > 0 ? `<span class="unread-dot">${c.unread}</span>` : ''}
                </div>
            `;
        });
        list.innerHTML = html;
    };

    const renderMessages = async (courseId) => {
        const course = dashboardData.courses?.find(c => c.id === courseId);
        if (!course) return;
        
        try {
            const messages = await CourseService.getCourseMessages(courseId);
            
            document.getElementById('chat-header').innerHTML = `Chat: <strong>${course.title}</strong>`;
            const body = document.getElementById('chat-body');
            let html = '';
            
            messages.forEach(m => {
                const isMe = m.sender_id === currentUser.id;
                const senderName = isMe ? 'You' : m.sender.full_name;
                html += `
                    <div class="message ${isMe ? 'sent' : 'received'}">
                        <div class="message-bubble">
                            <strong>${senderName}:</strong>
                            <p>${m.message_text}</p>
                            <small>${new Date(m.created_at).toLocaleTimeString()}</small>
                        </div>
                    </div>
                `;
            });
            
            body.innerHTML = html;
            body.scrollTop = body.scrollHeight;
            
            // Update chat input to send to this course
            const chatInput = document.querySelector('#chat-footer input');
            const sendBtn = document.querySelector('#chat-footer button');
            
            sendBtn.onclick = async () => {
                const messageText = chatInput.value.trim();
                if (messageText) {
                    try {
                        await CourseService.sendCourseMessage(courseId, currentUser.id, messageText);
                        chatInput.value = '';
                        renderMessages(courseId); // Refresh messages
                    } catch (error) {
                        console.error('Error sending message:', error);
                    }
                }
            };
            
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const renderEarnings = () => {
        const container = document.getElementById('earnings-container');
        const balance = dashboardData.earnings?.balance || 0;
        let html = `
            <div class="earnings-summary">
                <div>
                    <span>Available Balance</span>
                    <strong class="coin-value">${balance.toLocaleString()}</strong>
                </div>
                <button class="btn-primary" id="withdraw-earnings-btn-2">Withdraw Funds</button>
            </div>
            <h3>Transaction History</h3>
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
                    <tbody>
        `;
        const transactions = dashboardData.earnings?.transactions || [];
        transactions.forEach(t => {
            html += `
                <tr>
                    <td>${new Date(t.created_at).toLocaleDateString()}</td>
                    <td>${t.description}</td>
                    <td class="${t.amount > 0 ? 'credit' : 'debit'}"><span class="coin-value">${Math.abs(t.amount).toLocaleString()}</span></td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    };

    const renderProfileForm = () => {
        const container = document.getElementById('profile-form-container');
        const profile = dashboardData.mentorProfile;
        container.innerHTML = `
            <form class="profile-form">
                <div class="form-group">
                    <label for="profileName">Full Name</label>
                    <input type="text" id="profileName" value="${profile.name || ''}">
                </div>
                <div class="form-group">
                    <label for="profileHeadline">Headline</label>
                    <input type="text" id="profileHeadline" value="${profile.headline || ''}">
                </div>
                <div class="form-group">
                    <label for="profileBio">Biography</label>
                    <textarea id="profileBio" rows="5">${profile.bio || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="profileSubjects">Subjects (comma-separated)</label>
                    <input type="text" id="profileSubjects" value="${(profile.subjects || []).join(', ')}">
                </div>
                <div class="form-footer">
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        `;
    };

    const renderSettingsForm = () => {
        const container = document.getElementById('settings-form-container');
        container.innerHTML = `
            <form class="settings-form">
                <div class="settings-section">
                    <h3>Notification Settings</h3>
                    <div class="form-group">
                        <div class="toggle-switch">
                            <label for="notifNewBookings">New Bookings</label>
                            <input type="checkbox" id="notifNewBookings" checked>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="toggle-switch">
                            <label for="notifCancellations">Cancellations</label>
                            <input type="checkbox" id="notifCancellations" checked>
                        </div>
                    </div>
                     <div class="form-group">
                        <div class="toggle-switch">
                            <label for="notifNewMessage">New Messages</label>
                            <input type="checkbox" id="notifNewMessage" checked>
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
        // Count unread messages across all courses
        let unreadMessages = 0;
        (dashboardData.messages || []).forEach(msg => {
            if (!msg.is_read && msg.sender_id !== currentUser.id) {
                unreadMessages++;
            }
        });
        
        const messageBadge = document.getElementById('message-badge');
        messageBadge.textContent = unreadMessages;
        messageBadge.style.display = unreadMessages > 0 ? 'inline-block' : 'none';

        const unreadNotifications = (dashboardData.notifications || []).filter(n => !n.is_read).length;
        const notificationBadge = document.getElementById('notification-badge');
        notificationBadge.textContent = unreadNotifications;
        notificationBadge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
    };

    // --- CHART LOGIC ---
    const initChart = (period) => {
        const ctx = document.getElementById('earningsChart');
        if (!ctx) return;

        // Mock chart data for now
        const chartData = {
            monthly: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                data: [3200, 4500, 2800, 5000]
            },
            biannual: {
                labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                data: [9600, 10500, 12500, 11000, 14000, 18250]
            }
        };

        const chartConfig = {
            type: 'line',
            data: {
                labels: chartData[period].labels,
                datasets: [{
                    label: 'Earnings',
                    data: chartData[period].data,
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
                renderMessages(convItem.dataset.convId); // This is now courseId
            }
        });
    };

    // --- RUN ---
    initDashboard();
});
