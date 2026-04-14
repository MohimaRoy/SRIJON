import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SRIJON <noreply@aggrigo.com>',
      to: email,
      subject: 'Password Reset Request - SRIJON',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have requested to reset your password for your SRIJON account.</p>
              <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #22c55e;">${resetUrl}</p>
              <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SRIJON. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after registration
export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SRIJON <noreply@aggrigo.com>',
      to: email,
      subject: 'Welcome to SRIJON! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #22c55e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #22c55e; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to SRIJON!</h1>
              <p style="margin: 0; font-size: 18px;">Your journey to agricultural excellence begins here</p>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Thank you for registering with SRIJON! We're excited to have you join our community of agricultural entrepreneurs.</p>
              
              <h3 style="color: #22c55e; margin-top: 25px;">What's Next?</h3>
              <div class="feature">
                <strong>📝 Complete Your Business Profile</strong>
                <p style="margin: 5px 0 0 0;">Fill out the 6-step registration form to showcase your agricultural business to potential buyers and partners.</p>
              </div>
              <div class="feature">
                <strong>📸 Upload Your Products</strong>
                <p style="margin: 5px 0 0 0;">Add product images, certificates, and documentation to build trust with your customers.</p>
              </div>
              <div class="feature">
                <strong>🌍 Connect with Markets</strong>
                <p style="margin: 5px 0 0 0;">Reach local and international markets through our platform.</p>
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/wizard" class="button">Complete Your Profile</a>
              </p>

              <p style="margin-top: 30px;">If you have any questions or need assistance, feel free to reach out to our support team.</p>
              
              <p style="margin-top: 20px;">Best regards,<br><strong>The SRIJON Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SRIJON. All rights reserved.</p>
              <p>This email was sent because you created an account on SRIJON.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send registration complete email (after OTP verification)
export const sendRegistrationCompleteEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SRIJON <noreply@aggrigo.com>',
      to: email,
      subject: '🎉 Registration Complete - Welcome to SRIJON!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 14px 32px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .feature { background-color: white; padding: 15px; margin: 12px 0; border-radius: 6px; border-left: 4px solid #22c55e; }
            .success { background-color: #d1fae5; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 6px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">🎉 Congratulations!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Your Registration is Complete</p>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              
              <div class="success">
                <strong>✅ Email Verified Successfully!</strong><br>
                Your SRIJON account is now active and ready to use.
              </div>

              <p>Welcome to the SRIJON community! We're thrilled to have you join our platform connecting agricultural entrepreneurs with markets and opportunities.</p>
              
              <h3 style="color: #22c55e; margin-top: 30px;">🚀 What's Next?</h3>
              
              <div class="feature">
                <strong>📝 Complete Your Business Profile</strong>
                <p style="margin: 5px 0 0 0;">Take a few minutes to fill out our 6-step registration form. This helps buyers and partners understand your business better.</p>
              </div>
              
              <div class="feature">
                <strong>📸 Showcase Your Products</strong>
                <p style="margin: 5px 0 0 0;">Upload high-quality images of your products, certificates, and production facilities to build trust.</p>
              </div>
              
              <div class="feature">
                <strong>🌍 Connect with Markets</strong>
                <p style="margin: 5px 0 0 0;">Once your profile is complete, you'll receive a detailed PDF summary that you can share with potential buyers and partners.</p>
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/wizard" class="button">Complete Your Profile Now →</a>
              </p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Need help? Our support team is here to assist you at any time.
              </p>
              
              <p style="margin-top: 20px;">Best regards,<br><strong>The SRIJON Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SRIJON. All rights reserved.</p>
              <p>You're receiving this email because you successfully verified your account on SRIJON.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration complete email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Registration complete email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send OTP verification email
export const sendOTPEmail = async (email, name, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SRIJON <noreply@aggrigo.com>',
      to: email,
      subject: 'Verify Your Email - SRIJON',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #22c55e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background-color: white; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center; border: 2px dashed #22c55e; }
            .otp-code { font-size: 36px; font-weight: bold; color: #22c55e; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification</h1>
              <p style="margin: 0; font-size: 16px;">Welcome to SRIJON!</p>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Thank you for registering with SRIJON! To complete your registration, please verify your email address using the OTP code below:</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
              </div>

              <div class="warning">
                <strong>⏰ Important:</strong> This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
              </div>

              <p style="margin-top: 25px;">Enter this code on the verification page to activate your account and start using SRIJON.</p>
              
              <p style="margin-top: 20px; font-size: 14px; color: #666;">If you're having trouble, you can request a new code on the verification page.</p>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>The SRIJON Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SRIJON. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('OTP email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send business data PDF via email
export const sendBusinessDataPDF = async (email, name, pdfBuffer) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SRIJON <noreply@aggrigo.com>',
      to: email,
      subject: '📄 Your SRIJON Business Profile - PDF Attached',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .success { background-color: #d1fae5; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .button { display: inline-block; padding: 14px 32px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .feature { background-color: white; padding: 15px; margin: 12px 0; border-radius: 6px; border-left: 4px solid #22c55e; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .attachment-icon { font-size: 48px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">🎉 Profile Complete!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Your Business Profile is Ready</p>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              
              <div class="success">
                <div class="attachment-icon">📄</div>
                <strong style="font-size: 18px; color: #22c55e;">Your Business Profile PDF is Attached!</strong>
                <p style="margin: 10px 0 0 0; color: #666;">Download it from this email or access it anytime from your dashboard.</p>
              </div>

              <p>Congratulations on completing your SRIJON business profile! We've compiled all your information into a comprehensive PDF document that you can use to:</p>
              
              <div class="feature">
                <strong>📧 Share with Potential Buyers</strong>
                <p style="margin: 5px 0 0 0;">Send your professional profile to buyers and business partners.</p>
              </div>
              
              <div class="feature">
                <strong>💼 Present at Meetings</strong>
                <p style="margin: 5px 0 0 0;">Use it in business meetings and networking events.</p>
              </div>
              
              <div class="feature">
                <strong>📋 Apply for Opportunities</strong>
                <p style="margin: 5px 0 0 0;">Attach it to funding applications and business proposals.</p>
              </div>

              <div class="feature">
                <strong>💾 Keep for Records</strong>
                <p style="margin: 5px 0 0 0;">Maintain it as a snapshot of your business information.</p>
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">View Dashboard →</a>
              </p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #666;">
                <strong>💡 Tip:</strong> You can download a fresh copy of your profile anytime from your dashboard using the "Download PDF" button.
              </p>
              
              <p style="margin-top: 20px;">Best regards,<br><strong>The SRIJON Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SRIJON. All rights reserved.</p>
              <p>This email was sent because you completed your business profile on SRIJON.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `SRIJON_Business_Profile_${name.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Business data PDF email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Business data PDF email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send profile update email
export const sendProfileUpdateEmail = async (email, name, pdfBuffer) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SRIJON <noreply@aggrigo.com>',
      to: email,
      subject: '✅ Profile Updated Successfully - SRIJON',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .success { background-color: #d1fae5; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .button { display: inline-block; padding: 14px 32px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .feature { background-color: white; padding: 15px; margin: 12px 0; border-radius: 6px; border-left: 4px solid #22c55e; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .attachment-icon { font-size: 48px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">✅ Profile Updated!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Your Changes Have Been Saved</p>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              
              <div class="success">
                <div class="attachment-icon">📄</div>
                <strong style="font-size: 18px; color: #22c55e;">Your Updated Business Profile PDF is Attached!</strong>
                <p style="margin: 10px 0 0 0; color: #666;">Download it from this email or access it anytime from your dashboard.</p>
              </div>

              <p>Your SRIJON business profile has been successfully updated! We've compiled all your latest information into a comprehensive PDF document.</p>
              
              <div class="feature">
                <strong>📧 Share with Potential Buyers</strong>
                <p style="margin: 5px 0 0 0;">Send your updated professional profile to buyers and business partners.</p>
              </div>
              
              <div class="feature">
                <strong>💼 Present at Meetings</strong>
                <p style="margin: 5px 0 0 0;">Use it in business meetings and networking events.</p>
              </div>
              
              <div class="feature">
                <strong>📋 Apply for Opportunities</strong>
                <p style="margin: 5px 0 0 0;">Attach it to funding applications and business proposals.</p>
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">View Dashboard →</a>
              </p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #666;">
                <strong>💡 Tip:</strong> You can download a fresh copy of your profile anytime from your dashboard using the "Download PDF" button.
              </p>
              
              <p style="margin-top: 20px;">Best regards,<br><strong>The SRIJON Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SRIJON. All rights reserved.</p>
              <p>This email was sent because you updated your business profile on SRIJON.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `SRIJON_Business_Profile_${name.replace(/\s+/g, '_')}_Updated.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Profile update email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Profile update email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Agreement PDF Email (on first form submission)
 * @param {String} email      - Recipient email address
 * @param {String} name       - Recipient full name
 * @param {Buffer} pdfBuffer  - PDF binary
 * @param {String} language   - 'en' (default) or 'bn'
 */
export const sendAgreementPDF = async (email, name, pdfBuffer, language = 'en') => {
  try {
    const transporter = createTransporter();
    const isBangla = language === 'bn';
    const dateStr = new Date().toISOString().split('T')[0];

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SRIJON Platform <noreply@srijon.com>',
      to: email,
      subject: isBangla
        ? 'চুক্তি সম্পন্ন হয়েছে – SRIJON প্ল্যাটফর্ম'
        : 'Agreement Confirmation – SRIJON Platform',
      html: isBangla
        ? getBanglaAgreementEmailHTML(name)
        : getEnglishAgreementEmailHTML(name),
      attachments: [
        {
          filename: `Agreement_${name.replace(/\s+/g, '_')}_${dateStr}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Agreement PDF email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Agreement PDF email send error:', error);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// HTML template helpers for the Agreement email
// ─────────────────────────────────────────────────────────────

/**
 * English HTML body for the Agreement confirmation email.
 * @param {String} name - Recipient full name
 */
const getEnglishAgreementEmailHTML = (name) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .success { background-color: #d1fae5; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
      .button { display: inline-block; padding: 14px 32px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
      .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      .attachment-icon { font-size: 48px; margin: 10px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0; font-size: 32px;">🎉 Congratulations!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Your Registration is Complete</p>
      </div>
      <div class="content">
        <p>Dear <strong>${name}</strong>,</p>

        <div class="success">
          <div class="attachment-icon">📄</div>
          <strong style="font-size: 18px; color: #22c55e;">Your Entrepreneur Participation Agreement is Attached!</strong>
          <p style="margin: 10px 0 0 0; color: #666;">This agreement confirms your registration with the SRIJON platform.</p>
        </div>

        <p>Thank you for completing your business registration with SRIJON! Your Entrepreneur Participation Agreement has been generated and attached to this email.</p>

        <p><strong>What's Next?</strong></p>
        <ul style="line-height: 1.8;">
          <li>Review the attached agreement document</li>
          <li>Keep this document for your records</li>
          <li>Access your dashboard to manage your business profile</li>
          <li>Download a fresh copy anytime from your dashboard</li>
        </ul>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">View Dashboard →</a>
        </p>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #666;">
          <strong>💡 Note:</strong> You can download the agreement PDF anytime from your dashboard using the "Download Agreement PDF" button.
        </p>

        <p style="margin-top: 20px;">Best regards,<br><strong>The SRIJON Team</strong></p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} SRIJON Platform. All rights reserved.</p>
        <p>This email was sent because you completed your registration on the SRIJON platform.</p>
      </div>
    </div>
  </body>
  </html>
`;

/**
 * Bangla HTML body for the Agreement confirmation email.
 * @param {String} name - Recipient full name
 */
const getBanglaAgreementEmailHTML = (name) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .success { background-color: #d1fae5; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
      .button { display: inline-block; padding: 14px 32px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
      .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      .attachment-icon { font-size: 48px; margin: 10px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0; font-size: 32px;">🎉 অভিনন্দন!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">আপনার নিবন্ধন সম্পন্ন হয়েছে</p>
      </div>
      <div class="content">
        <p>প্রিয় <strong>${name}</strong>,</p>

        <div class="success">
          <div class="attachment-icon">📄</div>
          <strong style="font-size: 18px; color: #22c55e;">আপনার উদ্যোক্তা অংশগ্রহণ চুক্তি সংযুক্ত করা আছে!</strong>
          <p style="margin: 10px 0 0 0; color: #666;">এই চুক্তি SRIJON প্ল্যাটফর্মে আপনার নিবন্ধন নিশ্চিত করে।</p>
        </div>

        <p>SRIJON-এ আপনার ব্যবসা নিবন্ধন সম্পন্ন করার জন্য ধন্যবাদ! আপনার উদ্যোক্তা অংশগ্রহণ চুক্তি তৈরি করা হয়েছে এবং এই ইমেইলে সংযুক্ত করা হয়েছে।</p>

        <p><strong>পরবর্তী পদক্ষেপ:</strong></p>
        <ul style="line-height: 1.8;">
          <li>সংযুক্ত চুক্তি নথি পর্যালোচনা করুন</li>
          <li>আপনার রেকর্ডের জন্য এই নথি সংরক্ষণ করুন</li>
          <li>আপনার ব্যবসায়িক প্রোফাইল পরিচালনা করতে আপনার ড্যাশবোর্ড দেখুন</li>
          <li>যেকোনো সময় আপনার ড্যাশবোর্ড থেকে একটি নতুন কপি ডাউনলোড করুন</li>
        </ul>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">ড্যাশবোর্ড দেখুন →</a>
        </p>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #666;">
          <strong>💡 নোট:</strong> আপনি যেকোনো সময় আপনার ড্যাশবোর্ড থেকে "চুক্তিপত্র PDF ডাউনলোড করুন" বোতাম ব্যবহার করে চুক্তি PDF ডাউনলোড করতে পারবেন।
        </p>

        <p style="margin-top: 20px;">শুভেচ্ছা,<br><strong>SRIJON টিম</strong></p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} SRIJON প্ল্যাটফর্ম। সর্বস্বত্ব সংরক্ষিত।</p>
        <p>আপনি SRIJON প্ল্যাটফর্মে নিবন্ধন সম্পন্ন করেছেন বলে এই ইমেইলটি পাঠানো হয়েছে।</p>
      </div>
    </div>
  </body>
  </html>
`;

export default {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendRegistrationCompleteEmail,
  sendOTPEmail,
  sendBusinessDataPDF,
  sendProfileUpdateEmail,
  sendAgreementPDF
};
