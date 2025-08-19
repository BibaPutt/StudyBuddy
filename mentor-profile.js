import { mentors } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mentorId = parseInt(urlParams.get('id'), 10);
    const mentor = mentors.find(m => m.id === mentorId);

    if (mentor) {
        populateMentorData(mentor);
    } else {
        // Handle case where mentor is not found
        document.querySelector('.main-content').innerHTML = '<h1>Mentor not found</h1>';
    }

    setupTabs();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabPanes.forEach(pane => {
                pane.classList.toggle('active', pane.id === target);
            });
        });
    });
}

function populateMentorData(mentor) {
    // --- Header ---
    document.querySelector('.breadcrumb .active').textContent = mentor.name;
    document.querySelector('.profile-header-avatar').src = mentor.avatar;
    document.querySelector('.profile-header-avatar').alt = mentor.name;
    document.querySelector('.profile-header-main h1').textContent = mentor.name;
    document.querySelector('.mentor-headline').textContent = mentor.headline;
    document.querySelector('.rating-text').textContent = `${mentor.rating} (${mentor.reviewsCount} reviews)`;
    document.querySelector('.language-flags').innerHTML = mentor.languages.map(flag => `<span class="flag">${flag}</span>`).join('');
    document.querySelector('.stat-number:nth-child(1)').textContent = mentor.sessionsCount;
    document.querySelector('.stat:nth-child(2) .stat-number').textContent = mentor.studentsCount;
    
    const availability = document.querySelector('.status-badge');
    if (mentor.available) {
        availability.classList.add('available');
        availability.innerHTML = '<i class="fas fa-circle"></i> Available Now';
    } else {
        availability.classList.remove('available');
        availability.innerHTML = '<i class="fas fa-circle"></i> Not Available';
    }

    // --- Left Column ---
    document.querySelector('.video-thumbnail img').src = mentor.profile.videoThumbnail;
    document.querySelector('.price-amount').innerHTML = `🪙 ${mentor.price.toLocaleString()}`;

    // --- Right Column (Tabs) ---
    // About Tab
    document.querySelector('#about .about-section h3:nth-of-type(1) + p').textContent = mentor.profile.bio;
    document.querySelector('#about .education-item').innerHTML = mentor.profile.education.map(edu => `
        <div class="education-degree">${edu.degree}</div>
        <div class="education-school">${edu.school}</div>
        <div class="education-year">${edu.year}</div>
    `).join('');
    document.querySelector('#about .about-section h3:nth-of-type(3) + p').textContent = mentor.profile.philosophy;
    document.querySelector('#about .achievements').innerHTML = mentor.profile.achievements.map(ach => `<span class="achievement-badge">${ach}</span>`).join('');

    // Courses Tab
    const coursesGrid = document.querySelector('#courses .courses-grid');
    coursesGrid.innerHTML = mentor.profile.courses.map(course => `
        <div class="course-card">
            <div class="course-header">
                <h4>${course.title}</h4>
                <span class="course-difficulty ${course.difficulty.toLowerCase()}">${course.difficulty}</span>
            </div>
            <p class="course-description">${course.description}</p>
            <div class="course-meta">
                <span class="duration"><i class="fas fa-clock"></i> ${course.duration} sessions</span>
                <span class="price">🪙 ${course.price.toLocaleString()}</span>
            </div>
            <div class="course-actions">
                <button class="secondary-btn btn-sm">View Syllabus</button>
                <button class="primary-cta btn-sm">Enroll Now</button>
            </div>
        </div>
    `).join('');

    // Reviews Tab
    const reviewsList = document.querySelector('#reviews .reviews-list');
    reviewsList.innerHTML = mentor.profile.reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <img src="${review.avatar}" alt="${review.student}" class="student-avatar">
                <div class="review-info">
                    <div class="student-name">${review.student}</div>
                    <div class="review-rating">${'<i class="fas fa-star"></i>'.repeat(review.rating)}</div>
                    <div class="review-date">${review.date}</div>
                </div>
            </div>
            <p class="review-text">${review.text}</p>
        </div>
    `).join('');

    // Schedule Tab
    const scheduleGrid = document.querySelector('#schedule .schedule-grid');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    scheduleGrid.innerHTML = days.map(day => `
        <div class="day-column">
            <div class="day-header">${day}</div>
            ${mentor.profile.schedule[day] && mentor.profile.schedule[day].length > 0
                ? mentor.profile.schedule[day].map(slot => `<div class="time-slot">${slot}</div>`).join('')
                : '<div class="time-slot unavailable">Unavailable</div>'
            }
        </div>
    `).join('');
}
