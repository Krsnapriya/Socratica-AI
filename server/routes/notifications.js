const express = require("express");
const Notification = require("../models/Notification");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Get active notifications for current user (with read status)
router.get("/active", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = await Notification.find({
      active: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ],
    }).sort({ createdAt: -1 }).limit(20).lean();

    const result = notifications.map(n => ({
      ...n,
      isRead: n.readBy?.some(id => id.toString() === userId.toString()) || false,
    }));

    res.json(result);
  } catch (err) {
    console.error("[notifications] GET /active error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all active notifications (admin)
router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      active: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ],
    }).sort({ createdAt: -1 }).limit(50).lean();

    res.json(notifications);
  } catch (err) {
    console.error("[notifications] GET / error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark a notification as read for current user
router.post("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.userId } },
      { new: true }
    ).lean();

    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (err) {
    console.error("[notifications] POST /:id/read error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark all notifications as read for current user
router.post("/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { active: true },
      { $addToSet: { readBy: req.userId } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[notifications] POST /read-all error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get unread count for current user
router.get("/unread-count", requireAuth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      active: true,
      readBy: { $ne: req.userId },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ],
    });
    res.json({ count });
  } catch (err) {
    console.error("[notifications] GET /unread-count error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
