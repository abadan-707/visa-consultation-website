const express = require('express');
const { body } = require('express-validator');
const { runQuery, getRows } = require('../config/database');
const { catchAsync, AppError, handleValidationErrors } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
const moment = require('moment');

const router = express.Router();

// Validation rules for contact form
const contactValidationRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  
  body('inquiry_type')
    .optional()
    .isIn(['general', 'visa_inquiry', 'application_status', 'technical_support', 'complaint', 'suggestion'])
    .withMessage('Please select a valid inquiry type'),
  
  body('preferred_contact_method')
    .optional()
    .isIn(['email', 'phone', 'both'])
    .withMessage('Please select a valid contact method')
];

// Submit contact form
router.post('/', 
  contactValidationRules,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const {
      name,
      email,
      phone,
      subject,
      message,
      inquiry_type = 'general',
      preferred_contact_method = 'email'
    } = req.body;

    // Generate unique contact ID
    const contactId = `CONTACT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Insert contact message into database
    await runQuery(`
      INSERT INTO contact_messages (
        message_id, full_name, email, phone, subject, message, 
        inquiry_type, preferred_contact, status, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      contactId, name, email, phone, subject, message,
      inquiry_type, preferred_contact_method
    ]);

    // Send confirmation email to user
    try {
      await sendEmail({
        to: email,
        subject: `Contact Form Confirmation - ${contactId}`,
        template: 'contact-confirmation',
        data: {
          name,
          message_id: contactId,
          subject,
          message,
          inquiry_type,
          submitted_at: moment().format('MMMM DD, YYYY [at] HH:mm')
        }
      });

      // Send notification email to admin
      await sendEmail({
        to: process.env.EMAIL_TO || 'admin@uaevisaservices.com',
        subject: `New Contact Form Submission - ${contactId}`,
        template: 'new-contact-admin',
        data: {
          message_id: contactId,
          name,
          email,
          phone: phone || 'Not provided',
          subject,
          message,
          inquiry_type,
          preferred_contact_method,
          submitted_at: moment().format('MMMM DD, YYYY [at] HH:mm')
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the contact form if email fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Your message has been sent successfully',
      data: {
        message_id: contactId,
        status: 'received',
        submitted_at: new Date().toISOString(),
        estimated_response_time: '24-48 hours',
        next_steps: [
          'Your message has been received and assigned a reference number',
          'Our team will review your inquiry',
          'You will receive a response within 24-48 hours',
          'For urgent matters, please call our hotline'
        ]
      }
    });
  })
);

// Get contact messages (admin endpoint)
router.get('/messages', catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, inquiry_type } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = '';
  const params = [];

  if (status) {
    whereClause += ' WHERE status = ?';
    params.push(status);
  }

  if (inquiry_type) {
    whereClause += status ? ' AND inquiry_type = ?' : ' WHERE inquiry_type = ?';
    params.push(inquiry_type);
  }

  const messages = await getRows(`
    SELECT message_id, full_name as name, email, phone, subject, inquiry_type, 
           status, created_at, updated_at
    FROM contact_messages
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), parseInt(offset)]);

  // Get total count
  const totalResult = await getRow(`
    SELECT COUNT(*) as total FROM contact_messages ${whereClause}
  `, params);

  res.status(200).json({
    status: 'success',
    data: {
      messages,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: totalResult.total,
        total_pages: Math.ceil(totalResult.total / limit)
      }
    }
  });
}));

// Get specific contact message (admin endpoint)
router.get('/messages/:contactId', catchAsync(async (req, res) => {
  const { contactId } = req.params;

  const message = await getRow(`
    SELECT * FROM contact_messages WHERE message_id = ?
  `, [contactId]);

  if (!message) {
    throw new AppError('Contact message not found', 404, 'MESSAGE_NOT_FOUND');
  }

  res.status(200).json({
    status: 'success',
    data: {
      message
    }
  });
}));

// Update contact message status (admin endpoint)
router.patch('/messages/:contactId/status', 
  body('status')
    .isIn(['new', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { contactId } = req.params;
    const { status, notes } = req.body;

    // Check if message exists
    const existingMessage = await getRow(`
      SELECT * FROM contact_messages WHERE message_id = ?
    `, [contactId]);

    if (!existingMessage) {
      throw new AppError('Contact message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    // Update status
    await runQuery(`
      UPDATE contact_messages 
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE message_id = ?
    `, [status, notes || null, contactId]);

    // Send status update email to user if resolved
    if (status === 'resolved' && existingMessage.email) {
      try {
        await sendEmail({
          to: existingMessage.email,
          subject: `Your Inquiry Has Been Resolved - ${contactId}`,
          template: 'contact-resolved',
          data: {
            name: existingMessage.name,
            message_id: contactId,
            subject: existingMessage.subject,
            resolution_notes: notes || 'Your inquiry has been resolved.',
            resolved_at: moment().format('MMMM DD, YYYY [at] HH:mm')
          }
        });
      } catch (emailError) {
        console.error('Status update email failed:', emailError);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Contact message status updated successfully',
      data: {
          message_id: contactId,
          new_status: status,
          updated_at: new Date().toISOString()
        }
    });
  })
);

// Get contact statistics (admin endpoint)
router.get('/stats', catchAsync(async (req, res) => {
  const stats = await getRows(`
    SELECT 
      status,
      COUNT(*) as count
    FROM contact_messages 
    GROUP BY status
  `);

  const inquiryTypeStats = await getRows(`
    SELECT 
      inquiry_type,
      COUNT(*) as count
    FROM contact_messages 
    GROUP BY inquiry_type
  `);

  const monthlyStats = await getRows(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as count
    FROM contact_messages 
    WHERE created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
  `);

  res.status(200).json({
    status: 'success',
    data: {
      status_breakdown: stats.reduce((acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {}),
      inquiry_type_breakdown: inquiryTypeStats.reduce((acc, stat) => {
        acc[stat.inquiry_type] = stat.count;
        return acc;
      }, {}),
      monthly_trends: monthlyStats,
      total_messages: stats.reduce((sum, stat) => sum + stat.count, 0)
    }
  });
}));

module.exports = router;