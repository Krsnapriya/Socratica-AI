const nodemailer = require('nodemailer');

let transporter = null;

// Simple per-recipient hourly rate limiter (in-memory)
const emailSendLog = new Map();
const EMAIL_HOURLY_LIMIT = parseInt(process.env.EMAIL_HOURLY_LIMIT || "10", 10);

function allowEmailSend(to) {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const stamps = (emailSendLog.get(to) || []).filter((t) => t > windowStart);
  if (stamps.length >= EMAIL_HOURLY_LIMIT) return false;
  stamps.push(now);
  emailSendLog.set(to, stamps);
  return true;
}

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

  if (!allowEmailSend(to)) {
    console.log(`[email] Rate-limited ${to} (hourly cap reached)`);
    return { sent: false, reason: 'rate-limited' };
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

async function sendWelcomeEmail(email, displayName) {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return sendEmail({
    to: email,
    subject: 'Welcome to Socratica AI',
    text: `Hi ${displayName || ''},\n\nWelcome to Socratica AI — your AI-powered coding mentor.\n\nHere's how to get started:\n1. Head to the Curriculum to begin your learning path.\n2. Open your first problem in the Workspace.\n3. Run sample tests, then submit. The AI mentor is here whenever you're stuck.\n\nStart learning: ${baseUrl}/dashboard\n\nHappy coding!\nThe Socratica AI Team`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#4f46e5;">Socratica AI</h1>
      <p>Hi ${displayName || 'there'}, welcome aboard!</p>
      <p>You now have an AI mentor that teaches you to code the Socratic way — guiding with questions, not answers.</p>
      <ol style="color:#444;font-size:14px;line-height:1.6;">
        <li>Open the <strong>Curriculum</strong> to start your learning path.</li>
        <li>Open a problem in the <strong>Workspace</strong>.</li>
        <li>Run sample tests, then submit. Stuck? Ask the <strong>AI Mentor</strong>.</li>
      </ol>
      <a href="${baseUrl}/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
        Start Learning
      </a>
      <p style="color:#666;font-size:14px;">Happy coding!</p>
    </div>`,
  });
}

async function sendProgressEmail({ email, displayName, problemTitle, totalSolved, totalAttempted }) {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const milestones = [1, 5, 10, 25, 50, 100];
  const isMilestone = milestones.includes(totalSolved);
  const subject = isMilestone
    ? `🎉 Milestone reached: ${totalSolved} problems solved on Socratica AI`
    : `Progress update: you solved "${problemTitle}"`;

  return sendEmail({
    to: email,
    subject,
    text: `Hi ${displayName || ''},\n\nGreat work! You just solved "${problemTitle}".\n\nTotal problems solved: ${totalSolved}\nTotal problems attempted: ${totalAttempted}\n\n${isMilestone ? `That's ${totalSolved} problems — keep it up!` : 'Keep the momentum going — your next challenge is waiting.'}\n\nContinue: ${baseUrl}/workspace`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#4f46e5;">Socratica AI</h1>
      <p>Hi ${displayName || 'there'}, great work!</p>
      <p style="font-size:15px;line-height:1.6;">You just solved <strong>"${problemTitle}"</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:10px;background:#f1f5f9;border-radius:8px;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#4f46e5;">${totalSolved}</div>
            <div style="color:#666;font-size:12px;">Problems solved</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:10px;background:#f1f5f9;border-radius:8px;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#4f46e5;">${totalAttempted}</div>
            <div style="color:#666;font-size:12px;">Attempted</div>
          </td>
        </tr>
      </table>
      ${isMilestone ? `<p style="font-size:16px;font-weight:bold;color:#4f46e5;">🎉 ${totalSolved} problems solved — keep it up!</p>` : ''}
      <a href="${baseUrl}/workspace" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
        Keep Coding
      </a>
      <p style="color:#666;font-size:14px;">Happy coding!</p>
    </div>`,
  });
}

function isEmailConfigured() {
  return Boolean(
    process.env.SENDGRID_API_KEY ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

async function notifyProblemSolved({ userId, problemId, problemTitle }) {
  if (!isEmailConfigured()) return { sent: false, reason: 'SMTP not configured' };

  const User = require("../models/User");
  const Submission = require("../models/Submission");

  const user = await User.findById(userId).lean();
  if (!user || !user.email) return { sent: false, reason: 'no email' };

  const firstPass = await Submission.countDocuments({ userId, problemId, verdict: "pass" });
  if (firstPass !== 1) return { sent: false, reason: 'not a new solve' };

  const [solved, attempted] = await Promise.all([
    Submission.distinct("problemId", { userId, verdict: "pass" }),
    Submission.distinct("problemId", { userId }),
  ]);

  return sendProgressEmail({
    email: user.email,
    displayName: user.displayName,
    problemTitle,
    totalSolved: solved.length,
    totalAttempted: attempted.length,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendProgressEmail, notifyProblemSolved, sendEmail, isEmailVerificationRequired, isEmailConfigured };
