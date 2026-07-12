// submissionLock.js
// Prevents concurrent submissions for the same sessionId to avoid race conditions.

const activeSessions = new Set();

function submissionLock(req, res, next) {
  const { sessionId } = req.body;
  if (!sessionId) {
    return next();
  }

  if (activeSessions.has(sessionId)) {
    return res.status(429).json({ error: "Another submission is already in progress for this session." });
  }

  activeSessions.add(sessionId);

  // Helper function to safely release the lock
  res.releaseLock = () => {
    activeSessions.delete(sessionId);
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
