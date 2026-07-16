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

      // Use role already fetched by requireAuth (avoids redundant DB query)
      const userRole = req.userRole;
      if (!userRole) {
        // Fallback: query DB if requireAuth didn't set userRole (shouldn't happen)
        const user = await User.findById(req.userId).lean();
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }
        req.userRole = user.role;
        req.user = user;
        return requireRole(allowedRoles)(req, res, next);
      }

      if (userRole === 'guest' && !allowedRoles.includes('guest')) {
        return res.status(401).json({ error: "Please sign in to access this resource" });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: `Requires one of roles: ${allowedRoles.join(', ')}` 
        });
      }

      next();
    } catch (err) {
      console.error("[requireRole] Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

module.exports = requireRole;
