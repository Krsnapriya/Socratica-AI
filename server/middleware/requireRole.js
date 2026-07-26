/**
 * requireRole.js
 * Middleware factory for Role-Based Access Control.
 * Uses req.userRole set by requireAuth (no extra DB query needed).
 */
function requireRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userRole = req.userRole || "student";

      if (userRole === "guest" && !allowedRoles.includes("guest")) {
        return res.status(401).json({ error: "Please sign in to access this resource" });
      }

      // super_admin can access everything
      if (userRole === "super_admin") return next();

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `Requires one of roles: ${allowedRoles.join(", ")}`,
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
