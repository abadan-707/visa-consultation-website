const express = require('express');
const { body } = require('express-validator');
const { runQuery, getRows, getRow } = require('../config/database');
const { catchAsync, AppError, handleValidationErrors } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
const moment = require('moment');
const crypto = require('crypto');

const router = express.Router();

// Validation rules for newsletter subscription
const subscriptionValidationRules = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('preferences')
    .optional()
    .isArray()
    .withMessage('Preferences must be an array'),
  
  body('preferences.*')
    .optional()
    .isIn(['visa_updates', 'policy_changes', 'travel_tips', 'promotions', 'general_news'])
    .withMessage('Invalid preference option')
];

// Generate unsubscribe token
function generateUnsubscribeToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Subscribe to newsletter
router.post('/subscribe', 
  subscriptionValidationRules,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { email, name, preferences = [] } = req.body;

    // Check if email already exists
    const existingSubscription = await getRow(`
      SELECT * FROM newsletter_subscriptions WHERE email = ?
    `, [email]);

    if (existingSubscription) {
      if (existingSubscription.is_active) {
        return res.status(200).json({
          status: 'success',
          message: 'You are already subscribed to our newsletter',
          data: {
            email,
            status: 'already_subscribed',
            subscribed_since: existingSubscription.created_at
          }
        });
      } else {
        // Reactivate subscription
        const unsubscribeToken = generateUnsubscribeToken();
        await runQuery(`
          UPDATE newsletter_subscriptions 
          SET is_active = true, full_name = ?, 
              unsubscribe_token = ?, updated_at = CURRENT_TIMESTAMP
          WHERE email = ?
        `, [name || null, unsubscribeToken, email]);

        // Send reactivation confirmation
        try {
          await sendEmail({
            to: email,
            subject: 'Newsletter Subscription Reactivated - UAE Visa Services',
            template: 'newsletter-reactivated',
            data: {
              name: name || 'Subscriber',
              email,
              preferences,
              unsubscribe_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?token=${unsubscribeToken}`,
              reactivated_at: moment().format('MMMM DD, YYYY [at] HH:mm')
            }
          });
        } catch (emailError) {
          console.error('Reactivation email failed:', emailError);
        }

        return res.status(200).json({
          status: 'success',
          message: 'Your newsletter subscription has been reactivated',
          data: {
            email,
            status: 'reactivated',
            preferences
          }
        });
      }
    }

    // Create new subscription
    const unsubscribeToken = generateUnsubscribeToken();
    const subscriptionId = `NL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    await runQuery(`
      INSERT INTO newsletter_subscriptions (
        email, full_name, unsubscribe_token, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      email, name || null, unsubscribeToken
    ]);

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to UAE Visa Services Newsletter!',
        template: 'newsletter-welcome',
        data: {
          name: name || 'Subscriber',
          email,
          preferences,
          unsubscribe_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?token=${unsubscribeToken}`,
          subscribed_at: moment().format('MMMM DD, YYYY [at] HH:mm')
        }
      });

      // Send notification to admin
      await sendEmail({
        to: process.env.EMAIL_TO || 'admin@uaevisaservices.com',
        subject: `New Newsletter Subscription - ${email}`,
        template: 'new-newsletter-subscription-admin',
        data: {
          subscription_id: subscriptionId,
          email,
          name: name || 'Not provided',
          preferences,
          subscribed_at: moment().format('MMMM DD, YYYY [at] HH:mm')
        }
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail the subscription if email fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Successfully subscribed to our newsletter!',
      data: {
        subscription_id: subscriptionId,
        email,
        status: 'subscribed',
        preferences,
        subscribed_at: new Date().toISOString(),
        benefits: [
          'Get the latest visa updates and policy changes',
          'Receive travel tips and destination guides',
          'Be the first to know about special promotions',
          'Stay informed about UAE immigration news'
        ]
      }
    });
  })
);

// Unsubscribe from newsletter
router.post('/unsubscribe', 
  body('token')
    .notEmpty()
    .withMessage('Unsubscribe token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid unsubscribe token'),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { token } = req.body;

    // Find subscription by token
    const subscription = await getRow(`
      SELECT * FROM newsletter_subscriptions 
      WHERE unsubscribe_token = ? AND status = 'active'
    `, [token]);

    if (!subscription) {
      throw new AppError('Invalid or expired unsubscribe token', 400, 'INVALID_TOKEN');
    }

    // Update subscription status
    await runQuery(`
      UPDATE newsletter_subscriptions 
      SET status = 'unsubscribed', updated_at = CURRENT_TIMESTAMP
      WHERE unsubscribe_token = ?
    `, [token]);

    // Send unsubscribe confirmation
    try {
      await sendEmail({
        to: subscription.email,
        subject: 'Newsletter Unsubscription Confirmed - UAE Visa Services',
        template: 'newsletter-unsubscribed',
        data: {
          name: subscription.name || 'Subscriber',
          email: subscription.email,
          unsubscribed_at: moment().format('MMMM DD, YYYY [at] HH:mm'),
          resubscribe_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/newsletter`
        }
      });
    } catch (emailError) {
      console.error('Unsubscribe confirmation email failed:', emailError);
    }

    res.status(200).json({
      status: 'success',
      message: 'You have been successfully unsubscribed from our newsletter',
      data: {
        email: subscription.email,
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        message: 'We\'re sorry to see you go! You can resubscribe anytime.'
      }
    });
  })
);

// Update subscription preferences
router.patch('/preferences', 
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('preferences')
    .isArray()
    .withMessage('Preferences must be an array'),
  body('preferences.*')
    .isIn(['visa_updates', 'policy_changes', 'travel_tips', 'promotions', 'general_news'])
    .withMessage('Invalid preference option'),
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { email, preferences } = req.body;

    // Check if subscription exists
    const subscription = await getRow(`
      SELECT * FROM newsletter_subscriptions 
      WHERE email = ? AND status = 'active'
    `, [email]);

    if (!subscription) {
      throw new AppError('Active subscription not found for this email', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    // Update preferences
    await runQuery(`
      UPDATE newsletter_subscriptions 
      SET preferences = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `, [JSON.stringify(preferences), email]);

    // Send preferences update confirmation
    try {
      await sendEmail({
        to: email,
        subject: 'Newsletter Preferences Updated - UAE Visa Services',
        template: 'newsletter-preferences-updated',
        data: {
          name: subscription.name || 'Subscriber',
          email,
          old_preferences: JSON.parse(subscription.preferences || '[]'),
          new_preferences: preferences,
          updated_at: moment().format('MMMM DD, YYYY [at] HH:mm'),
          unsubscribe_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?token=${subscription.unsubscribe_token}`
        }
      });
    } catch (emailError) {
      console.error('Preferences update email failed:', emailError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Newsletter preferences updated successfully',
      data: {
        email,
        preferences,
        updated_at: new Date().toISOString()
      }
    });
  })
);

// Get subscription status
router.get('/status/:email', catchAsync(async (req, res) => {
  const { email } = req.params;

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Invalid email format', 400, 'INVALID_EMAIL');
  }

  const subscription = await getRow(`
    SELECT subscription_id, email, name, preferences, status, created_at, updated_at
    FROM newsletter_subscriptions 
    WHERE email = ?
  `, [email]);

  if (!subscription) {
    return res.status(200).json({
      status: 'success',
      data: {
        email,
        subscribed: false,
        message: 'Email not found in our newsletter database'
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      subscription_id: subscription.subscription_id,
      email: subscription.email,
      name: subscription.name,
      preferences: JSON.parse(subscription.preferences || '[]'),
      subscribed: subscription.status === 'active',
      status: subscription.status,
      subscribed_at: subscription.created_at,
      last_updated: subscription.updated_at
    }
  });
}));

// Get all subscriptions (admin endpoint)
router.get('/subscriptions', catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    status = 'active',
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;
  
  const offset = (page - 1) * limit;
  
  const validStatuses = ['active', 'unsubscribed', 'all'];
  const validSortColumns = ['created_at', 'updated_at', 'email', 'name'];
  const validSortOrders = ['asc', 'desc'];
  
  const filterStatus = validStatuses.includes(status) ? status : 'active';
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order.toUpperCase() : 'DESC';

  let whereClause = '';
  const params = [];

  if (filterStatus !== 'all') {
    whereClause = ' WHERE status = ?';
    params.push(filterStatus);
  }

  const subscriptions = await getRows(`
    SELECT subscription_id, email, name, preferences, status, created_at, updated_at
    FROM newsletter_subscriptions
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), parseInt(offset)]);

  // Get total count
  const totalResult = await getRow(`
    SELECT COUNT(*) as total FROM newsletter_subscriptions ${whereClause}
  `, params);

  // Parse preferences for each subscription
  const formattedSubscriptions = subscriptions.map(sub => ({
    ...sub,
    preferences: JSON.parse(sub.preferences || '[]')
  }));

  res.status(200).json({
    status: 'success',
    data: {
      subscriptions: formattedSubscriptions,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: totalResult.total,
        total_pages: Math.ceil(totalResult.total / limit)
      },
      filters: {
        status: filterStatus
      },
      sorting: {
        sort_by: sortColumn,
        sort_order: sortDirection
      }
    }
  });
}));

// Get newsletter statistics (admin endpoint)
router.get('/stats', catchAsync(async (req, res) => {
  // Overall statistics
  const overallStats = await getRow(`
    SELECT 
      COUNT(*) as total_subscriptions,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
      COUNT(CASE WHEN status = 'unsubscribed' THEN 1 END) as unsubscribed_count
    FROM newsletter_subscriptions
  `);

  // Monthly subscription trends
  const monthlyStats = await getRows(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as new_subscriptions,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_in_month
    FROM newsletter_subscriptions 
    WHERE created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
  `);

  // Preference statistics
  const preferenceStats = await getRows(`
    SELECT preferences FROM newsletter_subscriptions WHERE status = 'active'
  `);

  // Count preferences
  const preferenceCounts = {
    visa_updates: 0,
    policy_changes: 0,
    travel_tips: 0,
    promotions: 0,
    general_news: 0
  };

  preferenceStats.forEach(sub => {
    const prefs = JSON.parse(sub.preferences || '[]');
    prefs.forEach(pref => {
      if (preferenceCounts.hasOwnProperty(pref)) {
        preferenceCounts[pref]++;
      }
    });
  });

  // Recent activity (last 30 days)
  const recentStats = await getRow(`
    SELECT 
      COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_last_30_days,
      COUNT(CASE WHEN updated_at >= date('now', '-30 days') AND status = 'unsubscribed' THEN 1 END) as unsubscribed_last_30_days
    FROM newsletter_subscriptions
  `);

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        total_subscriptions: overallStats.total_subscriptions,
        active_subscriptions: overallStats.active_subscriptions,
        unsubscribed_count: overallStats.unsubscribed_count,
        retention_rate: overallStats.total_subscriptions > 0 ? 
          parseFloat(((overallStats.active_subscriptions / overallStats.total_subscriptions) * 100).toFixed(1)) : 0
      },
      monthly_trends: monthlyStats,
      preference_breakdown: preferenceCounts,
      recent_activity: {
        new_subscriptions_last_30_days: recentStats.new_last_30_days,
        unsubscriptions_last_30_days: recentStats.unsubscribed_last_30_days,
        net_growth_last_30_days: recentStats.new_last_30_days - recentStats.unsubscribed_last_30_days
      }
    }
  });
}));

module.exports = router;