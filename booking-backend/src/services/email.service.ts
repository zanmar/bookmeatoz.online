import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import logger from '@/utils/logger';
import { User, Booking, Business, Service, Tenant } from '@/types'; // Import relevant types
import { AppError } from '@/utils/errorHandler';
import { Customer } from '@/types/customer.types';
import { Employee } from '@/types/employee.types';
import { formatInTimeZone } from '@/utils/timezone.utils';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  attachments?: Mail.Attachment[];
}

// --- Email Transporter Setup ---
let transporter: Mail;

const initializeTransporter = async () => {
  if (transporter) return;

  if (process.env.NODE_ENV === 'development' && process.env.EMAIL_PREVIEW_MODE === 'true') {
    // Use Ethereal for development/preview if configured
    if (
      process.env.EMAIL_HOST === 'smtp.ethereal.email' &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      logger.info('Nodemailer Ethereal transporter initialized for email previews.');
    } else {
      // Fallback to console logging if Ethereal not fully configured for preview
      logger.warn(
        'EMAIL_PREVIEW_MODE is true, but Ethereal is not fully configured. Emails will be logged to console.'
      );
      transporter = {
        sendMail: async (options: EmailOptions) => {
          logger.info(`[EMAIL PREVIEW] To: ${options.to}`);
          logger.info(`[EMAIL PREVIEW] Subject: ${options.subject}`);
          // logger.info(`[EMAIL PREVIEW] HTML Body:\n${options.html}`);
          logger.info(`[EMAIL PREVIEW] Text Body:\n${options.text || 'No text body'}`);
          return { messageId: `preview-${Date.now()}` };
        },
      } as any; // Cast to Mail type for consistency
    }
  } else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Production or configured SMTP transporter
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // Max 10 emails per second
    });
    logger.info('Nodemailer SMTP transporter initialized.');
  } else {
    logger.error(
      'Email transporter not configured. EMAIL_HOST, EMAIL_USER, EMAIL_PASS are required.'
    );
    // Fallback to console logging if no transporter configured at all
    transporter = {
      sendMail: async (options: EmailOptions) => {
        logger.warn(`[NO EMAIL TRANSPORTER] To: ${options.to}`);
        logger.warn(`[NO EMAIL TRANSPORTER] Subject: ${options.subject}`);
        return { messageId: `no-transporter-${Date.now()}` };
      },
    } as any;
  }
};

initializeTransporter(); // Initialize on load

// --- Email Sending Function ---
const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!transporter) {
    logger.error('Email transporter is not initialized. Cannot send email.');
    // In a real app, you might queue this or throw a more specific error.
    // For now, we just log and skip.
    await initializeTransporter(); // Attempt to re-initialize
    if (!transporter || typeof (transporter as any).sendMail !== 'function') {
      logger.error('Re-initialization failed or transporter still invalid.');
      return;
    }
  }

  const mailOptions: Mail.Options = {
    from: `"${process.env.EMAIL_FROM_NAME || 'BookMeAtOz'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com'}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  };

  try {
    // In a production system, this should be offloaded to a queue (e.g., BullMQ, RabbitMQ)
    // to avoid blocking the main application thread and to handle retries.
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${options.to} (Subject: ${options.subject})`);
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.EMAIL_PREVIEW_MODE === 'true' &&
      nodemailer.getTestMessageUrl(info)
    ) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error('Error sending email:', { error, to: options.to, subject: options.subject });
    // TODO: Implement retry mechanism or dead-letter queue for failed emails
    throw new AppError('Failed to send email.', 500); // Or handle more gracefully
  }
};

// --- Email Template Functions (Basic Examples) ---
// In a real app, use a templating engine like Handlebars, EJS, or Pug, or a dedicated email templating service.

const getEmailWrapper = (title: string, content: string, preheader?: string): string => {
  return `
    <!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background-color:#f4f4f4;} .container{background-color:#ffffff;padding:20px;border-radius:8px;max-width:600px;margin:auto;} h1{color:#333;} p{color:#555;line-height:1.6;}</style></head>
    <body><div class="container">
      ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
      <h1>${title}</h1>
      ${content}
      <p>Thanks,<br/>The BookMeAtOz Team</p>
      <p style="font-size:10px; color:#999; text-align:center;">&copy; ${new Date().getFullYear()} BookMeAtOz.online</p>
    </div></body></html>
  `;
};

export const emailService = {
  sendWelcomeEmail: async (user: Pick<User, 'email' | 'profile'>, verificationToken: string) => {
    const userName = user.profile?.name || user.email.split('@')[0];
    // TODO: Construct verificationLink based on frontend URL
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
    const subject = 'Welcome to BookMeAtOz! Please Verify Your Email';
    const content = `
      <p>Hi ${userName},</p>
      <p>Welcome to BookMeAtOz! We're excited to have you on board.</p>
      <p>Please click the link below to verify your email address and activate your account:</p>
      <p><a href="${verificationLink}" style="color:#06b6d4;text-decoration:none;font-weight:bold;">Verify Email Address</a></p>
      <p>If you did not sign up for BookMeAtOz, please ignore this email.</p>
    `;
    const html = getEmailWrapper(
      'Welcome to BookMeAtOz!',
      content,
      'Verify your email to get started.'
    );
    await sendEmail({
      to: user.email,
      subject,
      html,
      text: `Hi ${userName}, Welcome! Verify your email: ${verificationLink}`,
    });
  },

  sendPasswordResetEmail: async (userEmail: string, resetToken: string) => {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    const subject = 'BookMeAtOz Password Reset Request';
    const content = `
      <p>Hello,</p>
      <p>We received a request to reset the password for your BookMeAtOz account associated with this email.</p>
      <p>If you made this request, please click the link below to set a new password:</p>
      <p><a href="${resetLink}" style="color:#06b6d4;text-decoration:none;font-weight:bold;">Reset Your Password</a></p>
      <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
    `;
    const html = getEmailWrapper('Password Reset', content, 'Reset your BookMeAtOz password.');
    await sendEmail({ to: userEmail, subject, html, text: `Reset your password: ${resetLink}` });
  },

  sendBookingConfirmationEmail: async (
    recipientEmail: string,
    booking: Booking,
    customer: Pick<Customer, 'name'>,
    business: Pick<Business, 'name' | 'timezone'>,
    service: Pick<Service, 'name' | 'duration'>,
    employee?: { name: string } // Employee.name from users.profile
  ) => {
    const subject = `Booking Confirmed: ${service.name} at ${business.name}`;
    const bookingStartTimeInBusinessTZ = formatInTimeZone(
      booking.start_time,
      'MMMM d, yyyy h:mm a zzz',
      business.timezone
    );

    const content = `
      <p>Hi ${customer.name},</p>
      <p>Your booking for <strong>${service.name}</strong> at <strong>${business.name}</strong> is confirmed!</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li><strong>Service:</strong> ${service.name} (${service.duration} minutes)</li>
        <li><strong>Date & Time:</strong> ${bookingStartTimeInBusinessTZ}</li>
        ${employee?.name ? `<li><strong>With:</strong> ${employee.name}</li>` : ''}
        <li><strong>Business:</strong> ${business.name}</li>
      </ul>
      <p>Booking ID: ${booking.id}</p>
      <p>We look forward to seeing you!</p>
    `;
    // TODO: Add links to manage booking, business address, contact info.
    const html = getEmailWrapper(
      'Booking Confirmation',
      content,
      `Your booking for ${service.name} is confirmed.`
    );
    await sendEmail({ to: recipientEmail, subject, html });

    // TODO: Send notification to business/employee as well.
  },

  sendBookingReminderEmail: async (
    recipientEmail: string,
    booking: Booking,
    customerName: string,
    businessName: string,
    businessTimezone: string,
    serviceName: string,
    reminderType: '24h' | '1h'
  ) => {
    const subject = `Reminder: Your booking for ${serviceName} is ${reminderType === '24h' ? 'tomorrow' : 'soon'}!`;
    const bookingStartTimeInBusinessTZ = formatInTimeZone(
      booking.start_time,
      'MMMM d, yyyy h:mm a zzz',
      businessTimezone
    );
    const content = `
        <p>Hi ${customerName},</p>
        <p>This is a friendly reminder about your upcoming booking for <strong>${serviceName}</strong> at <strong>${businessName}</strong>.</p>
        <p><strong>Date & Time:</strong> ${bookingStartTimeInBusinessTZ}</p>
        <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
    `;
    const html = getEmailWrapper('Booking Reminder', content);
    await sendEmail({ to: recipientEmail, subject, html });
  },

  // Conceptual: Employee Invitation Email
  sendEmployeeInvitationEmail: async (
    inviteeEmail: string,
    businessName: string,
    invitationToken: string,
    inviterName?: string
  ) => {
    const subject = `You're invited to join ${businessName} on BookMeAtOz!`;
    const setupLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation/${invitationToken}`;
    const content = `
      <p>Hello,</p>
      <p>${inviterName || `The team at ${businessName}`} has invited you to join their business on BookMeAtOz as an employee/staff member.</p>
      <p>Please click the link below to accept the invitation and set up your account:</p>
      <p><a href="${setupLink}" style="color:#06b6d4;text-decoration:none;font-weight:bold;">Accept Invitation & Set Up Account</a></p>
      <p>This invitation will expire in 7 days.</p>
    `;
    const html = getEmailWrapper('Employee Invitation', content);
    await sendEmail({ to: inviteeEmail, subject, html });
  },

  // TODO: Implement other email templates:
  // - Booking cancellation/rescheduling (to customer, business, employee)
};

// Queue System Conceptual Note:
// For production, `sendEmail` should not directly call `transporter.sendMail()`.
// Instead, it should add the email job to a persistent queue (e.g., BullMQ with Redis, RabbitMQ, AWS SQS).
// A separate worker process would then pick up jobs from the queue and use `transporter.sendMail()`.
// This makes email sending asynchronous, resilient to failures, and allows for retries.
// Example with BullMQ (conceptual):
// import { Queue } from 'bullmq';
// const emailQueue = new Queue('emailSendingQueue', { connection: { host: 'redis', port: 6379 }});
// async function addEmailToQueue(options: EmailOptions) {
//   await emailQueue.add('sendEmailJob', options);
// }
// // Worker:
// import { Worker } from 'bullmq';
// const emailWorker = new Worker('emailSendingQueue', async job => {
//   await transporter.sendMail(job.data as Mail.Options);
// }, { connection: { host: 'redis', port: 6379 }});
