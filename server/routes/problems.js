const express = require("express");
const Problem = require("../models/Problem");
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

    const problems = await Problem.find({}, { starterCode: 0, testCases: 0, oracleSolutions: 0 }).lean();
    
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

// Get problem detail
router.get("/:id", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!(await canAccessProblem(user, req.params.id))) {
      return res.status(403).json({ error: "Access denied. Module locked." });
    }

    const problem = await Problem.findOne({ problemId: req.params.id }, { oracleSolutions: 0 }).lean();
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
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
