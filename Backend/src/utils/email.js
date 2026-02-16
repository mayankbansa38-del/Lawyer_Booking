/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Email Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Email sending functionality using Nodemailer.
 * 
 * @module utils/email
 */

import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from './logger.js';

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORTER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create nodemailer transporter
 */
let transporter = null;

/**
 * Get or create email transporter
 * @returns {import('nodemailer').Transporter}
 */
function getTransporter() {
  if (!transporter) {
    if (!env.SMTP_HOST || !env.SMTP_USER) {
      logger.warn('⚠️  Email not configured (SMTP credentials missing)');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    logger.info('✅ Email transporter initialized');
  }

  return transporter;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL SENDING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send email
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail({ to, subject, text, html }) {
  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    logger.warn('Email not sent (transporter not configured):', { to, subject });
    return { accepted: [], rejected: [to], messageId: null };
  }

  try {
    const result = await emailTransporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject,
      error: error.message,
    });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base email template wrapper
 * @param {string} content - Email content
 * @returns {string} Wrapped HTML
 */
function wrapEmailTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #0c1f3f;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #0c1f3f;
    }
    .logo span {
      color: #cfa052;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 12px;
    }
    .info-box {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .info-row {
      display: flex;
      margin: 5px 0;
    }
    .info-label {
      font-weight: 600;
      width: 120px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Nyay<span>Booker</span></div>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} NyayBooker. All rights reserved.</p>
    <p>This is an automated email. Please do not reply directly.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send email verification email
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.token - Verification token
 * @returns {Promise<Object>} Send result
 */
export async function sendVerificationEmail({ to, name, token }) {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = wrapEmailTemplate(`
    <h2>Verify Your Email Address</h2>
    <p>Hi ${name},</p>
    <p>Thank you for registering with NyayBooker. Please verify your email address by clicking the button below:</p>
    <p style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Email</a>
    </p>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account with us, you can safely ignore this email.</p>
  `);

  return sendEmail({
    to,
    subject: 'Verify Your Email - NyayBooker',
    html,
    text: `Hi ${name},\n\nPlease verify your email by visiting: ${verificationUrl}\n\nThis link expires in 24 hours.`,
  });
}

/**
 * Send password reset email
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.token - Reset token
 * @returns {Promise<Object>} Send result
 */
export async function sendPasswordResetEmail({ to, name, token }) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = wrapEmailTemplate(`
    <h2>Reset Your Password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  `);

  return sendEmail({
    to,
    subject: 'Reset Your Password - NyayBooker',
    html,
    text: `Hi ${name},\n\nReset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}

/**
 * Send booking confirmation email
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Client name
 * @param {Object} options.booking - Booking details
 * @param {Object} options.lawyer - Lawyer details
 * @returns {Promise<Object>} Send result
 */
export async function sendBookingConfirmationEmail({ to, name, booking, lawyer }) {
  const bookingUrl = `${env.FRONTEND_URL}/bookings/${booking.id}`;

  const html = wrapEmailTemplate(`
    <h2>Booking Confirmed!</h2>
    <p>Hi ${name},</p>
    <p>Your consultation has been confirmed. Here are the details:</p>
    
    <div class="info-box">
      <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
      <p><strong>Lawyer:</strong> ${lawyer.name}</p>
      <p><strong>Specialization:</strong> ${lawyer.specialization}</p>
      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.time}</p>
      <p><strong>Duration:</strong> ${booking.duration} minutes</p>
      <p><strong>Meeting Type:</strong> ${booking.meetingType}</p>
      ${booking.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : ''}
    </div>
    
    <p style="text-align: center;">
      <a href="${bookingUrl}" class="button">View Booking Details</a>
    </p>
    
    <p><strong>Important:</strong></p>
    <ul>
      <li>Please be ready 5 minutes before the scheduled time</li>
      <li>Have any relevant documents ready to share</li>
      <li>Ensure a stable internet connection for video consultations</li>
    </ul>
    
    <p>Need to reschedule? <a href="${bookingUrl}">Click here</a> to manage your booking.</p>
  `);

  return sendEmail({
    to,
    subject: `Booking Confirmed - ${booking.bookingNumber} | NyayBooker`,
    html,
    text: `Hi ${name},\n\nYour booking (${booking.bookingNumber}) with ${lawyer.name} on ${booking.date} at ${booking.time} has been confirmed.\n\nView details: ${bookingUrl}`,
  });
}

/**
 * Send booking cancellation email
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {Object} options.booking - Booking details
 * @param {string} options.reason - Cancellation reason
 * @returns {Promise<Object>} Send result
 */
export async function sendBookingCancellationEmail({ to, name, booking, reason }) {
  const html = wrapEmailTemplate(`
    <h2>Booking Cancelled</h2>
    <p>Hi ${name},</p>
    <p>Your booking has been cancelled. Here are the details:</p>
    
    <div class="info-box">
      <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
      <p><strong>Original Date:</strong> ${booking.date}</p>
      <p><strong>Original Time:</strong> ${booking.time}</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    </div>
    
    <p>If a payment was made, a refund will be processed within 5-7 business days.</p>
    
    <p style="text-align: center;">
      <a href="${env.FRONTEND_URL}/lawyers" class="button">Book Another Consultation</a>
    </p>
  `);

  return sendEmail({
    to,
    subject: `Booking Cancelled - ${booking.bookingNumber} | NyayBooker`,
    html,
    text: `Hi ${name},\n\nYour booking (${booking.bookingNumber}) scheduled for ${booking.date} at ${booking.time} has been cancelled.\n\n${reason ? `Reason: ${reason}` : ''}`,
  });
}

/**
 * Send booking reminder email
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {Object} options.booking - Booking details
 * @param {Object} options.lawyer - Lawyer details
 * @returns {Promise<Object>} Send result
 */
export async function sendBookingReminderEmail({ to, name, booking, lawyer }) {
  const bookingUrl = `${env.FRONTEND_URL}/bookings/${booking.id}`;

  const html = wrapEmailTemplate(`
    <h2>Upcoming Consultation Reminder</h2>
    <p>Hi ${name},</p>
    <p>This is a reminder for your upcoming consultation:</p>
    
    <div class="info-box">
      <p><strong>Lawyer:</strong> ${lawyer.name}</p>
      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.time}</p>
      <p><strong>Duration:</strong> ${booking.duration} minutes</p>
      ${booking.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : ''}
    </div>
    
    <p style="text-align: center;">
      <a href="${bookingUrl}" class="button">View Booking</a>
    </p>
    
    <p>Please be ready 5 minutes before the scheduled time.</p>
  `);

  return sendEmail({
    to,
    subject: `Reminder: Consultation Tomorrow | NyayBooker`,
    html,
    text: `Hi ${name},\n\nReminder: You have a consultation with ${lawyer.name} on ${booking.date} at ${booking.time}.\n\nView details: ${bookingUrl}`,
  });
}

/**
 * Send welcome email after registration
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.role - User role
 * @returns {Promise<Object>} Send result
 */
export async function sendWelcomeEmail({ to, name, role }) {
  const isLawyer = role === 'LAWYER';
  const dashboardUrl = isLawyer
    ? `${env.FRONTEND_URL}/lawyer/dashboard`
    : `${env.FRONTEND_URL}/dashboard`;

  const html = wrapEmailTemplate(`
    <h2>Welcome to NyayBooker!</h2>
    <p>Hi ${name},</p>
    <p>Welcome to NyayBooker! We're excited to have you on board.</p>
    
    ${isLawyer ? `
    <p>As a legal professional, you can now:</p>
    <ul>
      <li>Set up your professional profile</li>
      <li>Define your availability and pricing</li>
      <li>Receive booking requests from clients</li>
      <li>Manage your consultations efficiently</li>
    </ul>
    <p><strong>Next Step:</strong> Complete your profile verification to start receiving bookings.</p>
    ` : `
    <p>With NyayBooker, you can:</p>
    <ul>
      <li>Find verified legal professionals</li>
      <li>Book consultations online</li>
      <li>Manage your appointments easily</li>
      <li>Get the legal help you need</li>
    </ul>
    <p><strong>Next Step:</strong> Browse our network of lawyers and book your first consultation.</p>
    `}
    
    <p style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
    </p>
    
    <p>Need help? Contact our support team anytime.</p>
  `);

  return sendEmail({
    to,
    subject: 'Welcome to NyayBooker!',
    html,
    text: `Hi ${name},\n\nWelcome to NyayBooker! Visit your dashboard to get started: ${dashboardUrl}`,
  });
}

/**
 * Send payment confirmation email to CLIENT (receipt)
 * 
 * @param {Object} options
 * @param {string} options.to - Client email
 * @param {string} options.name - Client name
 * @param {Object} options.payment - Payment details
 * @param {Object} options.booking - Booking details
 * @param {Object} options.lawyer - Lawyer info { name }
 * @returns {Promise<Object>} Send result
 */
export async function sendPaymentConfirmationEmail({ to, name, payment, booking, lawyer }) {
  const amount = Number(payment.amount).toLocaleString('en-IN');
  const date = new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const txnId = payment.gatewayPaymentId || payment.id;

  const html = wrapEmailTemplate(`
    <h2>Payment Successful!</h2>
    <p>Hi ${name},</p>
    <p>Your payment has been processed successfully. Here's your receipt:</p>
    
    <div class="info-box" style="border-left: 4px solid #22c55e;">
      <p><strong>Transaction ID:</strong> ${txnId}</p>
      <p><strong>Amount Paid:</strong> ₹${amount}</p>
      <p><strong>Payment Method:</strong> ${payment.method || 'Card'}</p>
      <p><strong>Date:</strong> ${new Date(payment.processedAt || payment.createdAt).toLocaleString('en-IN')}</p>
    </div>
    
    <div class="info-box">
      <p style="font-weight: 600; margin-bottom: 8px;">Booking Details</p>
      <p><strong>Booking #:</strong> ${booking.bookingNumber}</p>
      <p><strong>Advocate:</strong> ${lawyer.name}</p>
      <p><strong>Consultation Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${booking.scheduledTime}</p>
      <p><strong>Duration:</strong> ${booking.duration || 60} minutes</p>
      <p><strong>Type:</strong> ${booking.meetingType || 'Video'}</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${env.FRONTEND_URL}/user/payments" class="button">View Payment History</a>
    </p>
    
    <p style="color: #666; font-size: 13px;">If you have any questions about this payment, please contact our support team.</p>
  `);

  return sendEmail({
    to,
    subject: `Payment Receipt - ₹${amount} | NyayBooker`,
    html,
    text: `Hi ${name},\n\nYour payment of ₹${amount} to ${lawyer.name} has been processed.\nTransaction ID: ${txnId}\nBooking #: ${booking.bookingNumber}\n\nView details: ${env.FRONTEND_URL}/user/payments`,
  });
}

/**
 * Send payment received email to LAWYER (notification)
 * 
 * @param {Object} options
 * @param {string} options.to - Lawyer email
 * @param {string} options.name - Lawyer name
 * @param {Object} options.payment - Payment details
 * @param {Object} options.booking - Booking details
 * @param {Object} options.client - Client info { name }
 * @returns {Promise<Object>} Send result
 */
export async function sendPaymentReceivedEmail({ to, name, payment, booking, client }) {
  const amount = Number(payment.amount).toLocaleString('en-IN');
  const date = new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const html = wrapEmailTemplate(`
    <h2>New Payment Received!</h2>
    <p>Hi ${name},</p>
    <p>Great news! You've received a new payment for a consultation booking.</p>
    
    <div class="info-box" style="border-left: 4px solid #2563eb;">
      <p style="font-size: 24px; font-weight: 700; color: #22c55e; margin: 0;">₹${amount}</p>
      <p style="color: #666; margin-top: 4px;">Payment from ${client.name}</p>
    </div>
    
    <div class="info-box">
      <p><strong>Booking #:</strong> ${booking.bookingNumber}</p>
      <p><strong>Client:</strong> ${client.name}</p>
      <p><strong>Consultation Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${booking.scheduledTime}</p>
      <p><strong>Duration:</strong> ${booking.duration || 60} minutes</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${env.FRONTEND_URL}/lawyer/earnings" class="button">View Earnings</a>
    </p>
  `);

  return sendEmail({
    to,
    subject: `Payment Received - ₹${amount} from ${client.name} | NyayBooker`,
    html,
    text: `Hi ${name},\n\nYou received ₹${amount} from ${client.name}.\nBooking #: ${booking.bookingNumber}\nDate: ${date} at ${booking.scheduledTime}\n\nView earnings: ${env.FRONTEND_URL}/lawyer/earnings`,
  });
}

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendBookingReminderEmail,
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendPaymentReceivedEmail,
};
