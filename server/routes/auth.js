const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const FailedLogin = require("../models/FailedLogin");
const requireAuth = require("../middleware/requireAuth");
const { revokeToken, isRevoked } = require("../middleware/tokenBlacklist");
const { validate, schemas } = require("../middleware/validate");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("[FATAL] JWT_SECRET environment variable is required but not set");
  process.exit(1);
}

// One-time setup: promote first user to admin if no admin exists
router.post("/setup-admin", async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: { $in: ["admin", "super_admin"] } });
    if (adminCount > 0) return res.status(400).json({ error: "Admin already exists" });
    const user = await User.findOneAndUpdate({ email: req.body.email }, { role: "admin" }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Admin promoted", email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Sign a JWT with a unique jti so individual tokens can be revoked */
async function signToken(userId) {
  const user = await User.findById(userId).lean();
  const jti = crypto.randomUUID();
  const payload = { userId, jti, type: "access", tokenVersion: user?.tokenVersion || 0 };
  return {
    token: jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" }),
    refreshToken: jwt.sign({ userId, jti: crypto.randomUUID(), type: "refresh", tokenVersion: user?.tokenVersion || 0 }, JWT_SECRET, { expiresIn: "7d" }),
    jti,
  };
}

function validatePassword(password) {
  if (!password || password.length < 12) return "Password must be at least 12 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character";
  return null;
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", validate(schemas.register), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const passwordErr = validatePassword(password);
  if (passwordErr) {
    return res.status(400).json({ error: passwordErr });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const displayName = email.split("@")[0];
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      email, passwordHash, displayName,
      emailVerifyToken,
      emailVerifyTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      emailVerified: false,
    });

    const adminCount = await User.countDocuments({ role: { $in: ["admin", "super_admin"] } });
    if (adminCount === 0) {
      user.role = "admin";
      await user.save();
    }

    sendVerificationEmail(email, emailVerifyToken);

    const { token, refreshToken } = await signToken(user._id);

    await AuditLog.create({
      userId: user._id, action: "register", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
    });

    res.status(201).json({
      email, token, refreshToken, userId: user._id, displayName: user.displayName,
      role: user.role, emailVerified: false,
    });
  } catch (err) {
    console.error("[auth] Registration error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", validate(schemas.login), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      await AuditLog.create({
        action: "login_failed", resource: "user", resourceId: email,
        ip: req.ip, userAgent: req.headers["user-agent"], success: false,
        metadata: { reason: "user_not_found" },
      });
      await FailedLogin.create({ email, ip: req.ip, userAgent: req.headers["user-agent"], reason: "user_not_found" });
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await AuditLog.create({
        userId: user._id, action: "login_failed", resource: "user", resourceId: user._id.toString(),
        ip: req.ip, userAgent: req.headers["user-agent"], success: false,
        metadata: { reason: "wrong_password" },
      });
      await FailedLogin.create({ email, ip: req.ip, userAgent: req.headers["user-agent"], reason: "wrong_password", userId: user._id });
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    const { token, refreshToken } = await signToken(user._id);
    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date(), lastActiveAt: new Date() } });

    await AuditLog.create({
      userId: user._id, action: "login", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
    });

    res.status(200).json({
      email,
      token,
      refreshToken,
      userId: user._id,
      displayName: user.displayName,
      role: user.role,
      emailVerified: user.emailVerified,
    });
  } catch (err) {
    console.error("[auth] Login error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Logout (token revocation) ─────────────────────────────────────────────────
router.post("/logout", requireAuth, async (req, res) => {
  try {
    // req.tokenJti and req.tokenExp are set by requireAuth
    // revokeToken may fail if Redis is unavailable — don't let that block logout
    await revokeToken(req.tokenJti, req.tokenExp).catch(err =>
      console.warn("[auth] Logout: revokeToken failed (non-fatal):", err.message)
    );
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("[auth] Logout error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Refresh token ──────────────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== "refresh") return res.status(401).json({ error: "Invalid token type" });

    const revoked = await isRevoked(decoded.jti);
    if (revoked) return res.status(401).json({ error: "Token revoked" });

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    const { token: newAccessToken, refreshToken: newRefreshToken } = await signToken(user._id);
    await revokeToken(decoded.jti, decoded.exp);

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// ── Verify email ───────────────────────────────────────────────────────────────
router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Verification token required" });

  try {
    const user = await User.findOne({ emailVerifyToken: token, emailVerifyTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired verification token" });

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyTokenExpires = undefined;
    await user.save();

    await AuditLog.create({
      userId: user._id, action: "email_verified", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
    });

    res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.error("[auth] Verify email error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Resend verification email ────────────────────────────────────────────────
router.post("/resend-verification", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (user.emailVerified) {
      return res.json({ success: true, message: "Email already verified" });
    }

    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    sendVerificationEmail(user.email, emailVerifyToken);

    await AuditLog.create({
      userId: user._id, action: "resend_verification", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
    });

    res.json({ success: true, message: "Verification email sent" });
  } catch (err) {
    console.error("[auth] Resend verification error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Forgot password ────────────────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: "If the email exists, a reset link has been sent." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    sendPasswordResetEmail(email, resetToken);

    await AuditLog.create({
      userId: user._id, action: "password_reset_requested", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
    });

    res.json({ success: true, message: "If the email exists, a reset link has been sent." });
  } catch (err) {
    console.error("[auth] Forgot password error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Reset password ─────────────────────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token and password required" });

  const passwordErr = validatePassword(password);
  if (passwordErr) return res.status(400).json({ error: passwordErr });

  try {
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await AuditLog.create({
      userId: user._id, action: "password_reset", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
    });

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("[auth] Reset password error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get current user profile ──────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId, { passwordHash: 0 }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[auth] /me error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update user profile ───────────────────────────────────────────────────────
router.put("/me", requireAuth, async (req, res) => {
  const { displayName, bio, preferences } = req.body;
  try {
    const update = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (bio !== undefined) update.bio = bio;
    if (preferences !== undefined) update.preferences = { ...preferences };

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true, projection: { passwordHash: 0 } }
    ).lean();

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[auth] PUT /me error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Google OAuth (ID Token verification) ──────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "Google ID token is required" });

    const { OAuth2Client } = require("google-auth-library");
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      console.error("[auth/google] Token verification failed:", verifyErr.message);
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Existing user — link Google if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = "google";
        if (!user.emailVerified) user.emailVerified = true;
        await user.save();
      }
    } else {
      // New user — create without password
      user = await User.create({
        email,
        googleId,
        provider: "google",
        displayName: name || email.split("@")[0],
        emailVerified: true,
        role: "student",
      });
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date(), lastActiveAt: new Date() } });

    const { token, refreshToken } = await signToken(user._id);

    await AuditLog.create({
      userId: user._id, action: "login_google", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
    });

    res.status(200).json({
      email: user.email,
      token,
      refreshToken,
      userId: user._id,
      displayName: user.displayName,
      role: user.role,
      emailVerified: true,
    });
  } catch (err) {
    console.error("[auth] Google OAuth error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
