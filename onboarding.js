// Mentor Onboarding Flow JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Lottie Animations
    lottie.loadAnimation({
        container: document.getElementById('lottie-welcome'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://assets10.lottiefiles.com/packages/lf20_i8mmfrht.json'
    });

    const successAnimation = lottie.loadAnimation({
        container: document.getElementById('lottie-success'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: 'https://assets2.lottiefiles.com/packages/lf20_xwmj0hsk.json'
    });

    // DOM Elements
    const form = document.getElementById('onboarding-form');
    const startAppBtn = document.getElementById('start-app-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const formStepsContainer = document.getElementById('form-steps');
    const successScreen = document.getElementById('success-screen');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progress-text');
    const bioTextarea = document.getElementById('bio');
    const charCount = document.getElementById('char-count');
    const teachingExperienceRadios = document.querySelectorAll('input[name="teachingExperience"]');
    const teachingDetailsContainer = document.getElementById('teachingDetails');
    const fileInputs = document.querySelectorAll('.file-input');

    const steps = Array.from(document.querySelectorAll('.onboarding-step[id^="step-"]'));
    const totalSteps = steps.length;
    let currentStep = 0;

    // --- VALIDATION LOGIC ---
    const validationRules = {
        0: [ // Step 1
            { input: 'fullName', type: 'text', min: 2 },
            { input: 'email', type: 'email' },
            { input: 'phone', type: 'phone' },
            { input: 'dob', type: 'date' },
            { input: 'city', type: 'text', min: 2 },
        ],
        1: [ // Step 2
            { input: 'educationLevel', type: 'select' },
            { input: 'institution', type: 'text', min: 3 },
            { input: 'gradYear', type: 'year' },
            { input: 'fieldOfStudy', type: 'text', min: 2 },
        ],
        2: [ // Step 3
            { input: 'subjects', type: 'checkbox', min: 3, max: 10 }
        ],
        3: [ // Step 4
            { input: 'idFront', type: 'file' },
            { input: 'idBack', type: 'file' },
            { input: 'eduCert', type: 'file' },
        ],
        4: [ // Step 5
            { input: 'demoVideo', type: 'file' }
        ],
        5: [ // Step 6
            { input: 'ndaAgree', type: 'nda' },
            { input: 'digitalSignature', type: 'signature' }
        ],
        6: [] // Step 7 - Review
    };

    const validateStep = (stepIndex) => {
        let isValid = true;
        const rules = validationRules[stepIndex];
        if (!rules) return true;

        rules.forEach(rule => {
            const inputElement = form.querySelector(`[name="${rule.input}"]`);
            if (!inputElement) {
                console.warn(`Validation input not found: ${rule.input}`);
                return;
            }
            
            // The root cause of the error is that the 'subjects' checkboxes are not
            // wrapped in a `.form-group`. This selector finds the closest container,
            // whether it's a `.form-group` or the `.subject-tree` as a fallback.
            const group = inputElement.closest('.form-group, .subject-tree');

            if (!group) {
                console.error(`Could not find a validation container for input "${rule.input}".`);
                return;
            }

            let isFieldValid = false;

            // Clear previous errors
            group.classList.remove('error');
            const errorMsg = group.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();

            switch (rule.type) {
                case 'text':
                    isFieldValid = inputElement.value.length >= rule.min;
                    break;
                case 'email':
                    isFieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputElement.value);
                    break;
                case 'phone':
                    isFieldValid = /^\d{10}$/.test(inputElement.value);
                    break;
                case 'date':
                    isFieldValid = inputElement.value !== '';
                    break;
                case 'select':
                    isFieldValid = inputElement.value !== '';
                    break;
                case 'year':
                    const year = parseInt(inputElement.value, 10);
                    isFieldValid = !isNaN(year) && year > 1950 && year <= new Date().getFullYear();
                    break;
                case 'checkbox':
                    const checked = form.querySelectorAll(`[name="${rule.input}"]:checked`).length;
                    isFieldValid = checked >= rule.min && checked <= rule.max;
                    break;
                case 'file':
                    isFieldValid = inputElement.files.length > 0;
                    break;
                case 'nda':
                    isFieldValid = form.querySelector('#ndaAgree').checked;
                    break;
                case 'signature':
                    const fullName = form.querySelector('#fullName').value;
                    isFieldValid = inputElement.value.trim() === fullName.trim() && fullName.trim() !== '';
                    break;
            }

            if (!isFieldValid) {
                isValid = false;
                group.classList.add('error');
                const msg = document.createElement('small');
                msg.className = 'error-message';
                msg.textContent = getErrorMessage(rule);
                group.appendChild(msg);
            }
        });

        return isValid;
    };

    const getErrorMessage = (rule) => {
        switch (rule.type) {
            case 'text': return `Please enter at least ${rule.min} characters.`;
            case 'email': return 'Please enter a valid email address.';
            case 'phone': return 'Please enter a 10-digit phone number.';
            case 'date': case 'select': return 'This field is required.';
            case 'year': return 'Please enter a valid year.';
            case 'checkbox': return `Please select between ${rule.min} and ${rule.max} subjects.`;
            case 'file': return 'Please upload the required file.';
            case 'nda': return 'You must agree to the NDA.';
            case 'signature': return 'Signature must match your full name from Step 1.';
            default: return 'Invalid input.';
        }
    };

    // --- EVENT LISTENERS ---
    startAppBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        formStepsContainer.style.display = 'block';
        updateStepVisibility();
        updateProgressBar();
    });

    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps - 1) {
                currentStep++;
                if (currentStep === totalSteps - 1) { // If it's the review step
                    populateSummary();
                }
                updateStepVisibility();
                updateProgressBar();
            }
        }
    });

    backBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            updateStepVisibility();
            updateProgressBar();
        }
    });
    
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Final validation on the review step is implicitly handled by validating the last step before this.
        // A final check could be added here if needed, but the flow prevents submission otherwise.
        formStepsContainer.style.display = 'none';
        successScreen.style.display = 'block';
        successAnimation.play();
    });

    bioTextarea.addEventListener('input', () => {
        charCount.textContent = `${bioTextarea.value.length}/500 characters`;
    });

    teachingExperienceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            teachingDetailsContainer.style.display = e.target.value === 'yes' ? 'block' : 'none';
        });
    });

    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
            const feedbackEl = document.getElementById(`${e.target.id}-name`);
            if (feedbackEl) {
                feedbackEl.textContent = fileName;
                feedbackEl.style.color = e.target.files[0] ? '#10b981' : '#64748b';
            }
        });
    });

    // --- FUNCTIONS ---
    function updateStepVisibility() {
        steps.forEach((step, index) => {
            step.style.display = index === currentStep ? 'block' : 'none';
        });
        backBtn.style.display = currentStep > 0 ? 'inline-block' : 'none';
        nextBtn.style.display = currentStep < totalSteps - 1 ? 'inline-block' : 'none';
        submitBtn.style.display = currentStep === totalSteps - 1 ? 'inline-block' : 'none';
    }

    function updateProgressBar() {
        const progress = ((currentStep + 1) / totalSteps) * 100;
        progressBarFill.style.width = `${progress}%`;
        progressText.textContent = `Step ${currentStep + 1} of ${totalSteps}`;
    }

    function populateSummary() {
        const summaryContainer = document.getElementById('review-summary');
        const formData = new FormData(form);
        let html = '<ul>';

        const fieldLabels = {
            fullName: 'Full Name', email: 'Email', phone: 'Phone', dob: 'Date of Birth',
            gender: 'Gender', city: 'City', bio: 'Bio', educationLevel: 'Education',
            institution: 'Institution', gradYear: 'Graduation Year', fieldOfStudy: 'Field of Study',
            profession: 'Profession', experience: 'Experience', teachingExperience: 'Taught Before?',
            digitalSignature: 'Signature'
        };

        for (let [key, value] of formData.entries()) {
            if (key.startsWith('subjects')) continue; // Handle subjects separately
            if (value instanceof File || !value) continue; // Skip files and empty fields
            if (fieldLabels[key]) {
                html += `<li><strong>${fieldLabels[key]}:</strong> ${value}</li>`;
            }
        }

        const subjects = Array.from(formData.getAll('subjects')).join(', ');
        if (subjects) {
            html += `<li><strong>Subjects:</strong> ${subjects}</li>`;
        }

        html += '</ul><h4>Uploaded Documents:</h4><ul>';
        fileInputs.forEach(input => {
            if (input.files.length > 0) {
                html += `<li><strong>${input.closest('.form-group').querySelector('label').textContent}:</strong> ${input.files[0].name} <i class="fas fa-check-circle" style="color: #10b981;"></i></li>`;
            }
        });
        html += '</ul>';

        summaryContainer.innerHTML = html;
    }
});
