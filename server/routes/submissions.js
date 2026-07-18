const express = require("express");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// ── Legacy POST route removed — execution now goes through /api/execute ─────
// Use POST /api/execute/run, /api/execute/samples, or /api/execute/submit instead.
router.post("/", requireAuth, async (req, res) => {
  res.status(410).json({
    error: "This endpoint is deprecated. Use POST /api/execute/run, /api/execute/samples, or /api/execute/submit instead.",
  });
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

router.get("/session/:sessionId/analysis", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
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

    res.json({
      problemId,
      language,
      title: problem.title,
      statement: problem.statement,
      difficulty: problem.difficulty,
      category: problem.category,
      oracleCode,
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
    console.error("[submissions] analysis error:", err.message);
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

module.exports = router;
