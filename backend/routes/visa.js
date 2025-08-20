const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const { runQuery, getRow, getRows } = require('../config/database');
const { catchAsync, AppError, handleValidationErrors } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
const moment = require('moment');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = file.fieldname;
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'passport_copy': ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    'photo': ['image/jpeg', 'image/png', 'image/jpg'],
    'cv': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'additional_documents': ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  if (allowedTypes[file.fieldname] && allowedTypes[file.fieldname].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type for ${file.fieldname}. Allowed types: ${allowedTypes[file.fieldname]?.join(', ')}`, 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files
  }
});

// Validation rules for visa application
const visaValidationRules = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .trim()
    .matches(/^[+]?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('nationality')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nationality must be between 2 and 50 characters'),
  
  body('passport_number')
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('Passport number must be between 6 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Passport number can only contain uppercase letters and numbers'),
  
  body('visa_type')
    .isIn(['tourist', 'business', 'transit', 'work', 'student', 'family', 'medical'])
    .withMessage('Please select a valid visa type'),
  
  body('purpose_of_visit')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Purpose of visit must be between 10 and 500 characters'),
  
  body('duration_of_stay')
    .isInt({ min: 1, max: 365 })
    .withMessage('Duration of stay must be between 1 and 365 days'),
  
  body('arrival_date')
    .isISO8601()
    .withMessage('Please provide a valid arrival date')
    .custom((value) => {
      if (moment(value).isBefore(moment(), 'day')) {
        throw new Error('Arrival date cannot be in the past');
      }
      return true;
    }),
  
  body('departure_date')
    .isISO8601()
    .withMessage('Please provide a valid departure date')
    .custom((value, { req }) => {
      if (moment(value).isSameOrBefore(moment(req.body.arrival_date), 'day')) {
        throw new Error('Departure date must be after arrival date');
      }
      return true;
    }),
  
  body('accommodation_details')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Accommodation details cannot exceed 500 characters'),
  
  body('sponsor_information')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Sponsor information cannot exceed 500 characters'),
  
  body('previous_uae_visit')
    .isIn(['yes', 'no'])
    .withMessage('Please specify if you have visited UAE before'),
  
  body('criminal_record')
    .isIn(['yes', 'no'])
    .withMessage('Please specify if you have any criminal record'),
  
  body('medical_conditions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Medical conditions cannot exceed 500 characters'),
  
  body('emergency_contact_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name must be between 2 and 100 characters'),
  
  body('emergency_contact_phone')
    .trim()
    .matches(/^[+]?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid emergency contact phone number'),
  
  body('emergency_contact_relationship')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emergency contact relationship must be between 2 and 50 characters')
];

// Submit visa application
router.post('/application', 
  upload.fields([
    { name: 'passport_copy', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'additional_documents', maxCount: 5 }
  ]),
  visaValidationRules,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const {
      full_name, email, phone, nationality, passport_number, visa_type,
      purpose_of_visit, duration_of_stay, arrival_date, departure_date,
      accommodation_details, sponsor_information, previous_uae_visit,
      criminal_record, medical_conditions, emergency_contact_name,
      emergency_contact_phone, emergency_contact_relationship
    } = req.body;

    // Check for required files
    if (!req.files || !req.files.passport_copy || !req.files.photo) {
      throw new AppError('Passport copy and photo are required', 400, 'MISSING_REQUIRED_FILES');
    }

    // Generate unique application ID
    const applicationId = `UAE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Prepare file paths
    const filePaths = {
      passport_copy_path: req.files.passport_copy ? req.files.passport_copy[0].filename : null,
      photo_path: req.files.photo ? req.files.photo[0].filename : null,
      cv_path: req.files.cv ? req.files.cv[0].filename : null,
      additional_documents_path: req.files.additional_documents ? 
        req.files.additional_documents.map(file => file.filename).join(',') : null
    };

    // Insert application into database
    const result = await runQuery(`
      INSERT INTO visa_applications (
        application_id, full_name, email, phone, nationality, passport_number,
        visa_type, purpose_of_visit, duration_of_stay, arrival_date, departure_date,
        accommodation_details, sponsor_information, previous_uae_visit,
        criminal_record, medical_conditions, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relationship,
        passport_copy_path, photo_path, cv_path, additional_documents_path,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      applicationId, full_name, email, phone, nationality, passport_number,
      visa_type, purpose_of_visit, duration_of_stay, arrival_date, departure_date,
      accommodation_details, sponsor_information, previous_uae_visit,
      criminal_record, medical_conditions, emergency_contact_name,
      emergency_contact_phone, emergency_contact_relationship,
      filePaths.passport_copy_path, filePaths.photo_path, filePaths.cv_path, filePaths.additional_documents_path
    ]);

    // Log status change
    await runQuery(`
      INSERT INTO application_status_log (application_id, old_status, new_status, notes, created_at)
      VALUES (?, NULL, 'pending', 'Application submitted', CURRENT_TIMESTAMP)
    `, [applicationId]);

    // Send confirmation email to applicant
    try {
      await sendEmail({
        to: email,
        subject: `UAE Visa Application Confirmation - ${applicationId}`,
        template: 'visa-application-confirmation',
        data: {
          full_name,
          application_id: applicationId,
          visa_type,
          arrival_date: moment(arrival_date).format('MMMM DD, YYYY'),
          departure_date: moment(departure_date).format('MMMM DD, YYYY'),
          duration_of_stay
        }
      });

      // Send notification email to admin
      await sendEmail({
        to: process.env.EMAIL_TO || 'admin@uaevisaservices.com',
        subject: `New Visa Application - ${applicationId}`,
        template: 'new-visa-application-admin',
        data: {
          application_id: applicationId,
          full_name,
          email,
          phone,
          nationality,
          visa_type,
          arrival_date: moment(arrival_date).format('MMMM DD, YYYY'),
          purpose_of_visit
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the application if email fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Visa application submitted successfully',
      data: {
        application_id: applicationId,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        estimated_processing_time: '5-7 business days',
        next_steps: [
          'Your application is being reviewed',
          'You will receive email updates on the progress',
          'Additional documents may be requested if needed',
          'Final decision will be communicated via email'
        ]
      }
    });
  })
);

// Get application status
router.get('/status/:applicationId', catchAsync(async (req, res) => {
  const { applicationId } = req.params;

  const application = await getRow(`
    SELECT application_id, full_name, email, visa_type, status, 
           created_at, updated_at, arrival_date, departure_date
    FROM visa_applications 
    WHERE application_id = ?
  `, [applicationId]);

  if (!application) {
    throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
  }

  // Get status history
  const statusHistory = await getRows(`
    SELECT old_status, new_status, notes, created_at
    FROM application_status_log 
    WHERE application_id = ?
    ORDER BY created_at ASC
  `, [applicationId]);

  res.status(200).json({
    status: 'success',
    data: {
      application: {
        id: application.application_id,
        applicant_name: application.full_name,
        email: application.email,
        visa_type: application.visa_type,
        current_status: application.status,
        submitted_at: application.created_at,
        last_updated: application.updated_at,
        travel_dates: {
          arrival: application.arrival_date,
          departure: application.departure_date
        }
      },
      status_history: statusHistory.map(log => ({
        from: log.old_status,
        to: log.new_status,
        notes: log.notes,
        timestamp: log.created_at
      })),
      status_descriptions: {
        pending: 'Application received and under initial review',
        reviewing: 'Application is being processed by our team',
        approved: 'Application approved - visa will be issued',
        rejected: 'Application rejected - see notes for details',
        additional_info_required: 'Additional information or documents needed'
      }
    }
  });
}));

// Get all applications (admin endpoint - would need authentication in production)
router.get('/applications', catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, visa_type } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = '';
  const params = [];

  if (status) {
    whereClause += ' WHERE status = ?';
    params.push(status);
  }

  if (visa_type) {
    whereClause += status ? ' AND visa_type = ?' : ' WHERE visa_type = ?';
    params.push(visa_type);
  }

  const applications = await getRows(`
    SELECT application_id, full_name, email, nationality, visa_type, 
           status, created_at, arrival_date
    FROM visa_applications
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), parseInt(offset)]);

  // Get total count
  const totalResult = await getRow(`
    SELECT COUNT(*) as total FROM visa_applications ${whereClause}
  `, params);

  res.status(200).json({
    status: 'success',
    data: {
      applications,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: totalResult.total,
        total_pages: Math.ceil(totalResult.total / limit)
      }
    }
  });
}));

module.exports = router;