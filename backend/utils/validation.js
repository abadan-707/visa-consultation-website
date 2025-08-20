const { body, param, query, validationResult } = require('express-validator');
const moment = require('moment');

// Common validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[1-9]\d{1,14}$/,
  passport: /^[A-Z0-9]{6,20}$/,
  applicationId: /^UAE-\d+-[A-Z0-9]+$/,
  contactId: /^CONTACT-\d+-[A-Z0-9]+$/,
  feedbackId: /^FB-\d+-[A-Z0-9]+$/,
  subscriptionId: /^NL-\d+-[A-Z0-9]+$/,
  name: /^[a-zA-Z\s'-]{2,100}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Validation helper functions
const validators = {
  // Email validation
  email: (field = 'email', options = {}) => {
    return body(field)
      .isEmail()
      .normalizeEmail()
      .withMessage(options.message || 'Please provide a valid email address')
      .isLength({ max: options.maxLength || 255 })
      .withMessage(`Email cannot exceed ${options.maxLength || 255} characters`);
  },

  // Name validation
  name: (field = 'name', options = {}) => {
    const minLength = options.minLength || 2;
    const maxLength = options.maxLength || 100;
    
    return body(field)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
      .matches(patterns.name)
      .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`);
  },

  // Phone validation
  phone: (field = 'phone', options = {}) => {
    let validator = body(field);
    
    if (options.optional) {
      validator = validator.optional();
    }
    
    return validator
      .trim()
      .matches(patterns.phone)
      .withMessage(options.message || 'Please provide a valid phone number');
  },

  // Passport number validation
  passport: (field = 'passport_number', options = {}) => {
    return body(field)
      .trim()
      .isLength({ min: 6, max: 20 })
      .withMessage('Passport number must be between 6 and 20 characters')
      .matches(patterns.passport)
      .withMessage('Passport number can only contain uppercase letters and numbers')
      .toUpperCase();
  },

  // Date validation
  date: (field, options = {}) => {
    let validator = body(field)
      .isISO8601()
      .withMessage(`Please provide a valid ${field.replace('_', ' ')}`);
    
    if (options.futureOnly) {
      validator = validator.custom((value) => {
        if (moment(value).isBefore(moment(), 'day')) {
          throw new Error(`${field.replace('_', ' ')} cannot be in the past`);
        }
        return true;
      });
    }
    
    if (options.pastOnly) {
      validator = validator.custom((value) => {
        if (moment(value).isAfter(moment(), 'day')) {
          throw new Error(`${field.replace('_', ' ')} cannot be in the future`);
        }
        return true;
      });
    }
    
    if (options.minDate) {
      validator = validator.custom((value) => {
        if (moment(value).isBefore(moment(options.minDate), 'day')) {
          throw new Error(`${field.replace('_', ' ')} cannot be before ${moment(options.minDate).format('YYYY-MM-DD')}`);
        }
        return true;
      });
    }
    
    if (options.maxDate) {
      validator = validator.custom((value) => {
        if (moment(value).isAfter(moment(options.maxDate), 'day')) {
          throw new Error(`${field.replace('_', ' ')} cannot be after ${moment(options.maxDate).format('YYYY-MM-DD')}`);
        }
        return true;
      });
    }
    
    return validator;
  },

  // Text field validation
  text: (field, options = {}) => {
    const minLength = options.minLength || 1;
    const maxLength = options.maxLength || 1000;
    
    let validator = body(field);
    
    if (options.optional) {
      validator = validator.optional();
    }
    
    return validator
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field.replace('_', ' ')} must be between ${minLength} and ${maxLength} characters`);
  },

  // Number validation
  number: (field, options = {}) => {
    const min = options.min || 0;
    const max = options.max || Number.MAX_SAFE_INTEGER;
    
    let validator = body(field);
    
    if (options.optional) {
      validator = validator.optional();
    }
    
    return validator
      .isInt({ min, max })
      .withMessage(`${field.replace('_', ' ')} must be a number between ${min} and ${max}`);
  },

  // Enum validation
  enum: (field, values, options = {}) => {
    let validator = body(field);
    
    if (options.optional) {
      validator = validator.optional();
    }
    
    return validator
      .isIn(values)
      .withMessage(options.message || `${field.replace('_', ' ')} must be one of: ${values.join(', ')}`);
  },

  // Array validation
  array: (field, options = {}) => {
    let validator = body(field);
    
    if (options.optional) {
      validator = validator.optional();
    }
    
    validator = validator
      .isArray()
      .withMessage(`${field.replace('_', ' ')} must be an array`);
    
    if (options.minLength !== undefined) {
      validator = validator.isLength({ min: options.minLength })
        .withMessage(`${field.replace('_', ' ')} must contain at least ${options.minLength} items`);
    }
    
    if (options.maxLength !== undefined) {
      validator = validator.isLength({ max: options.maxLength })
        .withMessage(`${field.replace('_', ' ')} cannot contain more than ${options.maxLength} items`);
    }
    
    return validator;
  },

  // URL validation
  url: (field, options = {}) => {
    let validator = body(field);
    
    if (options.optional) {
      validator = validator.optional();
    }
    
    return validator
      .isURL(options.urlOptions || {})
      .withMessage(options.message || `Please provide a valid URL for ${field.replace('_', ' ')}`);
  },

  // Application ID validation
  applicationId: (field = 'application_id', options = {}) => {
    let validator = param(field);
    
    if (options.body) {
      validator = body(field);
    }
    
    if (options.optional) {
      validator = validator.optional();
    }
    
    return validator
      .matches(patterns.applicationId)
      .withMessage('Please provide a valid application ID');
  },

  // Contact ID validation
  contactId: (field = 'contact_id', options = {}) => {
    let validator = param(field);
    
    if (options.body) {
      validator = body(field);
    }
    
    return validator
      .matches(patterns.contactId)
      .withMessage('Please provide a valid contact ID');
  },

  // Feedback ID validation
  feedbackId: (field = 'feedback_id', options = {}) => {
    let validator = param(field);
    
    if (options.body) {
      validator = body(field);
    }
    
    return validator
      .matches(patterns.feedbackId)
      .withMessage('Please provide a valid feedback ID');
  },

  // Pagination validation
  pagination: () => {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt()
    ];
  },

  // Sorting validation
  sorting: (allowedFields = []) => {
    return [
      query('sort_by')
        .optional()
        .isIn(allowedFields)
        .withMessage(`Sort field must be one of: ${allowedFields.join(', ')}`),
      query('sort_order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either asc or desc')
        .toLowerCase()
    ];
  }
};

// Custom validation functions
const customValidators = {
  // Check if departure date is after arrival date
  departureDateAfterArrival: (departureField = 'departure_date', arrivalField = 'arrival_date') => {
    return body(departureField).custom((value, { req }) => {
      const arrivalDate = req.body[arrivalField];
      if (arrivalDate && moment(value).isSameOrBefore(moment(arrivalDate), 'day')) {
        throw new Error('Departure date must be after arrival date');
      }
      return true;
    });
  },

  // Check if date is within a specific range
  dateInRange: (field, minDays = 0, maxDays = 365) => {
    return body(field).custom((value) => {
      const date = moment(value);
      const minDate = moment().add(minDays, 'days');
      const maxDate = moment().add(maxDays, 'days');
      
      if (date.isBefore(minDate, 'day')) {
        throw new Error(`${field.replace('_', ' ')} must be at least ${minDays} days from today`);
      }
      
      if (date.isAfter(maxDate, 'day')) {
        throw new Error(`${field.replace('_', ' ')} cannot be more than ${maxDays} days from today`);
      }
      
      return true;
    });
  },

  // Check if duration matches date range
  durationMatchesDates: (durationField = 'duration_of_stay', arrivalField = 'arrival_date', departureField = 'departure_date') => {
    return body(durationField).custom((value, { req }) => {
      const arrivalDate = req.body[arrivalField];
      const departureDate = req.body[departureField];
      
      if (arrivalDate && departureDate) {
        const calculatedDuration = moment(departureDate).diff(moment(arrivalDate), 'days');
        if (parseInt(value) !== calculatedDuration) {
          throw new Error(`Duration of stay (${value} days) does not match the date range (${calculatedDuration} days)`);
        }
      }
      
      return true;
    });
  },

  // Check if email is unique (requires database query)
  uniqueEmail: (tableName, excludeField = null) => {
    return body('email').custom(async (value, { req }) => {
      const { getRow } = require('../config/database');
      
      let query = `SELECT email FROM ${tableName} WHERE email = ?`;
      const params = [value];
      
      if (excludeField && req.body[excludeField]) {
        query += ` AND ${excludeField} != ?`;
        params.push(req.body[excludeField]);
      }
      
      const existingRecord = await getRow(query, params);
      
      if (existingRecord) {
        throw new Error('Email address is already in use');
      }
      
      return true;
    });
  },

  // Check if passport number is unique
  uniquePassport: (excludeField = null) => {
    return body('passport_number').custom(async (value, { req }) => {
      const { getRow } = require('../config/database');
      
      let query = 'SELECT passport_number FROM visa_applications WHERE passport_number = ?';
      const params = [value];
      
      if (excludeField && req.body[excludeField]) {
        query += ` AND ${excludeField} != ?`;
        params.push(req.body[excludeField]);
      }
      
      const existingRecord = await getRow(query, params);
      
      if (existingRecord) {
        throw new Error('Passport number is already associated with another application');
      }
      
      return true;
    });
  }
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: formattedErrors,
      error_code: 'VALIDATION_ERROR'
    });
  }
  
  next();
};

// Sanitization helpers
const sanitizers = {
  // Remove HTML tags
  stripHtml: (field) => {
    return body(field).customSanitizer((value) => {
      if (typeof value === 'string') {
        return value.replace(/<[^>]*>/g, '');
      }
      return value;
    });
  },

  // Normalize phone number
  normalizePhone: (field) => {
    return body(field).customSanitizer((value) => {
      if (typeof value === 'string') {
        // Remove all non-digit characters except +
        return value.replace(/[^\d+]/g, '');
      }
      return value;
    });
  },

  // Capitalize first letter of each word
  titleCase: (field) => {
    return body(field).customSanitizer((value) => {
      if (typeof value === 'string') {
        return value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      }
      return value;
    });
  },

  // Convert to uppercase
  uppercase: (field) => {
    return body(field).customSanitizer((value) => {
      if (typeof value === 'string') {
        return value.toUpperCase();
      }
      return value;
    });
  },

  // Convert to lowercase
  lowercase: (field) => {
    return body(field).customSanitizer((value) => {
      if (typeof value === 'string') {
        return value.toLowerCase();
      }
      return value;
    });
  }
};

// Common validation rule sets
const rulesets = {
  // Visa application validation
  visaApplication: [
    validators.name('full_name'),
    validators.email('email'),
    validators.phone('phone'),
    validators.text('nationality', { minLength: 2, maxLength: 50 }),
    validators.passport('passport_number'),
    validators.enum('visa_type', ['tourist', 'business', 'transit', 'work', 'student', 'family', 'medical']),
    validators.text('purpose_of_visit', { minLength: 10, maxLength: 500 }),
    validators.number('duration_of_stay', { min: 1, max: 365 }),
    validators.date('arrival_date', { futureOnly: true }),
    validators.date('departure_date', { futureOnly: true }),
    customValidators.departureDateAfterArrival(),
    customValidators.durationMatchesDates(),
    validators.text('accommodation_details', { optional: true, maxLength: 500 }),
    validators.text('sponsor_information', { optional: true, maxLength: 500 }),
    validators.enum('previous_uae_visit', ['yes', 'no']),
    validators.enum('criminal_record', ['yes', 'no']),
    validators.text('medical_conditions', { optional: true, maxLength: 500 }),
    validators.name('emergency_contact_name'),
    validators.phone('emergency_contact_phone'),
    validators.text('emergency_contact_relationship', { minLength: 2, maxLength: 50 })
  ],

  // Contact form validation
  contactForm: [
    validators.name('name'),
    validators.email('email'),
    validators.phone('phone', { optional: true }),
    validators.text('subject', { minLength: 5, maxLength: 200 }),
    validators.text('message', { minLength: 10, maxLength: 2000 }),
    validators.enum('inquiry_type', ['general', 'visa_inquiry', 'application_status', 'technical_support', 'complaint', 'suggestion'], { optional: true }),
    validators.enum('preferred_contact_method', ['email', 'phone', 'both'], { optional: true })
  ],

  // Feedback form validation
  feedbackForm: [
    validators.name('name'),
    validators.email('email'),
    validators.enum('service_used', ['visa_application', 'document_verification', 'consultation', 'status_inquiry', 'other'], { optional: true }),
    validators.number('rating', { min: 1, max: 5 }),
    validators.enum('feedback_type', ['compliment', 'complaint', 'suggestion', 'general']),
    validators.text('subject', { minLength: 5, maxLength: 200 }),
    validators.text('message', { minLength: 10, maxLength: 2000 }),
    validators.enum('would_recommend', ['yes', 'no', 'maybe']),
    validators.applicationId('application_id', { optional: true, body: true })
  ],

  // Newsletter subscription validation
  newsletterSubscription: [
    validators.email('email'),
    validators.name('name', { optional: true }),
    validators.array('preferences', { optional: true }),
    body('preferences.*')
      .optional()
      .isIn(['visa_updates', 'policy_changes', 'travel_tips', 'promotions', 'general_news'])
      .withMessage('Invalid preference option')
  ]
};

module.exports = {
  patterns,
  validators,
  customValidators,
  sanitizers,
  rulesets,
  handleValidationErrors
};