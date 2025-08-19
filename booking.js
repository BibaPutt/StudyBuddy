document.addEventListener('DOMContentLoaded', () => {
    const bookSessionBtn = document.getElementById('bookSessionBtn');
    const bookingModalOverlay = document.getElementById('bookingModalOverlay');
    const closeBookingModal = document.getElementById('closeBookingModal');
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    const modalPriceEl = document.getElementById('modalPrice');
    const progressSteps = document.querySelectorAll('.progress-step');

    let currentStep = 1;
    const totalSteps = 4;
    const basePrice = 1500;

    const bookingState = {
        sessionType: null,
        duration: null, // in minutes
        date: null,
        time: null,
        price: basePrice,
    };

    const openModal = () => {
        bookingModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderStep(1);
    };

    const closeModal = () => {
        if (bookingState.sessionType || bookingState.date) {
            if (!confirm("Are you sure you want to close? Your progress will be lost.")) {
                return;
            }
        }
        bookingModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        resetState();
    };
    
    const resetState = () => {
        currentStep = 1;
        Object.assign(bookingState, {
            sessionType: null,
            duration: null,
            date: null,
            time: null,
            price: basePrice,
        });
    };

    const updatePrice = () => {
        let newPrice = basePrice;
        if (bookingState.duration) {
            newPrice = basePrice * (bookingState.duration / 60);
        }
        bookingState.price = newPrice;
        modalPriceEl.innerHTML = `🪙 ${newPrice.toLocaleString()}`;
    };

    const validateStep = () => {
        switch (currentStep) {
            case 1:
                return bookingState.sessionType && bookingState.duration;
            case 2:
                return bookingState.date && bookingState.time;
            case 3:
                return true; // Assuming details are optional for now
            case 4:
                return true; // Assuming payment method is selected
            default:
                return false;
        }
    };

    const updateButtons = () => {
        const isStepValid = validateStep();
        nextBtn.disabled = !isStepValid;

        backBtn.style.display = currentStep > 1 && currentStep <= totalSteps ? 'inline-flex' : 'none';
        
        if (currentStep === totalSteps) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Booking';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    };

    const renderStep = (step) => {
        currentStep = step;
        const stepContainer = document.getElementById(`step${step}`);
        if (!stepContainer) return;

        let content = '';
        switch (step) {
            case 1:
                content = getStep1HTML();
                break;
            case 2:
                content = getStep2HTML();
                break;
            case 3:
                content = getStep3HTML();
                break;
            case 4:
                content = getStep4HTML();
                break;
        }
        stepContainer.innerHTML = content;
        attachStepListeners(step);

        // Update progress indicator
        progressSteps.forEach((el, index) => {
            el.classList.toggle('active', index < currentStep);
            el.classList.toggle('current', index + 1 === currentStep);
        });

        // Show current step content
        document.querySelectorAll('.booking-step').forEach(el => el.classList.remove('active'));
        stepContainer.classList.add('active');
        
        updateButtons();
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            renderStep(currentStep + 1);
        } else {
            // Final submission
            console.log('Booking confirmed!', bookingState);
            renderSuccessStep();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            renderStep(currentStep - 1);
        }
    };

    const attachStepListeners = (step) => {
        switch (step) {
            case 1:
                document.querySelectorAll('.session-type-card').forEach(card => {
                    card.addEventListener('click', () => {
                        document.querySelectorAll('.session-type-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        bookingState.sessionType = card.dataset.type;
                        updateButtons();
                    });
                });
                document.querySelectorAll('.duration-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        bookingState.duration = parseInt(btn.dataset.duration);
                        updatePrice();
                        updateButtons();
                    });
                });
                break;
            case 2:
                renderCalendar();
                break;
            case 3:
                // Attach listeners for step 3 form elements if needed
                break;
            case 4:
                // Attach listeners for payment options
                break;
        }
    };

    // HTML Content for Steps
    const getStep1HTML = () => `
        <h2 class="step-title">Select Session Type & Duration</h2>
        <div class="session-type-options">
            <div class="session-type-card" data-type="1-on-1">
                <div class="recommended-badge">Recommended</div>
                <div class="icon"><i class="fas fa-user"></i></div>
                <h4>1-on-1 Session</h4>
                <p>A personalized session tailored to your specific learning goals.</p>
            </div>
            <div class="session-type-card" data-type="group">
                <div class="icon"><i class="fas fa-users"></i></div>
                <h4>Join Group Session</h4>
                <p>Learn with others in a collaborative environment. (Max 5 students)</p>
                <div class="participants">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" alt="p1">
                    <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=32&h=32&fit=crop&crop=face" alt="p2">
                    <div class="count">+2</div>
                </div>
            </div>
        </div>
        <div class="duration-selector">
            <h4>Select Duration</h4>
            <div class="duration-options">
                <button class="duration-btn" data-duration="30">30 min</button>
                <button class="duration-btn" data-duration="60">60 min</button>
                <button class="duration-btn" data-duration="90">90 min</button>
                <button class="duration-btn" data-duration="120">120 min</button>
            </div>
        </div>
    `;

    const getStep2HTML = () => `
        <h2 class="step-title">Choose Date & Time</h2>
        <div class="date-time-container">
            <div class="calendar">
                <div class="calendar-header">
                    <button id="prevMonth"><i class="fas fa-chevron-left"></i></button>
                    <h3 id="currentMonthYear"></h3>
                    <button id="nextMonth"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="calendar-grid day-names">
                    <div class="day-name">Sun</div><div class="day-name">Mon</div><div class="day-name">Tue</div><div class="day-name">Wed</div><div class="day-name">Thu</div><div class="day-name">Fri</div><div class="day-name">Sat</div>
                </div>
                <div class="calendar-grid" id="calendarDays"></div>
            </div>
            <div class="time-slots">
                <h4>Available Slots</h4>
                <div class="time-slots-grid" id="timeSlotsGrid">
                    <p>Please select a date to see available times.</p>
                </div>
            </div>
        </div>
    `;

    const getStep3HTML = () => `
        <h2 class="step-title">Add Session Details</h2>
        <form class="details-form">
            <div class="form-group">
                <label for="sessionTopic">Topic / Subject</label>
                <select id="sessionTopic">
                    <option>Python for Beginners</option>
                    <option>Advanced Machine Learning</option>
                    <option>General Q&A</option>
                </select>
            </div>
            <div class="form-group">
                <label for="specialRequirements">Special Requirements</label>
                <textarea id="specialRequirements" placeholder="Let Sarah know if you have any specific questions or topics you'd like to cover..."></textarea>
            </div>
            <div class="form-group">
                <label>Preparation Materials (Optional)</label>
                <div class="upload-area">
                    <input type="file" id="fileUpload" hidden/>
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p><strong>Click to upload</strong> or drag and drop</p>
                </div>
            </div>
            <div class="form-group">
                <div class="toggle-group">
                    <label for="addToCalendar">Add to my calendar</label>
                    <label class="switch">
                        <input type="checkbox" id="addToCalendar" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </form>
    `;

    const getStep4HTML = () => `
        <h2 class="step-title">Confirm & Pay</h2>
        <div class="payment-container">
            <div class="booking-summary-card">
                <h4>Booking Summary</h4>
                <div class="summary-item">
                    <span class="label">Session Type</span>
                    <span class="value">${bookingState.sessionType}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Date & Time</span>
                    <span class="value">${bookingState.date} at ${bookingState.time}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Duration</span>
                    <span class="value">${bookingState.duration} minutes</span>
                </div>
                <div class="summary-item total">
                    <span class="label"><strong>Total</strong></span>
                    <span class="value"><strong>🪙 ${bookingState.price.toLocaleString()}</strong></span>
                </div>
            </div>
            <div class="payment-options">
                <h4>Select Payment Method</h4>
                <div class="payment-card selected">
                    <h5>Use Excel Coins</h5>
                    <p>Available Balance: 🪙 1,250</p>
                    <p class="insufficient-coins" style="display: none;">Not enough coins!</p>
                </div>
                <div class="payment-card">
                    <h5>Buy Coins & Book</h5>
                    <p>Securely purchase more coins to complete your booking.</p>
                </div>
            </div>
        </div>
        <p class="cancellation-policy">By confirming, you agree to our <a href="#">Cancellation Policy</a>.</p>
    `;

    const renderSuccessStep = () => {
        const successContainer = document.getElementById('successStep');
        successContainer.innerHTML = `
            <div class="success-container">
                <div class="success-icon"><i class="fas fa-check"></i></div>
                <h2>Booking Confirmed!</h2>
                <p>Your session with Dr. Sarah Chen for ${bookingState.date} at ${bookingState.time} is booked.</p>
                <div class="success-actions">
                    <button class="secondary-btn"><i class="fas fa-download"></i> Download .ics</button>
                    <button class="primary-cta">Go to My Sessions</button>
                </div>
            </div>
        `;
        document.querySelectorAll('.booking-step').forEach(el => el.classList.remove('active'));
        successContainer.classList.add('active');
        document.querySelector('.modal-footer').style.display = 'none';
    };

    // Calendar Logic
    let currentDate = new Date();

    const renderCalendar = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        document.getElementById('currentMonthYear').textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        for (let i = 0; i < firstDay; i++) {
            calendarDays.innerHTML += `<div class="calendar-day other-month"></div>`;
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.textContent = i;
            
            // Mock availability: make weekends unavailable, and some random weekdays
            const dayOfWeek = new Date(year, month, i).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6 || Math.random() > 0.7) {
                dayEl.classList.add('unavailable');
            } else {
                dayEl.classList.add('available');
                dayEl.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
                    dayEl.classList.add('selected');
                    bookingState.date = `${month + 1}/${i}/${year}`;
                    renderTimeSlots();
                    updateButtons();
                });
            }
            
            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            
            calendarDays.appendChild(dayEl);
        }

        document.getElementById('prevMonth').onclick = () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        };
        document.getElementById('nextMonth').onclick = () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        };
    };

    const renderTimeSlots = () => {
        const timeSlotsGrid = document.getElementById('timeSlotsGrid');
        timeSlotsGrid.innerHTML = '';
        const times = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"];
        times.forEach(time => {
            const btn = document.createElement('button');
            btn.classList.add('time-slot-btn');
            btn.textContent = time;
            
            if (Math.random() > 0.8) {
                btn.classList.add('booked');
                btn.disabled = true;
            } else {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot-btn.selected').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    bookingState.time = time;
                    updateButtons();
                });
            }
            
            if (Math.random() > 0.9) {
                const badge = document.createElement('span');
                badge.classList.add('time-slot-badge', 'popular');
                badge.textContent = 'Popular';
                btn.appendChild(badge);
            }
            
            timeSlotsGrid.appendChild(btn);
        });
    };

    // Initial Event Listeners
    bookSessionBtn?.addEventListener('click', openModal);
    closeBookingModal?.addEventListener('click', closeModal);
    bookingModalOverlay?.addEventListener('click', (e) => {
        if (e.target === bookingModalOverlay) closeModal();
    });
    nextBtn?.addEventListener('click', handleNext);
    backBtn?.addEventListener('click', handleBack);
});
