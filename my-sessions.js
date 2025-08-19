document.addEventListener('DOMContentLoaded', () => {
    const sessionsList = document.getElementById('sessions-list');
    const tabLinks = document.querySelectorAll('.tab-link');
    const confirmationModal = document.getElementById('confirmation-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    // --- Mock Data ---
    const mockSessions = [
        {
            id: 1,
            status: 'upcoming',
            mentor: { name: 'Dr. Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face' },
            subject: 'Advanced Machine Learning',
            date: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
            duration: 60, // minutes
            type: '1-on-1 Session'
        },
        {
            id: 2,
            status: 'upcoming',
            mentor: { name: 'Johnathan Lee', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
            subject: 'Python for Beginners',
            date: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
            duration: 90,
            type: 'Group Session'
        },
        {
            id: 3,
            status: 'completed',
            mentor: { name: 'Dr. Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face' },
            subject: 'Intro to Neural Networks',
            date: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            duration: 60,
            type: '1-on-1 Session',
            reviewLeft: false
        },
        {
            id: 4,
            status: 'completed',
            mentor: { name: 'Maria Garcia', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face' },
            subject: 'Calculus II Problem Solving',
            date: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            duration: 60,
            type: '1-on-1 Session',
            reviewLeft: true
        }
    ];

    // --- Rendering Logic ---
    const renderSessions = (filter) => {
        if (!sessionsList) return;
        sessionsList.innerHTML = '';
        const filteredSessions = mockSessions.filter(s => filter === 'upcoming' ? s.status === 'upcoming' : s.status !== 'upcoming');

        if (filteredSessions.length === 0) {
            sessionsList.innerHTML = getEmptyStateHTML(filter);
            return;
        }

        filteredSessions.forEach(session => {
            sessionsList.innerHTML += createSessionCardHTML(session);
        });
    };

    const createSessionCardHTML = (session) => {
        const sessionDate = new Date(session.date);
        const endDate = new Date(sessionDate.getTime() + session.duration * 60000);
        const isPast = session.status !== 'upcoming';

        const formattedDate = sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const formattedTime = `${sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

        const actionsHTML = isPast 
            ? getPastSessionActions(session)
            : getUpcomingSessionActions(session);

        return `
            <div class="session-card ${isPast ? 'past-session' : ''}" data-session-id="${session.id}">
                <div class="mentor-info-col">
                    <img src="${session.mentor.avatar}" alt="${session.mentor.name}" class="mentor-avatar">
                    <div class="mentor-name">${session.mentor.name}</div>
                </div>
                <div class="session-details-col">
                    <h3 class="session-title">${session.subject}</h3>
                    <div class="session-meta">
                        <div class="meta-item"><i class="fas fa-calendar-alt"></i><span>${formattedDate}</span></div>
                        <div class="meta-item"><i class="fas fa-clock"></i><span>${formattedTime}</span></div>
                        <div class="meta-item"><i class="fas fa-user-friends"></i><span>${session.type}</span></div>
                        <div class="meta-item"><i class="fas fa-hourglass-half"></i><span>${session.duration} minutes</span></div>
                    </div>
                </div>
                <div class="session-actions-col">
                    ${actionsHTML}
                </div>
            </div>
        `;
    };

    const getUpcomingSessionActions = (session) => {
        const now = new Date();
        const sessionDate = new Date(session.date);
        const isJoinable = now >= new Date(sessionDate.getTime() - 10 * 60000) && now < new Date(sessionDate.getTime() + session.duration * 60000);

        return `
            <button class="btn-session btn-primary" ${!isJoinable ? 'disabled' : ''} data-action="join">
                <i class="fas fa-video"></i> Join Session
            </button>
            <button class="btn-session btn-secondary" data-action="reschedule">
                <i class="fas fa-calendar-edit"></i> Reschedule
            </button>
            <button class="btn-session btn-tertiary" data-action="cancel">
                <i class="fas fa-times-circle"></i> Cancel
            </button>
        `;
    };

    const getPastSessionActions = (session) => {
        const reviewButton = session.reviewLeft
            ? `<button class="btn-session btn-secondary" data-action="view-review"><i class="fas fa-star"></i> View Review</button>`
            : `<button class="btn-session btn-primary" data-action="leave-review"><i class="fas fa-star"></i> Leave a Review</button>`;

        return `
            ${reviewButton}
            <button class="btn-session btn-secondary" data-action="book-again">
                <i class="fas fa-redo"></i> Book Again
            </button>
            <button class="btn-session btn-tertiary" data-action="view-recording">
                <i class="fas fa-download"></i> View Recording
            </button>
        `;
    };

    const getEmptyStateHTML = (filter) => {
        const message = filter === 'upcoming'
            ? { icon: 'fa-calendar-plus', title: 'No Upcoming Sessions', text: 'Ready to learn something new? Book a session with one of our expert mentors.', button: 'Find a Mentor' }
            : { icon: 'fa-history', title: 'No Past Sessions', text: 'Your completed sessions will appear here for your reference.', button: 'Browse Mentors' };

        return `
            <div class="empty-state-container">
                <i class="fas ${message.icon}"></i>
                <h3>${message.title}</h3>
                <p>${message.text}</p>
                <a href="index.html" class="primary-cta">${message.button}</a>
            </div>
        `;
    };

    // --- Event Handlers ---
    tabLinks.forEach(tab => {
        tab.addEventListener('click', () => {
            tabLinks.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderSessions(tab.dataset.tab);
        });
    });

    sessionsList?.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-session');
        if (!button) return;

        const action = button.dataset.action;
        const sessionId = button.closest('.session-card')?.dataset.sessionId;
        if (sessionId) handleSessionAction(action, sessionId);
    });

    const handleSessionAction = (action, sessionId) => {
        console.log(`Action: ${action}, Session ID: ${sessionId}`);
        switch (action) {
            case 'cancel':
                showConfirmationModal(
                    'Cancel Session',
                    'Are you sure you want to cancel this session? Please review our cancellation policy.',
                    'Yes, Cancel Session',
                    () => {
                        console.log(`Session ${sessionId} cancelled.`);
                        const session = mockSessions.find(s => s.id == sessionId);
                        if(session) session.status = 'canceled';
                        const activeTab = document.querySelector('.tab-link.active')?.dataset.tab || 'upcoming';
                        renderSessions(activeTab);
                        hideConfirmationModal();
                    }
                );
                break;
            case 'join': alert('Joining session... (This would open a video call link)'); break;
            case 'reschedule': alert('Opening reschedule options... (This would open a calendar modal)'); break;
            case 'leave-review': alert('Opening review form...'); break;
            case 'book-again': window.location.href = 'mentor-profile.html'; break;
            default: alert(`Action "${action}" is not fully implemented yet.`);
        }
    };

    // --- Modal Logic ---
    const showConfirmationModal = (title, body, confirmText, onConfirm) => {
        if (!confirmationModal || !modalTitle || !modalBody || !modalConfirmBtn) return;
        modalTitle.textContent = title;
        modalBody.innerHTML = `<p>${body}</p>`;
        
        const newConfirmBtn = modalConfirmBtn.cloneNode(true);
        newConfirmBtn.textContent = confirmText;
        modalConfirmBtn.parentNode.replaceChild(newConfirmBtn, modalConfirmBtn);
        newConfirmBtn.addEventListener('click', onConfirm, { once: true });
        
        confirmationModal.style.display = 'flex';
    };

    const hideConfirmationModal = () => {
        if (confirmationModal) confirmationModal.style.display = 'none';
    };

    closeModalBtn?.addEventListener('click', hideConfirmationModal);
    modalCancelBtn?.addEventListener('click', hideConfirmationModal);
    confirmationModal?.addEventListener('click', (e) => {
        if (e.target === confirmationModal) hideConfirmationModal();
    });

    // --- Initial Load ---
    renderSessions('upcoming');
});
