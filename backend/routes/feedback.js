const express = require('express');
const { body } = require('express-validator');
const { runQuery, getRows, getRow } = require('../config/database');
const { catchAsync, AppError, handleValidationErrors } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
const moment = require('moment');

const router = express.Router();

// Validation rules for feedback form
const feedbackValidationRules = [
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
  
  body('service_used')
    .optional()
    .isIn(['visa_application', 'document_verification', 'consultation', 'status_inquiry', 'other'])
    .withMessage('Please select a valid service type'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('feedback_type')
    .isIn(['compliment', 'complaint', 'suggestion', 'general'])
    .withMessage('Please select a valid feedback type'),
  
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  
  body('would_recommend')
    .isIn(['yes', 'no', 'maybe'])
    .withMessage('Please specify if you would recommend our services'),
  
  body('application_id')
    .optional()
    .trim()
    .matches(/^UAE-\d+-[A-Z0-9]+$/)
    .withMessage('Please provide a valid application ID if applicable')
];

// Submit feedback
router.post('/', 
  feedbackValidationRules,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const {
      name,
      email,
      service_used,
      rating,
      feedback_type,
      subject,
      message,
      would_recommend,
      application_id
    } = req.body;

    // Generate unique feedback ID
    const feedbackId = `FB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Insert feedback into database
    await runQuery(`
      INSERT INTO feedback (
        feedback_id, full_name, email, service_rating, would_recommend,
        feedback_title, feedback_message, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     `, [
       feedbackId, name, email, rating, would_recommend,
       subject, message
     ]);

    // Send confirmation email to user
    try {
      await sendEmail({
        to: email,
        subject: `Feedback Confirmation - ${feedbackId}`,
        template: 'feedback-confirmation',
        data: {
          name,
          feedback_id: feedbackId,
          subject,
          rating,
          feedback_type,
          submitted_at: moment().format('MMMM DD, YYYY [at] HH:mm')
        }
      });

      // Send notification email to admin
      await sendEmail({
        to: process.env.EMAIL_TO || 'admin@uaevisaservices.com',
        subject: `New Feedback Received - ${feedbackId} (${feedback_type.toUpperCase()})`,
        template: 'new-feedback-admin',
        data: {
          feedback_id: feedbackId,
          name,
          email,
          service_used: service_used || 'Not specified',
          rating,
          feedback_type,
          subject,
          message,
          would_recommend,
          application_id: application_id || 'Not provided',
          submitted_at: moment().format('MMMM DD, YYYY [at] HH:mm')
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the feedback submission if email fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Thank you for your feedback! We appreciate your input.',
      data: {
        feedback_id: feedbackId,
        status: 'received',
        submitted_at: new Date().toISOString(),
        next_steps: [
          'Your feedback has been received and assigned a reference number',
          'Our team will review your feedback',
          'If a response is required, we will contact you within 48 hours',
          'Your feedback helps us improve our services'
        ]
      }
    });
  })
);

// Get all feedback (admin endpoint)
router.get('/', catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    feedback_type, 
    rating, 
    status,
    service_used,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;
  
  const offset = (page - 1) * limit;
  let whereClause = '';
  const params = [];
  const conditions = [];

  if (feedback_type) {
    conditions.push('feedback_type = ?');
    params.push(feedback_type);
  }

  if (rating) {
    conditions.push('rating = ?');
    params.push(parseInt(rating));
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (service_used) {
    conditions.push('service_used = ?');
    params.push(service_used);
  }

  if (conditions.length > 0) {
    whereClause = ' WHERE ' + conditions.join(' AND ');
  }

  const validSortColumns = ['created_at', 'rating', 'feedback_type', 'name'];
  const validSortOrders = ['asc', 'desc'];
  
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order.toUpperCase() : 'DESC';

  const feedback = await getRows(`
    SELECT feedback_id, name, email, service_used, rating, feedback_type,
           subject, would_recommend, status, created_at, updated_at
    FROM feedback
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), parseInt(offset)]);

  // Get total count
  const totalResult = await getRow(`
    SELECT COUNT(*) as total FROM feedback ${whereClause}
  `, params);

  res.status(200).json({
    status: 'success',
    data: {
      feedback,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: totalResult.total,
        total_pages: Math.ceil(totalResult.total / limit)
      },
      filters: {
        feedback_type,
        rating,
        status,
        service_used
      },
      sorting: {
        sort_by: sortColumn,
        sort_order: sortDirection
      }
    }
  });
}));

// Get specific feedback (admin endpoint)
router.get('/:feedbackId', catchAsync(async (req, res) => {
  const { feedbackId } = req.params;

  const feedback = await getRow(`
    SELECT * FROM feedback WHERE feedback_id = ?
  `, [feedbackId]);

  if (!feedback) {
    throw new AppError('Feedback not found', 404, 'FEEDBACK_NOT_FOUND');
  }

  res.status(200).json({
    status: 'success',
    data: {
      feedback
    }
  });
}));

// Update feedback status (admin endpoint)
router.patch('/:feedbackId/status', 
  body('status')
    .isIn(['new', 'reviewed', 'responded', 'closed'])
    .withMessage('Invalid status'),
  body('admin_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters'),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { feedbackId } = req.params;
    const { status, admin_notes } = req.body;

    // Check if feedback exists
    const existingFeedback = await getRow(`
      SELECT * FROM feedback WHERE feedback_id = ?
    `, [feedbackId]);

    if (!existingFeedback) {
      throw new AppError('Feedback not found', 404, 'FEEDBACK_NOT_FOUND');
    }

    // Update status
    await runQuery(`
      UPDATE feedback 
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE feedback_id = ?
    `, [status, admin_notes || null, feedbackId]);

    // Send response email to user if responded
    if (status === 'responded' && existingFeedback.email && admin_notes) {
      try {
        await sendEmail({
          to: existingFeedback.email,
          subject: `Response to Your Feedback - ${feedbackId}`,
          template: 'feedback-response',
          data: {
            name: existingFeedback.name,
            feedback_id: feedbackId,
            original_subject: existingFeedback.subject,
            response: admin_notes,
            responded_at: moment().format('MMMM DD, YYYY [at] HH:mm')
          }
        });
      } catch (emailError) {
        console.error('Response email failed:', emailError);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Feedback status updated successfully',
      data: {
        feedback_id: feedbackId,
        new_status: status,
        updated_at: new Date().toISOString()
      }
    });
  })
);

// Get feedback statistics (admin endpoint)
router.get('/stats/overview', catchAsync(async (req, res) => {
  // Overall statistics
  const overallStats = await getRow(`
    SELECT 
      COUNT(*) as total_feedback,
      AVG(rating) as average_rating,
      COUNT(CASE WHEN would_recommend = 'yes' THEN 1 END) as would_recommend_yes,
      COUNT(CASE WHEN would_recommend = 'no' THEN 1 END) as would_recommend_no,
      COUNT(CASE WHEN would_recommend = 'maybe' THEN 1 END) as would_recommend_maybe
    FROM feedback
  `);

  // Rating distribution
  const ratingStats = await getRows(`
    SELECT 
      rating,
      COUNT(*) as count
    FROM feedback 
    GROUP BY rating
    ORDER BY rating
  `);

  // Feedback type breakdown
  const typeStats = await getRows(`
    SELECT 
      feedback_type,
      COUNT(*) as count,
      AVG(rating) as avg_rating
    FROM feedback 
    GROUP BY feedback_type
  `);

  // Service usage feedback
  const serviceStats = await getRows(`
    SELECT 
      service_used,
      COUNT(*) as count,
      AVG(rating) as avg_rating
    FROM feedback 
    WHERE service_used IS NOT NULL
    GROUP BY service_used
  `);

  // Monthly trends
  const monthlyStats = await getRows(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as count,
      AVG(rating) as avg_rating
    FROM feedback 
    WHERE created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
  `);

  // Recent feedback (last 7 days)
  const recentStats = await getRow(`
    SELECT 
      COUNT(*) as recent_count,
      AVG(rating) as recent_avg_rating
    FROM feedback 
    WHERE created_at >= date('now', '-7 days')
  `);

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        total_feedback: overallStats.total_feedback,
        average_rating: parseFloat(overallStats.average_rating?.toFixed(2)) || 0,
        recommendation_rate: {
          yes: overallStats.would_recommend_yes,
          no: overallStats.would_recommend_no,
          maybe: overallStats.would_recommend_maybe,
          percentage_yes: overallStats.total_feedback > 0 ? 
            parseFloat(((overallStats.would_recommend_yes / overallStats.total_feedback) * 100).toFixed(1)) : 0
        }
      },
      rating_distribution: ratingStats.reduce((acc, stat) => {
        acc[`${stat.rating}_star`] = stat.count;
        return acc;
      }, {}),
      feedback_types: typeStats.reduce((acc, stat) => {
        acc[stat.feedback_type] = {
          count: stat.count,
          avg_rating: parseFloat(stat.avg_rating?.toFixed(2)) || 0
        };
        return acc;
      }, {}),
      service_feedback: serviceStats.reduce((acc, stat) => {
        acc[stat.service_used] = {
          count: stat.count,
          avg_rating: parseFloat(stat.avg_rating?.toFixed(2)) || 0
        };
        return acc;
      }, {}),
      monthly_trends: monthlyStats,
      recent_activity: {
        last_7_days: recentStats.recent_count,
        recent_avg_rating: parseFloat(recentStats.recent_avg_rating?.toFixed(2)) || 0
      }
    }
  });
}));

module.exports = router;