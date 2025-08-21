// Forms JavaScript for UAE Visa Services

// Form Handler Class
class FormHandler {
    constructor(formSelector, apiEndpoint, options = {}) {
        this.form = document.querySelector(formSelector);
        this.apiEndpoint = apiEndpoint;
        this.options = {
            showSuccessMessage: true,
            resetOnSuccess: true,
            redirectOnSuccess: null,
            customValidation: null,
            beforeSubmit: null,
            afterSubmit: null,
            ...options
        };
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.setupEventListeners();
        this.setupFileUpload();
        this.setupDependentFields();
        
        // Setup real-time validation if available
        if (window.UaeVisaApp && window.UaeVisaApp.formValidation) {
            window.UaeVisaApp.formValidation.setupRealTimeValidation(this.form);
        }
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Setup field-specific listeners
        const fields = this.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.addEventListener('change', (e) => this.handleFieldChange(e));
            field.addEventListener('input', (e) => this.handleFieldInput(e));
        });
    }

    setupFileUpload() {
        const fileInputs = this.form.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            const wrapper = input.closest('.file-upload-wrapper');
            if (!wrapper) return;

            const dropZone = wrapper.querySelector('.file-drop-zone');
            const fileList = wrapper.querySelector('.file-list');
            const maxSize = parseInt(input.dataset.maxSize) || 5242880; // 5MB default
            const allowedTypes = input.dataset.allowedTypes ? input.dataset.allowedTypes.split(',') : [];

            // File input change
            input.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files, input, fileList, maxSize, allowedTypes);
            });

            // Drag and drop
            if (dropZone) {
                dropZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropZone.classList.add('drag-over');
                });

                dropZone.addEventListener('dragleave', () => {
                    dropZone.classList.remove('drag-over');
                });

                dropZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('drag-over');
                    this.handleFileSelection(e.dataTransfer.files, input, fileList, maxSize, allowedTypes);
                });

                dropZone.addEventListener('click', () => {
                    input.click();
                });
            }
        });
    }

    setupDependentFields() {
        // Visa type dependent fields
        const visaTypeSelect = this.form.querySelector('select[name="visaType"]');
        if (visaTypeSelect) {
            visaTypeSelect.addEventListener('change', (e) => {
                this.handleVisaTypeChange(e.target.value);
            });
            // Trigger on page load
            this.handleVisaTypeChange(visaTypeSelect.value);
        }

        // Country dependent fields
        const countrySelect = this.form.querySelector('select[name="nationality"]');
        if (countrySelect) {
            countrySelect.addEventListener('change', (e) => {
                this.handleCountryChange(e.target.value);
            });
        }
    }

    handleFileSelection(files, input, fileList, maxSize, allowedTypes) {
        const validFiles = [];
        const errors = [];

        Array.from(files).forEach(file => {
            // Check file size
            if (file.size > maxSize) {
                errors.push(`${file.name}: File size exceeds ${this.formatFileSize(maxSize)}`);
                return;
            }

            // Check file type
            if (allowedTypes.length > 0) {
                const fileExtension = file.name.split('.').pop().toLowerCase();
                const mimeType = file.type.toLowerCase();
                
                const isValidType = allowedTypes.some(type => {
                    return type.startsWith('.') ? 
                        fileExtension === type.substring(1) : 
                        mimeType.startsWith(type);
                });

                if (!isValidType) {
                    errors.push(`${file.name}: Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
                    return;
                }
            }

            validFiles.push(file);
        });

        // Show errors
        if (errors.length > 0) {
            this.showFieldError(input, errors.join('\n'));
        } else {
            this.clearFieldError(input);
        }

        // Update file list display
        if (fileList && validFiles.length > 0) {
            this.updateFileList(fileList, validFiles);
        }

        // Update input files (for single file inputs)
        if (input.multiple === false && validFiles.length > 0) {
            const dt = new DataTransfer();
            dt.items.add(validFiles[0]);
            input.files = dt.files;
        }
    }

    updateFileList(fileList, files) {
        fileList.innerHTML = '';
        
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                </div>
                <button type="button" class="file-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);
        });

        // Add remove functionality
        fileList.addEventListener('click', (e) => {
            if (e.target.closest('.file-remove')) {
                const index = parseInt(e.target.closest('.file-remove').dataset.index);
                e.target.closest('.file-item').remove();
                // Note: Removing from actual FileList is complex, handled in form submission
            }
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleVisaTypeChange(visaType) {
        const dependentFields = {
            'business': ['.business-fields', '.sponsor-fields'],
            'tourist': ['.tourist-fields'],
            'transit': ['.transit-fields'],
            'family': ['.family-fields', '.sponsor-fields']
        };

        // Hide all dependent fields
        Object.values(dependentFields).flat().forEach(selector => {
            const elements = this.form.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = 'none';
                // Remove required attribute from hidden fields
                const inputs = el.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.dataset.wasRequired = input.hasAttribute('required');
                    input.removeAttribute('required');
                });
            });
        });

        // Show relevant fields
        if (dependentFields[visaType]) {
            dependentFields[visaType].forEach(selector => {
                const elements = this.form.querySelectorAll(selector);
                elements.forEach(el => {
                    el.style.display = 'block';
                    // Restore required attribute
                    const inputs = el.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (input.dataset.wasRequired === 'true') {
                            input.setAttribute('required', '');
                        }
                    });
                });
            });
        }
    }

    handleCountryChange(country) {
        // Handle country-specific requirements
        const visaFeeElement = this.form.querySelector('.visa-fee');
        const processingTimeElement = this.form.querySelector('.processing-time');
        
        // This would typically fetch from an API
        const countryInfo = this.getCountryVisaInfo(country);
        
        if (visaFeeElement && countryInfo.fee) {
            visaFeeElement.textContent = `Visa Fee: ${countryInfo.fee}`;
        }
        
        if (processingTimeElement && countryInfo.processingTime) {
            processingTimeElement.textContent = `Processing Time: ${countryInfo.processingTime}`;
        }
    }

    getCountryVisaInfo(country) {
        // Mock data - in real app, this would come from API
        const countryData = {
            'US': { fee: '$100', processingTime: '3-5 days' },
            'UK': { fee: '$85', processingTime: '2-4 days' },
            'IN': { fee: '$60', processingTime: '1-3 days' },
            'default': { fee: '$75', processingTime: '2-5 days' }
        };
        
        return countryData[country] || countryData.default;
    }

    handleFieldChange(e) {
        const field = e.target;
        
        // Custom field handling
        if (field.name === 'dateOfBirth') {
            this.calculateAge(field.value);
        }
        
        if (field.name === 'passportExpiry') {
            this.validatePassportExpiry(field.value);
        }
    }

    handleFieldInput(e) {
        const field = e.target;
        
        // Real-time formatting
        if (field.name === 'phone') {
            field.value = this.formatPhoneNumber(field.value);
        }
        
        if (field.name === 'passportNumber') {
            field.value = field.value.toUpperCase();
        }
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return;
        
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        const ageDisplay = this.form.querySelector('.age-display');
        if (ageDisplay) {
            ageDisplay.textContent = `Age: ${age} years`;
        }
        
        // Validate minimum age
        if (age < 18) {
            this.showFieldError(
                this.form.querySelector('input[name="dateOfBirth"]'),
                'Applicant must be at least 18 years old'
            );
        }
    }

    validatePassportExpiry(expiryDate) {
        if (!expiryDate) return;
        
        const expiry = new Date(expiryDate);
        const today = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(today.getMonth() + 6);
        
        const passportField = this.form.querySelector('input[name="passportExpiry"]');
        
        if (expiry <= today) {
            this.showFieldError(passportField, 'Passport has expired');
        } else if (expiry <= sixMonthsFromNow) {
            this.showFieldError(passportField, 'Passport should be valid for at least 6 months');
        } else {
            this.clearFieldError(passportField);
        }
    }

    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }

    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('error');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.remove('error');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Run before submit hook
        if (this.options.beforeSubmit) {
            const shouldContinue = await this.options.beforeSubmit(this.form);
            if (!shouldContinue) return;
        }

        // Validate form
        if (!this.validateForm()) {
            this.showMessage('Please fix the errors in the form', 'error');
            return;
        }

        // Custom validation
        if (this.options.customValidation) {
            const customValidationResult = await this.options.customValidation(this.form);
            if (!customValidationResult.isValid) {
                this.showMessage(customValidationResult.message, 'error');
                return;
            }
        }

        // Prepare form data
        const formData = this.prepareFormData();
        
        // Show loading state
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        try {
            // Submit to API
            const response = await this.submitToAPI(formData);
            
            // Handle success
            await this.handleSuccess(response);
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.handleError(error);
        } finally {
            // Reset button state
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            
            // Run after submit hook
            if (this.options.afterSubmit) {
                this.options.afterSubmit(this.form);
            }
        }
    }

    validateForm() {
        if (window.UaeVisaApp && window.UaeVisaApp.formValidation) {
            return window.UaeVisaApp.formValidation.validateForm(this.form);
        }
        
        // Basic validation fallback
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });
        
        return isValid;
    }

    prepareFormData() {
        const formData = new FormData(this.form);
        
        // Handle file uploads
        const fileInputs = this.form.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            if (input.files.length > 0) {
                Array.from(input.files).forEach(file => {
                    formData.append(input.name, file);
                });
            }
        });
        
        return formData;
    }

    async submitToAPI(formData) {
        const response = await fetch(`${window.UaeVisaApp.CONFIG.API_BASE_URL}${this.apiEndpoint}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Submission failed');
        }

        return await response.json();
    }

    async handleSuccess(response) {
        if (this.options.showSuccessMessage) {
            this.showMessage(
                response.message || 'Form submitted successfully!',
                'success'
            );
        }
        
        if (this.options.resetOnSuccess) {
            this.resetForm();
        }
        
        if (this.options.redirectOnSuccess) {
            setTimeout(() => {
                window.location.href = this.options.redirectOnSuccess;
            }, 2000);
        }
        
        // Store application ID for tracking
        if (response.applicationId) {
            localStorage.setItem('lastApplicationId', response.applicationId);
        }
    }

    handleError(error) {
        this.showMessage(
            error.message || 'An error occurred. Please try again.',
            'error'
        );
    }

    resetForm() {
        this.form.reset();
        
        // Clear validation states
        const formGroups = this.form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error', 'success');
            const message = group.querySelector('.error-message, .success-message');
            if (message) message.remove();
        });
        
        // Clear file lists
        const fileLists = this.form.querySelectorAll('.file-list');
        fileLists.forEach(list => list.innerHTML = '');
    }

    showMessage(message, type) {
        if (window.UaeVisaApp && window.UaeVisaApp.utils) {
            window.UaeVisaApp.utils.showMessage(message, type);
        } else {
            alert(message); // Fallback
        }
    }
}

// Newsletter Subscription Handler
class NewsletterHandler {
    constructor() {
        this.forms = document.querySelectorAll('.newsletter-form');
        this.init();
    }

    init() {
        this.forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        
        if (!this.isValidEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Subscribing...';
        submitButton.disabled = true;

        try {
            const response = await fetch(`${window.UaeVisaApp.CONFIG.API_BASE_URL}/newsletter/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Successfully subscribed to newsletter!', 'success');
                form.reset();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showMessage(error.message || 'Subscription failed. Please try again.', 'error');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    showMessage(message, type) {
        if (window.UaeVisaApp && window.UaeVisaApp.utils) {
            window.UaeVisaApp.utils.showMessage(message, type);
        }
    }
}

// Initialize form handlers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize newsletter handler
    new NewsletterHandler();
    
    // Initialize specific form handlers based on page
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('visa-application')) {
        new FormHandler('#visa-application-form', '/visa/application', {
            redirectOnSuccess: './status-check.html',
            customValidation: async (form) => {
                // Add custom visa application validation
                const passportExpiry = form.querySelector('input[name="passportExpiry"]').value;
                if (passportExpiry) {
                    const expiry = new Date(passportExpiry);
                    const sixMonthsFromNow = new Date();
                    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
                    
                    if (expiry <= sixMonthsFromNow) {
                        return {
                            isValid: false,
                            message: 'Passport must be valid for at least 6 months from travel date'
                        };
                    }
                }
                return { isValid: true };
            }
        });
    }
    
    if (currentPage.includes('feedback')) {
        new FormHandler('#feedback-form', '/feedback', {
            showSuccessMessage: true,
            resetOnSuccess: true
        });
    }
});

// Export for global use
window.FormHandler = FormHandler;
window.NewsletterHandler = NewsletterHandler;