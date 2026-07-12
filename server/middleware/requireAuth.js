const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { isRevoked } = require("./tokenBlacklist");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("[FATAL] JWT_SECRET environment variable is required but not set");
  process.exit(1);
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Request is not authorized" });
  }

  // Check token blacklist (e.g. after logout)
  const jti = decoded.jti || token;
  let revoked = false;
  try {
    revoked = await isRevoked(jti);
  } catch (err) {
    console.warn("[requireAuth] Token blacklist unavailable — allowing request:", err.message);
  }
  if (revoked) {
    return res.status(401).json({ error: "Token has been revoked. Please log in again." });
  }

  req.userId = decoded.userId;
  req.userObjectId = new mongoose.Types.ObjectId(req.userId);
  req.tokenExp = decoded.exp;
  req.tokenJti = jti;

  try {
    const user = await User.findById(req.userId, { role: 1, tokenVersion: 1 });
    if (!user) return res.status(401).json({ error: "User not found" });
    req.userRole = user.role;
    if (typeof decoded.tokenVersion === "number" && decoded.tokenVersion < (user.tokenVersion || 0)) {
      return res.status(401).json({ error: "Session invalidated. Please log in again." });
    }
  } catch (err) {
    console.warn("[requireAuth] DB check failed:", err.message);
    return res.status(503).json({ error: "Authentication service unavailable. Please try again." });
  }

  // Passively update active timestamp without blocking
  User.updateOne({ _id: req.userId }, { $set: { lastActiveAt: new Date() } }).catch((err) => {
    console.error("[requireAuth] Failed to update lastActiveAt:", err.message);
  });

  next();
}

module.exports = requireAuth;
