const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { validate } = require("../middleware/validate");
const { compilerLimiter } = require("../middleware/rateLimiter");
const submissionLock = require("../middleware/submissionLock");
const { runCode, runSamples, submitSolution } = require("../engine/execute");
const { config } = require("../configLoader");

const router = express.Router();

const langList = config.roles ? Object.keys(config.sandbox.languages).join(",") : "python,cpp,javascript";
const runCodeSchema = {
  code: "required",
  language: `required|in:${langList}`,
  problemId: "required",
};

const runSamplesSchema = {
  code: "required",
  language: `required|in:${langList}`,
  problemId: "required",
};

const submitSchema = {
  code: "required",
  language: `required|in:${langList}`,
  problemId: "required",
};

router.post("/run", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), compilerLimiter, async (req, res) => {
  try {
    const { code, language, problemId, customInput } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: "Code is required" });
    }
    if (code.trim().length < config.execution.minCodeLength) {
      return res.status(400).json({ error: "Submission too short. Please provide a complete solution." });
    }
    if (customInput && customInput.length > config.execution.maxCustomInputBytes) {
      return res.status(400).json({ error: "Custom input too large (max 10KB)" });
    }

    const result = await runCode({ code, language, problemId, customInput });
    res.json(result);
  } catch (err) {
    console.error("[execute/run] Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/samples", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), compilerLimiter, async (req, res) => {
  try {
    const { code, language, problemId } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: "Code is required" });
    }
    if (code.trim().length < 10) {
      return res.status(400).json({ error: "Submission too short. Please provide a complete solution." });
    }

    const result = await runSamples({ code, language, problemId });
    res.json(result);
  } catch (err) {
    console.error("[execute/samples] Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/submit", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), compilerLimiter, submissionLock, async (req, res) => {
  try {
    const { code, language, problemId, sessionId } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: "Code is required" });
    }
    if (code.trim().length < 10) {
      return res.status(400).json({ error: "Submission too short. Please provide a complete solution." });
    }

    const result = await submitSolution({
      code, language, problemId,
      sessionId: sessionId || req.body.sessionId,
      userId: req.userId,
    });
    res.json(result);
  } catch (err) {
    console.error("[execute/submit] Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
