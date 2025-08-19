document.addEventListener('DOMContentLoaded', () => {
    const wizardOverlay = document.getElementById('course-wizard-overlay');
    if (!wizardOverlay) return;

    const form = document.getElementById('course-wizard-form');
    const steps = Array.from(form.querySelectorAll('.wizard-step'));
    const progressSteps = Array.from(document.querySelectorAll('.wizard-progress .progress-step'));
    const backBtn = document.getElementById('wizard-back-btn');
    const nextBtn = document.getElementById('wizard-next-btn');
    const draftBtn = document.getElementById('wizard-draft-btn');
    const publishBtn = document.getElementById('wizard-publish-btn');
    
    let currentStep = 0;
    const DRAFT_KEY = 'courseWizardDraft';

    const updateWizardState = () => {
        // Update step content visibility
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });

        // Update progress bar
        progressSteps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        // Update button visibility
        backBtn.style.display = currentStep > 0 ? 'inline-block' : 'none';
        nextBtn.style.display = currentStep < steps.length - 1 ? 'inline-block' : 'none';
        publishBtn.style.display = currentStep === steps.length - 1 ? 'inline-block' : 'none';
        draftBtn.style.display = currentStep < steps.length - 1 ? 'inline-block' : 'none';
    };

    const validateCurrentStep = () => {
        // Simple validation, can be expanded
        const activeStep = steps[currentStep];
        const inputs = Array.from(activeStep.querySelectorAll('input[required], select[required], textarea[required]'));
        let isValid = true;
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                // Add error indication
            }
        });
        return isValid;
    };

    nextBtn.addEventListener('click', () => {
        // if (validateCurrentStep()) {
            if (currentStep < steps.length - 1) {
                currentStep++;
                if (currentStep === steps.length - 1) {
                    updatePreview();
                }
                updateWizardState();
            }
        // }
    });

    backBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            updateWizardState();
        }
    });

    // --- Feature Implementations ---

    // 1. Save as Draft
    draftBtn.addEventListener('click', () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        alert('Draft saved!');
        wizardOverlay.style.display = 'none';
    });

    const loadDraft = () => {
        const draftData = localStorage.getItem(DRAFT_KEY);
        if (draftData) {
            if (confirm('You have a saved draft. Would you like to load it?')) {
                const data = JSON.parse(draftData);
                for (const key in data) {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'radio' || input.type === 'checkbox') {
                            input.checked = input.value === data[key];
                        } else {
                            input.value = data[key];
                        }
                    }
                }
            } else {
                localStorage.removeItem(DRAFT_KEY);
            }
        }
    };
    
    document.getElementById('create-course-btn').addEventListener('click', loadDraft);


    // 2. Session Type Toggle
    const sessionTypeRadios = form.querySelectorAll('input[name="sessionType"]');
    const groupOptions = document.getElementById('group-options');
    sessionTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            groupOptions.style.display = e.target.value === 'group' ? 'block' : 'none';
        });
    });

    // 3. AI Price Recommendation
    const getPriceBtn = document.getElementById('get-price-recommendation');
    const aiResultDiv = document.getElementById('ai-result');
    getPriceBtn.addEventListener('click', () => {
        getPriceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        getPriceBtn.disabled = true;

        setTimeout(() => {
            const subject = form.querySelector('#courseSubject').value;
            const duration = parseInt(form.querySelector('#courseDuration').value, 10);
            
            let basePrice = 1000; // Base for 60 mins
            if (subject === 'programming') basePrice = 1500;
            if (subject === 'science') basePrice = 1200;

            const recommendedPrice = Math.round((basePrice / 60) * duration);
            
            document.getElementById('ai-recommended-price').textContent = `₹${recommendedPrice}/session`;
            aiResultDiv.style.display = 'block';
            
            getPriceBtn.innerHTML = 'Analyze';
            getPriceBtn.disabled = false;

            // Also update the user's price field
            document.getElementById('coursePrice').value = recommendedPrice;

        }, 1500); // Simulate API call
    });

    // 4. Preview & Publish
    const updatePreview = () => {
        document.getElementById('preview-title').textContent = form.querySelector('#courseTitle').value || 'Course Title';
        document.getElementById('preview-subject').textContent = form.querySelector('#courseSubject option:checked').text || 'Subject';
        document.getElementById('preview-difficulty').textContent = form.querySelector('input[name="difficulty"]:checked').value || 'Difficulty';
        document.getElementById('preview-description').textContent = form.querySelector('#courseDescription').value || 'Description will appear here.';
        document.getElementById('preview-duration').textContent = form.querySelector('#courseDuration option:checked').text || '1 hour';
        document.getElementById('preview-price').textContent = form.querySelector('#coursePrice').value || '1000';
    };

    publishBtn.addEventListener('click', () => {
        alert('Course published successfully! (Simulation)');
        localStorage.removeItem(DRAFT_KEY);
        wizardOverlay.style.display = 'none';
        // Here you would typically send the data to a server
    });

    // Initialize
    updateWizardState();
});
