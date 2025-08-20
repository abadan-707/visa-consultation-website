const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

// Email templates cache
const templateCache = new Map();

// Create transporter
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  // For development, use ethereal email if no SMTP config
  if (!process.env.EMAIL_USER && process.env.NODE_ENV === 'development') {
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  return nodemailer.createTransporter(config);
};

// Load and compile email template
const loadTemplate = async (templateName) => {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateContent);
    
    templateCache.set(templateName, compiledTemplate);
    return compiledTemplate;
  } catch (error) {
    console.error(`Failed to load email template: ${templateName}`, error);
    // Return a basic template as fallback
    return handlebars.compile(`
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #c41e3a;">UAE Visa Services</h2>
            <p>{{message}}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This email was sent from UAE Visa Services.<br>
              If you have any questions, please contact us at support@uaevisaservices.com
            </p>
          </div>
        </body>
      </html>
    `);
  }
};

// Default email templates (inline)
const defaultTemplates = {
  'visa-application-confirmation': `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #c41e3a; margin: 0;">UAE Visa Services</h1>
            <p style="color: #666; margin: 5px 0;">Your trusted visa processing partner</p>
          </div>
          
          <h2 style="color: #2c5530;">Visa Application Confirmation</h2>
          
          <p>Dear {{full_name}},</p>
          
          <p>Thank you for submitting your UAE visa application. We have successfully received your application and it is now being processed.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #c41e3a;">Application Details</h3>
            <p><strong>Application ID:</strong> {{application_id}}</p>
            <p><strong>Visa Type:</strong> {{visa_type}}</p>
            <p><strong>Arrival Date:</strong> {{arrival_date}}</p>
            <p><strong>Departure Date:</strong> {{departure_date}}</p>
            <p><strong>Duration of Stay:</strong> {{duration_of_stay}} days</p>
          </div>
          
          <h3 style="color: #2c5530;">What happens next?</h3>
          <ul>
            <li>Your application is being reviewed by our team</li>
            <li>You will receive email updates on the progress</li>
            <li>Additional documents may be requested if needed</li>
            <li>Final decision will be communicated via email</li>
          </ul>
          
          <p><strong>Estimated Processing Time:</strong> 5-7 business days</p>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Important:</strong> Please keep your Application ID ({{application_id}}) safe for future reference and status inquiries.</p>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>UAE Visa Services Team</p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated email. Please do not reply to this email.<br>
            For support, contact us at support@uaevisaservices.com
          </p>
        </div>
      </body>
    </html>
  `,
  
  'contact-confirmation': `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #c41e3a; margin: 0;">UAE Visa Services</h1>
            <p style="color: #666; margin: 5px 0;">Your trusted visa processing partner</p>
          </div>
          
          <h2 style="color: #2c5530;">Contact Form Confirmation</h2>
          
          <p>Dear {{name}},</p>
          
          <p>Thank you for contacting us. We have received your message and will respond within 24-48 hours.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #c41e3a;">Your Message Details</h3>
            <p><strong>Reference ID:</strong> {{contact_id}}</p>
            <p><strong>Subject:</strong> {{subject}}</p>
            <p><strong>Inquiry Type:</strong> {{inquiry_type}}</p>
            <p><strong>Submitted:</strong> {{submitted_at}}</p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your Message:</strong></p>
            <p style="margin: 10px 0 0 0; font-style: italic;">"{{message}}"</p>
          </div>
          
          <p>Our team will review your inquiry and respond as soon as possible. For urgent matters, please call our hotline.</p>
          
          <p>Best regards,<br>UAE Visa Services Team</p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Reference ID: {{contact_id}}<br>
            For support, contact us at support@uaevisaservices.com
          </p>
        </div>
      </body>
    </html>
  `,
  
  'feedback-confirmation': `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #c41e3a; margin: 0;">UAE Visa Services</h1>
            <p style="color: #666; margin: 5px 0;">Your trusted visa processing partner</p>
          </div>
          
          <h2 style="color: #2c5530;">Thank You for Your Feedback!</h2>
          
          <p>Dear {{name}},</p>
          
          <p>Thank you for taking the time to share your feedback with us. Your input is valuable and helps us improve our services.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #c41e3a;">Feedback Details</h3>
            <p><strong>Reference ID:</strong> {{feedback_id}}</p>
            <p><strong>Subject:</strong> {{subject}}</p>
            <p><strong>Type:</strong> {{feedback_type}}</p>
            <p><strong>Rating:</strong> {{rating}}/5 stars</p>
            <p><strong>Submitted:</strong> {{submitted_at}}</p>
          </div>
          
          <p>We appreciate your {{rating}}-star rating and will use your feedback to enhance our services.</p>
          
          <p>If your feedback requires a response, we will get back to you within 48 hours.</p>
          
          <p>Best regards,<br>UAE Visa Services Team</p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Reference ID: {{feedback_id}}<br>
            For support, contact us at support@uaevisaservices.com
          </p>
        </div>
      </body>
    </html>
  `,
  
  'newsletter-welcome': `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #c41e3a; margin: 0;">UAE Visa Services</h1>
            <p style="color: #666; margin: 5px 0;">Your trusted visa processing partner</p>
          </div>
          
          <h2 style="color: #2c5530;">Welcome to Our Newsletter!</h2>
          
          <p>Dear {{name}},</p>
          
          <p>Welcome to the UAE Visa Services newsletter! Thank you for subscribing to stay updated with the latest visa information, travel tips, and important announcements.</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c5530;">What you'll receive:</h3>
            <ul style="margin: 10px 0;">
              <li>Latest UAE visa updates and policy changes</li>
              <li>Travel tips and destination guides</li>
              <li>Special promotions and offers</li>
              <li>Important immigration news</li>
            </ul>
          </div>
          
          <p><strong>Your subscription preferences:</strong></p>
          <ul>
            {{#each preferences}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
          
          <p>You can update your preferences or unsubscribe at any time using the link at the bottom of our emails.</p>
          
          <p>Thank you for joining our community!</p>
          
          <p>Best regards,<br>UAE Visa Services Team</p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Subscribed: {{subscribed_at}}<br>
            <a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a> | 
            <a href="mailto:support@uaevisaservices.com" style="color: #666;">Contact Support</a>
          </p>
        </div>
      </body>
    </html>
  `
};

// Get template (from file or default)
const getTemplate = async (templateName) => {
  try {
    return await loadTemplate(templateName);
  } catch (error) {
    // Use default template if file template fails
    if (defaultTemplates[templateName]) {
      return handlebars.compile(defaultTemplates[templateName]);
    }
    
    // Fallback to basic template
    return handlebars.compile(`
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #c41e3a;">UAE Visa Services</h2>
            <p>{{message}}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This email was sent from UAE Visa Services.<br>
              For support, contact us at support@uaevisaservices.com
            </p>
          </div>
        </body>
      </html>
    `);
  }
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    let htmlContent;
    
    if (options.template) {
      // Use template
      const template = await getTemplate(options.template);
      htmlContent = template(options.data || {});
    } else if (options.html) {
      // Use provided HTML
      htmlContent = options.html;
    } else {
      // Use plain text with basic HTML wrapper
      htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #c41e3a;">UAE Visa Services</h2>
              <p>${options.text || options.message || 'No content provided'}</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                This email was sent from UAE Visa Services.<br>
                For support, contact us at support@uaevisaservices.com
              </p>
            </div>
          </body>
        </html>
      `;
    }
    
    const mailOptions = {
      from: `"UAE Visa Services" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@uaevisaservices.com'}>`,
      to: options.to,
      subject: options.subject,
      html: htmlContent,
      text: options.text || options.message,
      attachments: options.attachments || []
    };
    
    // Add CC and BCC if provided
    if (options.cc) mailOptions.cc = options.cc;
    if (options.bcc) mailOptions.bcc = options.bcc;
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: result.messageId,
      to: options.to,
      subject: options.subject
    });
    
    return result;
  } catch (error) {
    console.error('Email sending failed:', {
      error: error.message,
      to: options.to,
      subject: options.subject,
      stack: error.stack
    });
    throw error;
  }
};

// Send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  const errors = [];
  
  for (const emailOptions of emails) {
    try {
      const result = await sendEmail(emailOptions);
      results.push({ success: true, messageId: result.messageId, to: emailOptions.to });
    } catch (error) {
      errors.push({ success: false, error: error.message, to: emailOptions.to });
    }
    
    // Add delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { results, errors };
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error.message);
    return false;
  }
};

// Test email function
const sendTestEmail = async (to) => {
  return await sendEmail({
    to,
    subject: 'UAE Visa Services - Email Configuration Test',
    template: 'test-email',
    data: {
      message: 'This is a test email to verify that the email configuration is working correctly.',
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  verifyEmailConfig,
  sendTestEmail,
  loadTemplate,
  getTemplate
};