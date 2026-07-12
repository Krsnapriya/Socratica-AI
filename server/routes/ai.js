const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { chat, getHistory, clearHistory } = require("../ai/aiOrchestrator");
const AIConversation = require("../models/AIConversation");
const User = require("../models/User");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const LearningPath = require("../models/LearningPath");

// All AI mentor routes require auth
router.use(requireAuth);

// ── Chat with AI Mentor ──────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  try {
    const { message, sessionId, topic, context, style } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const result = await chat(req.userId, { message, sessionId, topic, context, style });
    if (result.error) return res.status(result.fallback ? 200 : 500).json(result);
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
    const history = await getHistory(req.userId, limit);
    res.json(history);
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
    await clearHistory(req.userId, sessionId);
    res.json({ success: true });
  } catch (err) {
    console.error("[ai/mentor] clear error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Explain syllabus / topic ────────────────────────────────────────────
router.post("/syllabus", async (req, res) => {
  try {
    const { moduleId, problemId } = req.body;
    const ctx = { moduleId, problemId };
    const context = await require("../ai/aiOrchestrator").gatherContext(req.userId, ctx);

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

    if (!topicContext) return res.status(400).json({ error: "Module ID or Problem ID required" });

    const result = await chat(req.userId, {
      message: topicContext,
      topic: "syllabus_explanation",
      context: ctx,
    });
    if (result.error) return res.status(result.fallback ? 200 : 500).json(result);
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] syllabus error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Explain compiler error ──────────────────────────────────────────────
router.post("/debug", async (req, res) => {
  try {
    const { code, language, problemId, error, sessionId } = req.body;
    if (!error) return res.status(400).json({ error: "Error message is required" });

    const ctx = { problemId, sessionId };
    if (code) ctx.code = code.substring(0, 2000);

    const debugMessage = `I'm working on a ${language} problem and got this error. Help me understand what caused it and how to fix it.\n\n**Error:**\n\`\`\`\n${error}\n\`\`\`\n${code ? `**My Code:**\n\`\`\`${language}\n${code.substring(0, 1500)}\n\`\`\`` : ""}\n\nExplain:\n1. What caused this error\n2. Where it likely occurred\n3. Why it happened\n4. How to fix it\n5. Similar mistakes to avoid`;

    const result = await chat(req.userId, {
      message: debugMessage,
      topic: "debug_explanation",
      context: ctx,
    });
    if (result.error) return res.status(result.fallback ? 200 : 500).json(result);
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] debug error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Code review ─────────────────────────────────────────────────────────
router.post("/code-review", async (req, res) => {
  try {
    const { code, language, problemId, sessionId } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required" });

    const ctx = { problemId, sessionId };
    const problem = problemId ? await Problem.findOne({ problemId }).lean() : null;

    const reviewMessage = `Review my ${language} code and provide feedback on:\n\n1. **Readability** - naming, formatting, clarity\n2. **Correctness** - edge cases, logic errors\n3. **Complexity** - time and space analysis\n4. **Best Practices** - idiomatic patterns, modularity\n5. **Optimization Suggestions** - if applicable\n\n${problem ? `**Problem:** ${problem.title}\n` : ""}**My Code:**\n\`\`\`${language}\n${code.substring(0, 2000)}\n\`\`\``;

    const result = await chat(req.userId, {
      message: reviewMessage,
      topic: "code_review",
      context: ctx,
    });
    if (result.error) return res.status(result.fallback ? 200 : 500).json(result);
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] code-review error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Generate quiz ───────────────────────────────────────────────────────
router.post("/quiz", async (req, res) => {
  try {
    const { moduleId, problemId, difficulty, count = 5 } = req.body;
    if (!moduleId && !problemId) return res.status(400).json({ error: "Module ID or Problem ID required" });

    const ctx = { moduleId, problemId };
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
        const titles = (mod.topics || []).map(t => t.title).join(", ");
        quizContext = `Create a quiz with ${count} questions covering these topics: ${titles}. Difficulty: ${difficulty || "mixed"}. Include answer key.`;
      }
    }

    if (!quizContext) return res.status(400).json({ error: "Could not find content for quiz" });

    const result = await chat(req.userId, {
      message: quizContext,
      topic: "quiz_generation",
      context: ctx,
    });
    if (result.error) return res.status(result.fallback ? 200 : 500).json(result);
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] quiz error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get personalized learning path ──────────────────────────────────────
router.get("/learning-path", async (req, res) => {
  try {
    let lp = await LearningPath.findOne({ userId: req.userId }).lean();

    // Analyze if not recently done
    if (!lp || !lp.lastAnalyzed || Date.now() - new Date(lp.lastAnalyzed).getTime() > 3600000) {
      const submissions = await Submission.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
      const User = require("../models/User");
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

      const aiContext = { weakAreas, strengths, recentSubmissions: submissions.slice(0, 5).map(s => ({ problemId: s.problemId, verdict: s.verdict })) };
      const aiMessage = `Based on my learning data, suggest the next 3-5 topics I should focus on and specific practice recommendations:\n\nWeak areas: ${weakAreas.map(w => w.topic).join(", ")}\nStrengths: ${strengths.join(", ")}\nTotal problems attempted: ${submissions.length}\nRecent verdicts: ${submissions.slice(0, 10).map(s => s.verdict).join(", ")}`;

      const result = await chat(req.userId, { message: aiMessage, topic: "learning_path_analysis", context: {} });

      lp = await LearningPath.findOneAndUpdate(
        { userId: req.userId },
        {
          $set: {
            weakAreas, strengths, lastAnalyzed: new Date(),
            recommendations: result.response ? [{
              type: "next_topic", reason: result.response.substring(0, 500), priority: 100,
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

// ── Interview practice ──────────────────────────────────────────────────
router.post("/interview", async (req, res) => {
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

    const result = await chat(req.userId, {
      message: interviewMessage,
      topic: "interview_practice",
      context: {},
    });
    if (result.error) return res.status(result.fallback ? 200 : 500).json(result);
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] interview error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Session reflection / summary ────────────────────────────────────────
router.post("/reflect", async (req, res) => {
  try {
    const { sessionId, problemId } = req.body;
    const ctx = { sessionId, problemId };

    const reflectMessage = `Summarize my learning session. Cover:\n1. Topics covered\n2. Concepts I seem to understand well\n3. Mistakes I made and what I learned from them\n4. Areas I should review\n5. Suggested next steps or topics`;

    const result = await chat(req.userId, {
      message: reflectMessage,
      topic: "session_reflection",
      context: ctx,
    });
    if (result.error) return res.status(result.fallback ? 200 : 500).json(result);
    res.json(result);
  } catch (err) {
    console.error("[ai/mentor] reflect error:", err.message);
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

    res.json({
      totalUsers, totalSubmissions, passRate,
      commonErrors, topFailedProblems, completionRates,
    });
  } catch (err) {
    console.error("[ai/mentor] insights error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
