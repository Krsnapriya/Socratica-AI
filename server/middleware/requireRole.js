const User = require("../models/User");

/**
 * Middleware factory for Role-Based Access Control
 * @param {string[]} allowedRoles - Array of roles allowed to access this route
 */
function requireRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.role === 'guest' && !allowedRoles.includes('guest')) {
        return res.status(401).json({ error: "Please sign in to access this resource" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: `Requires one of roles: ${allowedRoles.join(', ')}` 
        });
      }

      // Attach full user object for downstream use
      req.user = user;
      next();
    } catch (err) {
      console.error("[requireRole] Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

module.exports = requireRole;
