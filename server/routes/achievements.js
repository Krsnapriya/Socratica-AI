const express = require("express");
const Achievement = require("../models/Achievement");
const Submission = require("../models/Submission");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const ACHIEVEMENT_DEFS = [
  { key: "first_submission", title: "First Steps", description: "Submit your first solution", icon: "rocket_launch", category: "milestone" },
  { key: "first_pass", title: "Got It!", description: "Pass your first test case", icon: "check_circle", category: "milestone" },
  { key: "solved_5", title: "Getting Started", description: "Solve 5 problems", icon: "school", category: "milestone" },
  { key: "solved_10", title: "Problem Solver", description: "Solve 10 problems", icon: "psychology", category: "milestone" },
  { key: "solved_25", title: "Code Warrior", description: "Solve 25 problems", icon: "military_tech", category: "milestone" },
  { key: "solved_50", title: "Half Century", description: "Solve 50 problems", icon: "stars", category: "milestone" },
  { key: "solved_100", title: "Century Club", description: "Solve 100 problems", icon: "emoji_events", category: "milestone" },
  { key: "streak_3", title: "Consistent", description: "3-day practice streak", icon: "local_fire_department", category: "streak" },
  { key: "streak_7", title: "Week Warrior", description: "7-day practice streak", icon: "whatshot", category: "streak" },
  { key: "streak_30", title: "Monthly Master", description: "30-day practice streak", icon: "diamond", category: "streak" },
  { key: "python_first", title: "Pythonista", description: "Pass a Python problem", icon: "code", category: "language" },
  { key: "c_first", title: "C Pioneer", description: "Pass a C problem", icon: "memory", category: "language" },
  { key: "js_first", title: "JavaScript Guru", description: "Pass a JavaScript problem", icon: "javascript", category: "language" },
  { key: "all_languages", title: "Polyglot", description: "Pass problems in all 3 languages", icon: "translate", category: "language" },
  { key: "submissions_50", title: "Persistent", description: "Submit 50 solutions", icon: "send", category: "submission" },
  { key: "submissions_100", title: "Dedicated", description: "Submit 100 solutions", icon: "repeat", category: "submission" },
  { key: "perfect_session", title: "Perfect Session", description: "Pass all test cases on first try", icon: "bolt", category: "special" },
];

async function checkAndAwardAchievements(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return [];

  const existingAchievements = await Achievement.find({ userId }).lean();
  const existingKeys = new Set(existingAchievements.map(a => a.achievementKey));

  const newAchievements = [];

  const submissions = await Submission.find({ userId }).sort({ createdAt: 1 }).lean();
  const passes = submissions.filter(s => s.verdict === "pass");
  const totalSubs = submissions.length;
  const solvedProblems = new Set(passes.map(s => s.problemId)).size;
  const languagesUsed = new Set(passes.map(s => s.language));

  const checks = [
    { key: "first_submission", cond: totalSubs >= 1 },
    { key: "first_pass", cond: passes.length >= 1 },
    { key: "solved_5", cond: solvedProblems >= 5 },
    { key: "solved_10", cond: solvedProblems >= 10 },
    { key: "solved_25", cond: solvedProblems >= 25 },
    { key: "solved_50", cond: solvedProblems >= 50 },
    { key: "solved_100", cond: solvedProblems >= 100 },
    { key: "submissions_50", cond: totalSubs >= 50 },
    { key: "submissions_100", cond: totalSubs >= 100 },
    { key: "python_first", cond: languagesUsed.has("python") },
    { key: "c_first", cond: languagesUsed.has("c") },
    { key: "js_first", cond: languagesUsed.has("javascript") },
    { key: "all_languages", cond: languagesUsed.has("python") && languagesUsed.has("c") && languagesUsed.has("javascript") },
    { key: "streak_3", cond: (user.learningProfile?.streakDays || 0) >= 3 },
    { key: "streak_7", cond: (user.learningProfile?.streakDays || 0) >= 7 },
    { key: "streak_30", cond: (user.learningProfile?.streakDays || 0) >= 30 },
  ];

  for (const check of checks) {
    if (check.cond && !existingKeys.has(check.key)) {
      const def = ACHIEVEMENT_DEFS.find(d => d.key === check.key);
      if (def) {
        const ach = await Achievement.findOneAndUpdate(
          { userId, achievementKey: check.key },
          { $setOnInsert: { ...def, userId } },
          { upsert: true, new: true, lean: true }
        );
        newAchievements.push(ach);
      }
    }
  }

  return newAchievements;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const achievements = await Achievement.find({ userId: req.userId }).sort({ unlockedAt: -1 }).lean();
    res.json({ achievements, definitions: ACHIEVEMENT_DEFS });
  } catch (err) {
    console.error("[achievements] GET / error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboard", requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const leaderboard = await Submission.aggregate([
      { $match: { verdict: "pass" } },
      { $group: { _id: "$userId", solved: { $sum: 1 } } },
      { $sort: { solved: -1 } },
      { $limit: limit },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, solved: 1, displayName: "$user.displayName", email: "$user.email", role: "$user.role" } },
    ]);

    const enriched = leaderboard.map((entry, i) => ({
      rank: i + 1,
      userId: entry._id,
      displayName: entry.displayName || entry.email?.split("@")[0] || "Anonymous",
      solved: entry.solved,
      role: entry.role,
    }));

    res.json(enriched);
  } catch (err) {
    console.error("[achievements] GET /leaderboard error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/check", requireAuth, async (req, res) => {
  try {
    const newAchievements = await checkAndAwardAchievements(req.userId);
    res.json({ newAchievements, count: newAchievements.length });
  } catch (err) {
    console.error("[achievements] POST /check error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboard/top", requireAuth, async (req, res) => {
  try {
    const top = await Submission.aggregate([
      { $match: { verdict: "pass" } },
      { $group: { _id: "$userId", solved: { $sum: 1 } } },
      { $sort: { solved: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, solved: 1, displayName: "$user.displayName", email: "$user.email" } },
    ]);

    res.json(top.map((e, i) => ({
      rank: i + 1,
      userId: e._id,
      displayName: e.displayName || e.email?.split("@")[0] || "Anonymous",
      solved: e.solved,
    })));
  } catch (err) {
    console.error("[achievements] GET /leaderboard/top error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
module.exports.checkAndAwardAchievements = checkAndAwardAchievements;
