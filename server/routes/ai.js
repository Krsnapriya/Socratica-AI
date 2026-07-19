const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const AIConversation = require("../models/AIConversation");
const User = require("../models/User");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const LearningPath = require("../models/LearningPath");
const { getAgentsForRequest, shouldGateContent, getRateLimit, getPersonaStyle } = require("../ai/roleRouter");
const { routeAndRespond, trackRoleInteraction } = require("../ai/orchestrator");
const { getLLMClient } = require("../ai/llmClient.unified");
const { buildAgentPrompt, getHintLevel } = require("../ai/agents");
const { buildMemoryContext, updateLearningMemory } = require("../ai/memoryAgent");
const { buildContentQualityPrompt } = require("../ai/agents/definitions/admin/contentQuality");
const { buildModerationPrompt } = require("../ai/agents/definitions/admin/moderation");
const { buildPlatformIntelPrompt } = require("../ai/agents/definitions/admin/platformIntel");
const { buildHealthPrompt } = require("../ai/agents/definitions/superAdmin/health");
const { buildSecurityPrompt } = require("../ai/agents/definitions/superAdmin/security");
const { buildGovernancePrompt } = require("../ai/agents/definitions/superAdmin/governance");
const { buildCurriculumPrompt } = require("../ai/agents/definitions/instructor/curriculum");
const { buildAssessmentPrompt } = require("../ai/agents/definitions/instructor/assessment");
const { buildInsightsPrompt } = require("../ai/agents/definitions/instructor/insights");
const { buildProblemAuthorPrompt } = require("../ai/agents/definitions/instructor/problemAuthor");
const redis = require("../redis");

// ── Rate limit store (Redis-backed, per-role) ────────────────────────────
async function roleRateLimit(req, res, next) {
  const role = req.userRole || "guest";
  const limit = getRateLimit(role);
  const key = `rl:${role}:${req.userId || req.ip}`;

  const count = await redis.incr(key, limit.windowMs);
  if (count > limit.requests) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again shortly." });
  }
  next();
}

// ── Guest access routes (no auth required) ──────────────────────────────
router.post("/guest/chat", roleRateLimit, async (req, res) => {
  try {
    const { message, topic } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const result = await routeAndRespond({
      userId: null,
      userRole: "guest",
      action: "chat",
      message,
      context: { topic, nudgeRegistration: true },
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/guest] chat error:", err.message);
    res.status(500).json({ error: "AI mentor unavailable" });
  }
});

router.post("/guest/syllabus", roleRateLimit, async (req, res) => {
  try {
    const { problemId } = req.body;
    if (!problemId) return res.status(400).json({ error: "problemId required" });

    const problem = await Problem.findOne({ problemId }).lean();
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const result = await routeAndRespond({
      userId: null,
      userRole: "guest",
      action: "syllabus",
      message: `Explain this topic: ${problem.title} (${problem.difficulty}, ${problem.category})`,
      problemId,
      context: { problem },
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/guest] syllabus error:", err.message);
    res.status(500).json({ error: "AI mentor unavailable" });
  }
});

// ── Auth middleware for all routes below ─────────────────────────────────
router.use(requireAuth);

// ── Chat with AI Mentor ──────────────────────────────────────────────────
router.post("/chat", roleRateLimit, async (req, res) => {
  try {
    const { message, sessionId, topic, context, style, code, language, problemId } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Extract code/language/problemId from either top-level or nested context
    const effectiveCode = code || context?.code;
    const effectiveLanguage = language || context?.language;
    const effectiveProblemId = problemId || context?.problemId;

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "chat",
      message,
      code: effectiveCode,
      language: effectiveLanguage,
      problemId: effectiveProblemId,
      sessionId,
      context: { topic, ...context, preferredStyle: style },
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] chat error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get conversation history ─────────────────────────────────────────────
router.get("/history", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const conversations = await AIConversation.find({ userId: req.userId, active: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select("sessionId topic createdAt updatedAt")
      .lean();
    res.json(conversations);
  } catch (err) {
    console.error("[ai/mentor] history error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get specific conversation ────────────────────────────────────────────
router.get("/conversation/:sessionId", async (req, res) => {
  try {
    const conversation = await AIConversation.findOne({
      userId: req.userId, sessionId: req.params.sessionId, active: true,
    }).select("-__v").lean();
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    res.json(conversation);
  } catch (err) {
    console.error("[ai/mentor] conversation error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Clear conversation history ──────────────────────────────────────────
router.delete("/history", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await AIConversation.updateOne(
        { userId: req.userId, sessionId },
        { $set: { active: false } }
      );
    } else {
      await AIConversation.updateMany(
        { userId: req.userId },
        { $set: { active: false } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[ai/mentor] clear error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Explain syllabus / topic ────────────────────────────────────────────
router.post("/syllabus", roleRateLimit, async (req, res) => {
  try {
    const { moduleId, problemId } = req.body;
    if (!moduleId && !problemId) return res.status(400).json({ error: "moduleId or problemId required" });

    let topicContext = "";
    if (problemId) {
      const problem = await Problem.findOne({ problemId }).lean();
      if (problem) {
        topicContext = `Explain the following topic to me as if I'm about to start learning it. Cover:\n\n1. Why this topic exists\n2. Real-world applications\n3. Industry relevance\n4. Prerequisites needed\n5. Learning outcomes\n6. Common misconceptions\n7. Estimated learning effort\n\n**Topic:** ${problem.title}\n**Difficulty:** ${problem.difficulty}\n**Category:** ${problem.category}\n**Tags:** ${(problem.tags || []).join(", ")}\n\n**Problem Statement:**\n${problem.statement?.substring(0, 500)}`;
      }
    } else if (moduleId) {
      const Module = require("../models/Module");
      const mod = await Module.findById(moduleId).populate("course", "title").lean();
      if (mod) {
        topicContext = `Give me a syllabus overview for this module. For each topic, explain the learning objectives, real-world relevance, and estimated effort:\n\n**Module:** ${mod.title}\n**Course:** ${mod.course?.title}\n**Description:** ${mod.description}\n\n**Topics:**\n${(mod.topics || []).map((t, i) => `${i + 1}. ${t.title}`).join("\n")}`;
      }
    }

    if (!topicContext) return res.status(400).json({ error: "Could not find content" });

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "syllabus",
      message: topicContext,
      context: { moduleId, problemId },
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] syllabus error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Explain compiler error ──────────────────────────────────────────────
router.post("/debug", roleRateLimit, async (req, res) => {
  try {
    const { code, language, problemId, error, sessionId } = req.body;
    if (!error) return res.status(400).json({ error: "Error message is required" });

    const debugMessage = `I'm working on a ${language} problem and got this error. Help me understand what caused it and how to fix it.\n\n**Error:**\n\`\`\`\n${error}\n\`\`\`\n${code ? `**My Code:**\n\`\`\`${language}\n${code.substring(0, 1500)}\n\`\`\`` : ""}\n\nExplain:\n1. What caused this error\n2. Where it likely occurred\n3. Why it happened\n4. How to fix it\n5. Similar mistakes to avoid`;

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "debug",
      message: debugMessage,
      code,
      language,
      problemId,
      sessionId,
      executionResult: { error: "compile_error" },
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] debug error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Code review (contextual) ────────────────────────────────────────────
router.post("/code-review-contextual", roleRateLimit, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { code, language, problemId } = req.body;
    if (!code || !problemId) return res.status(400).json({ error: "code and problemId are required" });

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "code-review-contextual",
      code,
      language: language || "python",
      problemId,
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] code-review-contextual error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Code review (legacy) ─────────────────────────────────────────────────
router.post("/code-review", roleRateLimit, async (req, res) => {
  try {
    const { code, language, problemId, sessionId } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required" });

    const problem = problemId ? await Problem.findOne({ problemId }).lean() : null;
    const reviewMessage = `Review my ${language} code and provide feedback on:\n\n1. **Readability** - naming, formatting, clarity\n2. **Correctness** - edge cases, logic errors\n3. **Complexity** - time and space analysis\n4. **Best Practices** - idiomatic patterns, modularity\n5. **Optimization Suggestions**\n\n${problem ? `**Problem:** ${problem.title}\n` : ""}**My Code:**\n\`\`\`${language}\n${code.substring(0, 2000)}\n\`\`\``;

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "code-review",
      message: reviewMessage,
      code,
      language,
      problemId,
      sessionId,
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] code-review error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Oracle Comparison (post-acceptance) ──────────────────────────────────
router.post("/oracle-comparison", roleRateLimit, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { code, language, problemId } = req.body;
    if (!code || !problemId) return res.status(400).json({ error: "code and problemId are required" });

    const Problem = require("../models/Problem");
    const ReferenceSolution = require("../models/ReferenceSolution");
    const problem = await Problem.findOne({ problemId }).lean();

    // Try ReferenceSolution collection first, fall back to inline oracleSolutions
    let referenceSolutions = await ReferenceSolution.find({
      problemId,
      language: language || "python",
      verified: true,
    }).sort({ isPrimary: -1, createdAt: 1 }).lean();

    if (referenceSolutions.length === 0 && problem?.oracleSolutions?.[language]) {
      referenceSolutions = [{
        problemId,
        language,
        code: problem.oracleSolutions[language],
        variant: "primary",
        isPrimary: true,
        verified: true,
      }];
    }

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "oracle-comparison",
      code,
      language: language || "python",
      problemId,
      context: { referenceSolutions },
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] oracle-comparison error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Learning Summary ─────────────────────────────────────────────────────
router.post("/learning-summary", roleRateLimit, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { sessionId } = req.body;
    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "learning-summary",
      sessionId,
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] learning-summary error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Context-Aware Hint ───────────────────────────────────────────────────
router.post("/contextual-hint", roleRateLimit, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { code, language, problemId, sessionId } = req.body;
    if (!code || !problemId) return res.status(400).json({ error: "code and problemId are required" });

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "contextual-hint",
      code,
      language: language || "python",
      problemId,
      sessionId,
      explicitAgent: "hintAgent",
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] contextual-hint error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Confidence Report ────────────────────────────────────────────────────
router.post("/confidence", roleRateLimit, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { code, language, problemId } = req.body;
    if (!code) return res.status(400).json({ error: "code is required" });
    const { analyzeStudentCode } = require("../ai/codeAnalyzer");
    const { scoreConfidence, formatConfidence } = require("../ai/confidenceScorer");
    const codeAnalysis = analyzeStudentCode(code, language || "python");
    const confidence = scoreConfidence({ code, language: language || "python", codeAnalysis });
    res.json({ confidence, label: formatConfidence(confidence) });
  } catch (err) {
    console.error("[ai/mentor] confidence error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Generate quiz ───────────────────────────────────────────────────────
router.post("/quiz", roleRateLimit, async (req, res) => {
  try {
    const { moduleId, problemId, difficulty, count = 5 } = req.body;
    if (!moduleId && !problemId) return res.status(400).json({ error: "moduleId or problemId required" });

    let quizContext = "";
    if (problemId) {
      const problem = await Problem.findOne({ problemId }).lean();
      if (problem) {
        quizContext = `Create a quiz with ${count} questions about "${problem.title}" (${problem.difficulty}, ${problem.category}). Include a mix of:\n- Multiple choice\n- Code tracing / output prediction\n- True/False about concepts\n- Debugging scenarios\n\nProvide the answer key after the questions.`;
      }
    } else if (moduleId) {
      const Module = require("../models/Module");
      const mod = await Module.findById(moduleId).lean();
      if (mod) {
        quizContext = `Create a quiz with ${count} questions covering these topics: ${(mod.topics || []).map(t => t.title).join(", ")}. Difficulty: ${difficulty || "mixed"}. Include answer key.`;
      }
    }

    if (!quizContext) return res.status(400).json({ error: "Could not find content for quiz" });

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "quiz",
      message: quizContext,
      context: { moduleId, problemId },
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] quiz error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Interview practice ──────────────────────────────────────────────────
router.post("/interview", roleRateLimit, async (req, res) => {
  try {
    const { topic, difficulty = "medium", type = "coding" } = req.body;

    const interviewMessage = `I'm practicing for a technical interview. Give me a ${difficulty} difficulty ${type} question${topic ? ` about ${topic}` : ""}. 

First, present the question. Then wait for my answer before giving feedback.

Question requirements:
- Clear problem statement
- Example input/output
- Constraints
- (if coding) Starter function signature in Python
- Evaluation criteria`;

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "chat",
      message: interviewMessage,
      context: { topic: "interview_practice" },
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] interview error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Session reflection / summary ────────────────────────────────────────
router.post("/reflect", roleRateLimit, async (req, res) => {
  try {
    const { sessionId, problemId } = req.body;

    const result = await routeAndRespond({
      userId: req.userId,
      userRole: req.userRole,
      action: "learning-summary",
      sessionId,
      context: { problemId },
    });
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] reflect error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get personalized learning path ──────────────────────────────────────
router.get("/learning-path", async (req, res) => {
  try {
    let lp = await LearningPath.findOne({ userId: req.userId }).lean();

    if (!lp || !lp.lastAnalyzed || Date.now() - new Date(lp.lastAnalyzed).getTime() > 3600000) {
      const submissions = await Submission.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
      const Module = require("../models/Module");

      const weakMap = {};
      const strongMap = {};
      const problemIds = [...new Set(submissions.map(s => s.problemId))];
      const problems = await Problem.find({ problemId: { $in: problemIds } }).lean();
      const probMap = {};
      problems.forEach(p => { probMap[p.problemId] = p; });

      submissions.forEach(s => {
        const tags = probMap[s.problemId]?.tags || [s.problemId];
        tags.forEach(tag => {
          if (s.verdict === "pass") {
            strongMap[tag] = (strongMap[tag] || 0) + 1;
          } else if (s.verdict !== "system_judge_error") {
            weakMap[tag] = (weakMap[tag] || 0) + 1;
          }
        });
      });

      const weakAreas = Object.entries(weakMap)
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, frequency]) => ({ topic, frequency, lastDetected: new Date() }));

      const strengths = Object.entries(strongMap)
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic);

      const aiResult = await routeAndRespond({
        userId: req.userId,
        userRole: req.userRole,
        action: "learning-summary",
        message: `Based on my learning data, suggest the next 3-5 topics I should focus on and specific practice recommendations:\n\nWeak areas: ${weakAreas.map(w => w.topic).join(", ")}\nStrengths: ${strengths.join(", ")}\nTotal problems attempted: ${submissions.length}`,
        context: { weakAreas, strengths },
      });

      lp = await LearningPath.findOneAndUpdate(
        { userId: req.userId },
        {
          $set: {
            weakAreas, strengths, lastAnalyzed: new Date(),
            recommendations: aiResult.response ? [{
              type: "next_topic", reason: aiResult.response.substring(0, 500), priority: 100,
            }] : [],
          },
        },
        { upsert: true, new: true }
      ).lean();
    }

    res.json(lp);
  } catch (err) {
    console.error("[ai/mentor] learning-path error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: Platform-wide AI insights ────────────────────────────────────
router.get("/insights", requireRole(["admin", "super_admin"]), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    const passRate = totalSubmissions > 0
      ? Math.round((await Submission.countDocuments({ verdict: "pass" })) / totalSubmissions * 100) : 0;

    const commonErrors = await Submission.aggregate([
      { $match: { compileOutput: { $ne: "", $exists: true } } },
      { $group: { _id: "$verdict", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topFailedProblems = await Submission.aggregate([
      { $match: { verdict: { $ne: "pass" } } },
      { $group: { _id: "$problemId", failures: { $sum: 1 }, uniqueUsers: { $addToSet: "$userId" } } },
      { $addFields: { uniqueUserCount: { $size: "$uniqueUsers" } } },
      { $sort: { failures: -1 } },
      { $limit: 10 },
      { $project: { _id: 1, failures: 1, uniqueUserCount: 1 } },
    ]);

    const completionRates = await Submission.aggregate([
      { $group: { _id: "$problemId", total: { $sum: 1 }, passed: { $sum: { $cond: [{ $eq: ["$verdict", "pass"] }, 1, 0] } } } },
      { $addFields: { passRate: { $multiply: [{ $divide: ["$passed", "$total"] }, 100] } } },
      { $sort: { total: -1 } },
      { $limit: 20 },
    ]);

    res.json({ totalUsers, totalSubmissions, passRate, commonErrors, topFailedProblems, completionRates });
  } catch (err) {
    console.error("[ai/mentor] insights error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// INSTRUCTOR AI ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

router.post("/instructor/curriculum", roleRateLimit, requireRole(["instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { message, courses, moduleData } = req.body;
    const client = getLLMClient();
    const prompt = buildCurriculumPrompt({ message, courses, moduleData });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `instr-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "curriculum-design",
      message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "instructorCurriculumAgent",
    });
    res.json({ response: result.text });
  } catch (err) {
    console.error("[ai/instructor] curriculum error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/instructor/assessment", roleRateLimit, requireRole(["instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { message, problems, moduleData, assessmentType } = req.body;
    const client = getLLMClient();
    const prompt = buildAssessmentPrompt({ message, problems, moduleData, assessmentType });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `instr-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "assessment-gen",
      message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "instructorAssessmentAgent",
    });
    res.json({ response: result.text });
  } catch (err) {
    console.error("[ai/instructor] assessment error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/instructor/insights", roleRateLimit, requireRole(["instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { message, studentData, classData } = req.body;
    const client = getLLMClient();
    const prompt = buildInsightsPrompt({ message, studentData, classData });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `instr-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "student-insights",
      message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "instructorInsightsAgent",
    });
    res.json({ response: result.text });
  } catch (err) {
    console.error("[ai/instructor] insights error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/instructor/problem-author", roleRateLimit, requireRole(["instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { message, category, difficulty, existingProblems } = req.body;
    const client = getLLMClient();
    const prompt = buildProblemAuthorPrompt({ message, category, difficulty, existingProblems });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `instr-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "problem-author",
      message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "instructorProblemAgent",
    });
    res.json({ response: result.text });
  } catch (err) {
    console.error("[ai/instructor] problem-author error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ADMIN AI ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

router.get("/admin/platform-intel", roleRateLimit, requireRole(["admin", "super_admin"]), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    const passRate = totalSubmissions > 0
      ? Math.round((await Submission.countDocuments({ verdict: "pass" })) / totalSubmissions * 100) : 0;

    const courseStats = await Submission.aggregate([
      { $group: { _id: "$problemId", total: { $sum: 1 }, passed: { $sum: { $cond: [{ $eq: ["$verdict", "pass"] }, 1, 0] } } } },
      { $addFields: { passRate: { $multiply: [{ $divide: ["$passed", "$total"] }, 100] } } },
      { $sort: { total: -1 } },
      { $limit: 20 },
    ]);

    const client = getLLMClient();
    const prompt = buildPlatformIntelPrompt({
      message: req.query.message || "Give me a platform health overview.",
      platformStats: { totalUsers, totalSubmissions, passRate },
      problemStats: courseStats.map(c => ({ problemId: c._id, failureRate: 100 - c.passRate, totalAttempts: c.total })),
    });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `admin-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "platform-intel",
      message: req.query.message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "adminPlatformAgent",
    });
    res.json({ response: result.text, stats: { totalUsers, totalSubmissions, passRate } });
  } catch (err) {
    console.error("[ai/admin] platform-intel error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/content-quality", roleRateLimit, requireRole(["admin", "super_admin"]), async (req, res) => {
  try {
    const { message, problems } = req.body;
    const client = getLLMClient();
    const prompt = buildContentQualityPrompt({ message, problems });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `admin-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "content-quality",
      message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "adminContentAgent",
    });
    res.json({ response: result.text });
  } catch (err) {
    console.error("[ai/admin] content-quality error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/moderation", roleRateLimit, requireRole(["admin", "super_admin"]), async (req, res) => {
  try {
    const { message, flaggedContent, submissionPatterns } = req.body;
    const client = getLLMClient();
    const prompt = buildModerationPrompt({ message, flaggedContent, submissionPatterns });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `admin-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "moderation",
      message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "adminModerationAgent",
    });
    res.json({ response: result.text });
  } catch (err) {
    console.error("[ai/admin] moderation error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN AI ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

router.get("/super-admin/health", roleRateLimit, requireRole(["super_admin"]), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
    const dbStats = {
      connectionState: dbState[mongoose.connection.readyState] || "unknown",
      collections: Object.keys(mongoose.connection.collections).length,
    };

    const totalUsers = await User.countDocuments();
    const totalSubmissions = await Submission.countDocuments();

    const client = getLLMClient();
    const prompt = buildHealthPrompt({
      message: req.query.message || "System health summary",
      dbStats,
      apiStats: { activeSessions: totalUsers },
    });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `sadmin-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "system-health",
      message: req.query.message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "superAdminHealthAgent",
    });
    res.json({ response: result.text, dbStats });
  } catch (err) {
    console.error("[ai/super-admin] health error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/super-admin/security", roleRateLimit, requireRole(["super_admin"]), async (req, res) => {
  try {
    const { message } = req.body;
    const FailedLogin = require("../models/FailedLogin");
    const failedLogins = await FailedLogin.find({}).sort({ timestamp: -1 }).limit(20).lean();
    const failedCount24h = await FailedLogin.countDocuments({ timestamp: { $gte: new Date(Date.now() - 86400000) } });

    const client = getLLMClient();
    const prompt = buildSecurityPrompt({
      message: message || "Security overview",
      failedLogins: failedLogins.map(f => ({ email: f.email, ip: f.ip, reason: f.reason, timestamp: f.timestamp })),
      securityOverview: { failedLogins24h: failedCount24h },
    });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `sadmin-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "security-review",
      message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "superAdminSecurityAgent",
    });
    res.json({ response: result.text });
  } catch (err) {
    console.error("[ai/super-admin] security error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/super-admin/governance", roleRateLimit, requireRole(["super_admin"]), async (req, res) => {
  try {
    const { message } = req.body;
    const roles = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const client = getLLMClient();
    const prompt = buildGovernancePrompt({
      message: message || "Review role configuration",
      roles: roles.map(r => ({ name: r._id, userCount: r.count, permissionCount: 0 })),
    });
    const result = await client.chat(prompt.system, prompt.user);
    const sessionId = req.headers["x-session-id"] || `sadmin-${Date.now()}`;
    trackRoleInteraction({
      userId: req.userId, userRole: req.userRole, action: "governance",
      message, response: result.text, tokens: result.tokens, latencyMs: result.latencyMs,
      sessionId, agentType: "superAdminGovernanceAgent",
    });
    res.json({ response: result.text });
  } catch (err) {
    console.error("[ai/super-admin] governance error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── AI Usage Stats (for admins) ─────────────────────────────────────────
router.get("/usage-stats", requireRole(["admin", "super_admin"]), async (req, res) => {
  try {
    const AIUsage = require("../models/AIUsage");
    const days = parseInt(req.query.days) || 7;
    const since = new Date(Date.now() - days * 86400000);

    const stats = await AIUsage.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { action: "$action", role: "$role" },
          count: { $sum: 1 },
          avgLatency: { $avg: "$latencyMs" },
          errors: { $sum: { $cond: ["$success", 0, 1] } },
          totalTokens: { $sum: "$totalTokens" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalRequests = stats.reduce((sum, s) => sum + s.count, 0);
    const totalErrors = stats.reduce((sum, s) => sum + s.errors, 0);

    res.json({ stats, totalRequests, totalErrors, period: `${days}d` });
  } catch (err) {
    console.error("[ai/usage-stats] error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
