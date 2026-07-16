const Permission = require("../models/Permission");

function requirePermission(resource, action = "access") {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.user) {
        const User = require("../models/User");
        const user = await User.findById(req.userId).lean();
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }
        req.user = user;
      }

      if (req.user.role === "super_admin") {
        return next();
      }

      const resourceId = req.params.id || req.body?.resourceId || "*";

      const permission = await Permission.findOne({
        role: req.user.role,
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

      next();
    } catch (err) {
      console.error("[requirePermission] Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

module.exports = requirePermission;
