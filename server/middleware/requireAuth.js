const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { isRevoked } = require("./tokenBlacklist");
const LocalUserStore = require("../localUserStore");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("[FATAL] JWT_SECRET environment variable is required but not set");
  process.exit(1);
}

function isMongoReady() {
  return mongoose.connection.readyState === 1;
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

  // Check token blacklist
  const jti = decoded.jti || token;
  try {
    const revoked = await isRevoked(jti);
    if (revoked) {
      return res.status(401).json({ error: "Token has been revoked. Please log in again." });
    }
  } catch (err) {
    console.warn("[requireAuth] Token blacklist unavailable — allowing request:", err.message);
  }

  req.userId = decoded.userId;
  req.tokenExp = decoded.exp;
  req.tokenJti = jti;

  // Try to set ObjectId only if it looks like a Mongo ObjectId (24 hex chars)
  if (/^[a-f0-9]{24}$/.test(req.userId)) {
    try {
      req.userObjectId = new mongoose.Types.ObjectId(req.userId);
    } catch (_) {}
  }

  // Try Mongo first to get role
  if (isMongoReady()) {
    try {
      const User = require("../models/User");
      const user = await User.findById(req.userId, { role: 1, tokenVersion: 1 });
      if (user) {
        req.userRole = user.role;
        if (typeof decoded.tokenVersion === "number" && decoded.tokenVersion < (user.tokenVersion || 0)) {
          return res.status(401).json({ error: "Session invalidated. Please log in again." });
        }
        // Passively update active timestamp
        User.updateOne({ _id: req.userId }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
        return next();
      }
    } catch (err) {
      console.warn("[requireAuth] DB check failed, trying local store:", err.message);
    }
  }

  // Local store fallback
  const localUser = LocalUserStore.findById(req.userId);
  if (!localUser) {
    return res.status(401).json({ error: "User not found" });
  }
  req.userRole = localUser.role;
  return next();
}

module.exports = requireAuth;
