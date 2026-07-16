// submissionLock.js
// Prevents concurrent submissions for the same sessionId to avoid race conditions.
// Uses Redis when available, falls back to in-memory Set.

const redis = require("../redis");

const LOCK_TTL_MS = 30000; // auto-expire after 30s

async function submissionLock(req, res, next) {
  const { sessionId } = req.body;
  if (!sessionId) {
    return next();
  }

  const lockKey = `lock:${sessionId}`;
  const acquired = await redis.setNX(lockKey, "1", LOCK_TTL_MS);

  if (!acquired) {
    return res.status(429).json({ error: "Another submission is already in progress for this session." });
  }

  // Helper function to safely release the lock
  res.releaseLock = () => {
    redis.del(lockKey).catch(() => {});
  };

  // Ensure lock is released on completion or failure
  const originalJson = res.json;
  res.json = function(data) {
    res.releaseLock();
    return originalJson.apply(this, arguments);
  };

  const originalSend = res.send;
  res.send = function(data) {
    res.releaseLock();
    return originalSend.apply(this, arguments);
  };

  next();
}

module.exports = submissionLock;
