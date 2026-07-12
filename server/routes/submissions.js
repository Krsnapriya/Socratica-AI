const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const Session = require("../models/Session");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const runInContainer = require("../sandbox/runInContainer");
const { isCompileError, formatCompileError } = require("../sandbox/compileErrorHandler");
const { generateSocraticHint, generateCompileHint } = require("../ai/llmClient");
const { analyzeTraces } = require("../tracer/traceAligner");
const { compilerLimiter } = require("../middleware/rateLimiter");
const submissionLock = require("../middleware/submissionLock");
const { validate, schemas } = require("../middleware/validate");

const router = express.Router();

router.post("/", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), validate(schemas.submission), compilerLimiter, submissionLock, async (req, res) => {
  const { code, language, problemId, sessionId } = req.body;

  if (!code || !language || !problemId) {
    return res.status(400).json({ error: "code, language, and problemId are required" });
  }

  const trimmedCode = code.trim();
  if (trimmedCode.length === 0) {
    return res.status(400).json({ error: "Empty submission rejected. Please provide working code." });
  }

  if (trimmedCode.length < 10) {
    return res.status(400).json({ error: "Submission too short. Please provide a complete solution." });
  }

  const userId = req.userId;
  const sId = sessionId || crypto.randomUUID();

  const latestRound = await Submission.findOne({ sessionId: sId })
    .sort({ round: -1 }).select('round').lean();
  const roundNum = (latestRound?.round || 0) + 1;
  if (roundNum > 5) {
    return res.status(400).json({ error: 'Max attempts reached for this session' });
  }

  await Session.findOneAndUpdate(
    { sessionId: sId },
    {
      $setOnInsert: { sessionId: sId, userId, problemId, startedAt: new Date() },
      $set: { roundCount: 0 },
    },
    { upsert: true }
  );

  try {
    const problem = await Problem.findOne({ problemId }).lean();
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const oracleCode = problem.oracleSolutions[language];
    if (!oracleCode) {
      return res.status(400).json({ error: `No oracle solution found for ${language} / ${problemId}` });
    }

    let runResult;
    try {
      runResult = await runInContainer({ studentCode: code, oracleCode, problemId, language });
    } catch (err) {
      if (err.message === "container_timeout") {
        const sub = await Submission.create({
          userId, problemId, sessionId: sId, code, language, round: roundNum,
          verdict: "timeout", tier: 2,
          tier2Result: { studentTimeMs: 0, oracleTimeMs: 0, studentMemMb: 0, oracleMemMb: 0 }
        });
        await Session.updateOne({ sessionId: sId }, { roundCount: roundNum, endedAt: new Date() });
        return res.json(sub);
      }
      if (err.message === "system_judge_error") {
        const sub = await Submission.create({
          userId, problemId, sessionId: sId, code, language, round: roundNum,
          verdict: "system_judge_error", tier: 2,
          tier2Result: { studentTimeMs: 0, oracleTimeMs: 0, studentMemMb: 0, oracleMemMb: 0 },
          hint: "The sandbox execution environment encountered an infrastructure failure. Please retry or contact an administrator."
        });
        await Session.updateOne({ sessionId: sId }, { roundCount: roundNum, endedAt: new Date() });
        return res.json(sub);
      }
      throw err;
    }

    const student = runResult.student || {};
    const oracle = runResult.oracle || {};

    if (isCompileError(student)) {
      const formatted = formatCompileError(student);
      const hint = await generateCompileHint(code, language, problem.statement, formatted.compileError, "Compile Error");
      const sub = await Submission.create({
        userId, problemId, sessionId: sId, code, language, round: roundNum,
        verdict: "compile_error", tier: 2,
        tier2Result: { studentTimeMs: 0, oracleTimeMs: 0, studentMemMb: 0, oracleMemMb: 0 },
        hint: hint || formatted.compileError
      });
      await Session.updateOne({ sessionId: sId }, { roundCount: roundNum, endedAt: new Date() });
      return res.json(sub);
    }

    let verdict = "fail";
    if (student.error) {
      if (student.error === "timeout") verdict = "timeout";
      else if (student.error.includes("oom") || student.error.includes("OutOfMemory")) verdict = "memory_exceeded";
      else verdict = "fail";
    } else {
      const sOut = (student.stdout || "").trim();
      const oOut = (oracle.stdout || "").trim();
      if (sOut === oOut && sOut !== "") verdict = "pass";
    }

    const studentTimeMs = student.elapsed_ms || 0;
    const oracleTimeMs = oracle.elapsed_ms || 0;
    const studentMemMb = Math.round((student.max_memory_bytes || 0) / (1024 * 1024) * 100) / 100;
    const oracleMemMb = Math.round((oracle.max_memory_bytes || 0) / (1024 * 1024) * 100) / 100;

    let finalTier = 2;
    let traceLog = undefined;
    let divergenceStep = undefined;
    let hint = undefined;

    if (verdict === "fail") {
      const { summary } = analyzeTraces({
        studentTelemetry: student,
        oracleTelemetry: oracle,
        language,
      });
      finalTier = summary.tier;
      if (summary.tier === 1) {
        traceLog = (await require('../tracer/traceAligner').truncateSnapshots(student.snapshots)) || [];
        divergenceStep = summary.divergenceStep;
      }

      // Fetch previous round's hint so the AI doesn't repeat itself
      const previousHint = roundNum > 1
        ? (await Submission.findOne({ sessionId: sId, round: roundNum - 1 }).select('hint').lean())?.hint || undefined
        : undefined;

      const hintParams = {
        code, language, problemStatement: problem.statement,
        verdict: 'fail', previousHint,
      };

      if (summary.tier === 1) {
        hint = await generateSocraticHint({
          ...hintParams, tier: 1,
          traceData: {
            snapshots: student.snapshots || [],
            steps: student.steps || 0,
            studentStdout: student.stdout || '',
            oracleStdout: oracle.stdout || '',
            divergenceStep: summary.divergenceStep,
            divergenceLine: summary.divergenceLine,
            divergenceLocals: summary.divergenceLocals,
          },
        });
      } else {
        hint = await generateSocraticHint({
          ...hintParams, tier: 2,
          performanceData: {
            studentStdout: student.stdout || '',
            oracleStdout: oracle.stdout || '',
            studentTimeMs, oracleTimeMs,
            studentMemMb, oracleMemMb,
            error: student.error || '',
          },
        });
      }
    }

    const sub = await Submission.create({
      userId, problemId, sessionId: sId, code, language, round: roundNum,
      verdict, tier: finalTier, traceLog, divergenceStep,
      tier2Result: { studentTimeMs, oracleTimeMs, studentMemMb, oracleMemMb },
      hint,
    });

    const sessionUpdate = { roundCount: roundNum, endedAt: new Date() };
    if (verdict === 'pass') sessionUpdate.finalVerdict = 'pass';
    else if (roundNum >= 5) sessionUpdate.finalVerdict = 'max_attempts_reached';
    await Session.updateOne({ sessionId: sId }, { $set: sessionUpdate });

    res.json(sub);
  } catch (err) {
    console.error("[submissions] Handler error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/session/:sessionId", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const rounds = await Submission.find({ sessionId: req.params.sessionId })
      .sort({ round: 1 }).lean();
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).lean();
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    if (submission.userId.toString() !== req.userId && !["admin", "super_admin"].includes(req.userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const userId = req.userId;

    const [total, passCount, submissions] = await Promise.all([
      Submission.countDocuments({ userId }),
      Submission.countDocuments({ userId, verdict: "pass" }),
      Submission.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const attempted = new Set(submissions.map((s) => s.problemId)).size;

    const solvedProblems = await Submission.distinct("problemId", { userId, verdict: "pass" });

    const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

    const passSubs = submissions.filter((s) => s.verdict === "pass" && s.tier2Result?.studentTimeMs);
    const avgTimeMs = passSubs.length > 0
      ? Math.round(passSubs.reduce((acc, s) => acc + s.tier2Result.studentTimeMs, 0) / passSubs.length)
      : 0;

    const langCounts = {};
    submissions.forEach((s) => {
      langCounts[s.language] = (langCounts[s.language] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = new Set(submissions.map((s) => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }));
    let streak = 0;
    for (let i = 0; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.getTime())) streak++;
      else if (i > 0) break;
    }

    const heatmapSubmissions = await Submission.find({ userId })
      .sort({ createdAt: -1 })
      .limit(144)
      .select('verdict createdAt')
      .lean();
    const heatmap = heatmapSubmissions.reverse().map(s => s.verdict);

    res.json({
      total, passCount, passRate, attempted,
      solved: solvedProblems.length, avgTimeMs, streak,
      langCounts, heatmap,
    });
  } catch (err) {
    console.error("[submissions] stats error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recent", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const subs = await Submission.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const problemIds = [...new Set(subs.map((s) => s.problemId))];
    const problems = await Problem.find(
      { problemId: { $in: problemIds } },
      { problemId: 1, title: 1 }
    ).lean();
    const titleMap = {};
    problems.forEach((p) => { titleMap[p.problemId] = p.title; });

    const enriched = subs.map((s) => ({
      ...s,
      problemTitle: titleMap[s.problemId] || s.problemId,
    }));

    res.json(enriched);
  } catch (err) {
    console.error("[submissions] recent error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/solved", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const solvedIds = await Submission.distinct("problemId", {
      userId: req.userId,
      verdict: "pass",
    });

    const problems = await Problem.find(
      { problemId: { $in: solvedIds } },
      { problemId: 1, title: 1, category: 1, statement: 1, difficulty: 1 }
    ).lean();

    res.json({ count: problems.length, problems });
  } catch (err) {
    console.error("[submissions] solved error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
