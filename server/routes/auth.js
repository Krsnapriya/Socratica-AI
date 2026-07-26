const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const requireAuth = require("../middleware/requireAuth");
const { revokeToken, isRevoked } = require("../middleware/tokenBlacklist");
const { validate, schemas } = require("../middleware/validate");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email");
const LocalUserStore = require("../localUserStore");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("[FATAL] JWT_SECRET environment variable is required but not set");
  process.exit(1);
}

// Check if MongoDB is actually connected and usable
function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

// Lazy-load User model only when Mongo is ready
function getUserModel() {
  if (!isMongoReady()) return null;
  try {
    return require("../models/User");
  } catch (e) {
    return null;
  }
}

function getAuditModel() {
  if (!isMongoReady()) return null;
  try {
    return require("../models/AuditLog");
  } catch (e) {
    return null;
  }
}

function getFailedLoginModel() {
  if (!isMongoReady()) return null;
  try {
    return require("../models/FailedLogin");
  } catch (e) {
    return null;
  }
}

/** Sign a JWT */
async function signToken(userId, userObj) {
  const jti = crypto.randomUUID();
  const tokenVersion = userObj?.tokenVersion || 0;
  const payload = { userId, jti, type: "access", tokenVersion };
  return {
    token: jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" }),
    refreshToken: jwt.sign(
      { userId, jti: crypto.randomUUID(), type: "refresh", tokenVersion },
      JWT_SECRET,
      { expiresIn: "7d" }
    ),
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

// ── One-time admin setup ──────────────────────────────────────────────────────
router.post("/setup-admin", async (req, res) => {
  const User = getUserModel();
  if (!User) return res.status(503).json({ error: "DB not available" });
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

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", validate(schemas.register), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const passwordErr = validatePassword(password);
  if (passwordErr) {
    return res.status(400).json({ error: passwordErr });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const displayName = normalizedEmail.split("@")[0];

  // Try MongoDB first, fall back to local file store
  const User = getUserModel();
  if (User) {
    try {
      const exists = await User.findOne({ email: normalizedEmail });
      if (exists) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const emailVerifyToken = crypto.randomBytes(32).toString("hex");
      const user = await User.create({
        email: normalizedEmail,
        passwordHash,
        displayName,
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

      const { token, refreshToken } = await signToken(user._id.toString(), user);

      return res.status(201).json({
        email: normalizedEmail,
        token,
        refreshToken,
        userId: user._id,
        displayName: user.displayName,
        role: user.role,
        emailVerified: false,
      });
    } catch (err) {
      console.warn("[auth] Mongo register failed, trying local store:", err.message);
      // Fall through to local store
    }
  }

  // Local file-based fallback
  try {
    const existing = LocalUserStore.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const user = LocalUserStore.create({ email: normalizedEmail, passwordHash, displayName });
    if (!user) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const { token, refreshToken } = await signToken(user._id, user);

    console.log("[auth] User registered via local store:", normalizedEmail);
    return res.status(201).json({
      email: normalizedEmail,
      token,
      refreshToken,
      userId: user._id,
      displayName: user.displayName,
      role: user.role,
      emailVerified: true,
    });
  } catch (err) {
    console.error("[auth] Registration error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", validate(schemas.login), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Try MongoDB first, fall back to local file store
  const User = getUserModel();
  if (User) {
    try {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
          return res.status(400).json({ error: "Incorrect email or password" });
        }
        await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date(), lastActiveAt: new Date() } });
        const { token, refreshToken } = await signToken(user._id.toString(), user);
        return res.status(200).json({
          email: normalizedEmail,
          token,
          refreshToken,
          userId: user._id,
          displayName: user.displayName,
          role: user.role,
          emailVerified: user.emailVerified,
        });
      }
    } catch (err) {
      console.warn("[auth] Mongo login failed, trying local store:", err.message);
    }
  }

  // Local file-based fallback
  try {
    const user = LocalUserStore.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    LocalUserStore.updateLastLogin(normalizedEmail);
    const { token, refreshToken } = await signToken(user._id, user);

    console.log("[auth] User logged in via local store:", normalizedEmail);
    return res.status(200).json({
      email: normalizedEmail,
      token,
      refreshToken,
      userId: user._id,
      displayName: user.displayName,
      role: user.role,
      emailVerified: user.emailVerified,
    });
  } catch (err) {
    console.error("[auth] Login error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Logout ─────────────────────────────────────────────────────────────────────
router.post("/logout", requireAuth, async (req, res) => {
  try {
    await revokeToken(req.tokenJti, req.tokenExp).catch((err) =>
      console.warn("[auth] Logout: revokeToken failed (non-fatal):", err.message)
    );
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
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

    // Try mongo, then local store
    let user = null;
    const User = getUserModel();
    if (User) {
      try {
        user = await User.findById(decoded.userId);
      } catch (_) {}
    }
    if (!user) {
      user = LocalUserStore.findById(decoded.userId);
    }
    if (!user) return res.status(401).json({ error: "User not found" });

    const { token: newAccessToken, refreshToken: newRefreshToken } = await signToken(
      user._id?.toString() || user._id,
      user
    );
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

  const User = getUserModel();
  if (!User) return res.json({ success: true, message: "Email verified (local mode)" });

  try {
    const user = await User.findOne({ emailVerifyToken: token, emailVerifyTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired verification token" });

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyTokenExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Resend verification email ─────────────────────────────────────────────────
router.post("/resend-verification", requireAuth, async (req, res) => {
  const User = getUserModel();
  if (!User) return res.json({ success: true, message: "Email already verified (local mode)" });

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.emailVerified) return res.json({ success: true, message: "Email already verified" });

    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    sendVerificationEmail(user.email, emailVerifyToken);

    res.json({ success: true, message: "Verification email sent" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Forgot password ────────────────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const User = getUserModel();
  if (!User) return res.json({ success: true, message: "If the email exists, a reset link has been sent." });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: "If the email exists, a reset link has been sent." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    sendPasswordResetEmail(email, resetToken);

    res.json({ success: true, message: "If the email exists, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Reset password ─────────────────────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token and password required" });

  const passwordErr = validatePassword(password);
  if (passwordErr) return res.status(400).json({ error: passwordErr });

  const User = getUserModel();
  if (!User) return res.status(503).json({ error: "DB not available" });

  try {
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

    user.passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get current user profile ──────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  // Try Mongo first
  const User = getUserModel();
  if (User) {
    try {
      const user = await User.findById(req.userId, { passwordHash: 0 }).lean();
      if (user) return res.json(user);
    } catch (_) {}
  }

  // Local store fallback
  const user = LocalUserStore.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { passwordHash, ...safeUser } = user;
  return res.json(safeUser);
});

// ── Update user profile ───────────────────────────────────────────────────────
router.put("/me", requireAuth, async (req, res) => {
  const { displayName, bio, preferences } = req.body;
  const User = getUserModel();
  if (!User) return res.status(503).json({ error: "DB not available in local mode" });

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
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "Google ID token is required" });

    const googleClientId =
      process.env.GOOGLE_CLIENT_ID ||
      "773033468672-4o2heb1mvk43b5293n8gqa7tg2h6nu2p.apps.googleusercontent.com";
    const { OAuth2Client } = require("google-auth-library");
    const client = new OAuth2Client(googleClientId);

    let ticket;
    try {
      ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
    } catch (verifyErr) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    const User = getUserModel();
    let user = null;

    if (User) {
      try {
        user = await User.findOne({ $or: [{ googleId }, { email: normalizedEmail }] });
        if (user) {
          if (!user.googleId) {
            user.googleId = googleId;
            user.emailVerified = true;
            await user.save();
          }
        } else {
          user = await User.create({
            email: normalizedEmail,
            googleId,
            provider: "google",
            displayName: name || normalizedEmail.split("@")[0],
            emailVerified: true,
            role: "student",
          });
        }
        await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
      } catch (err) {
        console.warn("[auth/google] Mongo failed, using local store:", err.message);
        user = null;
      }
    }

    if (!user) {
      // Local store fallback for Google
      user = LocalUserStore.findByEmail(normalizedEmail);
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(crypto.randomUUID(), salt);
        user = LocalUserStore.create({
          email: normalizedEmail,
          passwordHash,
          displayName: name || normalizedEmail.split("@")[0],
        });
      }
    }

    const userId = user._id?.toString() || user._id;
    const { token, refreshToken } = await signToken(userId, user);

    res.status(200).json({
      email: normalizedEmail,
      token,
      refreshToken,
      userId,
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
