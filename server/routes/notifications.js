const express = require("express");
const Notification = require("../models/Notification");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      active: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ],
    }).sort({ createdAt: -1 }).limit(20).lean();

    res.json(notifications);
  } catch (err) {
    console.error("[notifications] GET / error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get active notifications for the current user (public)
router.get("/active", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      active: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ],
    }).sort({ createdAt: -1 }).limit(10).lean();

    res.json(notifications);
  } catch (err) {
    console.error("[notifications] GET /active error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
