const User = require("../models/User");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const Session = require("../models/Session");
const TestCase = require("../models/TestCase");

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

async function buildStudentProfile(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const totalSubmissions = await Submission.countDocuments({ userId });
  const passCount = await Submission.countDocuments({ userId, verdict: "pass" });
  const solvedProblems = await Submission.distinct("problemId", { userId, verdict: "pass" });

  const recentSubmissions = await Submission.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("problemId verdict language createdAt tier")
    .lean();

  const allProblems = await Submission.distinct("problemId", { userId });

  const topicStats = {};
  for (const pid of allProblems) {
    const problem = await Problem.findOne({ problemId: pid }).select("category difficulty").lean();
    if (!problem) continue;
    const cat = problem.category || "General";
    if (!topicStats[cat]) topicStats[cat] = { attempted: 0, solved: 0, difficulty: problem.difficulty };
    topicStats[cat].attempted++;
    const solved = await Submission.findOne({ userId, problemId: pid, verdict: "pass" }).lean();
    if (solved) topicStats[cat].solved++;
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

  return {
    email: user.email,
    role: user.role,
    joinedAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    totalSubmissions,
    totalPass: passCount,
    passRate: totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0,
    solvedCount: solvedProblems.length,
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
    if (!categories[cat]) categories[cat] = { count: 0, descriptions: [] };
    categories[cat].count++;
    if (tc.description) categories[cat].descriptions.push(tc.description);
  }

  return Object.entries(categories).map(([category, info]) => ({
    category,
    label: CATEGORY_LABELS[category] || category,
    count: info.count,
    hint: HIDDEN_CATEGORY_HINTS[category] || "",
    sampleDescriptions: info.descriptions.slice(0, 3),
  }));
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
  const [problem, studentProfile, attemptHistory, hiddenCategories] = await Promise.all([
    Problem.findOne({ problemId }).lean(),
    buildStudentProfile(userId),
    buildAttemptHistory(userId, problemId, sessionId),
    buildHiddenTestCategories(problemId, language),
  ]);

  const conversationHistory = await buildConversationHistory(userId, sessionId);

  const testResults = await buildTestResults(userId, problemId, sessionId);

  return {
    student: studentProfile,
    problem: problem ? {
      id: problem.problemId,
      title: problem.title,
      statement: problem.statement,
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
    hiddenCategories,
    conversationHistory,
    weakTopics: studentProfile?.weakTopics || [],
    strongTopics: studentProfile?.strongTopics || [],
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
  CATEGORY_LABELS,
  HIDDEN_CATEGORY_HINTS,
};
