// Unified LLM Orchestrator — single entry point for all AI interactions
// Integrates role router, memory, knowledge graph, observability

const { buildFullContext } = require("./contextBuilder");
const { analyzeStudentCode } = require("./codeAnalyzer");
const { compareSolutions } = require("./oracleComparator");
const { scoreConfidence, formatConfidence } = require("./confidenceScorer");
const { getHintLevel } = require("./agents");
const { buildAgentPrompt } = require("./agents");
const { buildMemoryContext, updateLearningMemory } = require("./memoryAgent");
const { getAgentsForRequest, shouldGateContent, getPersonaStyle } = require("./roleRouter");
const { getLLMClient, sanitizeResponse: llmSanitize } = require("./llmClient.unified");
const AIUsage = require("../models/AIUsage");
const AIConversation = require("../models/AIConversation");

function isAdversarialResponse(text) {
  const lower = text.toLowerCase();
  // Only flag responses that are clearly providing complete solutions, not tutoring phrases
  return ["here is the complete code", "here's the complete code", "here is the full working solution",
    "here's the full working solution", "the complete solution is",
    "try this code:", "copy and paste this",
    "def solve(", "def two_sum(", "function solve("].some(s => lower.includes(s));
}

async function trackUsage({ userId, role, action, agentType, latencyMs, success, error, problemId, sessionId, cached, model, tokens }) {
  try {
    await AIUsage.create({
      userId, role, action, agentType, latencyMs, success, error,
      problemId, sessionId, cached, model,
      inputTokens: tokens?.in || 0,
      outputTokens: tokens?.out || 0,
      totalTokens: (tokens?.in || 0) + (tokens?.out || 0),
    });
  } catch (err) {
    console.error("[orchestrator] Usage tracking failed:", err.message);
  }
}

async function routeAndRespond({
  userId, userRole, action, message, code, language, problemId,
  sessionId, executionResult, explicitAgent, context: extraContext,
}) {
  const startTime = Date.now();
  const role = userRole || "student";
  const reqId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  console.log(`[ai:${reqId}] START role=${role} action=${action} agent=${explicitAgent || "auto"} user=${userId || "anon"}`);

  // Get memory context for students
  const memoryContext = role === "student" ? await buildMemoryContext(userId) : null;

  // Determine which agents to use
  const agents = getAgentsForRequest(role, action, {
    executionResult, verdict: extraContext?.verdict,
  });

  const agentType = explicitAgent || agents[0] || "tutorAgent";

  // Build persona
  const persona = getPersonaStyle(role, extraContext || {});

  // Build context — enrich with full problem/submission/test data when problemId available
  let fullContext = {
    ...extraContext,
    code,
    language: language || "python",
    problemId,
    sessionId,
    executionResult,
    memoryContext,
    persona,
    message,
  };

  // When we have a problemId and userId, build rich context from DB
  // This gives the AI access to problem statement, submission history, test results, etc.
  if (problemId && userId && (action === "chat" || action === "hint" || action === "contextual-hint" || action === "code-review" || action === "code-review-contextual")) {
    try {
      const richContext = await buildFullContext({
        userId, problemId, sessionId, code, language: language || "python", executionResult,
      });
      // Merge rich context — don't overwrite fields already set by the route
      fullContext = {
        ...richContext,
        ...fullContext, // Route-provided fields take precedence
        problem: richContext.problem || fullContext.problem,
        submission: richContext.submission || fullContext.submission,
        testResults: richContext.testResults || fullContext.testResults,
        hiddenTestInfo: richContext.hiddenTestInfo || fullContext.hiddenTestInfo,
        weakTopics: richContext.weakTopics?.length ? richContext.weakTopics : fullContext.weakTopics,
        strongTopics: richContext.strongTopics?.length ? richContext.strongTopics : fullContext.strongTopics,
      };
    } catch (err) {
      console.error(`[ai:${reqId}] Context build failed (non-fatal):`, err.message);
    }
  }

  // Static analysis if code provided
  if (code) {
    fullContext.codeAnalysis = analyzeStudentCode(code, language || "python");
  }

  // Build agent-specific prompt
  // Flatten context for agent builders which expect top-level fields
  const flatContext = {
    ...fullContext,
    code: fullContext.submission?.code,
    language: fullContext.language,
    problemTitle: fullContext.problem?.title,
    problemStatement: fullContext.problem?.statement,
    tier2Result: fullContext.execution?.tier2Result,
    oracleComparison: fullContext.oracleComparison,
    oracleComparisonData: fullContext.oracleComparisonData,
    oracleCode: fullContext.oracleCode || fullContext.problem?.oracleSolutions?.[fullContext.submission?.language] || "",
    studentOutput: fullContext.execution?.stdout,
    oracleOutput: fullContext.oracleOutput,
    curriculum: fullContext.curriculum,
    problem: fullContext.problem,
    student: fullContext.student,
    oracleComparison: fullContext.oracleComparison,
    tier2Result: fullContext.tier2Result,
    oracleComparisonData: fullContext.oracleComparisonData,
    studentOutput: fullContext.execution?.stdout,
    oracleOutput: fullContext.oracleOutput,
    curriculum: fullContext.curriculum,
    problem: fullContext.problem,
    student: fullContext.student,
  };

  // Build agent-specific prompt
  let prompt;
  if (agentType === "hintAgent") {
    const hintLevel = getHintLevel(fullContext);
    prompt = await buildAgentPrompt("hintAgent", { ...flatContext, hintLevel }, reqId);
  } else {
    prompt = await buildAgentPrompt(agentType, flatContext, reqId);
  }

  console.log(`[ai:${reqId}] PROMPT system=${prompt.system?.length || 0}chars user=${prompt.user?.length || 0}chars`);
  
  // DEBUG: Log prompt preview for debugging
  console.log(`[ai:${reqId}] SYSTEM PROMPT PREVIEW: ${prompt.system?.substring(0, 200)}...`);
  console.log(`[ai:${reqId}] USER PROMPT PREVIEW: ${prompt.user?.substring(0, 200)}...`);

  // Call LLM
  const client = getLLMClient();
  const llmResult = await client.chat(prompt.system, prompt.user);

  // Sanitize using unified sanitizer
  let response = llmSanitize(llmResult.text);
  if (isAdversarialResponse(response)) {
    console.warn(`[ai:${reqId}] ADVERSARIAL response detected — neutralizing`);
    response = null;
  }
  if (!response || response.length < 10) {
    console.warn(`[ai:${reqId}] SHORT response (${response?.length || 0} chars) — using telemetry fallback`);
    // Build fallback from raw execution telemetry instead of generic static text
    const er = executionResult || fullContext.executionResult;
    const testInfo = er?.testResults
      ? `\nTest Results: ${er.passedTestCount || 0}/${er.totalTestCount || 0} passed. ${er.failedTestCount || 0} failed.`
      : '';
    const errorInfo = er?.error ? `\nError: ${er.error}${er.stderr ? ' — ' + String(er.stderr).slice(0, 200) : ''}` : '';
    const timingInfo = er?.elapsedMs ? `\nRuntime: ${er.elapsedMs}ms` : '';
    response = `Your code produced wrong output.${testInfo}${errorInfo}${timingInfo}\n\nThink about: What is the difference between your output and the expected output for each failing test case? Walk through a small example by hand and compare step by step.`;
  }

  // Track usage with token data from actual LLM call
  const latencyMs = llmResult.latencyMs || (Date.now() - startTime);
  trackUsage({
    userId, role, action, agentType, latencyMs, success: !llmResult.error,
    problemId, sessionId, cached: llmResult.cached || false, model: llmResult.model || client.model,
    tokens: llmResult.tokens || { in: 0, out: 0 },
  });

  console.log(`[ai:${reqId}] DONE latency=${latencyMs}ms tokens=${llmResult.tokens?.in || 0}+${llmResult.tokens?.out || 0} cached=${llmResult.cached || false} response=${response?.length || 0}chars`);

  // Save conversation to AIConversation
  if (userId && sessionId) {
    saveConversation(userId, sessionId, action, message, response, problemId, role).catch(err => {
      console.error(`[ai:${reqId}] Conversation save failed:`, err.message);
    });
  }

  // Update learning memory after execution (pass/fail)
  if (executionResult?.verdict && userId && problemId) {
    const Problem = require("../models/Problem");
    const problem = await Problem.findOne({ problemId }).lean().catch(() => null);
    const codeAnalysis = code ? analyzeStudentCode(code, language || "python") : null;
    updateLearningMemory(userId, { verdict: executionResult.verdict, problemId }, problem, codeAnalysis).catch(err => {
      console.error(`[ai:${reqId}] Memory update failed:`, err.message);
    });
  }

  return {
    response,
    agent: agentType,
    role,
    latencyMs,
    cached: llmResult.cached || false,
  };
}

// ── Conversation Persistence ─────────────────────────────────────────────
async function saveConversation(userId, sessionId, action, userMessage, aiResponse, problemId, role) {
  const topicMap = {
    chat: "general",
    syllabus: "syllabus",
    debug: "debug",
    quiz: "quiz",
    interview: "interview_practice",
    "code-review": "code_review",
    "code-review-contextual": "code_review",
    "oracle-comparison": "oracle_comparison",
    "learning-summary": "learning_summary",
    "contextual-hint": "hint",
  };

  const update = {
    $push: {
      messages: {
        $each: [
          { role: "user", content: userMessage?.substring(0, 5000) || "", timestamp: new Date() },
          { role: "assistant", content: aiResponse?.substring(0, 5000) || "", timestamp: new Date() },
        ],
      },
    },
    $set: { updatedAt: new Date() },
  };

  if (problemId) {
    update.$set["metadata.problemId"] = problemId;
  }

  await AIConversation.findOneAndUpdate(
    { userId, sessionId, active: true },
    update,
    { upsert: true, new: true }
  );
}

// ── High-Level API Methods ────────────────────────────────────────────────

async function getAIResponse({ userId, userRole, problemId, sessionId, code, language, executionResult, previousHint, explicitAgent, oracleComparison }) {
  const context = await buildFullContext({ userId, problemId, sessionId, code, language, executionResult, previousHint });
  // Merge oracleComparison into context so celebration agent can do line-by-line comparison
  if (oracleComparison) {
    context.oracleComparisonData = oracleComparison;
    context.code = code;
    context.language = language;
    context.oracleCode = oracleComparison.oracleCode || context.problem?.oracleSolution || "";
  }
  return routeAndRespond({
    userId, userRole, action: "chat", code, language, problemId, sessionId,
    executionResult, explicitAgent, context, oracleComparison,
  });
}

async function getCodeReview({ userId, userRole, problemId, code, language }) {
  return routeAndRespond({
    userId, userRole, action: "code-review-contextual", code, language, problemId,
  });
}

async function getOracleComparison({ userId, userRole, problemId, code, language }) {
  const Problem = require("../models/Problem");
  const ReferenceSolution = require("../models/ReferenceSolution");

  const problem = await Problem.findOne({ problemId }).lean();
  if (!problem) return { error: "Problem not found" };

  // Try ReferenceSolution collection first, fall back to inline oracleSolutions
  let referenceSolutions = await ReferenceSolution.find({
    problemId,
    language: language || "python",
    verified: true,
  }).sort({ isPrimary: -1, createdAt: 1 }).lean();

  // If no ReferenceSolution entries, use the inline oracle from the Problem doc
  if (referenceSolutions.length === 0 && problem.oracleSolutions?.[language]) {
    referenceSolutions = [{
      problemId,
      language,
      code: problem.oracleSolutions[language],
      variant: "primary",
      isPrimary: true,
      verified: true,
    }];
  }

  const oracleCode = referenceSolutions[0]?.code || "";
  const comparison = compareSolutions(code, oracleCode, problemId, language);

  const result = await routeAndRespond({
    userId, userRole, action: "oracle-comparison", code, language, problemId,
    context: { referenceSolutions, oracleComparison: comparison },
  });

  return { ...result, comparison };
}

async function getLearningSummary({ userId, userRole, sessionId }) {
  const context = await buildFullContext({ userId, sessionId, code: "", language: "python" });
  return routeAndRespond({
    userId, userRole, action: "learning-summary", sessionId, context,
  });
}

async function getConfidenceReport({ userId, userRole, code, language, executionResult, codeAnalysis, verdict }) {
  const confidence = scoreConfidence({ code, language, executionResult, codeAnalysis, verdict });
  return {
    confidence,
    label: formatConfidence(confidence),
    recommendation: confidence.overall < 50
      ? "Consider revisiting the problem approach before continuing."
      : confidence.overall < 75
      ? "Your approach seems reasonable. Review any flagged issues."
      : "Your solution looks solid. Proceed with testing.",
  };
}

// ── Lightweight tracking for role-specific endpoints (instructor/admin/etc) ──
// Routes that use specialized prompts but still need usage tracking + conversation saves
async function trackRoleInteraction({ userId, userRole, action, message, response, tokens, latencyMs, sessionId, problemId, agentType }) {
  // Track usage
  trackUsage({
    userId, role: userRole, action, agentType: agentType || `${userRole}Agent`,
    latencyMs: latencyMs || 0, success: !!response,
    problemId, sessionId, cached: false, model: "default",
    tokens: tokens || { in: 0, out: 0 },
  }).catch(() => {});

  // Save conversation
  if (userId && sessionId) {
    saveConversation(userId, sessionId, action, message, response, problemId, userRole).catch(() => {});
  }
}

module.exports = {
  getAIResponse,
  getCodeReview,
  getOracleComparison,
  getLearningSummary,
  getConfidenceReport,
  routeAndRespond,
  trackUsage,
  trackRoleInteraction,
};
