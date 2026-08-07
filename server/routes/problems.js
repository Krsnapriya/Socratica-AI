const express = require("express");
const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

const User = require("../models/User");
const Module = require("../models/Module");

// Helper function to check problem access using pre-fetched user
async function canAccessProblem(user, problemId) {
  if (!user) return false;
  if (['admin', 'super_admin', 'instructor'].includes(user.role)) return true;

  const parentModule = await Module.findOne({ "topics.problemId": problemId }).lean();
  if (!parentModule) return false; // Orphaned problem

  const isUnlocked = user.unlockedModules.some(id => id.toString() === parentModule._id.toString());
  const hasNoPrereqs = !parentModule.prerequisites || parentModule.prerequisites.length === 0;

  return isUnlocked || hasNoPrereqs;
}

// Get problem list
router.get("/", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(401).json({ error: "User not found" });

    const isAdmin = ["admin", "super_admin"].includes(user.role);
    const projection = isAdmin ? { starterCode: 0, testCases: 0 } : { starterCode: 0, testCases: 0, oracleSolutions: 0 };
    const problems = await Problem.find({}, projection).lean();
    
    // Filter problems the user can access
    const accessibleProblems = [];
    for (const problem of problems) {
      if (await canAccessProblem(user, problem.problemId)) {
        accessibleProblems.push(problem);
      }
    }
    
    res.json(accessibleProblems);
  } catch (err) {
    console.error("[problems] Fetch error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Recommended next problem (progress-based nudge) ─────────────────────────
router.get("/next", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const Submission = require("../models/Submission");
    const [user, solvedIds] = await Promise.all([
      User.findById(req.userId).lean(),
      Submission.distinct("problemId", { userId: req.userId, verdict: "pass" }),
    ]);
    if (!user) return res.status(401).json({ error: "User not found" });

    const isAdminRole = ["admin", "super_admin", "instructor"].includes(user.role);
    const unlockedIds = (user.unlockedModules || []).map(id => id.toString());
    const modules = await Module.find().populate({ path: 'prerequisites', model: 'Module' }).sort({ order: 1 }).lean();

    for (const m of modules) {
      const prereqsMet = !m.prerequisites
        || m.prerequisites.length === 0
        || m.prerequisites.every(p => {
          if (!p) return true;
          const pts = p.topics || [];
          return pts.length === 0 || pts.every(t => solvedIds.includes(t.problemId));
        });
      const unlocked = isAdminRole || unlockedIds.includes(m._id.toString()) || prereqsMet;
      if (!unlocked) continue;

      const next = (m.topics || []).find(t => !solvedIds.includes(t.problemId));
      if (!next) continue;

      const problem = await Problem.findOne(
        { problemId: next.problemId },
        { problemId: 1, title: 1, difficulty: 1, category: 1, tags: 1 }
      ).lean();
      if (problem) {
        return res.json({
          recommendation: { ...problem, moduleId: m._id, moduleTitle: m.title },
          solvedCount: solvedIds.length,
        });
      }
    }

    res.json({ recommendation: null, solvedCount: solvedIds.length });
  } catch (err) {
    console.error("[problems] GET /next error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get problem detail
router.get("/:id", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!(await canAccessProblem(user, req.params.id))) {
      return res.status(403).json({ error: "Access denied. Module locked." });
    }

    const isAdmin = ["admin", "super_admin"].includes(user.role);
    const projection = isAdmin ? {} : { oracleSolutions: 0 };
    const problem = await Problem.findOne({ problemId: req.params.id }, projection).lean();
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Attach test cases from the TestCase collection
    const testCases = await TestCase.find({
      problemId: req.params.id,
      enabled: true,
    }).sort({ order: 1, createdAt: 1 }).lean();
    problem.testCases = testCases;

    // Structured constraints: fall back to parsing the statement's ## Constraints block
    if (!problem.constraints || problem.constraints.length === 0) {
      const match = String(problem.statement || "").match(/##\s*Constraints\s*\n([\s\S]*?)(?=\n##\s|\n##$|$)/i);
      if (match) {
        problem.constraints = match[1]
          .split("\n")
          .map(l => l.replace(/^[-*]\s+/, "").trim())
          .filter(Boolean);
      }
    }

    res.json(problem);
  } catch (err) {
    console.error("[problems] Detail fetch error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get problem starter code template
router.get("/:id/template", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!(await canAccessProblem(user, req.params.id))) {
      return res.status(403).json({ error: "Access denied. Module locked." });
    }

    const { lang = "python" } = req.query;
    const problem = await Problem.findOne({ problemId: req.params.id }, { starterCode: 1 }).lean();
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }
    const template = (problem.starterCode || {})[lang] || "";
    res.json({ code: template });
  } catch (err) {
    console.error("[problems] Template fetch error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
