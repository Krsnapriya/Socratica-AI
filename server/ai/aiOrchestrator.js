const OpenAI = require("openai");
const mongoose = require("mongoose");
const AIConversation = require("../models/AIConversation");
const User = require("../models/User");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const Course = require("../models/Course");
const Module = require("../models/Module");
const LearningPath = require("../models/LearningPath");

const API_KEY = process.env.NVIDIA_API_KEY;
const BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";

const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const MAX_TOKENS = 4096;
const REASONING_BUDGET = 4096;

let client = null;

function getClient() {
  if (client) return client;
  if (!API_KEY) return null;
  client = new OpenAI({ baseURL: BASE_URL, apiKey: API_KEY, timeout: TIMEOUT_MS, maxRetries: MAX_RETRIES });
  return client;
}

/**
 * Gather full learning context for a user
 */
async function gatherContext(userId, options = {}) {
  const { problemId, sessionId, moduleId, courseId } = options;
  const [user, learningPath] = await Promise.all([
    User.findById(userId).lean(),
    LearningPath.findOne({ userId }).lean(),
  ]);
  if (!user) return null;

  const ctx = {
    user: { displayName: user.displayName, role: user.role, emailVerified: user.emailVerified },
    progress: {},
    weakAreas: learningPath?.weakAreas || [],
    strengths: learningPath?.strengths || [],
    recommendations: learningPath?.recommendations?.filter(r => !r.completed) || [],
  };

  const [solvedProblems, allSubs, stats] = await Promise.all([
    Submission.distinct("problemId", { userId, verdict: "pass" }),
    Submission.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    Submission.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$language", count: { $sum: 1 }, passCount: { $sum: { $cond: [{ $eq: ["$verdict", "pass"] }, 1, 0] } } } },
    ]),
  ]);

  ctx.progress.solvedProblems = solvedProblems.length;
  ctx.problemStats = stats;

  const recentSubs = allSubs.slice(0, 5);
  ctx.recentSubmissions = recentSubs.map(s => ({
    problemId: s.problemId, verdict: s.verdict, language: s.language, round: s.round, createdAt: s.createdAt,
  }));

  if (problemId) {
    const problem = await Problem.findOne({ problemId }).lean();
    if (problem) {
      ctx.currentProblem = {
        id: problem.problemId, title: problem.title, difficulty: problem.difficulty,
        category: problem.category, tags: problem.tags,
      };
    }
    const previousAttempts = await Submission.find({ userId, problemId }).sort({ round: 1 }).lean();
    ctx.previousAttempts = previousAttempts.map(s => ({
      round: s.round, verdict: s.verdict, hint: s.hint, tier: s.tier, language: s.language,
    }));
    ctx.attemptsRemaining = 5 - previousAttempts.length;
  }

  if (moduleId) {
    const mod = await Module.findById(moduleId).populate("course", "title").lean();
    if (mod) {
      ctx.currentModule = { id: mod._id, title: mod.title, courseTitle: mod.course?.title };
      ctx.moduleProgress = mod.topics ? `${solvedProblems.filter(id => mod.topics.some(t => t.problemId === id)).length}/${mod.topics.length}` : "0/0";
    }
  }

  if (courseId) {
    const course = await Course.findById(courseId).lean();
    if (course) ctx.currentCourse = { id: course._id, title: course.title };
  }

  if (sessionId) {
    const sessionSubs = await Submission.find({ sessionId }).sort({ round: 1 }).lean();
    ctx.currentSession = sessionSubs.map(s => ({
      round: s.round, verdict: s.verdict, code: s.code?.substring(0, 500), hint: s.hint,
      tier2Result: s.tier2Result, compileOutput: s.compileOutput,
    }));
  }

  // Conversation history (last 20 messages across all sessions)
  const recentConversations = await AIConversation.find({ userId, active: true })
    .sort({ updatedAt: -1 }).limit(5).lean();
  ctx.conversationHistory = recentConversations.map(c => ({
    topic: c.topic, metadata: c.metadata,
    messages: c.messages.slice(-6).map(m => ({ role: m.role, content: m.content?.substring(0, 200) })),
  }));

  return ctx;
}

const SYSTEM_PROMPT = `You are the AI Mentor for Socratica AI, an intelligent coding education platform. Your goal is to help learners understand concepts deeply, not merely produce correct answers.

## Core Principles
- Tailor explanations to the learner's current course, module, topic, programming language, recent submissions, compiler results, and learning history.
- Encourage critical thinking by providing progressively detailed hints before revealing full solutions.
- Every response should reinforce learning outcomes, promote best coding practices, and connect new concepts with previously learned material.
- Never write complete solution code unless the learner has exhausted all attempts or explicitly asks after demonstrating effort.
- When the learner makes a mistake, first help them understand WHY it's wrong before showing HOW to fix it.

## Response Format
- Be concise and direct. Use markdown for formatting.
- When explaining code, reference specific lines or variables.
- When giving hints, start conceptual and get progressively more specific.
- Adapt your language complexity to the learner's demonstrated skill level.`;

function buildSystemPrompt(ctx) {
  if (!ctx) return SYSTEM_PROMPT;
  let prompt = SYSTEM_PROMPT + "\n\n";

  prompt += `## Current Learner Context\n`;
  prompt += `- Name: ${ctx.user.displayName}\n`;
  prompt += `- Role: ${ctx.user.role}\n`;
  prompt += `- Problems Solved: ${ctx.progress.solvedProblems || 0}\n`;
  if (ctx.currentCourse) prompt += `- Current Course: ${ctx.currentCourse.title}\n`;
  if (ctx.currentModule) prompt += `- Current Module: ${ctx.currentModule.title} (${ctx.moduleProgress})\n`;
  if (ctx.currentProblem) prompt += `- Current Problem: ${ctx.currentProblem.title} (${ctx.currentProblem.difficulty}, ${ctx.currentProblem.category})\n`;

  if (ctx.weakAreas.length > 0) {
    prompt += `\n## Weak Areas\n`;
    ctx.weakAreas.slice(0, 3).forEach(w => {
      prompt += `- ${w.topic} (detected ${w.frequency}x)\n`;
    });
  }

  if (ctx.strengths.length > 0) {
    prompt += `\n## Strengths\n`;
    ctx.strengths.slice(0, 3).forEach(s => prompt += `- ${s}\n`);
  }

  if (ctx.recentSubmissions?.length > 0) {
    prompt += `\n## Recent Submissions\n`;
    ctx.recentSubmissions.forEach(s => {
      prompt += `- ${s.problemId}: ${s.verdict} (${s.language}, round ${s.round})\n`;
    });
  }

  if (ctx.previousAttempts?.length > 0) {
    prompt += `\n## Previous Attempts for Current Problem\n`;
    ctx.previousAttempts.forEach(a => {
      prompt += `- Round ${a.round}: ${a.verdict}\n`;
    });
  }

  if (ctx.currentSession?.length > 0) {
    const last = ctx.currentSession[ctx.currentSession.length - 1];
    prompt += `\n## Latest Submission\n`;
    prompt += `- Verdict: ${last.verdict}\n`;
    prompt += `- Round: ${last.round}/${ctx.previousAttempts?.length || 5}\n`;
    if (last.compileOutput) prompt += `- Compile Output: ${last.compileOutput.substring(0, 300)}\n`;
    if (last.tier2Result) {
      const t = last.tier2Result;
      prompt += `- Performance: student=${t.studentTimeMs}ms vs oracle=${t.oracleTimeMs}ms, mem=${t.studentMemMb}MB\n`;
    }
  }

  if (ctx.conversationHistory?.length > 0) {
    prompt += `\n## Recent Conversation Topics\n`;
    ctx.conversationHistory.forEach(c => prompt += `- ${c.topic}\n`);
  }

  return prompt;
}

async function chat(userId, { message, sessionId, topic, context = {}, style }) {
  const ctx = await gatherContext(userId, context);
  const ai = getClient();
  if (!ai) {
    return { error: "AI Mentor is not configured. Contact your administrator.", fallback: true };
  }

  const existingSession = sessionId
    ? await AIConversation.findOne({ userId, sessionId }).sort({ updatedAt: -1 })
    : null;

  const effectiveSessionId = sessionId || `ai_${userId}_${Date.now()}`;

  let messages = [];
  let metadata = {};

  if (existingSession) {
    const historyMessages = existingSession.messages.slice(-20);
    historyMessages.forEach(m => {
      if (m.role !== "system") messages.push({ role: m.role, content: m.content });
    });
    metadata = existingSession.metadata || {};
    metadata.preferredStyle = existingSession.metadata?.preferredStyle || style || "intermediate";
  } else {
    metadata = {
      courseId: context.courseId,
      moduleId: context.moduleId,
      problemId: context.problemId,
      submissionId: context.submissionId,
      preferredStyle: style || "intermediate",
    };
  }

  const systemPrompt = buildSystemPrompt(ctx);
  messages.unshift({ role: "system", content: systemPrompt });

  if (style && ["beginner", "intermediate", "expert", "analogy", "step_by_step"].includes(style)) {
    messages.push({ role: "system", content: `Explain this in ${style} style.` });
    metadata.preferredStyle = style;
  }

  messages.push({ role: "user", content: message });

  try {
    const completion = await ai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: MAX_TOKENS,
    });

    const choice = completion.choices?.[0];
    if (!choice?.message?.content) throw new Error("Empty response from LLM");

    const response = choice.message.content;
    const reasoning = choice.message.reasoning_content;

    // Save to conversation history
    const userMessage = { role: "user", content: message, context, timestamp: new Date() };
    const assistantMessage = { role: "assistant", content: response, context: { reasoning }, timestamp: new Date() };

    if (existingSession) {
      existingSession.messages.push(userMessage, assistantMessage);
      if (existingSession.messages.length > 100) {
        existingSession.messages = existingSession.messages.slice(-100);
      }
      existingSession.metadata = metadata;
      existingSession.topic = topic || existingSession.topic;
      await existingSession.save();
    } else {
      await AIConversation.create({
        userId,
        sessionId: effectiveSessionId,
        topic: topic || "general",
        messages: [userMessage, assistantMessage],
        metadata,
      });
    }

    return { response, reasoning, sessionId: effectiveSessionId };
  } catch (err) {
    console.error("[aiOrchestrator] chat error:", err.message);
    return { error: "I'm having trouble connecting. Please try again.", fallback: true, sessionId: effectiveSessionId };
  }
}

async function getHistory(userId, limit = 10) {
  const sessions = await AIConversation.find({ userId, active: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select("sessionId topic messages metadata updatedAt")
    .lean();

  return sessions.map(s => ({
    sessionId: s.sessionId,
    topic: s.topic,
    preview: s.messages?.[s.messages.length - 1]?.content?.substring(0, 150) || "",
    messageCount: s.messages?.length || 0,
    metadata: s.metadata,
    lastUpdated: s.updatedAt,
  }));
}

async function clearHistory(userId, sessionId) {
  if (sessionId) {
    await AIConversation.updateOne({ userId, sessionId }, { active: false });
  } else {
    await AIConversation.updateMany({ userId, active: true }, { active: false });
  }
}

module.exports = { chat, gatherContext, getHistory, clearHistory, buildSystemPrompt };
