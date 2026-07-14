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
const { getLLMClient, callLLM } = require("./llmClient.unified");
const AIUsage = require("../models/AIUsage");

function stripCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "").trim();
}

function sanitizeResponse(text) {
  let cleaned = stripCodeBlocks(text);
  const lines = cleaned.split("\n");
  return lines.filter(line => {
    const trimmed = line.trim();
    if (/^(def |class |function |const |let |var |import |from |#include|using |for |while |if |return )/.test(trimmed)) return false;
    if (trimmed.startsWith(">>>") || trimmed.startsWith("...")) return false;
    return true;
  }).join("\n").trim();
}

function isAdversarialResponse(text) {
  const lower = text.toLowerCase();
  return ["here is the solution", "here's the solution", "the answer is", "the fix is",
    "try this code", "def solve", "def two_sum", "function solve",
    "solution:", "answer:", "fix:"].some(s => lower.includes(s));
}

async function trackUsage({ userId, role, action, agentType, latencyMs, success, error, problemId, sessionId, cached, model }) {
  try {
    await AIUsage.create({
      userId, role, action, agentType, latencyMs, success, error,
      problemId, sessionId, cached, model,
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

  // Get memory context for students
  const memoryContext = role === "student" ? await buildMemoryContext(userId) : null;

  // Determine which agents to use
  const agents = getAgentsForRequest(role, action, {
    executionResult, verdict: extraContext?.verdict,
  });

  const agentType = explicitAgent || agents[0] || "tutorAgent";

  // Build persona
  const persona = getPersonaStyle(role, extraContext || {});

  // Build context
  const fullContext = {
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

  // Static analysis if code provided
  if (code) {
    fullContext.codeAnalysis = analyzeStudentCode(code, language || "python");
  }

  // Build agent-specific prompt
  let prompt;
  if (agentType === "hintAgent") {
    const hintLevel = getHintLevel(fullContext);
    prompt = buildAgentPrompt("hintAgent", { ...fullContext, hintLevel });
  } else {
    prompt = buildAgentPrompt(agentType, fullContext);
  }

  // Call LLM
  const client = getLLMClient();
  const rawResponse = await client.chat(prompt.system, prompt.user);

  // Sanitize
  let response = sanitizeResponse(rawResponse);
  if (isAdversarialResponse(response)) {
    console.warn("[orchestrator] Adversarial response detected");
    response = null;
  }
  if (!response || response.length < 10) {
    response = "Look at the difference between your output and the expected output. Walk through your logic step by step with a small example.";
  }

  // Track usage
  const latencyMs = Date.now() - startTime;
  trackUsage({
    userId, role, action, agentType, latencyMs, success: true,
    problemId, sessionId, cached: false, model: client.model,
  });

  return {
    response,
    agent: agentType,
    role,
    latencyMs,
    cached: false,
  };
}

// ── High-Level API Methods ────────────────────────────────────────────────

async function getAIResponse({ userId, userRole, problemId, sessionId, code, language, executionResult, previousHint, explicitAgent }) {
  const context = await buildFullContext({ userId, problemId, sessionId, code, language, executionResult, previousHint });
  return routeAndRespond({
    userId, userRole, action: "chat", code, language, problemId, sessionId,
    executionResult, explicitAgent, context,
  });
}

async function getCodeReview({ userId, userRole, problemId, code, language }) {
  return routeAndRespond({
    userId, userRole, action: "code-review-contextual", code, language, problemId,
  });
}

async function getOracleComparison({ userId, userRole, problemId, code, language }) {
  const Problem = require("../models/Problem");
  const problem = await Problem.findOne({ problemId }).lean();
  const referenceSolutions = problem?.referenceSolutions?.filter(
    s => s.language === (language || "python") && s.status === "approved"
  ) || [];

  const comparison = compareSolutions(code, referenceSolutions[0]?.code || "", problemId, language);

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

module.exports = {
  getAIResponse,
  getCodeReview,
  getOracleComparison,
  getLearningSummary,
  getConfidenceReport,
  routeAndRespond,
  trackUsage,
};
