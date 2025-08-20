// Main JavaScript for UAE Visa Services

// Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    ANIMATION_DURATION: 300,
    SCROLL_OFFSET: 80,
    MESSAGE_TIMEOUT: 5000
};

// DOM Elements
const elements = {
    loadingSpinner: document.getElementById('loading-spinner'),
    navToggle: document.getElementById('nav-toggle'),
    navMenu: document.getElementById('nav-menu'),
    backToTop: document.getElementById('back-to-top'),
    messageContainer: document.getElementById('message-container'),
    contactForm: document.getElementById('contact-form')
};

// Utility Functions
const utils = {
    // Show loading spinner
    showLoading() {
        if (elements.loadingSpinner) {
            elements.loadingSpinner.classList.remove('hidden');
        }
    },

    // Hide loading spinner
    hideLoading() {
        if (elements.loadingSpinner) {
            elements.loadingSpinner.classList.add('hidden');
        }
    },

    // Show message
    showMessage(message, type = 'info') {
        if (!elements.messageContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.innerHTML = `
            <span>${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        elements.messageContainer.appendChild(messageElement);

        // Auto remove after timeout
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, CONFIG.MESSAGE_TIMEOUT);
    },

    // Smooth scroll to element
    scrollTo(target) {
        const element = document.querySelector(target);
        if (element) {
            const offsetTop = element.offsetTop - CONFIG.SCROLL_OFFSET;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Format phone number
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    },

    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate phone
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    },

    // Get URL parameters
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    // Set URL parameter
    setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    },

    // API request helper
    async apiRequest(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
};

// Navigation Handler
const navigation = {
    init() {
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupActiveLinks();
        this.setupHeaderScroll();
    },

    setupMobileMenu() {
        if (elements.navToggle && elements.navMenu) {
            elements.navToggle.addEventListener('click', () => {
                elements.navToggle.classList.toggle('active');
                elements.navMenu.classList.toggle('active');
                document.body.classList.toggle('nav-open');
            });

            // Close menu when clicking on links
            const navLinks = elements.navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    elements.navToggle.classList.remove('active');
                    elements.navMenu.classList.remove('active');
                    document.body.classList.remove('nav-open');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!elements.navMenu.contains(e.target) && !elements.navToggle.contains(e.target)) {
                    elements.navToggle.classList.remove('active');
                    elements.navMenu.classList.remove('active');
                    document.body.classList.remove('nav-open');
                }
            });
        }
    },

    setupSmoothScrolling() {
        // Handle anchor links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const target = link.getAttribute('href');
                if (target && target !== '#') {
                    utils.scrollTo(target);
                }
            }
        });
    },

    setupActiveLinks() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

        if (sections.length === 0 || navLinks.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            },
            {
                threshold: 0.3,
                rootMargin: '-80px 0px -80px 0px'
            }
        );

        sections.forEach(section => observer.observe(section));
    },

    setupHeaderScroll() {
        const header = document.querySelector('.header');
        if (!header) return;

        const handleScroll = utils.throttle(() => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, 100);

        window.addEventListener('scroll', handleScroll);
    }
};

// Back to Top Button
const backToTop = {
    init() {
        if (!elements.backToTop) return;

        const handleScroll = utils.throttle(() => {
            if (window.scrollY > 300) {
                elements.backToTop.classList.add('visible');
            } else {
                elements.backToTop.classList.remove('visible');
            }
        }, 100);

        window.addEventListener('scroll', handleScroll);

        elements.backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
};

// Form Validation
const formValidation = {
    // Validate single field
    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        const formGroup = field.closest('.form-group');
        let isValid = true;
        let message = '';

        // Remove previous validation classes
        formGroup.classList.remove('error', 'success');
        const existingMessage = formGroup.querySelector('.error-message, .success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Check if required field is empty
        if (required && !value) {
            isValid = false;
            message = 'This field is required';
        }
        // Validate email
        else if (type === 'email' && value && !utils.isValidEmail(value)) {
            isValid = false;
            message = 'Please enter a valid email address';
        }
        // Validate phone
        else if (type === 'tel' && value && !utils.isValidPhone(value)) {
            isValid = false;
            message = 'Please enter a valid phone number';
        }
        // Validate text length
        else if (field.hasAttribute('minlength')) {
            const minLength = parseInt(field.getAttribute('minlength'));
            if (value.length < minLength) {
                isValid = false;
                message = `Minimum ${minLength} characters required`;
            }
        }

        // Apply validation styling
        if (!isValid) {
            formGroup.classList.add('error');
            const errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            formGroup.appendChild(errorElement);
        } else if (value) {
            formGroup.classList.add('success');
        }

        return isValid;
    },

    // Validate entire form
    validateForm(form) {
        const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    },

    // Setup real-time validation
    setupRealTimeValidation(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            // Validate on blur
            field.addEventListener('blur', () => {
                this.validateField(field);
            });

            // Clear validation on focus
            field.addEventListener('focus', () => {
                const formGroup = field.closest('.form-group');
                formGroup.classList.remove('error', 'success');
                const message = formGroup.querySelector('.error-message, .success-message');
                if (message) {
                    message.remove();
                }
            });

            // Format phone number on input
            if (field.type === 'tel') {
                field.addEventListener('input', (e) => {
                    e.target.value = utils.formatPhoneNumber(e.target.value);
                });
            }
        });
    }
};

// Contact Form Handler
const contactForm = {
    init() {
        if (!elements.contactForm) return;

        formValidation.setupRealTimeValidation(elements.contactForm);
        
        elements.contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(e.target);
        });
    },

    async handleSubmit(form) {
        // Validate form
        if (!formValidation.validateForm(form)) {
            utils.showMessage('Please fix the errors in the form', 'error');
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        try {
            // Submit to API
            const response = await utils.apiRequest('/contact', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            // Show success message
            utils.showMessage('Thank you for your message! We will get back to you soon.', 'success');
            
            // Reset form
            form.reset();
            
            // Remove validation classes
            const formGroups = form.querySelectorAll('.form-group');
            formGroups.forEach(group => {
                group.classList.remove('error', 'success');
                const message = group.querySelector('.error-message, .success-message');
                if (message) message.remove();
            });

        } catch (error) {
            console.error('Contact form error:', error);
            utils.showMessage('Sorry, there was an error sending your message. Please try again.', 'error');
        } finally {
            // Reset button state
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }
};

// Animations
const animations = {
    init() {
        this.setupScrollAnimations();
        this.setupCounterAnimations();
    },

    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.service-card, .step, .feature, .contact-item');
        
        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    },

    setupCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number');
        
        if (counters.length === 0) return;

        const animateCounter = (counter) => {
            const target = parseInt(counter.textContent.replace(/\D/g, ''));
            const suffix = counter.textContent.replace(/\d/g, '');
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target + suffix;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + suffix;
                }
            }, 40);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach(counter => observer.observe(counter));
    }
};

// Performance Optimization
const performance = {
    init() {
        this.lazyLoadImages();
        this.preloadCriticalResources();
    },

    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        if (images.length === 0) return;

        const imageObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            },
            { rootMargin: '50px' }
        );

        images.forEach(img => imageObserver.observe(img));
    },

    preloadCriticalResources() {
        // Preload critical pages
        const criticalPages = [
            './pages/visa-application.html',
            './pages/status-check.html'
        ];

        criticalPages.forEach(page => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = page;
            document.head.appendChild(link);
        });
    }
};

// Error Handling
const errorHandler = {
    init() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.logError(e.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.logError(e.reason);
        });
    },

    logError(error) {
        // In production, you might want to send errors to a logging service
        const errorData = {
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // For now, just log to console
        console.error('Error logged:', errorData);
    }
};

// Initialize Application
const app = {
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    },

    start() {
        try {
            // Initialize all modules
            navigation.init();
            backToTop.init();
            contactForm.init();
            animations.init();
            performance.init();
            errorHandler.init();

            // Hide loading spinner
            setTimeout(() => {
                utils.hideLoading();
            }, 500);

            console.log('UAE Visa Services app initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            utils.hideLoading();
        }
    }
};

// Start the application
app.init();

// Export for use in other scripts
window.UaeVisaApp = {
    utils,
    navigation,
    formValidation,
    animations,
    CONFIG
};