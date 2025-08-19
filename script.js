import { initAuth } from './auth.js';
import { CourseService } from './courseService.js';
import { AuthService } from './authService.js';

// Application State
let currentView = 'grid';
let currentFilters = {
    priceRange: { min: 50, max: 2000 },
    languages: ['english'],
    subjects: [],
    availability: 'today',
    timeSlot: 'afternoon',
    sessionType: '1on1',
    groupSize: '2-5',
    features: [],
    difficulty: 'beginner'
};
let allCourses = [];
let filteredCourses = [];
let currentPage = 1;
let coursesPerPage = 8;
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let currentUser = null;
let userProfile = null;

// DOM Elements (Global scope for functions)
const courseGrid = document.getElementById('courseGrid');

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    await initAuth();
    setupEventListeners();
    
    // Page-specific initializations
    if (courseGrid) {
        setupFilters();
        await loadAndRenderCourses();
    }
    
    await initCoinDisplay();
    setupScrollEffects();
    initAuthModal(); // Initialize authentication modal logic
}

// Initialize authentication
async function initAuth() {
    try {
        currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
            userProfile = await AuthService.getUserProfile();
            updateUIForAuthenticatedUser();
        }
    } catch (error) {
        console.error('Auth initialization error:', error);
    }

    // Listen for auth changes
    AuthService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            userProfile = await AuthService.getUserProfile();
            updateUIForAuthenticatedUser();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            userProfile = null;
            updateUIForUnauthenticatedUser();
        }
    });
}

function updateUIForAuthenticatedUser() {
    const joinBtn = document.getElementById('join-btn');
    const coinsDisplay = document.getElementById('coinsDisplay');
    
    if (joinBtn && userProfile) {
        joinBtn.textContent = userProfile.full_name || 'Profile';
        joinBtn.onclick = () => {
            if (userProfile.role === 'mentor') {
                window.location.href = '/dashboard.html';
            } else {
                window.location.href = '/my-sessions.html';
            }
        };
    }
    
    if (coinsDisplay && userProfile) {
        const coinBalance = coinsDisplay.querySelector('.coin-balance');
        if (coinBalance) {
            coinBalance.textContent = (userProfile.excel_coin_balance || 0).toLocaleString();
        }
    }
}

function updateUIForUnauthenticatedUser() {
    const joinBtn = document.getElementById('join-btn');
    if (joinBtn) {
        joinBtn.textContent = 'Join StudyBuddy';
        joinBtn.onclick = () => showAuthModal();
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Universal Elements
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    const mobileNav = document.getElementById('mobileNav');
    const filterSidebar = document.getElementById('filterSidebar');
    const mobileFiltersToggle = document.getElementById('mobileFiltersToggle');

    mobileMenuToggle?.addEventListener('click', () => toggleMobileMenu(mobileNav));
    closeMobileMenu?.addEventListener('click', () => toggleMobileMenu(mobileNav));
    mobileFiltersToggle?.addEventListener('click', () => toggleMobileFilters(filterSidebar));
    document.addEventListener('click', (e) => handleClickOutside(e, mobileNav, mobileMenuToggle, filterSidebar, mobileFiltersToggle));

    // Index Page-specific Elements
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const viewToggleBtns = document.querySelectorAll('.view-btn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const expandBtns = document.querySelectorAll('.expand-btn');
    const selectAllLanguages = document.getElementById('selectAllLanguages');
    const sessionTypeRadios = document.querySelectorAll('input[name="sessionType"]');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const priceSlider = document.getElementById('priceSlider');

    searchInput?.addEventListener('input', debounce(handleSearch, 300));
    sortSelect?.addEventListener('change', handleSort);
    viewToggleBtns.forEach(btn => btn.addEventListener('click', () => handleViewToggle(btn.dataset.view)));
    loadMoreBtn?.addEventListener('click', loadMoreMentors);
    clearFiltersBtn?.addEventListener('click', clearAllFilters);
    expandBtns.forEach(btn => btn.addEventListener('click', () => toggleCategory(btn)));
    selectAllLanguages?.addEventListener('change', handleSelectAllLanguages);
    sessionTypeRadios.forEach(radio => radio.addEventListener('change', handleSessionTypeChange));
    minPriceInput?.addEventListener('input', handlePriceChange);
    maxPriceInput?.addEventListener('input', handlePriceChange);
    priceSlider?.addEventListener('input', handlePriceSliderChange);
}

// Load and render courses
async function loadAndRenderCourses() {
    try {
        allCourses = await CourseService.getAllCourses();
        applyFilters();
    } catch (error) {
        console.error('Error loading courses:', error);
        renderEmptyState();
    }
}

// Mobile Menu Functions
function toggleMobileMenu(mobileNav) {
    if (!mobileNav) return;
    mobileNav.classList.toggle('active');
    document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
}

function toggleMobileFilters(filterSidebar) {
    if (!filterSidebar) return;
    filterSidebar.classList.toggle('active');
}

function handleClickOutside(event, mobileNav, mobileMenuToggle, filterSidebar, mobileFiltersToggle) {
    if (mobileNav?.classList.contains('active') && !mobileNav.contains(event.target) && !mobileMenuToggle?.contains(event.target)) {
        toggleMobileMenu(mobileNav);
    }
    if (filterSidebar?.classList.contains('active') && !filterSidebar.contains(event.target) && !mobileFiltersToggle?.contains(event.target)) {
        toggleMobileFilters(filterSidebar);
    }
}

// Filter Functions (Only for Index Page)
function setupFilters() {
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const languageCheckboxes = document.querySelectorAll('.language-filters input[type="checkbox"]');

    if (minPriceInput) minPriceInput.value = currentFilters.priceRange.min;
    if (maxPriceInput) maxPriceInput.value = currentFilters.priceRange.max;
    
    languageCheckboxes.forEach(checkbox => checkbox.addEventListener('change', handleLanguageChange));
    document.querySelectorAll('.availability-btn').forEach(btn => btn.addEventListener('click', () => handleAvailabilityChange(btn)));
    document.querySelectorAll('.time-slot-btn').forEach(btn => btn.addEventListener('click', () => handleTimeSlotChange(btn)));
    document.querySelectorAll('.experience-btn').forEach(btn => btn.addEventListener('click', () => handleExperienceChange(btn)));
    document.querySelectorAll('.mentor-features input[type="checkbox"]').forEach(checkbox => checkbox.addEventListener('change', handleFeatureChange));
}

function handleLanguageChange() {
    const languageCheckboxes = document.querySelectorAll('.language-filters input[type="checkbox"]');
    const selectedLanguages = Array.from(languageCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    currentFilters.languages = selectedLanguages;
    applyFilters();
}

function handleSelectAllLanguages() {
    const selectAllLanguages = document.getElementById('selectAllLanguages');
    const languageCheckboxes = document.querySelectorAll('.language-filters input[type="checkbox"]');
    if (!selectAllLanguages) return;
    const isChecked = selectAllLanguages.checked;
    languageCheckboxes.forEach(cb => cb.checked = isChecked);
    handleLanguageChange();
}

function handleAvailabilityChange(clickedBtn) {
    document.querySelectorAll('.availability-btn').forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
    currentFilters.availability = clickedBtn.textContent.toLowerCase().replace(' ', '');
    applyFilters();
}

function handleTimeSlotChange(clickedBtn) {
    document.querySelectorAll('.time-slot-btn').forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
    currentFilters.timeSlot = clickedBtn.textContent.toLowerCase();
    applyFilters();
}

function handleExperienceChange(clickedBtn) {
    document.querySelectorAll('.experience-btn').forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
    currentFilters.difficulty = clickedBtn.textContent.toLowerCase();
    applyFilters();
}

function handleFeatureChange() {
    const selectedFeatures = Array.from(document.querySelectorAll('.mentor-features input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    currentFilters.features = selectedFeatures;
    applyFilters();
}

function handleSessionTypeChange() {
    const selectedType = document.querySelector('input[name="sessionType"]:checked')?.value;
    const groupSizeDiv = document.getElementById('groupSize');
    if (!selectedType || !groupSizeDiv) return;

    currentFilters.sessionType = selectedType;
    if (selectedType === 'group') {
        groupSizeDiv.style.display = 'block';
        document.querySelectorAll('.group-size-btn').forEach(btn => btn.addEventListener('click', () => handleGroupSizeChange(btn)));
    } else {
        groupSizeDiv.style.display = 'none';
    }
    applyFilters();
}

function handleGroupSizeChange(clickedBtn) {
    document.querySelectorAll('.group-size-btn').forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
    currentFilters.groupSize = clickedBtn.textContent;
    applyFilters();
}

function handlePriceChange() {
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    if (!minPriceInput || !maxPriceInput) return;
    const min = parseInt(minPriceInput.value) || 50;
    const max = parseInt(maxPriceInput.value) || 2000;
    currentFilters.priceRange = { min, max };
    applyFilters();
}

function handlePriceSliderChange() {
    const priceSlider = document.getElementById('priceSlider');
    const maxPriceInput = document.getElementById('maxPrice');
    if (!priceSlider || !maxPriceInput) return;
    const value = parseInt(priceSlider.value);
    maxPriceInput.value = value;
    currentFilters.priceRange.max = value;
    applyFilters();
}

function toggleCategory(btn) {
    const category = btn.dataset.category;
    const subcategories = document.getElementById(`${category}-sub`);
    subcategories?.classList.toggle('expanded');
    btn.classList.toggle('expanded');
}

function clearAllFilters() {
    currentFilters = {
        priceRange: { min: 50, max: 2000 },
        languages: ['english'],
        subjects: [],
        availability: 'today',
        timeSlot: 'afternoon',
        sessionType: '1on1',
        groupSize: '2-5',
        features: [],
        experience: 'professional'
    };
    
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const priceSlider = document.getElementById('priceSlider');
    const groupSizeDiv = document.getElementById('groupSize');

    if (minPriceInput) minPriceInput.value = currentFilters.priceRange.min;
    if (maxPriceInput) maxPriceInput.value = currentFilters.priceRange.max;
    if (priceSlider) priceSlider.value = currentFilters.priceRange.max;
    
    document.querySelectorAll('.language-filters input[type="checkbox"]').forEach(cb => cb.checked = cb.value === 'english');
    document.querySelectorAll('.availability-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes('today')) btn.classList.add('active');
    });
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes('afternoon')) btn.classList.add('active');
    });
    document.querySelectorAll('.experience-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes('professional')) btn.classList.add('active');
    });
    
    const sessionRadio = document.querySelector('input[name="sessionType"][value="1on1"]');
    if (sessionRadio) sessionRadio.checked = true;
    if (groupSizeDiv) groupSizeDiv.style.display = 'none';
    
    document.querySelectorAll('.mentor-features input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.subject-categories input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    applyFilters();
}

// Search and Sort Functions
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase().trim();
    currentFilters.search = query;
    applyFilters();
}

async function handleSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;
    const sortBy = sortSelect.value;
    await sortCourses(sortBy);
    renderCourses();
}

async function sortCourses(sortBy) {
    switch (sortBy) {
        case 'rating': filteredCourses.sort((a, b) => b.average_rating - a.average_rating); break;
        case 'priceLow': filteredCourses.sort((a, b) => a.price_per_session - b.price_per_session); break;
        case 'priceHigh': filteredCourses.sort((a, b) => b.price_per_session - a.price_per_session); break;
        case 'popular': filteredCourses.sort((a, b) => b.enrollment_count - a.enrollment_count); break;
        case 'newest': filteredCourses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
        default: break;
    }
}

function handleViewToggle(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) btn.classList.add('active');
    });
    
    if (courseGrid) {
        courseGrid.style.gridTemplateColumns = (view === 'list') ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))';
    }
    renderCourses();
}

// Filter Application
async function applyFilters() {
    filteredCourses = allCourses.filter(course => {
        // Search filter
        if (currentFilters.search && 
            !course.title.toLowerCase().includes(currentFilters.search) && 
            !course.description.toLowerCase().includes(currentFilters.search) &&
            !course.subject.toLowerCase().includes(currentFilters.search)) {
            return false;
        }
        
        // Price filter
        if (course.price_per_session < currentFilters.priceRange.min || 
            course.price_per_session > currentFilters.priceRange.max) {
            return false;
        }
        
        // Language filter (based on course language)
        if (currentFilters.languages.length > 0 && 
            !currentFilters.languages.includes(course.language.toLowerCase())) {
            return false;
        }
        
        // Difficulty filter
        if (currentFilters.difficulty && 
            course.difficulty_level !== currentFilters.difficulty) {
            return false;
        }
        
        // Subject filter
        if (currentFilters.subjects.length > 0 && 
            !currentFilters.subjects.includes(course.subject.toLowerCase())) {
            return false;
        }
        
        return true;
    });
    
    currentPage = 1;
    await sortCourses(document.getElementById('sortSelect')?.value || 'relevance');
    renderCourses();
    updateResultsCount();
}

function updateResultsCount() {
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
        resultsCount.textContent = `Showing ${Math.min(filteredCourses.length, coursesPerPage * currentPage)} of ${filteredCourses.length} courses`;
    }
}

// Course Rendering
function renderCourses() {
    if (!courseGrid) return;
    
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const coursesToShow = filteredCourses.slice(0, endIndex);
    
    courseGrid.innerHTML = '';
    
    if (coursesToShow.length === 0) {
        renderEmptyState();
        return;
    }
    
    coursesToShow.forEach(course => {
        const courseCard = createCourseCard(course);
        courseGrid.appendChild(courseCard);
    });
    
    updateLoadMoreButton();
    
    const newCards = courseGrid.querySelectorAll('.course-card:not(.fade-in)');
    newCards.forEach((card, index) => {
        setTimeout(() => card.classList.add('fade-in'), index * 100);
    });
}

function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.dataset.courseId = course.id;
    const isFavorited = favorites.includes(course.id);
    
    card.innerHTML = `
        <div class="course-header">
            <div class="course-image">
                <img src="${course.course_image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=320&h=180&fit=crop'}" alt="${course.title}">
                <div class="difficulty-badge ${course.difficulty_level}">${course.difficulty_level}</div>
            </div>
        </div>
        <div class="course-content">
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.short_description || course.description.substring(0, 100) + '...'}</p>
                <div class="course-meta">
                    <span class="course-subject">${course.subject}</span>
                    <span class="course-duration">${course.duration_minutes}min</span>
                    <span class="course-sessions">${course.total_sessions} sessions</span>
                </div>
            </div>
            <div class="mentor-info">
                <img src="${course.mentor.avatar_url || 'https://via.placeholder.com/32x32'}" alt="${course.mentor.full_name}" class="mentor-avatar-small">
                <span class="mentor-name">${course.mentor.full_name}</span>
            </div>
            <div class="course-stats">
                <div class="course-rating">
                    <div class="stars">${generateStars(course.average_rating || 0)}</div>
                    <span class="rating-text">${course.average_rating || 0} (${course.total_reviews || 0})</span>
                </div>
                <div class="enrollment-count">${course.enrollment_count || 0} enrolled</div>
            </div>
            <div class="price-section">
                <div class="coin-price"><i class="fas fa-coins"></i><span>${course.price_per_session.toLocaleString()}/session</span></div>
            </div>
            <div class="course-actions">
                <button class="preview-btn">View Course</button>
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}"><i class="fas fa-heart"></i></button>
            </div>
        </div>
    `;
    
    card.querySelector('.preview-btn')?.addEventListener('click', () => previewCourse(course.id));
    card.querySelector('.favorite-btn')?.addEventListener('click', (e) => toggleFavorite(course.id, e.currentTarget));

    return card;
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) stars += '<i class="fas fa-star star"></i>';
        else if (i - 0.5 <= rating) stars += '<i class="fas fa-star-half-alt star"></i>';
        else stars += '<i class="far fa-star star"></i>';
    }
    return stars;
}

function renderEmptyState() {
    if (!courseGrid) return;
    courseGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No courses found</h3>
            <p>Try adjusting your filters or search terms to find more courses.</p>
        </div>
    `;
}

function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    const hasMore = filteredCourses.length > currentPage * coursesPerPage;
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

function loadMoreCourses() {
    currentPage++;
    renderCourses();
    updateResultsCount();
}

// Favorite Functions
function toggleFavorite(courseId, btnElement) {
    const index = favorites.indexOf(courseId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(courseId);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    btnElement?.classList.toggle('favorited');
}

// Course Preview
function previewCourse(courseId) {
    window.location.href = `course-detail.html?id=${courseId}`;
}

// Coins Management
async function initCoinDisplay() {
    const coinsDisplay = document.getElementById('coinsDisplay');
    if (!coinsDisplay) return;

    // Create and append the popover
    const popover = document.createElement('div');
    popover.className = 'coin-popover';
    popover.id = 'coin-popover';
    coinsDisplay.appendChild(popover);

    // Populate and style the display
    await updateCoinsDisplay();

    // Add event listeners for hover
    coinsDisplay.addEventListener('mouseenter', () => {
        populateCoinPopover();
        popover.classList.add('visible');
    });
    coinsDisplay.addEventListener('mouseleave', () => {
        popover.classList.remove('visible');
    });
}

async function updateCoinsDisplay() {
    const coinsDisplay = document.getElementById('coinsDisplay');
    if (!coinsDisplay) return;
    
    let currentBalance = 0;
    if (userProfile) {
        currentBalance = userProfile.excel_coin_balance || 0;
    }
    
    const coinBalanceEl = coinsDisplay.querySelector('.coin-balance');
    if (coinBalanceEl) coinBalanceEl.textContent = `${currentBalance.toLocaleString()}`;
    
    coinsDisplay.classList.remove('low-balance', 'medium-balance');
    if (currentBalance < 100) {
        coinsDisplay.classList.add('low-balance');
    } else if (currentBalance <= 500) {
        coinsDisplay.classList.add('medium-balance');
    }
}

async function populateCoinPopover() {
    const popover = document.getElementById('coin-popover');
    if (!popover) return;

    // Get recent transactions
    let recentTransactions = [];
    if (currentUser) {
        try {
            const { data } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(5);
            recentTransactions = data || [];
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }

    const icons = {
        coin_purchase: { class: 'purchase', icon: 'fa-plus' },
        course_enrollment: { class: 'payment', icon: 'fa-minus' },
        refund: { class: 'refund', icon: 'fa-undo' },
        bonus: { class: 'bonus', icon: 'fa-star' }
    };

    const transactionsHTML = recentTransactions.map(t => {
        const typeInfo = icons[t.transaction_type] || { class: 'other', icon: 'fa-circle' };
        const amountClass = t.amount > 0 ? 'credit' : 'debit';
        const amountPrefix = t.amount > 0 ? '+' : '';
        const date = new Date(t.created_at).toLocaleDateString();
        return `
            <li class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-icon ${typeInfo.class}"><i class="fas ${typeInfo.icon}"></i></div>
                    <div class="transaction-info">
                        <p>${t.description}</p>
                        <small>${date}</small>
                    </div>
                </div>
                <span class="transaction-amount ${amountClass}">${amountPrefix}${t.amount.toLocaleString()}</span>
            </li>
        `;
    }).join('');

    popover.innerHTML = `
        <div class="popover-header">Recent Activity</div>
        <div class="popover-body">
            <ul class="transaction-list">
                ${transactionsHTML || '<li>No recent transactions</li>'}
            </ul>
        </div>
        <div class="popover-footer">
            <a href="pricing.html" class="buy-coins-btn">Buy More Coins</a>
            <a href="#" class="view-history-link">View all transactions</a>
        </div>
    `;
}

// Authentication Modal
function showAuthModal() {
    const authModal = document.getElementById('auth-modal-overlay');
    if (authModal) {
        authModal.classList.remove('is-hidden');
    }
}

function hideAuthModal() {
    const authModal = document.getElementById('auth-modal-overlay');
    if (authModal) {
        authModal.classList.add('is-hidden');
    }
}

// Initialize auth modal (renamed from initAuth to avoid confusion)
function initAuthModal() {
    const joinBtn = document.getElementById('join-btn');
    const authModalOverlay = document.getElementById('auth-modal-overlay');

    // If core auth elements don't exist, do nothing.
    if (!joinBtn || !authModalOverlay) {
        return;
    }

    const closeModalBtn = document.getElementById('auth-modal-close-btn');
    const tabBtns = document.querySelectorAll('.auth-tab-btn');
    const modalBodies = document.querySelectorAll('.auth-modal-body');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');

    // --- Modal Visibility ---
    const showModal = () => authModalOverlay.classList.remove('is-hidden');
    const hideModal = () => authModalOverlay.classList.add('is-hidden');

    if (!currentUser) {
        joinBtn.addEventListener('click', showModal);
    }
    closeModalBtn?.addEventListener('click', hideModal);
    authModalOverlay.addEventListener('click', (e) => {
        if (e.target === authModalOverlay) {
            hideModal();
        }
    });

    // --- Tab Switching ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            modalBodies.forEach(body => body.classList.remove('active'));
            document.getElementById(`${tab}-body`)?.classList.add('active');
        });
    });

    // --- Password Visibility Toggle ---
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                btn.classList.toggle('fa-eye');
                btn.classList.toggle('fa-eye-slash');
            }
        });
    });

    // --- Login Logic ---
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            await AuthService.signIn(email, password);
            hideModal();
            // UI will update via auth state change listener
        } catch (error) {
            showFormError(passwordInput, error.message);
        }
    });

    // --- Signup Logic ---
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email')?.value;
        const password = document.getElementById('signup-password')?.value;
        const fullName = document.getElementById('signup-name')?.value;
        const username = document.getElementById('signup-username')?.value;

        try {
            await AuthService.signUp(email, password, {
                full_name: fullName,
                username: username,
                role: 'student' // Default to student
            });
            hideModal();
            // Show success message or redirect
        } catch (error) {
            alert('Signup Error: ' + error.message);
        }
    });

    // Utility functions for form validation
    function showFormError(input, message) {
        if (!input) return;
        const formGroup = input.parentElement.closest('.form-group');
        if (!formGroup) return;
        formGroup.classList.add('error');
        const errorEl = formGroup.querySelector('.error-message');
        if (errorEl) errorEl.textContent = message;
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Scroll Effects
function setupScrollEffects() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (navbar && window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else if (navbar) {
            navbar.classList.remove('scrolled');
        }
    });
}

// Add CSS for fade-in animation
const style = document.createElement('style');
style.textContent = `
    .course-card { 
        opacity: 0; 
        transform: translateY(20px); 
        transition: all 0.5s ease;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px);
        border-radius: 16px;
        padding: 0;
        border: 1px solid rgba(147, 51, 234, 0.1);
        box-shadow: 0 4px 20px rgba(147, 51, 234, 0.1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    .course-card.fade-in { opacity: 1; transform: translateY(0); }
    .course-card:hover { 
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(147, 51, 234, 0.2);
    }
    .course-header { position: relative; }
    .course-image { 
        width: 100%; 
        height: 180px; 
        overflow: hidden;
        position: relative;
    }
    .course-image img { 
        width: 100%; 
        height: 100%; 
        object-fit: cover; 
    }
    .difficulty-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: capitalize;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
    }
    .difficulty-badge.beginner { color: #16a34a; }
    .difficulty-badge.intermediate { color: #f59e0b; }
    .difficulty-badge.advanced { color: #dc2626; }
    .course-content { 
        padding: 20px; 
        display: flex; 
        flex-direction: column; 
        flex-grow: 1;
    }
    .course-title { 
        font-size: 18px; 
        font-weight: 600; 
        margin-bottom: 8px; 
        color: #1e293b;
    }
    .course-description { 
        color: #64748b; 
        font-size: 14px; 
        margin-bottom: 12px; 
        line-height: 1.5;
    }
    .course-meta { 
        display: flex; 
        gap: 12px; 
        margin-bottom: 12px; 
        font-size: 12px; 
        color: #64748b;
    }
    .mentor-info { 
        display: flex; 
        align-items: center; 
        gap: 8px; 
        margin-bottom: 12px;
    }
    .mentor-avatar-small { 
        width: 32px; 
        height: 32px; 
        border-radius: 50%; 
        object-fit: cover;
    }
    .mentor-name { 
        font-size: 14px; 
        font-weight: 500; 
        color: #475569;
    }
    .course-stats { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 16px;
    }
    .course-rating { 
        display: flex; 
        align-items: center; 
        gap: 8px;
    }
    .enrollment-count { 
        font-size: 12px; 
        color: #64748b;
    }
    .price-section { 
        margin-bottom: 16px;
    }
    .coin-price { 
        font-size: 20px; 
        font-weight: 700; 
        color: #9333ea; 
        display: flex; 
        align-items: center; 
        gap: 6px;
    }
    .coin-price i { color: #f59e0b; }
    .course-actions { 
        display: flex; 
        gap: 12px; 
        margin-top: auto;
    }
    .preview-btn { 
        flex: 1; 
        background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); 
        color: white; 
        border: none; 
        padding: 12px 20px; 
        border-radius: 12px; 
        font-weight: 600; 
        cursor: pointer; 
        transition: all 0.3s ease;
    }
    .preview-btn:hover { 
        transform: translateY(-2px); 
        box-shadow: 0 8px 25px rgba(147, 51, 234, 0.4);
    }
    .favorite-btn.favorited { background: #9333ea !important; color: white !important; border-color: #9333ea !important; }
    .course-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
        gap: 24px; 
        margin-bottom: 40px;
    }
`;
document.head.appendChild(style);

// Update load more button event listener
document.getElementById('loadMoreBtn')?.addEventListener('click', loadMoreCourses);