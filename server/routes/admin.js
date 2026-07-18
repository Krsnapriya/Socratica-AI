const express = require("express");
const User = require("../models/User");
const Permission = require("../models/Permission");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const AuditLog = require("../models/AuditLog");
const SystemConfig = require("../models/SystemConfig");
const FailedLogin = require("../models/FailedLogin");
const Session = require("../models/Session");
const Notification = require("../models/Notification");
const configLoader = require("../configLoader");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const requirePermission = require("../middleware/requirePermission");
const { validate, schemas } = require("../middleware/validate");

const router = express.Router();

// ── Public Config API (no auth required) ────────────────────────────────
const Role = require("../models/Role");
const Language = require("../models/Language");
const Topic = require("../models/Topic");

router.get("/public", async (req, res) => {
  try {
    const [roles, languages, topics] = await Promise.all([
      Role.find({ isActive: true }).sort({ order: 1 }).select("name displayName config").lean(),
      Language.find({ isActive: true }).sort({ order: 1 }).select("id label ext").lean(),
      Topic.find({ isActive: true }).select("name category").lean(),
    ]);

    res.json({
      roles,
      languages,
      topics,
      branding: {
        siteName: "Socratica AI",
        tagline: "AI-Powered Computer Science Learning Operating System",
      },
      features: {
        aiMentor: true,
        codeExecution: true,
        learningPaths: true,
        quizzes: true,
        interviewPractice: true,
      },
    });
  } catch (err) {
    console.error("[admin] GET /public error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Protect all admin routes ──────────────────────────────────────────────────
router.use(requireAuth, requireRole(["admin", "super_admin"]));

// ── Get All Users (paginated) ─────────────────────────────────────────────────
router.get("/users", requirePermission("users", "read"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filter = search
      ? { $or: [{ email: { $regex: search, $options: "i" } }, { displayName: { $regex: search, $options: "i" } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter, { passwordHash: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map(u => u._id);
    const subCounts = await Submission.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 }, lastActivity: { $max: "$createdAt" } } },
    ]);
    const subMap = {};
    subCounts.forEach(s => { subMap[s._id] = { count: s.count, lastActivity: s.lastActivity }; });

    const enrichedUsers = users.map(u => ({
      ...u,
      submissionsCount: subMap[u._id.toString()]?.count || 0,
      lastActivity: subMap[u._id.toString()]?.lastActivity || null,
      lastLoginAt: u.lastLoginAt || null,
    }));

    res.json({ users: enrichedUsers, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[admin] /users error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update User Role ──────────────────────────────────────────────────────────
router.put("/users/:id/role", requirePermission("users", "update"), async (req, res) => {
  try {
    const { role } = req.body;
    const roles = configLoader.get("roles", ["super_admin", "admin", "instructor", "student", "guest"]);
    if (!roles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (req.userId === req.params.id) {
      return res.status(403).json({ error: "Self-privilege manipulation is not allowed. You cannot change your own role." });
    }

    if (req.userRole !== "super_admin") {
      if (role === "super_admin" || targetUser.role === "super_admin") {
        return res.status(403).json({ error: "Only super_admin can manage super_admin roles" });
      }
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await AuditLog.create({
      userId: req.userObjectId, action: "role_change", resource: "user", resourceId: targetUser._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
      metadata: { from: oldRole, to: role, targetUser: targetUser.email },
    });

    const userObj = targetUser.toObject();
    delete userObj.passwordHash;

    res.json(userObj);
  } catch (err) {
    console.error("[admin] PUT /users/role error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create User (super_admin only) ──────────────────────────────────────────────
router.post("/users", requirePermission("users", "create"), validate(schemas.createUser), async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;

    if (req.userRole !== "super_admin" && role === "super_admin") {
      return res.status(403).json({ error: "Only super_admin can create super_admin users" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "A user with this email already exists" });

    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      displayName: displayName || email.split("@")[0],
      role: role || "student",
      emailVerified: true,
    });

    await AuditLog.create({
      userId: req.userObjectId, action: "user_create", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
      metadata: { email: user.email, role: user.role },
    });

    const obj = user.toObject();
    delete obj.passwordHash;
    res.status(201).json(obj);
  } catch (err) {
    console.error("[admin] POST /users error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete User (super_admin only) ──────────────────────────────────────────────
router.delete("/users/:id", requirePermission("users", "delete"), async (req, res) => {
  try {
    if (req.userId === req.params.id) {
      return res.status(403).json({ error: "You cannot delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.userRole !== "super_admin" && user.role === "super_admin") {
      return res.status(403).json({ error: "Only super_admin can delete super_admin users" });
    }

    await Submission.deleteMany({ userId: user._id });
    await AuditLog.create({
      userId: req.userObjectId, action: "user_delete", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
      metadata: { email: user.email, role: user.role },
    });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User and associated submissions deleted" });
  } catch (err) {
    console.error("[admin] DELETE /users/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get Global Stats (expanded) ────────────────────────────────────────────────
router.get("/stats", requirePermission("analytics", "read"), async (req, res) => {
  try {
    const [totalUsers, loggedInUsers, totalSubmissions, passedSubmissions, totalCourses, totalModules, totalProblems] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLoginAt: { $ne: null } }),
      Submission.countDocuments(),
      Submission.countDocuments({ verdict: "pass" }),
      Course.countDocuments(),
      Module.countDocuments(),
      Problem.countDocuments(),
    ]);

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeSessions = await User.countDocuments({ lastActiveAt: { $gte: fifteenMinsAgo } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const registrationsToday = await User.countDocuments({ createdAt: { $gte: today } });

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const registrationsThisWeek = await User.countDocuments({ createdAt: { $gte: lastWeek } });

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const submissionsByLanguage = await Submission.aggregate([
      { $group: { _id: "$language", count: { $sum: 1 } } },
    ]);

    const submissionsByVerdict = await Submission.aggregate([
      { $group: { _id: "$verdict", count: { $sum: 1 } } },
    ]);

    const submissionsToday = await Submission.countDocuments({ createdAt: { $gte: today } });

    const failedLoginCount = await FailedLogin.countDocuments({ timestamp: { $gte: lastWeek } });

    const roleMap = {};
    usersByRole.forEach(r => { roleMap[r._id] = r.count; });
    const langMap = {};
    submissionsByLanguage.forEach(l => { langMap[l._id] = l.count; });
    const verdictMap = {};
    submissionsByVerdict.forEach(v => { verdictMap[v._id] = v.count; });

    res.json({
      totalUsers, loggedInUsers, totalSubmissions, passedSubmissions,
      passRate: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
      activeSessions, totalCourses, totalModules, totalProblems,
      registrationsToday, registrationsThisWeek,
      failedLogins7d: failedLoginCount,
      submissionsToday,
      usersByRole: roleMap,
      submissionsByLanguage: langMap,
      submissionsByVerdict: verdictMap,
    });
  } catch (err) {
    console.error("[admin] /stats error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get System Logs (enhanced filtering) ───────────────────────────────────────
router.get("/logs", requirePermission("audit_logs", "read"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const type = req.query.type || "all";
    const action = req.query.action || "";
    const resource = req.query.resource || "";
    const userId = req.query.userId || "";
    const days = parseInt(req.query.days) || 7;

    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const auditFilter = { createdAt: { $gte: dateFrom } };
    if (action) auditFilter.action = action;
    if (resource) auditFilter.resource = resource;
    if (userId) auditFilter.userId = userId;

    if (type === "audit") {
      const [logs, total] = await Promise.all([
        AuditLog.find(auditFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditLog.countDocuments(auditFilter),
      ]);
      return res.json({ logs: logs.map(l => ({ ...l, logType: "audit" })), total, page, limit, pages: Math.ceil(total / limit) });
    }

    if (type === "submissions") {
      const subFilter = { createdAt: { $gte: dateFrom }, verdict: { $ne: "pass" } };
      const [subs, total] = await Promise.all([
        Submission.find(subFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Submission.countDocuments(subFilter),
      ]);
      return res.json({ logs: subs.map(s => ({ ...s, logType: "submission" })), total, page, limit, pages: Math.ceil(total / limit) });
    }

    // "all" — merge both with unified sort
    const [auditLogs, auditTotal, submissions, subTotal] = await Promise.all([
      AuditLog.find(auditFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(auditFilter),
      Submission.find({ createdAt: { $gte: dateFrom }, verdict: { $ne: "pass" } }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Submission.countDocuments({ createdAt: { $gte: dateFrom }, verdict: { $ne: "pass" } }),
    ]);

    const merged = [
      ...auditLogs.map(l => ({ ...l, logType: "audit" })),
      ...submissions.map(s => ({ ...s, logType: "submission" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);

    res.json({ logs: merged, total: auditTotal + subTotal, page, limit, pages: Math.ceil((auditTotal + subTotal) / limit) });
  } catch (err) {
    console.error("[admin] /logs error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Security Center ────────────────────────────────────────────────────────────
router.get("/security/failed-logins", requirePermission("analytics", "read"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const days = parseInt(req.query.days) || 7;
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const filter = { timestamp: { $gte: dateFrom } };
    const [logs, total] = await Promise.all([
      FailedLogin.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      FailedLogin.countDocuments(filter),
    ]);

    res.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[admin] GET /security/failed-logins error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/security/force-logout/:userId", requirePermission("users", "update"), async (req, res) => {
  try {
    if (req.userId === req.params.userId) {
      return res.status(400).json({ error: "Cannot force logout yourself" });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, { $inc: { tokenVersion: 1 } }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    await AuditLog.create({
      userId: req.userObjectId, action: "force_logout", resource: "user", resourceId: user._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
      metadata: { targetEmail: user.email, targetRole: user.role },
    });

    res.json({ message: "User force logged out", email: user.email });
  } catch (err) {
    console.error("[admin] POST /security/force-logout error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/security/overview", requirePermission("analytics", "read"), async (req, res) => {
  try {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const [last24h, last7d, uniqueIPs7d] = await Promise.all([
      FailedLogin.countDocuments({ timestamp: { $gte: new Date(now - oneDay) } }),
      FailedLogin.countDocuments({ timestamp: { $gte: new Date(now - sevenDays) } }),
      FailedLogin.distinct("ip", { timestamp: { $gte: new Date(now - sevenDays) } }),
    ]);

    const topAttemptedEmails = await FailedLogin.aggregate([
      { $match: { timestamp: { $gte: new Date(now - sevenDays) } } },
      { $group: { _id: "$email", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const forcedLogouts = await AuditLog.countDocuments({
      action: "force_logout",
      createdAt: { $gte: new Date(now - sevenDays) },
    });

    res.json({
      failedLogins24h: last24h,
      failedLogins7d: last7d,
      uniqueIPs7d: uniqueIPs7d.length,
      forcedLogouts7d: forcedLogouts,
      topAttemptedEmails,
    });
  } catch (err) {
    console.error("[admin] GET /security/overview error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Notifications (admin) ──────────────────────────────────────────────────────
router.get("/notifications", requirePermission("notifications", "read"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("createdBy", "email displayName").lean(),
      Notification.countDocuments(),
    ]);

    res.json({ notifications, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[admin] GET /notifications error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications", requirePermission("notifications", "create"), async (req, res) => {
  try {
    const { type, title, message, audience, link, expiresAt } = req.body;
    if (!title || !message) return res.status(400).json({ error: "Title and message are required" });

    const notification = await Notification.create({
      type: type || "broadcast",
      title, message,
      audience: audience || "all",
      link, expiresAt,
      createdBy: req.userObjectId,
    });

    await AuditLog.create({
      userId: req.userObjectId, action: "notification_create", resource: "notification", resourceId: notification._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
      metadata: { title, audience },
    });

    res.status(201).json(notification);
  } catch (err) {
    console.error("[admin] POST /notifications error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/notifications/:id", requirePermission("notifications", "delete"), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("[admin] DELETE /notifications/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── List All Permissions ──────────────────────────────────────────────────────
router.get("/permissions", requirePermission("permissions", "read"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [permissions, total] = await Promise.all([
      Permission.find().sort({ role: 1, resource: 1 }).skip(skip).limit(limit).lean(),
      Permission.countDocuments(),
    ]);

    res.json({ permissions, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[admin] GET /permissions error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create Permission ─────────────────────────────────────────────────────────
router.post("/permissions", requirePermission("permissions", "create"), async (req, res) => {
  try {
    const { role, resource, resourceId, actions } = req.body;

    if (!role || !resource || !actions || !actions.length) {
      return res.status(400).json({ error: "role, resource, and actions are required" });
    }

    const permission = await Permission.create({
      role,
      resource,
      resourceId: resourceId || "*",
      actions,
    });

    await AuditLog.create({
      userId: req.userObjectId, action: "permission_create", resource: "permission", resourceId: permission._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
      metadata: { role, resource, resourceId, actions },
    });

    res.status(201).json(permission);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Permission already exists for this role/resource combination" });
    }
    console.error("[admin] POST /permissions error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update Permission ─────────────────────────────────────────────────────────
router.put("/permissions/:id", requirePermission("permissions", "update"), async (req, res) => {
  try {
    const { role, resource, resourceId, actions } = req.body;
    const update = {};
    if (role) update.role = role;
    if (resource) update.resource = resource;
    if (resourceId) update.resourceId = resourceId;
    if (actions) update.actions = actions;

    const permission = await Permission.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!permission) {
      return res.status(404).json({ error: "Permission not found" });
    }

    await AuditLog.create({
      userId: req.userObjectId, action: "permission_update", resource: "permission", resourceId: permission._id.toString(),
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
      metadata: update,
    });

    res.json(permission);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Duplicate permission entry" });
    }
    console.error("[admin] PUT /permissions error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete Permission ─────────────────────────────────────────────────────────
router.delete("/permissions/:id", requirePermission("permissions", "delete"), async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);
    if (!permission) {
      return res.status(404).json({ error: "Permission not found" });
    }

    await AuditLog.create({
      userId: req.userObjectId, action: "permission_delete", resource: "permission", resourceId: req.params.id,
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
      metadata: { deletedPermission: permission },
    });

    res.json({ message: "Permission deleted" });
  } catch (err) {
    console.error("[admin] DELETE /permissions error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Course CRUD ───────────────────────────────────────────────────────────────
router.get("/courses", requirePermission("courses", "read"), async (req, res) => {
  try {
    const courses = await Course.find().populate("modules").sort({ order: 1 }).lean();
    res.json(courses);
  } catch (err) {
    console.error("[admin] GET /courses error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses", requirePermission("courses", "create"), validate(schemas.createCourse), async (req, res) => {
  try {
    const { title, description, icon, order, modules, instructorId, isPublished } = req.body;
    const course = await Course.create({ title, description, icon, order, modules, instructorId, isPublished });
    const populated = await Course.findById(course._id).populate("modules").lean();
    res.status(201).json(populated);
  } catch (err) {
    console.error("[admin] POST /courses error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/courses/:id", requirePermission("courses", "update"), async (req, res) => {
  try {
    const { title, description, icon, order, modules, instructorId, isPublished } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { title, description, icon, order, modules, instructorId, isPublished },
      { new: true, runValidators: true }
    ).populate("modules").lean();
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    console.error("[admin] PUT /courses/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/courses/:id", requirePermission("courses", "delete"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    await Module.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: "Course and associated modules deleted" });
  } catch (err) {
    console.error("[admin] DELETE /courses/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Module CRUD ───────────────────────────────────────────────────────────────
router.get("/modules", requirePermission("modules", "read"), async (req, res) => {
  try {
    const modules = await Module.find().populate("course", "title").populate("prerequisites", "title").sort({ order: 1 }).lean();
    res.json(modules);
  } catch (err) {
    console.error("[admin] GET /modules error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/modules", requirePermission("modules", "create"), validate(schemas.createModule), async (req, res) => {
  try {
    const { course, title, description, order, topics, prerequisites } = req.body;
    const mod = await Module.create({ course, title, description, order, topics, prerequisites });
    const populated = await Module.findById(mod._id).populate("course", "title").populate("prerequisites", "title").lean();
    res.status(201).json(populated);
  } catch (err) {
    console.error("[admin] POST /modules error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/modules/:id", requirePermission("modules", "update"), async (req, res) => {
  try {
    const { course, title, description, order, topics, prerequisites } = req.body;
    const mod = await Module.findByIdAndUpdate(
      req.params.id,
      { course, title, description, order, topics, prerequisites },
      { new: true, runValidators: true }
    ).populate("course", "title").populate("prerequisites", "title").lean();
    if (!mod) return res.status(404).json({ error: "Module not found" });
    res.json(mod);
  } catch (err) {
    console.error("[admin] PUT /modules/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/modules/:id", requirePermission("modules", "delete"), async (req, res) => {
  try {
    const mod = await Module.findByIdAndDelete(req.params.id);
    if (!mod) return res.status(404).json({ error: "Module not found" });

    await Course.updateMany({ modules: mod._id }, { $pull: { modules: mod._id } });
    await Module.updateMany({ prerequisites: mod._id }, { $pull: { prerequisites: mod._id } });

    res.json({ message: "Module deleted" });
  } catch (err) {
    console.error("[admin] DELETE /modules/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Problem CRUD ──────────────────────────────────────────────────────────────
router.get("/problems", requirePermission("problems", "read"), async (req, res) => {
  try {
    const problems = await Problem.find().sort({ createdAt: -1 }).lean();
    res.json(problems);
  } catch (err) {
    console.error("[admin] GET /problems error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/problems", requirePermission("problems", "create"), validate(schemas.createProblem), async (req, res) => {
  try {
    const { sanitizeProblemInput } = require("../utils/sanitize");
    const { problemId, title, statement, description, category, difficulty, tags, estimatedMinutes, starterCode, oracleSolutions, testCases, hiddenTestCases, moduleId, authorId } = req.body;
    const sanitized = sanitizeProblemInput({ title, statement, description });
    const problem = await Problem.create({
      problemId, ...sanitized, category, difficulty, tags, estimatedMinutes, starterCode, oracleSolutions, testCases, hiddenTestCases, moduleId, authorId
    });
    res.status(201).json(problem.toObject());
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A problem with this problemId already exists" });
    }
    console.error("[admin] POST /problems error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/problems/:id", requirePermission("problems", "update"), async (req, res) => {
  try {
    const { sanitizeProblemInput } = require("../utils/sanitize");
    const { problemId, title, statement, description, category, difficulty, tags, estimatedMinutes, starterCode, oracleSolutions, testCases, hiddenTestCases, moduleId, authorId } = req.body;
    const sanitized = sanitizeProblemInput({ title, statement, description });
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { problemId, ...sanitized, category, difficulty, tags, estimatedMinutes, starterCode, oracleSolutions, testCases, hiddenTestCases, moduleId, authorId },
      { new: true, runValidators: true }
    );
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(problem.toObject());
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A problem with this problemId already exists" });
    }
    console.error("[admin] PUT /problems/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/problems/:id", requirePermission("problems", "delete"), async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json({ message: "Problem deleted" });
  } catch (err) {
    console.error("[admin] DELETE /problems/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── System Config ─────────────────────────────────────────────────────────────
router.get("/config", requirePermission("compiler", "read"), async (req, res) => {
  try {
    const configs = await SystemConfig.find().lean();
    const map = {};
    configs.forEach(c => { map[c.key] = c.value; });
    res.json(map);
  } catch (err) {
    console.error("[admin] GET /config error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/config/:key", requirePermission("compiler", "read"), async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ key: req.params.key });
    if (!config) return res.status(404).json({ error: "Config not found" });
    res.json(config);
  } catch (err) {
    console.error("[admin] GET /config error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/config/:key", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const { value } = req.body;
    const configDoc = await SystemConfig.findOneAndUpdate(
      { key: req.params.key },
      { value },
      { new: true, upsert: true, runValidators: true }
    );

    // Invalidate configLoader cache so runtime picks up the new value
    const configLoader = require("../configLoader");
    configLoader.invalidate();

    await AuditLog.create({
      userId: req.userObjectId, action: "config_update", resource: "config", resourceId: req.params.key,
      ip: req.ip, userAgent: req.headers["user-agent"], success: true,
      metadata: { key: req.params.key },
    });
    res.json(configDoc);
  } catch (err) {
    console.error("[admin] PUT /config error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Reseed Default Permissions ─────────────────────────────────────────────────
router.post("/reseed-permissions", requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    await Permission.deleteMany({});
    await require("../seedPermissions")();
    const count = await Permission.countDocuments();
    res.json({ message: "Permissions reseeded", count });
  } catch (err) {
    console.error("[admin] POST /reseed-permissions error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: View any user's submissions ────────────────────────────────────────
router.get("/submissions/user/:userId", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = { userId: req.params.userId };
    if (req.query.problemId) filter.problemId = req.query.problemId;
    if (req.query.verdict) filter.verdict = req.query.verdict;

    const [subs, total] = await Promise.all([
      Submission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Submission.countDocuments(filter),
    ]);
    res.json({ submissions: subs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[admin] user submissions error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: View any session's analysis (with oracle) ──────────────────────────
router.get("/submissions/session/:sessionId/analysis", async (req, res) => {
  try {
    const rounds = await Submission.find({ sessionId: req.params.sessionId })
      .sort({ round: 1 }).lean();
    if (rounds.length === 0) return res.status(404).json({ error: "No submissions found" });

    const problemId = rounds[0].problemId;
    const language = rounds[0].language;
    const problem = await Problem.findOne({ problemId }).lean();
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const oracleCode = problem.oracleSolutions?.[language] || null;
    const bestRound = rounds.reduce((best, r) => {
      if (r.verdict === 'pass') return r;
      if (!best) return r;
      if (r.tier === 1 && (!best.tier || best.tier !== 1)) return r;
      return best;
    }, null);

    const divergences = rounds
      .filter(r => r.divergenceStep != null)
      .map(r => ({ round: r.round, step: r.divergenceStep, tier: r.tier }));

    const owner = await User.findById(rounds[0].userId).select("email displayName role").lean();

    res.json({
      problemId,
      language,
      title: problem.title,
      statement: problem.statement,
      difficulty: problem.difficulty,
      category: problem.category,
      oracleCode,
      owner: owner ? { email: owner.email, displayName: owner.displayName, role: owner.role } : null,
      rounds: rounds.map(r => ({
        round: r.round,
        code: r.code,
        verdict: r.verdict,
        tier: r.tier,
        hint: r.hint,
        divergenceStep: r.divergenceStep,
        tier2Result: r.tier2Result,
      })),
      bestAttempt: bestRound ? {
        round: bestRound.round,
        code: bestRound.code,
        verdict: bestRound.verdict,
        tier: bestRound.tier,
        hint: bestRound.hint,
        divergenceStep: bestRound.divergenceStep,
      } : null,
      divergences,
      totalRounds: rounds.length,
      hasPass: rounds.some(r => r.verdict === 'pass'),
    });
  } catch (err) {
    console.error("[admin] session analysis error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: Get all sessions (all users) ───────────────────────────────────────
router.get("/sessions", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.problemId) filter.problemId = req.query.problemId;
    if (req.query.finalVerdict) filter.finalVerdict = req.query.finalVerdict;

    const [sessions, total] = await Promise.all([
      Session.find(filter).sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
      Session.countDocuments(filter),
    ]);

    const userIds = [...new Set(sessions.map(s => s.userId?.toString()))].filter(Boolean);
    const users = userIds.length > 0 ? await User.find({ _id: { $in: userIds } }).select("email displayName role").lean() : [];
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    res.json({
      sessions: sessions.map(s => ({
        ...s,
        owner: userMap[s.userId?.toString()] || null,
      })),
      total, page, limit, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[admin] sessions list error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Test Cases CRUD ──────────────────────────────────────────────────────────

const TestCase = require("../models/TestCase");

router.get("/testcases", requirePermission("problems", "read"), async (req, res) => {
  try {
    const { problemId, visibility, category, language } = req.query;
    const filter = {};
    if (problemId) filter.problemId = problemId;
    if (visibility) filter.visibility = visibility;
    if (category) filter.category = category;
    if (language) filter.language = language;
    const testCases = await TestCase.find(filter).sort({ order: 1, createdAt: 1 }).lean();
    res.json(testCases);
  } catch (err) {
    console.error("[admin] testcases list error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/testcases", requirePermission("problems", "create"), async (req, res) => {
  try {
    const { problemId, language, visibility, category, input, expectedOutput, weight, description, order, timeLimitMs, memoryLimitMb } = req.body;
    if (!problemId || !language || !input || !expectedOutput) {
      return res.status(400).json({ error: "problemId, language, input, and expectedOutput are required" });
    }
    const tc = await TestCase.create({
      problemId, language, visibility: visibility || "public",
      category: category || "sample", input, expectedOutput,
      weight: weight || 1, description: description || "",
      order: order || 0, timeLimitMs, memoryLimitMb,
    });
    res.status(201).json(tc);
  } catch (err) {
    console.error("[admin] testcases create error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/testcases/:id", requirePermission("problems", "update"), async (req, res) => {
  try {
    const tc = await TestCase.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!tc) return res.status(404).json({ error: "Test case not found" });
    res.json(tc);
  } catch (err) {
    console.error("[admin] testcases update error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/testcases/:id", requirePermission("problems", "delete"), async (req, res) => {
  try {
    const tc = await TestCase.findByIdAndDelete(req.params.id);
    if (!tc) return res.status(404).json({ error: "Test case not found" });
    res.json({ message: "Test case deleted" });
  } catch (err) {
    console.error("[admin] testcases delete error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Driver Templates CRUD ───────────────────────────────────────────────────

const DriverTemplate = require("../models/DriverTemplate");

router.get("/drivers", requirePermission("problems", "read"), async (req, res) => {
  try {
    const { problemId, language } = req.query;
    const filter = {};
    if (problemId) filter.problemId = problemId;
    if (language) filter.language = language;
    const drivers = await DriverTemplate.find(filter).sort({ createdAt: 1 }).lean();
    res.json(drivers);
  } catch (err) {
    console.error("[admin] drivers list error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/drivers", requirePermission("problems", "create"), async (req, res) => {
  try {
    const { problemId, language, driverCode, stdinTemplate, wrapperType, functionName, description } = req.body;
    if (!problemId || !language || !driverCode) {
      return res.status(400).json({ error: "problemId, language, and driverCode are required" });
    }
    const driver = await DriverTemplate.findOneAndUpdate(
      { problemId, language },
      { $set: { driverCode, stdinTemplate, wrapperType, functionName, description } },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(driver);
  } catch (err) {
    console.error("[admin] drivers create error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/drivers/:id", requirePermission("problems", "update"), async (req, res) => {
  try {
    const driver = await DriverTemplate.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (err) {
    console.error("[admin] drivers update error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/drivers/:id", requirePermission("problems", "delete"), async (req, res) => {
  try {
    const driver = await DriverTemplate.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({ message: "Driver deleted" });
  } catch (err) {
    console.error("[admin] drivers delete error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Reference Solutions CRUD ────────────────────────────────────────────────
const ReferenceSolution = require("../models/ReferenceSolution");

router.get("/reference-solutions", requirePermission("problems", "read"), async (req, res) => {
  try {
    const { problemId, language } = req.query;
    const filter = {};
    if (problemId) filter.problemId = problemId;
    if (language) filter.language = language;
    const solutions = await ReferenceSolution.find(filter).sort({ problemId: 1, language: 1, variant: 1 }).lean();
    res.json(solutions);
  } catch (err) {
    console.error("[admin] reference-solutions list error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reference-solutions", requirePermission("problems", "create"), async (req, res) => {
  try {
    const { problemId, language, code, variant, notes } = req.body;
    if (!problemId || !language || !code) {
      return res.status(400).json({ error: "problemId, language, and code are required" });
    }
    const solution = await ReferenceSolution.create({ problemId, language, code, variant, notes });
    res.status(201).json(solution);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A reference solution with this problemId, language, and variant already exists" });
    }
    console.error("[admin] reference-solutions create error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/reference-solutions/:id", requirePermission("problems", "update"), async (req, res) => {
  try {
    const { code, variant, notes, isActive } = req.body;
    const update = {};
    if (code !== undefined) update.code = code;
    if (variant !== undefined) update.variant = variant;
    if (notes !== undefined) update.notes = notes;
    if (isActive !== undefined) update.isActive = isActive;
    const solution = await ReferenceSolution.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!solution) return res.status(404).json({ error: "Reference solution not found" });
    res.json(solution);
  } catch (err) {
    console.error("[admin] reference-solutions update error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/reference-solutions/:id", requirePermission("problems", "delete"), async (req, res) => {
  try {
    const solution = await ReferenceSolution.findByIdAndDelete(req.params.id);
    if (!solution) return res.status(404).json({ error: "Reference solution not found" });
    res.json({ message: "Reference solution deleted" });
  } catch (err) {
    console.error("[admin] reference-solutions delete error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Roles CRUD ───────────────────────────────────────────────────────────
router.get("/roles", requirePermission("permissions", "read"), async (req, res) => {
  try {
    const roles = await Role.find().sort({ order: 1 }).lean();
    res.json(roles);
  } catch (err) {
    console.error("[admin] GET /roles error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/roles", requirePermission("permissions", "create"), async (req, res) => {
  try {
    const { name, displayName, description, permissions, config: roleConfig } = req.body;
    if (!name || !displayName) return res.status(400).json({ error: "name and displayName are required" });
    const role = await Role.create({ name, displayName, description, permissions, config: roleConfig });
    res.status(201).json(role);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Role already exists" });
    console.error("[admin] POST /roles error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/roles/:id", requirePermission("permissions", "update"), async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  } catch (err) {
    console.error("[admin] PUT /roles error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/roles/:id", requirePermission("permissions", "delete"), async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json({ message: "Role deleted" });
  } catch (err) {
    console.error("[admin] DELETE /roles error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Languages CRUD ───────────────────────────────────────────────────────
router.get("/languages", requirePermission("compiler", "read"), async (req, res) => {
  try {
    const languages = await Language.find().sort({ order: 1 }).lean();
    res.json(languages);
  } catch (err) {
    console.error("[admin] GET /languages error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/languages", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const { id, label, ext, image, memoryMb, cpuQuota, timeoutMs, compileTimeoutMs, compile, run } = req.body;
    if (!id || !label || !ext || !run) return res.status(400).json({ error: "id, label, ext, and run are required" });
    const lang = await Language.create({ id, label, ext, image, memoryMb, cpuQuota, timeoutMs, compileTimeoutMs, compile, run });
    res.status(201).json(lang);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Language already exists" });
    console.error("[admin] POST /languages error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/languages/:id", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const lang = await Language.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { new: true, runValidators: true });
    if (!lang) return res.status(404).json({ error: "Language not found" });
    res.json(lang);
  } catch (err) {
    console.error("[admin] PUT /languages error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/languages/:id", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const lang = await Language.findOneAndDelete({ id: req.params.id });
    if (!lang) return res.status(404).json({ error: "Language not found" });
    res.json({ message: "Language deleted" });
  } catch (err) {
    console.error("[admin] DELETE /languages error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Topics (Knowledge Graph) CRUD ────────────────────────────────────────
router.get("/topics", requirePermission("courses", "read"), async (req, res) => {
  try {
    const topics = await Topic.find().sort({ category: 1, name: 1 }).lean();
    res.json(topics);
  } catch (err) {
    console.error("[admin] GET /topics error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/topics", requirePermission("courses", "create"), async (req, res) => {
  try {
    const { name, category, dependsOn, description } = req.body;
    if (!name || !category) return res.status(400).json({ error: "name and category are required" });
    const topic = await Topic.create({ name, category, dependsOn, description });
    res.status(201).json(topic);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Topic already exists" });
    console.error("[admin] POST /topics error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/topics/:id", requirePermission("courses", "update"), async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    res.json(topic);
  } catch (err) {
    console.error("[admin] PUT /topics error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/topics/:id", requirePermission("courses", "delete"), async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    res.json({ message: "Topic deleted" });
  } catch (err) {
    console.error("[admin] DELETE /topics error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── AI Prompts CRUD ───────────────────────────────────────────────────
const AIPrompt = require("../models/AIPrompt");
const { invalidateDBPromptCache } = require("../ai/agents/index");

router.get("/ai-prompts", requirePermission("compiler", "read"), async (req, res) => {
  try {
    const { agentType } = req.query;
    const filter = agentType ? { agentType } : {};
    const prompts = await AIPrompt.find(filter).sort({ agentType: 1, version: -1 }).lean();
    res.json(prompts);
  } catch (err) {
    console.error("[admin] GET /ai-prompts error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/ai-prompts", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const { agentType, systemPrompt, description } = req.body;
    if (!agentType || !systemPrompt) return res.status(400).json({ error: "agentType and systemPrompt are required" });

    // Auto-increment version
    const last = await AIPrompt.findOne({ agentType }).sort({ version: -1 }).lean();
    const version = last ? last.version + 1 : 1;

    const prompt = await AIPrompt.create({ agentType, version, systemPrompt, description, isActive: true });
    invalidateDBPromptCache(agentType);
    res.status(201).json(prompt);
  } catch (err) {
    console.error("[admin] POST /ai-prompts error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/ai-prompts/:id", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const prompt = await AIPrompt.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!prompt) return res.status(404).json({ error: "Prompt not found" });
    invalidateDBPromptCache(prompt.agentType);
    res.json(prompt);
  } catch (err) {
    console.error("[admin] PUT /ai-prompts error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/ai-prompts/:id/activate", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const target = await AIPrompt.findById(req.params.id);
    if (!target) return res.status(404).json({ error: "Prompt not found" });

    // Deactivate all other versions of this agentType
    await AIPrompt.updateMany(
      { agentType: target.agentType, _id: { $ne: target._id } },
      { $set: { isActive: false } }
    );
    target.isActive = true;
    await target.save();
    invalidateDBPromptCache(target.agentType);

    res.json(target);
  } catch (err) {
    console.error("[admin] POST /ai-prompts/activate error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/ai-prompts/:id", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const prompt = await AIPrompt.findByIdAndDelete(req.params.id);
    if (!prompt) return res.status(404).json({ error: "Prompt not found" });
    invalidateDBPromptCache(prompt.agentType);
    res.json({ message: "Prompt deleted" });
  } catch (err) {
    console.error("[admin] DELETE /ai-prompts error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Seed Agent Routes ──────────────────────────────────────────────────
const AgentRoute = require("../models/AgentRoute");

router.get("/agent-routes", requirePermission("compiler", "read"), async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const routes = await AgentRoute.find(filter).sort({ role: 1, action: 1 }).lean();
    res.json(routes);
  } catch (err) {
    console.error("[admin] GET /agent-routes error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/agent-routes", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const { role, action, agents, gates } = req.body;
    if (!role || !action || !agents) return res.status(400).json({ error: "role, action, and agents are required" });
    const route = await AgentRoute.create({ role, action, agents, gates });
    res.status(201).json(route);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Route already exists for this role/action" });
    console.error("[admin] POST /agent-routes error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/agent-routes/:id", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const route = await AgentRoute.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!route) return res.status(404).json({ error: "Route not found" });
    res.json(route);
  } catch (err) {
    console.error("[admin] PUT /agent-routes error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/agent-routes/:id", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const route = await AgentRoute.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ error: "Route not found" });
    res.json({ message: "Route deleted" });
  } catch (err) {
    console.error("[admin] DELETE /agent-routes error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/seed-agent-routes", requireRole(["super_admin"]), async (req, res) => {
  try {
    const result = await require("../seedAgentRoutes")();
    res.json({ message: "Agent routes seeded", ...result });
  } catch (err) {
    console.error("[admin] POST /seed-agent-routes error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Analysis Patterns CRUD ──────────────────────────────────────────────
const AnalysisPattern = require("../models/AnalysisPattern");

router.get("/analysis-patterns", requirePermission("compiler", "read"), async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    const patterns = await AnalysisPattern.find(filter).sort({ type: 1, name: 1 }).lean();
    res.json(patterns);
  } catch (err) {
    console.error("[admin] GET /analysis-patterns error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/analysis-patterns", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const { type, name, regex, severity, complexity, description } = req.body;
    if (!type || !name || !regex) return res.status(400).json({ error: "type, name, and regex are required" });
    const pattern = await AnalysisPattern.create({ type, name, regex, severity, complexity, description });
    res.status(201).json(pattern);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Pattern already exists" });
    console.error("[admin] POST /analysis-patterns error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/analysis-patterns/:id", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const pattern = await AnalysisPattern.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!pattern) return res.status(404).json({ error: "Pattern not found" });
    res.json(pattern);
  } catch (err) {
    console.error("[admin] PUT /analysis-patterns error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/analysis-patterns/:id", requirePermission("compiler", "update"), async (req, res) => {
  try {
    const pattern = await AnalysisPattern.findByIdAndDelete(req.params.id);
    if (!pattern) return res.status(404).json({ error: "Pattern not found" });
    res.json({ message: "Pattern deleted" });
  } catch (err) {
    console.error("[admin] DELETE /analysis-patterns error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/seed-analysis-patterns", requireRole(["super_admin"]), async (req, res) => {
  try {
    const result = await require("../seedAnalysisPatterns")();
    res.json({ message: "Analysis patterns seeded", ...result });
  } catch (err) {
    console.error("[admin] POST /seed-analysis-patterns error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Seed AI Prompts ─────────────────────────────────────────────────────
router.post("/seed-ai-prompts", requireRole(["super_admin"]), async (req, res) => {
  try {
    const result = await require("../seedAIPrompts")();
    invalidateDBPromptCache();
    res.json({ message: "AI prompts seeded", ...result });
  } catch (err) {
    console.error("[admin] POST /seed-ai-prompts error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Seed Roles/Languages/Topics ──────────────────────────────────────────
router.post("/seed-roles", requireRole(["super_admin"]), async (req, res) => {
  try {
    const result = await require("../seedRoles")();
    res.json({ message: "Roles seeded", ...result });
  } catch (err) {
    console.error("[admin] POST /seed-roles error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/seed-languages", requireRole(["super_admin"]), async (req, res) => {
  try {
    const result = await require("../seedLanguages")();
    res.json({ message: "Languages seeded", ...result });
  } catch (err) {
    console.error("[admin] POST /seed-languages error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/seed-topics", requireRole(["super_admin"]), async (req, res) => {
  try {
    const result = await require("../seedTopics")();
    res.json({ message: "Topics seeded", ...result });
  } catch (err) {
    console.error("[admin] POST /seed-topics error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
