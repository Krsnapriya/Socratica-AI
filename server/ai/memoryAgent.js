// Memory Agent — persistent learning memory across sessions
// Stores teaching style, weak/strong topics, common mistakes, streak data

const User = require("../models/User");
const Submission = require("../models/Submission");
const { identifyPrerequisiteGaps, suggestNextTopic } = require("./knowledgeGraph");

async function getLearningMemory(userId) {
  const user = await User.findById(userId)
    .select("learningProfile email displayName")
    .lean();

  if (!user?.learningProfile) {
    return {
      exists: false,
      profile: null,
      insights: null,
    };
  }

  const profile = user.learningProfile;
  const submissions = await Submission.find({ userId })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const insights = buildInsights(profile, submissions);

  return {
    exists: true,
    profile,
    insights,
  };
}

function buildInsights(profile, submissions) {
  const recentSubmissions = submissions.slice(0, 50);
  const recentPassRate = recentSubmissions.length > 0
    ? Math.round((recentSubmissions.filter(s => s.verdict === "pass").length / recentSubmissions.length) * 100)
    : 0;

  const streak = profile.streakDays || 0;
  const lastPractice = profile.lastPracticeDate ? new Date(profile.lastPracticeDate) : null;
  const daysSincePractice = lastPractice
    ? Math.floor((Date.now() - lastPractice.getTime()) / 86400000)
    : 999;

  const weakTopics = profile.weakTopics || [];
  const strongTopics = profile.strongTopics || [];
  const prerequisiteGaps = identifyPrerequisiteGaps(weakTopics, profile.lastProblemCategory || "");
  const nextTopic = suggestNextTopic(strongTopics);

  return {
    recentPassRate,
    streak,
    daysSincePractice,
    weakTopics,
    strongTopics,
    prerequisiteGaps,
    nextTopic,
    totalProblemsSolved: profile.totalProblemsSolved || 0,
    totalSubmissions: profile.totalSubmissions || 0,
    preferredStyle: profile.preferredStyle || "socratic",
    skillLevel: profile.skillLevel || "intermediate",
    commonMistakes: (profile.teachingMemory?.commonMistakes || []).slice(0, 10),
    learningVelocity: profile.teachingMemory?.learningVelocity || "moderate",
  };
}

async function updateLearningMemory(userId, submission, problem, codeAnalysis) {
  const update = {
    $inc: { "learningProfile.totalSubmissions": 1 },
    $set: { "learningProfile.lastPracticeDate": new Date() },
  };

  if (submission.verdict === "pass") {
    update.$inc["learningProfile.totalProblemsSolved"] = 1;
    if (problem?.category) {
      update.$addToSet = { "learningProfile.strongTopics": problem.category };
    }
  } else {
    if (problem?.category) {
      update.$addToSet = { "learningProfile.weakTopics": problem.category };
    }
  }

  if (problem?.category) {
    update.$set["learningProfile.lastProblemCategory"] = problem.category;
  }

  // Track common mistakes
  if (codeAnalysis?.bugs?.length > 0 && submission.verdict !== "pass") {
    const mistakeType = codeAnalysis.bugs[0].type || "logic_error";
    update.$push = {
      "learningProfile.teachingMemory.commonMistakes": {
        $each: [{ type: mistakeType, timestamp: new Date(), problemId: submission.problemId }],
        $slice: -50,
      },
    };
  }

  // Calculate streak
  const user = await User.findById(userId).select("learningProfile.lastPracticeDate learningProfile.streakDays").lean();
  if (user?.learningProfile?.lastPracticeDate) {
    const last = new Date(user.learningProfile.lastPracticeDate);
    const daysDiff = Math.floor((Date.now() - last.getTime()) / 86400000);
    if (daysDiff === 0) {
      // Same day, keep streak
    } else if (daysDiff === 1) {
      update.$inc["learningProfile.streakDays"] = 1;
    } else if (daysDiff > 1) {
      update.$set["learningProfile.streakDays"] = 1;
    }
  } else {
    update.$set["learningProfile.streakDays"] = 1;
  }

  await User.updateOne({ _id: userId }, update).catch(err => {
    console.error("[memoryAgent] Failed to update memory:", err.message);
  });
}

async function buildMemoryContext(userId) {
  const memory = await getLearningMemory(userId);
  if (!memory.exists) return null;

  const { insights } = memory;
  let context = "";

  if (insights.weakTopics.length > 0) {
    context += `Weak topics: ${insights.weakTopics.join(", ")}\n`;
  }
  if (insights.strongTopics.length > 0) {
    context += `Strong topics: ${insights.strongTopics.join(", ")}\n`;
  }
  if (insights.prerequisiteGaps.length > 0) {
    context += `Prerequisite gaps: ${insights.prerequisiteGaps.join(", ")}\n`;
  }
  if (insights.nextTopic) {
    context += `Suggested next topic: ${insights.nextTopic}\n`;
  }
  context += `Streak: ${insights.streak} days\n`;
  context += `Recent pass rate: ${insights.recentPassRate}%\n`;
  context += `Skill level: ${insights.skillLevel}\n`;
  context += `Preferred style: ${insights.preferredStyle}\n`;
  context += `Total solved: ${insights.totalProblemsSolved}/${insights.totalSubmissions}\n`;

  if (insights.commonMistakes.length > 0) {
    context += `Common mistake patterns: ${insights.commonMistakes.map(m => m.type).join(", ")}\n`;
  }

  return context;
}

module.exports = {
  getLearningMemory,
  updateLearningMemory,
  buildMemoryContext,
  buildInsights,
};
