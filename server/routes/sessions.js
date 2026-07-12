const express = require("express");
const Session = require("../models/Session");
const Submission = require("../models/Submission");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const isAdmin = ["admin", "super_admin"].includes(req.userRole);
    const filter = isAdmin ? {} : { userId: req.userId };
    const sessions = await Session.find(filter)
      .sort({ startedAt: -1 })
      .limit(50)
      .lean();
    res.json(sessions);
  } catch (err) {
    console.error("[sessions] list error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:sessionId", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const isAdmin = ["admin", "super_admin"].includes(req.userRole);
    const filter = isAdmin
      ? { sessionId: req.params.sessionId }
      : { sessionId: req.params.sessionId, userId: req.userId };
    const session = await Session.findOne(filter).lean();
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
