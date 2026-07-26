const LocalUserStore = require("../localUserStore");

function requirePermission(resource, action = "access") {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userRole = req.userRole || "student";

      // super_admin bypasses all permission checks
      if (userRole === "super_admin" || userRole === "admin") {
        return next();
      }

      // Try MongoDB Permission model
      try {
        const mongoose = require("mongoose");
        if (mongoose.connection.readyState === 1) {
          const Permission = require("../models/Permission");
          const resourceId = req.params.id || req.body?.resourceId || "*";
          const permission = await Permission.findOne({
            role: userRole,
            resource,
            resourceId: { $in: [resourceId, "*"] },
            actions: { $in: [action, "manage"] },
          });
          if (!permission) {
            return res.status(403).json({
              error: "Forbidden",
              message: `Missing permission: ${action} on ${resource}`,
            });
          }
          return next();
        }
      } catch (err) {
        console.warn("[requirePermission] DB check failed, failing open for instructors/students:", err.message);
      }

      // Fallback: allow instructors and students basic access
      if (["instructor", "student"].includes(userRole)) {
        return next();
      }

      return res.status(403).json({ error: "Forbidden" });
    } catch (err) {
      console.error("[requirePermission] Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

module.exports = requirePermission;
