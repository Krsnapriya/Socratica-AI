const User = require("../models/User");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const Session = require("../models/Session");
const TestCase = require("../models/TestCase");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Topic = require("../models/Topic");
const ReferenceSolution = require("../models/ReferenceSolution");

const CATEGORY_LABELS = {
  sample: "Basic sample tests",
  edge: "Edge cases",
  boundary: "Boundary conditions",
  stress: "Large input stress tests",
  random: "Randomized tests",
  performance: "Performance/timing tests",
  hidden: "Hidden correctness tests",
};

const HIDDEN_CATEGORY_HINTS = {
  edge: "Your solution may not handle edge cases properly. Consider empty inputs, single elements, or boundary values.",
  boundary: "Your solution may fail at boundary conditions. Think about the smallest and largest valid inputs.",
  stress: "Your solution may be too slow for large inputs. Consider optimizing your time complexity.",
  performance: "Your solution exceeds resource limits. Review your algorithm's efficiency.",
  random: "Your solution fails on some inputs. Check your logic more carefully.",
  hidden: "Your solution doesn't pass all test cases. Review your approach and edge cases.",
  sample: "Your solution doesn't pass the sample tests.",
};

// ── Course/Module/Topic Context ─────────────────────────────────────────────
async function buildCurriculumContext(problemId) {
  if (!problemId) return null;

  // Find the module that contains this problem
  const module = await Module.findOne({ "topics.problemId": problemId })
    .populate("course", "title description estimatedHours")
    .populate("prerequisites", "title description")
    .lean();

  if (!module) return null;

  // Find the course
  const course = module.course || await Course.findById(module.course).lean();

  // Find all modules in this course for progress tracking
  const courseModules = course?.modules
    ? await Module.find({ _id: { $in: course.modules } })
        .select("title order topics.problemId")
        .sort({ order: 1 })
        .lean()
    : [];

  // Find which topic in the module contains this problem
  const currentTopic = module.topics?.find(t => t.problemId === problemId);

  // Find prerequisite topics from the knowledge graph
  // Map problem category to topic names
  const problem = await Problem.findOne({ problemId }).lean();
  const categoryToTopic = {
    "Arrays": "arrays", "Linked Lists": "linked_lists", "Stacks": "stacks",
    "Queues": "queues", "Hash Maps": "hashing", "Trees": "trees",
    "Graphs": "graphs", "Dynamic Programming": "dynamic_programming",
    "Binary Search": "binary_search", "Sorting": "sorting",
    "Recursion": "recursion", "Backtracking": "backtracking",
    "Two Pointers": "two_pointers", "Sliding Window": "sliding_window",
    "Greedy": "greedy", "Bit Manipulation": "bit_manipulation",
    "Strings": "strings", "Math": "math", "Design": "design",
  };
  const topicName = categoryToTopic[problem?.category];
  let prerequisites = [];
  if (topicName) {
    const topicDoc = await Topic.findOne({ name: topicName }).lean();
    if (topicDoc?.dependsOn?.length > 0) {
      prerequisites = await Topic.find({ name: { $in: topicDoc.dependsOn } })
        .select("name category description")
        .lean();
    }
  }

  // Get reference solutions for this problem
  const referenceSolutions = await ReferenceSolution.find({ problemId, verified: true })
    .select("language variant code timeComplexity spaceComplexity algorithm isPrimary")
    .sort({ isPrimary: -1 })
    .lean();

  return {
    course: course ? {
      title: course.title,
      description: course.description,
      estimatedHours: course.estimatedHours,
    } : null,
    module: {
      title: module.title,
      description: module.description,
      order: module.order,
      totalTopics: module.topics?.length || 0,
      currentTopic: currentTopic?.title || null,
      prerequisites: (module.prerequisites || []).map(p => ({
        title: p.title,
        description: p.description,
      })),
    },
    courseModules: courseModules.map(m => ({
      title: m.title,
      order: m.order,
      problemCount: m.topics?.length || 0,
    })),
    knowledgeGraph: {
      currentTopic: topicName || null,
      prerequisites: prerequisites.map(p => ({
        name: p.name,
        category: p.category,
        description: p.description,
      })),
    },
    referenceSolutions: referenceSolutions.map(rs => ({
      language: rs.language,
      variant: rs.variant,
      timeComplexity: rs.timeComplexity,
      spaceComplexity: rs.spaceComplexity,
      algorithm: rs.algorithm,
      isPrimary: rs.isPrimary,
      // Never expose oracle code to students — only metadata
    })),
  };
}

async function buildStudentProfile(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  // Aggregate submission stats in a single query instead of N+1
  const [stats, recentSubmissions, topicAggregation] = await Promise.all([
    Submission.aggregate([
      { $match: { userId: user._id } },
      { $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        passCount: { $sum: { $cond: [{ $eq: ["$verdict", "pass"] }, 1, 0] } },
        solvedProblems: { $addToSet: { $cond: [{ $eq: ["$verdict", "pass"] }, "$problemId", null] } },
      }},
    ]),
    Submission.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("problemId verdict language createdAt tier")
      .lean(),
    Submission.aggregate([
      { $match: { userId: user._id } },
      { $group: {
        _id: "$problemId",
        totalAttempts: { $sum: 1 },
        passed: { $sum: { $cond: [{ $eq: ["$verdict", "pass"] }, 1, 0] } },
      }},
    ]),
  ]);

  const { totalSubmissions = 0, passCount = 0, solvedProblems = [] } = stats[0] || {};
  const solvedCount = (solvedProblems || []).filter(Boolean).length;
  const allProblemIds = topicAggregation.map(t => t._id);

  // Batch-fetch problem metadata for all attempted problems
  const problems = await Problem.find({ problemId: { $in: allProblemIds } })
    .select("problemId category difficulty")
    .lean();
  const problemMap = {};
  problems.forEach(p => { problemMap[p.problemId] = p; });

  // Build topic stats without per-problem queries
  const topicStats = {};
  for (const agg of topicAggregation) {
    const problem = problemMap[agg._id];
    if (!problem) continue;
    const cat = problem.category || "General";
    if (!topicStats[cat]) topicStats[cat] = { attempted: 0, solved: 0, difficulty: problem.difficulty };
    topicStats[cat].attempted += agg.totalAttempts;
    topicStats[cat].solved += agg.passed;
  }

  const weakTopics = Object.entries(topicStats)
    .filter(([_, s]) => s.attempted > 0 && s.solved / s.attempted < 0.5)
    .map(([topic, s]) => ({ topic, solveRate: Math.round((s.solved / s.attempted) * 100), attempts: s.attempted }));

  const strongTopics = Object.entries(topicStats)
    .filter(([_, s]) => s.solved > 0 && s.solved / s.attempted >= 0.8)
    .map(([topic, s]) => ({ topic, solveRate: Math.round((s.solved / s.attempted) * 100), solved: s.solved }));

  const submissionHistory = recentSubmissions.map(s => ({
    problemId: s.problemId,
    verdict: s.verdict,
    language: s.language,
    date: s.createdAt,
    tier: s.tier,
  }));

  // Calculate skill level based on pass rate and difficulty progression
  let skillLevel = "beginner";
  const overallPassRate = totalSubmissions > 0 ? passCount / totalSubmissions : 0;
  const hardSolved = Object.entries(topicStats)
    .filter(([_, s]) => s.difficulty === "hard" && s.solved > 0).length;
  if (overallPassRate > 0.6 && hardSolved > 0) skillLevel = "advanced";
  else if (overallPassRate > 0.3 || solvedCount > 3) skillLevel = "intermediate";

  return {
    email: user.email,
    role: user.role,
    joinedAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    totalSubmissions,
    totalPass: passCount,
    passRate: totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0,
    solvedCount,
    skillLevel,
    topicStats,
    weakTopics,
    strongTopics,
    submissionHistory,
    streak: calculateStreak(recentSubmissions),
  };
}

function calculateStreak(submissions) {
  const days = new Set(submissions.map(s => {
    const d = new Date(s.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.getTime())) streak++;
    else if (i > 0) break;
  }
  return streak;
}

async function buildAttemptHistory(userId, problemId, sessionId) {
  const filter = { userId, problemId };
  if (sessionId) filter.sessionId = sessionId;

  const submissions = await Submission.find(filter)
    .sort({ round: 1 })
    .select("round verdict code language tier hint tier2Result createdAt")
    .lean();

  return submissions.map(s => ({
    round: s.round,
    verdict: s.verdict,
    language: s.language,
    tier: s.tier,
    timeMs: s.tier2Result?.studentTimeMs || 0,
    memoryMb: s.tier2Result?.studentMemMb || 0,
    hadHint: !!s.hint,
    date: s.createdAt,
  }));
}

async function buildTestResults(userId, problemId, sessionId) {
  const submissions = await Submission.find({ userId, problemId, sessionId })
    .sort({ round: -1 })
    .limit(1)
    .lean();

  if (submissions.length === 0) return null;
  const latest = submissions[0];

  return {
    verdict: latest.verdict,
    round: latest.round,
    tier: latest.tier,
    timeMs: latest.tier2Result?.studentTimeMs || 0,
    oracleTimeMs: latest.tier2Result?.oracleTimeMs || 0,
    memoryMb: latest.tier2Result?.studentMemMb || 0,
    oracleMemoryMb: latest.tier2Result?.oracleMemMb || 0,
    divergenceStep: latest.divergenceStep,
    hint: latest.hint,
    // Include oracle output so AI knows correct answer on failure
    oracleOutput: latest.oracleOutput ? {
      stdout: latest.oracleOutput.stdout?.substring(0, 2000) || "",
      stderr: latest.oracleOutput.stderr?.substring(0, 500) || "",
      exitCode: latest.oracleOutput.exitCode,
      testResults: latest.oracleOutput.testResults || null,
    } : null,
  };
}

async function buildHiddenTestCategories(problemId, language) {
  const testCases = await TestCase.find({
    problemId,
    visibility: "hidden",
    enabled: true,
    $or: [{ language: "all" }, { language }],
  }).lean();

  const categories = {};
  for (const tc of testCases) {
    const cat = tc.category || "hidden";
    if (!categories[cat]) categories[cat] = { count: 0 };
    categories[cat].count++;
  }

  // Don't expose category names to AI — only provide aggregate hints
  const totalHidden = Object.values(categories).reduce((sum, c) => sum + c.count, 0);
  const failedCategories = Object.entries(categories)
    .filter(([cat]) => cat !== "sample")
    .map(([cat, info]) => ({
      hint: HIDDEN_CATEGORY_HINTS[cat] || "Some test cases failed. Review your approach.",
      count: info.count,
    }));

  return {
    totalHiddenTests: totalHidden,
    failedCategories,
    generalHint: failedCategories.length > 0
      ? failedCategories[0].hint
      : "Your solution doesn't pass all test cases. Review your approach and edge cases.",
  };
}

async function buildConversationHistory(userId, sessionId, limit = 20) {
  const AIConversation = require("../models/AIConversation");
  if (!sessionId) return [];

  const conversation = await AIConversation.findOne({ userId, sessionId })
    .select("messages")
    .lean();

  if (!conversation || !conversation.messages) return [];
  return conversation.messages.slice(-limit).map(m => ({
    role: m.role,
    content: m.content?.slice(0, 2000) || "",
  }));
}

async function buildFullContext({ userId, problemId, sessionId, code, language, executionResult, previousHint }) {
  // Parallel fetch: problem, student profile, attempt history, hidden categories, curriculum
  const [problem, studentProfile, attemptHistory, hiddenCategories, curriculum] = await Promise.all([
    Problem.findOne({ problemId }).lean(),
    userId ? buildStudentProfile(userId) : Promise.resolve(null),
    userId && problemId ? buildAttemptHistory(userId, problemId, sessionId) : Promise.resolve([]),
    buildHiddenTestCategories(problemId, language),
    buildCurriculumContext(problemId),
  ]);

  const conversationHistory = userId && sessionId
    ? await buildConversationHistory(userId, sessionId)
    : [];

  const testResults = userId && problemId && sessionId
    ? await buildTestResults(userId, problemId, sessionId)
    : null;

  return {
    student: studentProfile,
    problem: problem ? {
      id: problem.problemId,
      title: problem.title,
      statement: problem.statement,
      description: problem.description,
      category: problem.category,
      difficulty: problem.difficulty,
      tags: problem.tags,
      timeLimitMs: problem.timeLimitMs || problem.executionConfig?.defaultTimeLimitMs,
      memoryLimitMb: problem.memoryLimitMb || problem.executionConfig?.defaultMemoryLimitMb,
      oracleSolution: problem.oracleSolutions?.[language] || "",
    } : null,
    submission: {
      code,
      language,
      attemptHistory,
      previousHint,
      currentRound: attemptHistory.length + 1,
      maxRounds: problem?.maxRounds || 5,
    },
    execution: executionResult ? {
      stdout: executionResult.stdout || "",
      stderr: executionResult.stderr || "",
      error: executionResult.error || null,
      exitCode: executionResult.exitCode,
      elapsedMs: executionResult.elapsed_ms || 0,
      memoryBytes: executionResult.max_memory_bytes || 0,
    } : null,
    testResults,
    // Sanitized hidden test info (no category names exposed to AI)
    hiddenTestInfo: hiddenCategories,
    // Curriculum context (course, module, topic, prerequisites, reference solutions)
    curriculum,
    conversationHistory,
    weakTopics: studentProfile?.weakTopics || [],
    strongTopics: studentProfile?.strongTopics || [],
    skillLevel: studentProfile?.skillLevel || "intermediate",
    passRate: studentProfile?.passRate || 0,
    streak: studentProfile?.streak || 0,
  };
}

module.exports = {
  buildFullContext,
  buildStudentProfile,
  buildAttemptHistory,
  buildHiddenTestCategories,
  buildConversationHistory,
  buildCurriculumContext,
  CATEGORY_LABELS,
  HIDDEN_CATEGORY_HINTS,
};
