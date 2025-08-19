import { initAuth } from './auth.js';
import { mentors, userProfile } from './data.js';

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
    experience: 'professional'
};
let filteredMentors = [...mentors];
let currentPage = 1;
let mentorsPerPage = 8;
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// DOM Elements (Global scope for functions)
const mentorGrid = document.getElementById('mentorGrid');

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    setupEventListeners();
    
    // Page-specific initializations
    if (mentorGrid) {
        setupFilters();
        renderMentors();
    }
    
    initCoinDisplay();
    setupScrollEffects();
    initAuth(); // Initialize authentication modal logic
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
    currentFilters.experience = clickedBtn.textContent.toLowerCase();
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
    applyFilters(query);
}

function handleSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;
    const sortBy = sortSelect.value;
    sortMentors(sortBy);
    renderMentors();
}

function sortMentors(sortBy) {
    switch (sortBy) {
        case 'rating': filteredMentors.sort((a, b) => b.rating - a.rating); break;
        case 'priceLow': filteredMentors.sort((a, b) => a.price - b.price); break;
        case 'priceHigh': filteredMentors.sort((a, b) => b.price - a.price); break;
        case 'popular': filteredMentors.sort((a, b) => b.reviewsCount - a.reviewsCount); break;
        default: break;
    }
}

function handleViewToggle(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) btn.classList.add('active');
    });
    
    if (mentorGrid) {
        mentorGrid.style.gridTemplateColumns = (view === 'list') ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))';
    }
    renderMentors();
}

// Filter Application
function applyFilters(searchQuery = '') {
    filteredMentors = mentors.filter(mentor => {
        if (searchQuery && !mentor.name.toLowerCase().includes(searchQuery) && 
            !mentor.headline.toLowerCase().includes(searchQuery) &&
            !mentor.subjects.some(subject => subject.toLowerCase().includes(searchQuery))) {
            return false;
        }
        if (mentor.price < currentFilters.priceRange.min || mentor.price > currentFilters.priceRange.max) {
            return false;
        }
        if (currentFilters.languages.length > 0 && !currentFilters.languages.some(lang => mentor.languages.some(mentorLang => mentorLang.includes(lang === 'english' ? '🇺🇸' : '🇮🇳')))) {
            return false;
        }
        if (currentFilters.experience && mentor.experience.toLowerCase() !== currentFilters.experience) {
            return false;
        }
        if (currentFilters.features.length > 0 && !currentFilters.features.some(feature => mentor.features.includes(feature))) {
            return false;
        }
        return true;
    });
    
    currentPage = 1;
    const sortSelect = document.getElementById('sortSelect');
    sortMentors(sortSelect?.value || 'relevance');
    renderMentors();
    updateResultsCount();
}

function updateResultsCount() {
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
        resultsCount.textContent = `Showing ${Math.min(filteredMentors.length, mentorsPerPage * currentPage)} of ${filteredMentors.length} mentors`;
    }
}

// Mentor Rendering
function renderMentors() {
    if (!mentorGrid) return;
    
    const startIndex = (currentPage - 1) * mentorsPerPage;
    const endIndex = startIndex + mentorsPerPage;
    const mentorsToShow = filteredMentors.slice(0, endIndex);
    
    mentorGrid.innerHTML = '';
    
    if (mentorsToShow.length === 0) {
        renderEmptyState();
        return;
    }
    
    mentorsToShow.forEach(mentor => {
        const mentorCard = createMentorCard(mentor);
        mentorGrid.appendChild(mentorCard);
    });
    
    updateLoadMoreButton();
    
    const newCards = mentorGrid.querySelectorAll('.mentor-card:not(.fade-in)');
    newCards.forEach((card, index) => {
        setTimeout(() => card.classList.add('fade-in'), index * 100);
    });
}

function createMentorCard(mentor) {
    const card = document.createElement('div');
    card.className = 'mentor-card';
    card.dataset.mentorId = mentor.id;
    const isFavorited = favorites.includes(mentor.id);
    
    card.innerHTML = `
        <div class="mentor-header">
            <div class="mentor-avatar">
                <img src="${mentor.avatar}" alt="${mentor.name}" onerror="this.src='https://via.placeholder.com/80x80/9333ea/ffffff?text=${mentor.name.charAt(0)}'">
                ${mentor.verified ? '<div class="verified-badge"><i class="fas fa-check"></i></div>' : ''}
            </div>
            <div class="mentor-info">
                <h3 class="mentor-name">${mentor.name}</h3>
                <p class="mentor-headline">${mentor.headline}</p>
                <div class="mentor-rating">
                    <div class="stars">${generateStars(mentor.rating)}</div>
                    <span class="rating-text">${mentor.rating} (${mentor.reviewsCount} reviews)</span>
                </div>
            </div>
        </div>
        <div class="price-section">
            <div class="coin-price"><i class="fas fa-coins"></i><span>${mentor.price.toLocaleString()}/hr</span></div>
            ${mentor.available ? `<div class="availability-indicator"><span class="availability-dot"></span>Available Now</div>` : ''}
        </div>
        <div class="subject-tags">${mentor.subjects.slice(0, 3).map(subject => `<span class="subject-tag">${subject}</span>`).join('')}</div>
        <div class="mentor-actions">
            <button class="preview-btn">Preview Profile</button>
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}"><i class="fas fa-heart"></i></button>
        </div>
    `;
    
    card.querySelector('.preview-btn')?.addEventListener('click', () => previewMentor(mentor.id));
    card.querySelector('.favorite-btn')?.addEventListener('click', (e) => toggleFavorite(mentor.id, e.currentTarget));

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
    if (!mentorGrid) return;
    mentorGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No mentors found</h3>
            <p>Try adjusting your filters or search terms to find more mentors.</p>
        </div>
    `;
}

function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    const hasMore = filteredMentors.length > currentPage * mentorsPerPage;
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

function loadMoreMentors() {
    currentPage++;
    renderMentors();
    updateResultsCount();
}

// Favorite Functions
function toggleFavorite(mentorId, btnElement) {
    const index = favorites.indexOf(mentorId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(mentorId);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    btnElement?.classList.toggle('favorited');
}

// Mentor Preview
function previewMentor(mentorId) {
    window.location.href = `mentor-profile.html?id=${mentorId}`;
}

// Coins Management
function initCoinDisplay() {
    const coinsDisplay = document.getElementById('coinsDisplay');
    if (!coinsDisplay) return;

    // Create and append the popover
    const popover = document.createElement('div');
    popover.className = 'coin-popover';
    popover.id = 'coin-popover';
    coinsDisplay.appendChild(popover);

    // Populate and style the display
    updateCoinsDisplay();

    // Add event listeners for hover
    coinsDisplay.addEventListener('mouseenter', () => {
        populateCoinPopover();
        popover.classList.add('visible');
    });
    coinsDisplay.addEventListener('mouseleave', () => {
        popover.classList.remove('visible');
    });
}

function updateCoinsDisplay() {
    const coinsDisplay = document.getElementById('coinsDisplay');
    if (!coinsDisplay) return;
    
    const currentBalance = userProfile.coinBalance;
    const coinBalanceEl = coinsDisplay.querySelector('.coin-balance');
    if (coinBalanceEl) coinBalanceEl.textContent = `${currentBalance.toLocaleString()}`;
    
    coinsDisplay.classList.remove('low-balance', 'medium-balance');
    if (currentBalance < 100) {
        coinsDisplay.classList.add('low-balance');
    } else if (currentBalance <= 500) {
        coinsDisplay.classList.add('medium-balance');
    }
}

function populateCoinPopover() {
    const popover = document.getElementById('coin-popover');
    if (!popover) return;

    const icons = {
        purchase: { class: 'purchase', icon: 'fa-plus' },
        payment: { class: 'payment', icon: 'fa-minus' },
        refund: { class: 'refund', icon: 'fa-undo' },
        bonus: { class: 'bonus', icon: 'fa-star' }
    };

    const transactionsHTML = userProfile.recentTransactions.map(t => {
        const typeInfo = icons[t.type];
        const amountClass = t.amount > 0 ? 'credit' : 'debit';
        const amountPrefix = t.amount > 0 ? '+' : '';
        return `
            <li class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-icon ${typeInfo.class}"><i class="fas ${typeInfo.icon}"></i></div>
                    <div class="transaction-info">
                        <p>${t.description}</p>
                        <small>${t.date}</small>
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
                ${transactionsHTML}
            </ul>
        </div>
        <div class="popover-footer">
            <a href="pricing.html" class="buy-coins-btn">Buy More Coins</a>
            <a href="#" class="view-history-link">View all transactions</a>
        </div>
    `;
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
    .mentor-card { opacity: 0; transform: translateY(20px); transition: all 0.5s ease; }
    .mentor-card.fade-in { opacity: 1; transform: translateY(0); }
    .favorite-btn.favorited { background: #9333ea !important; color: white !important; border-color: #9333ea !important; }
`;
document.head.appendChild(style);
