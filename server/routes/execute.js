const express = require("express");
const { z } = require("zod");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { compilerLimiter } = require("../middleware/rateLimiter");
const submissionLock = require("../middleware/submissionLock");
const { runCode, runSamples, submitSolution } = require("../engine/execute");
const { config } = require("../configLoader");

const router = express.Router();

const ALLOWED_LANGUAGES = config?.sandbox?.languages
  ? Object.keys(config.sandbox.languages)
  : ["python", "cpp", "javascript"];

const MAX_CODE_LENGTH = 50000;
const MAX_CUSTOM_INPUT = 10240;
const MIN_CODE_LENGTH = 10;

const runCodeSchema = z.object({
  code: z.string().min(1, "Code is required").max(MAX_CODE_LENGTH, "Code too long"),
  language: z.enum(ALLOWED_LANGUAGES, { errorMap: () => ({ message: `Language must be one of: ${ALLOWED_LANGUAGES.join(", ")}` }) }),
  problemId: z.string().min(1, "Problem ID is required"),
  customInput: z.string().max(MAX_CUSTOM_INPUT, "Custom input too large").optional(),
});

const runSamplesSchema = z.object({
  code: z.string().min(1, "Code is required").max(MAX_CODE_LENGTH, "Code too long"),
  language: z.enum(ALLOWED_LANGUAGES, { errorMap: () => ({ message: `Language must be one of: ${ALLOWED_LANGUAGES.join(", ")}` }) }),
  problemId: z.string().min(1, "Problem ID is required"),
});

const submitSchema = z.object({
  code: z.string().min(1, "Code is required").max(MAX_CODE_LENGTH, "Code too long"),
  language: z.enum(ALLOWED_LANGUAGES, { errorMap: () => ({ message: `Language must be one of: ${ALLOWED_LANGUAGES.join(", ")}` }) }),
  problemId: z.string().min(1, "Problem ID is required"),
  sessionId: z.string().optional(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`);
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    req.body = result.data;
    next();
  };
}

// CSRF token endpoint for execute routes
router.get("/csrf-token", require("../middleware/csrf").csrfToken, (req, res) => res.json({ token: req._csrfToken || req.cookies?._csrf }));

router.post("/run", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), compilerLimiter, validateBody(runCodeSchema), async (req, res) => {
  try {
    const { code, language, problemId, customInput } = req.body;
    const result = await runCode({ code, language, problemId, customInput });
    res.json(result);
  } catch (err) {
    console.error("[execute/run] Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/samples", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), compilerLimiter, validateBody(runSamplesSchema), async (req, res) => {
  try {
    const { code, language, problemId } = req.body;
    const result = await runSamples({ code, language, problemId });
    res.json(result);
  } catch (err) {
    console.error("[execute/samples] Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/submit", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), compilerLimiter, submissionLock, validateBody(submitSchema), async (req, res) => {
  try {
    const { code, language, problemId, sessionId } = req.body;
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
