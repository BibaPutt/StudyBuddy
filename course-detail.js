import { CourseService } from './courseService.js';
import { AuthService } from './authService.js';

let currentCourse = null;
let currentUser = null;
let userProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();
    await loadCourseDetails();
    setupTabs();
    setupEventListeners();
});

async function initAuth() {
    try {
        currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
            userProfile = await AuthService.getUserProfile();
        }
    } catch (error) {
        console.error('Auth initialization error:', error);
    }
}

async function loadCourseDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (!courseId) {
        document.querySelector('.main-content').innerHTML = '<h1>Course not found</h1>';
        return;
    }

    try {
        currentCourse = await CourseService.getCourseById(courseId);
        if (currentCourse) {
            populateCourseData(currentCourse);
        } else {
            document.querySelector('.main-content').innerHTML = '<h1>Course not found</h1>';
        }
    } catch (error) {
        console.error('Error loading course:', error);
        document.querySelector('.main-content').innerHTML = '<h1>Error loading course</h1>';
    }
}

function populateCourseData(course) {
    // Update breadcrumb
    document.getElementById('course-breadcrumb').textContent = course.title;

    // Populate course header
    const courseHeader = document.getElementById('course-header');
    courseHeader.innerHTML = `
        <div class="profile-header-avatar-container">
            <img src="${course.course_image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop'}" alt="${course.title}" class="profile-header-avatar">
            <div class="profile-header-verified-badge"><i class="fas fa-check"></i></div>
        </div>
        <div class="profile-header-main">
            <h1>${course.title}</h1>
            <p class="mentor-headline">${course.short_description || course.description.substring(0, 100) + '...'}</p>
            <div class="profile-header-meta">
                <div class="rating-section">
                    <div class="stars">
                        ${generateStars(course.average_rating || 0)}
                    </div>
                    <span class="rating-text">${course.average_rating || 0} (${course.total_reviews || 0} reviews)</span>
                </div>
                <div class="language-flags">
                    <span class="flag">${getLanguageFlag(course.language)}</span>
                </div>
                <div class="status-badge available">
                    <i class="fas fa-circle"></i>
                    ${course.difficulty_level} Level
                </div>
            </div>
        </div>
        <div class="profile-header-actions">
            <div class="profile-header-stats">
                <div class="stat">
                    <span class="stat-number">${course.total_sessions}</span>
                    <span class="stat-label">Sessions</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${course.enrollment_count || 0}</span>
                    <span class="stat-label">Enrolled</span>
                </div>
            </div>
            <button class="primary-cta" id="headerEnrollBtn">
                <i class="fas fa-graduation-cap"></i>
                Enroll Now
            </button>
        </div>
    `;

    // Populate video section
    const courseVideo = document.getElementById('course-video');
    courseVideo.innerHTML = `
        <div class="video-thumbnail">
            <img src="${course.course_image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop'}" alt="Course Preview">
            <div class="play-button"><i class="fas fa-play"></i></div>
            <div class="video-duration">Preview</div>
        </div>
    `;

    // Populate pricing
    const coursePricing = document.getElementById('course-pricing');
    coursePricing.innerHTML = `
        <span class="price-amount">🪙 ${course.price_per_session.toLocaleString()}</span>
        <span class="price-unit">per session</span>
        <div class="discount-badges">
            <span class="discount-badge">Total: ${course.total_sessions} sessions</span>
        </div>
    `;

    // Populate About tab
    const courseAbout = document.getElementById('course-about');
    courseAbout.innerHTML = `
        <h3>Course Description</h3>
        <p>${course.description}</p>
        
        <h3>What You'll Learn</h3>
        <ul class="learning-objectives">
            ${course.learning_objectives.map(obj => `<li><i class="fas fa-check-circle"></i> ${obj}</li>`).join('')}
        </ul>
        
        <h3>Prerequisites</h3>
        <p>${course.prerequisites || 'No prerequisites required'}</p>
        
        <h3>Materials Needed</h3>
        <ul class="materials-list">
            ${course.materials_needed.map(material => `<li><i class="fas fa-tools"></i> ${material}</li>`).join('')}
        </ul>
        
        <h3>Course Details</h3>
        <div class="course-details-grid">
            <div class="detail-item">
                <strong>Subject:</strong> ${course.subject}
            </div>
            <div class="detail-item">
                <strong>Category:</strong> ${course.category || 'General'}
            </div>
            <div class="detail-item">
                <strong>Duration:</strong> ${course.duration_minutes} minutes per session
            </div>
            <div class="detail-item">
                <strong>Total Sessions:</strong> ${course.total_sessions}
            </div>
            <div class="detail-item">
                <strong>Language:</strong> ${course.language}
            </div>
            <div class="detail-item">
                <strong>Max Participants:</strong> ${course.is_group_session ? course.max_participants : '1 (Individual)'}
            </div>
        </div>
    `;

    // Populate Curriculum tab
    const courseCurriculum = document.getElementById('course-curriculum');
    courseCurriculum.innerHTML = `
        <h3>Course Curriculum</h3>
        <div class="curriculum-list">
            ${Array.from({length: course.total_sessions}, (_, i) => `
                <div class="curriculum-item">
                    <div class="session-number">${i + 1}</div>
                    <div class="session-details">
                        <h4>Session ${i + 1}</h4>
                        <p>Duration: ${course.duration_minutes} minutes</p>
                        <p>Interactive learning session covering key concepts</p>
                    </div>
                    <div class="session-status">
                        <i class="fas fa-lock"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Populate Reviews tab
    populateReviews(course);

    // Populate Mentor tab
    const mentorInfo = document.getElementById('mentor-info');
    mentorInfo.innerHTML = `
        <div class="mentor-profile-card">
            <div class="mentor-header">
                <img src="${course.mentor.avatar_url || 'https://via.placeholder.com/80x80'}" alt="${course.mentor.full_name}" class="mentor-avatar">
                <div class="mentor-details">
                    <h3>${course.mentor.full_name}</h3>
                    <p>${course.mentor.headline || 'Expert Mentor'}</p>
                </div>
            </div>
            <div class="mentor-bio">
                <h4>About the Mentor</h4>
                <p>${course.mentor.bio || 'Experienced educator passionate about sharing knowledge.'}</p>
            </div>
            <div class="mentor-actions">
                <button class="secondary-btn" onclick="window.location.href='mentor-profile.html?id=${course.mentor.id}'">
                    <i class="fas fa-user"></i> View Full Profile
                </button>
                <button class="secondary-btn" id="mentorMessageBtn">
                    <i class="fas fa-envelope"></i> Send Message
                </button>
            </div>
        </div>
    `;

    // Update enrollment modal
    updateEnrollmentModal(course);
}

function populateReviews(course) {
    const reviewsSummary = document.getElementById('reviews-summary');
    const reviewsList = document.getElementById('reviews-list');

    if (!course.course_reviews || course.course_reviews.length === 0) {
        reviewsSummary.innerHTML = '<p>No reviews yet. Be the first to review this course!</p>';
        reviewsList.innerHTML = '';
        return;
    }

    // Calculate rating distribution
    const ratings = course.course_reviews.map(r => r.rating);
    const avgRating = course.average_rating || 0;
    const totalReviews = course.total_reviews || 0;

    reviewsSummary.innerHTML = `
        <div class="summary-score">
            <div class="score-value">${avgRating.toFixed(1)}</div>
            <div class="score-stars">
                ${generateStars(avgRating)}
            </div>
            <div class="score-count">${totalReviews} Reviews</div>
        </div>
        <div class="summary-bars">
            ${[5,4,3,2,1].map(star => {
                const count = ratings.filter(r => r === star).length;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return `
                    <div class="bar-item">
                        <span>${star}</span>
                        <i class="fas fa-star"></i>
                        <div class="bar">
                            <div class="bar-fill" style="width: ${percentage}%;"></div>
                        </div>
                        <span>${count}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    reviewsList.innerHTML = course.course_reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <img src="${review.student.avatar_url || 'https://via.placeholder.com/40x40'}" alt="${review.student.full_name}" class="student-avatar">
                <div class="review-info">
                    <div class="student-name">${review.student.full_name}</div>
                    <div class="review-rating">${generateStars(review.rating)}</div>
                    <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
                </div>
            </div>
            <p class="review-text">${review.review_text}</p>
        </div>
    `).join('');
}

function updateEnrollmentModal(course) {
    const enrollmentCourseInfo = document.getElementById('enrollment-course-info');
    enrollmentCourseInfo.innerHTML = `
        <img src="${course.course_image_url || 'https://via.placeholder.com/60x60'}" alt="${course.title}" class="mentor-avatar-small">
        <div>
            <h3 class="mentor-name-small">${course.title}</h3>
            <p class="mentor-headline-small">Enrolling in course</p>
        </div>
    `;

    const enrollmentDetails = document.getElementById('enrollment-details');
    enrollmentDetails.innerHTML = `
        <div class="enrollment-summary">
            <h3>Course Summary</h3>
            <div class="summary-item">
                <span class="label">Course:</span>
                <span class="value">${course.title}</span>
            </div>
            <div class="summary-item">
                <span class="label">Mentor:</span>
                <span class="value">${course.mentor.full_name}</span>
            </div>
            <div class="summary-item">
                <span class="label">Total Sessions:</span>
                <span class="value">${course.total_sessions}</span>
            </div>
            <div class="summary-item">
                <span class="label">Duration per Session:</span>
                <span class="value">${course.duration_minutes} minutes</span>
            </div>
            <div class="summary-item">
                <span class="label">Difficulty:</span>
                <span class="value">${course.difficulty_level}</span>
            </div>
            <div class="summary-item total">
                <span class="label"><strong>Total Cost:</strong></span>
                <span class="value"><strong>🪙 ${(course.price_per_session * course.total_sessions).toLocaleString()}</strong></span>
            </div>
        </div>
        
        <div class="payment-options">
            <h3>Payment Method</h3>
            <div class="payment-card selected">
                <h5>Use Excel Coins</h5>
                <p>Available Balance: 🪙 ${userProfile?.excel_coin_balance?.toLocaleString() || '0'}</p>
                ${(userProfile?.excel_coin_balance || 0) < (course.price_per_session * course.total_sessions) ? 
                    '<p class="insufficient-coins">Not enough coins! <a href="pricing.html">Buy more coins</a></p>' : ''}
            </div>
        </div>
    `;

    document.getElementById('enrollmentPrice').textContent = `🪙 ${(course.price_per_session * course.total_sessions).toLocaleString()}`;
}

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

function setupEventListeners() {
    // Enroll buttons
    document.getElementById('enrollBtn')?.addEventListener('click', showEnrollmentModal);
    document.getElementById('headerEnrollBtn')?.addEventListener('click', showEnrollmentModal);
    
    // Modal controls
    document.getElementById('closeEnrollmentModal')?.addEventListener('click', hideEnrollmentModal);
    document.getElementById('confirmEnrollmentBtn')?.addEventListener('click', handleEnrollment);
    
    // Other actions
    document.getElementById('messageBtn')?.addEventListener('click', handleMessageMentor);
    document.getElementById('favoriteBtn')?.addEventListener('click', handleToggleFavorite);
    document.getElementById('shareBtn')?.addEventListener('click', handleShareCourse);
    document.getElementById('mentorMessageBtn')?.addEventListener('click', handleMessageMentor);
}

function showEnrollmentModal() {
    if (!currentUser) {
        // Show auth modal instead
        document.getElementById('auth-modal-overlay')?.classList.remove('is-hidden');
        return;
    }
    
    document.getElementById('enrollmentModalOverlay').classList.add('active');
}

function hideEnrollmentModal() {
    document.getElementById('enrollmentModalOverlay').classList.remove('active');
}

async function handleEnrollment() {
    if (!currentUser || !currentCourse) return;
    
    try {
        // Check if user has enough coins
        const totalCost = currentCourse.price_per_session * currentCourse.total_sessions;
        if ((userProfile?.excel_coin_balance || 0) < totalCost) {
            alert('Insufficient coins! Please buy more coins to enroll.');
            window.location.href = 'pricing.html';
            return;
        }
        
        // Enroll in course
        await CourseService.enrollInCourse(currentCourse.id, currentUser.id);
        
        // Update user's coin balance
        await AuthService.updateCoinBalance(currentUser.id, -totalCost, `Enrolled in ${currentCourse.title}`);
        
        // Show success
        document.getElementById('enrollmentStep').style.display = 'none';
        document.getElementById('enrollmentSuccess').style.display = 'block';
        document.getElementById('enrollment-footer').style.display = 'none';
        
    } catch (error) {
        console.error('Enrollment error:', error);
        alert('Enrollment failed. Please try again.');
    }
}

function handleMessageMentor() {
    if (!currentUser) {
        document.getElementById('auth-modal-overlay')?.classList.remove('is-hidden');
        return;
    }
    
    // Redirect to course messages or mentor profile
    alert('Message functionality coming soon!');
}

function handleToggleFavorite() {
    if (!currentUser) {
        document.getElementById('auth-modal-overlay')?.classList.remove('is-hidden');
        return;
    }
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(currentCourse.id);
    const btn = document.getElementById('favoriteBtn');
    
    if (index > -1) {
        favorites.splice(index, 1);
        btn.innerHTML = '<i class="fas fa-heart"></i> Add to Favorites';
    } else {
        favorites.push(currentCourse.id);
        btn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function handleShareCourse() {
    if (navigator.share) {
        navigator.share({
            title: currentCourse.title,
            text: currentCourse.short_description,
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Course link copied to clipboard!');
    }
}

// Utility functions
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) stars += '<i class="fas fa-star star"></i>';
        else if (i - 0.5 <= rating) stars += '<i class="fas fa-star-half-alt star"></i>';
        else stars += '<i class="far fa-star star"></i>';
    }
    return stars;
}

function getLanguageFlag(language) {
    const flags = {
        'English': '🇺🇸',
        'Hindi': '🇮🇳',
        'Spanish': '🇪🇸',
        'French': '🇫🇷',
        'German': '🇩🇪',
        'Chinese': '🇨🇳',
        'Japanese': '🇯🇵'
    };
    return flags[language] || '🌐';
}