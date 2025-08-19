import { supabase } from './supabaseClient.js';

export function initAuth() {
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

    joinBtn.addEventListener('click', showModal);
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

    // --- Utility Functions ---
    const showFormError = (input, message) => {
        if (!input) return;
        const formGroup = input.parentElement.closest('.form-group');
        if (!formGroup) return;
        formGroup.classList.add('error');
        const errorEl = formGroup.querySelector('.error-message');
        if (errorEl) errorEl.textContent = message;
    };

    const clearFormError = (input) => {
        if (!input) return;
        const formGroup = input.parentElement.closest('.form-group');
        if (!formGroup) return;
        formGroup.classList.remove('error');
        const errorEl = formGroup.querySelector('.error-message');
        if (errorEl) errorEl.textContent = '';
    };

    // --- Login Logic ---
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const email = emailInput.value;
        const password = passwordInput.value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            showFormError(passwordInput, error.message);
        } else {
            console.log('Logged in successfully:', data.user);
            window.location.href = '/dashboard.html';
        }
    });

    // --- Google Login ---
    googleLoginBtn?.addEventListener('click', async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            alert('Error logging in with Google: ' + error.message);
        }
    });

    // --- Signup Logic ---
    const signupSteps = document.querySelectorAll('.signup-step');
    const signupNextBtn = document.getElementById('signup-next-btn');
    const signupBackBtn = document.getElementById('signup-back-btn');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupConfirmPasswordInput = document.getElementById('signup-confirm-password');
    let currentStep = 1;

    const goToStep = (step) => {
        signupSteps.forEach(s => s.classList.remove('active'));
        const nextStepEl = document.querySelector(`.signup-step[data-step="${step}"]`);
        nextStepEl?.classList.add('active');
        currentStep = step;
    };

    signupNextBtn?.addEventListener('click', () => {
        if (validateStep1()) {
            goToStep(2);
        }
    });

    signupBackBtn?.addEventListener('click', () => goToStep(1));

    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (currentStep !== 2) return;

        const email = document.getElementById('signup-email')?.value;
        const password = document.getElementById('signup-password')?.value;
        const fullName = document.getElementById('signup-name')?.value;
        const username = document.getElementById('signup-username')?.value;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    username: username,
                },
            },
        });

        if (error) {
            alert('Signup Error: ' + error.message);
        } else {
            console.log('Signup successful:', data.user);
            const successUsernameEl = document.getElementById('success-username');
            if (successUsernameEl) successUsernameEl.textContent = username;
            goToStep(3);
        }
    });

    // --- Password Strength Meter ---
    const strengthMeter = document.querySelector('.password-strength-meter');
    const strengthBar = strengthMeter?.querySelector('.strength-bar');
    const strengthText = strengthMeter?.querySelector('.strength-text');
    const criteria = {
        length: document.querySelector('[data-criterion="length"]'),
        capital: document.querySelector('[data-criterion="capital"]'),
        symbol: document.querySelector('[data-criterion="symbol"]'),
    };

    const checkPasswordStrength = () => {
        if (!signupPasswordInput || !strengthBar || !strengthText) return;
        const password = signupPasswordInput.value;
        let score = 0;
        
        const hasLength = password.length >= 8;
        const hasCapital = /[A-Z]/.test(password);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (hasLength) score++;
        if (hasCapital) score++;
        if (hasSymbol) score++;
        if (/[0-9]/.test(password)) score++;

        criteria.length?.classList.toggle('valid', hasLength);
        criteria.capital?.classList.toggle('valid', hasCapital);
        criteria.symbol?.classList.toggle('valid', hasSymbol);

        let color = '#e5e7eb'; // default
        let text = '';
        switch (score) {
            case 1: color = '#f87171'; text = 'Weak'; break;
            case 2: color = '#fbbf24'; text = 'Medium'; break;
            case 3:
            case 4: color = '#4ade80'; text = 'Strong'; break;
        }
        strengthBar.style.width = `${(score / 4) * 100}%`;
        strengthBar.style.backgroundColor = color;
        strengthText.textContent = text;
    };

    signupPasswordInput?.addEventListener('input', checkPasswordStrength);

    // --- Step 1 Validation ---
    const validateStep1 = () => {
        let isValid = true;
        const name = document.getElementById('signup-name');
        const email = document.getElementById('signup-email');
        const password = signupPasswordInput;
        const confirmPassword = signupConfirmPasswordInput;
        const terms = document.getElementById('signup-terms');

        if (!name || !email || !password || !confirmPassword || !terms) return false;

        clearFormError(name);
        if (name.value.trim().length < 2) {
            showFormError(name, 'Please enter your full name.');
            isValid = false;
        }

        clearFormError(email);
        if (!/^\S+@\S+\.\S+$/.test(email.value)) {
            showFormError(email, 'Please enter a valid email address.');
            isValid = false;
        }

        clearFormError(password);
        const passwordValid = 
            password.value.length >= 8 &&
            /[A-Z]/.test(password.value) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(password.value);
        if (!passwordValid) {
            showFormError(password, 'Password does not meet the criteria.');
            isValid = false;
        }

        clearFormError(confirmPassword);
        if (password.value !== confirmPassword.value) {
            showFormError(confirmPassword, 'Passwords do not match.');
            isValid = false;
        }

        if (!terms.checked) {
            alert('You must agree to the Terms & Conditions.');
            isValid = false;
        }

        return isValid;
    };
}
