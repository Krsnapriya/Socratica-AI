const express = require("express");
const Session = require("../models/Session");
const Submission = require("../models/Submission");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId })
      .sort({ startedAt: -1 })
      .limit(20)
      .lean();
    res.json(sessions);
  } catch (err) {
    console.error("[sessions] list error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:sessionId", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const session = await Session.findOne({
      sessionId: req.params.sessionId,
      userId: req.userId,
    }).lean();
    if (!session) return res.status(404).json({ error: "Session not found" });

    const rounds = await Submission.find({ sessionId: req.params.sessionId })
      .sort({ round: 1 })
      .lean();

    res.json({ session, rounds });
  } catch (err) {
    console.error("[sessions] get error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
