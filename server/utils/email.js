const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // SendGrid API support (preferred for production)
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: { api_key: sendgridKey },
    });
    return transporter;
  }

  // Generic SMTP support
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[email] SMTP not configured — emails will be logged to console only');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

function isEmailVerificationRequired() {
  return process.env.SKIP_EMAIL_VERIFICATION !== 'true' && process.env.NODE_ENV === 'production';
}

async function sendEmail({ to, subject, text, html }) {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || 'noreply@socratica.ai';

  if (!transport) {
    console.log(`[email] (console) To: ${to} | Subject: ${subject}`);
    console.log(`[email] Body: ${text || html}`);
    return { sent: false, reason: 'SMTP not configured' };
  }

  try {
    const info = await transport.sendMail({ from, to, subject, text, html });
    console.log(`[email] Sent: ${info.messageId} -> ${to}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[email] Failed to send to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

async function sendVerificationEmail(email, token) {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const link = `${baseUrl}/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: 'Verify your Socratica AI account',
    text: `Welcome to Socratica AI!\n\nPlease verify your email address by clicking this link:\n${link}\n\nThis link expires in 24 hours.\n\nIf you did not create an account, you can safely ignore this email.`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#4f46e5;">Socratica AI</h1>
      <p>Welcome! Please verify your email address:</p>
      <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
        Verify Email
      </a>
      <p style="color:#666;font-size:14px;">This link expires in 24 hours.</p>
    </div>`,
  });
}

async function sendPasswordResetEmail(email, token) {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const link = `${baseUrl}/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: 'Reset your Socratica AI password',
    text: `A password reset was requested for your Socratica AI account.\n\nClick this link to reset your password:\n${link}\n\nThis link expires in 1 hour.\n\nIf you did not request this, you can safely ignore this email.`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#4f46e5;">Socratica AI</h1>
      <p>A password reset was requested for your account.</p>
      <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#666;font-size:14px;">This link expires in 1 hour.</p>
    </div>`,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendEmail, isEmailVerificationRequired };
