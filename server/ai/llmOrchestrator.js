const { buildFullContext } = require("./contextBuilder");
const { analyzeStudentCode } = require("./codeAnalyzer");
const { selectAgent, buildAgentPrompt, formatAgentResponse, SYSTEM_PROMPTS } = require("./agents/pipeline");
const { buildHintPrompt, getHintLevel } = require("./hintProgression");
const { compareSolutions } = require("./oracleComparator");
const { scoreConfidence, formatConfidence } = require("./confidenceScorer");

const API_KEY = process.env.NVIDIA_API_KEY;
const BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";
const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const MAX_TOKENS = 4096;

const CB_THRESHOLD = 5;
const CB_RESET_MS = 30000;
let cbState = "CLOSED";
let cbFailures = [];
let cbOpenedAt = 0;

function recordSuccess() { cbFailures = []; cbState = "CLOSED"; }
function recordFailure() {
  const now = Date.now();
  cbFailures = cbFailures.filter(t => now - t < 60000);
  cbFailures.push(now);
  if (cbFailures.length >= CB_THRESHOLD) { cbState = "OPEN"; cbOpenedAt = now; }
}
function canAttempt() {
  if (cbState === "CLOSED" || cbState === "HALF_OPEN") return true;
  if (Date.now() - cbOpenedAt >= CB_RESET_MS) { cbState = "HALF_OPEN"; return true; }
  return false;
}

const CODE_BLOCK_RE = /```[\s\S]*?```/g;
const CODE_LINE_RE = /^(def |class |function |const |let |var |import |from |#include|using |for |while |if |return )/m;

function stripCodeBlocks(text) { return text.replace(CODE_BLOCK_RE, "").trim(); }

function sanitizeResponse(text) {
  let cleaned = stripCodeBlocks(text);
  cleaned = cleaned.replace(/`[^`]+`/g, "");
  const lines = cleaned.split("\n");
  return lines.filter(line => {
    if (CODE_LINE_RE.test(line.trim())) return false;
    if (line.trim().startsWith(">>>") || line.trim().startsWith("...")) return false;
    return true;
  }).join("\n").trim();
}

function isAdversarialResponse(text) {
  const lower = text.toLowerCase();
  return ["here is the solution", "here's the solution", "the answer is", "the fix is",
    "try this code", "def solve", "def two_sum", "function solve",
    "solution:", "answer:", "fix:"].some(s => lower.includes(s));
}

async function fetchWithRetry(url, options) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        if ((resp.status === 429 || resp.status >= 500) && attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** (attempt - 1), 4000)));
          continue;
        }
        throw new Error(`LLM API error: ${resp.status} ${body.slice(0, 200)}`);
      }
      return resp;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** (attempt - 1), 4000)));
    }
  }
  throw lastErr;
}

async function callLLM(systemContent, userContent) {
  if (!API_KEY) return "The AI mentor is currently unavailable (API key not configured).";
  if (!canAttempt()) return "The AI mentor is temporarily unavailable due to high demand. Please try again shortly.";

  try {
    const resp = await fetchWithRetry(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: MAX_TOKENS,
        stream: false,
      }),
    });

    const data = await resp.json();
    const choice = data?.choices?.[0];
    if (!choice) throw new Error("Empty LLM response");

    let hint = choice.message?.content?.trim();
    if (!hint) throw new Error("Empty LLM response");

    hint = sanitizeResponse(hint);
    if (isAdversarialResponse(hint)) {
      console.warn("[llmOrchestrator] Adversarial response detected");
      hint = null;
    }
    if (!hint || hint.length < 10) {
      hint = "Look at the difference between your output and the expected output. Walk through your logic step by step with a small example.";
    }

    recordSuccess();
    return hint;
  } catch (err) {
    recordFailure();
    console.error("[llmOrchestrator] Error:", err.message);
    return "I'm having trouble connecting to my knowledge base right now. Review your logic, edge cases, and variable assignments carefully.";
  }
}

async function getAIResponse({ userId, problemId, sessionId, code, language, executionResult, previousHint, explicitAgent }) {
  const context = await buildFullContext({ userId, problemId, sessionId, code, language, executionResult, previousHint });

  const codeAnalysis = analyzeStudentCode(code, language);
  context.codeAnalysis = codeAnalysis;

  let agentType = explicitAgent || selectAgent(context);
  let prompt;

  if (agentType === "hint") {
    const hintLevel = getHintLevel(context);
    prompt = buildHintPrompt(context, hintLevel);
  } else {
    prompt = buildAgentPrompt(agentType, context);
  }

  const rawResponse = await callLLM(prompt.systemPrompt, prompt.userContent);
  return formatAgentResponse(agentType, rawResponse, context);
}

async function getCodeReview({ userId, problemId, code, language }) {
  const context = await buildFullContext({ userId, problemId, code, language });
  context.codeAnalysis = analyzeStudentCode(code, language);

  const prompt = buildAgentPrompt("codeReview", context);
  const rawResponse = await callLLM(prompt.systemPrompt, prompt.userContent);
  return formatAgentResponse("codeReview", rawResponse, context);
}

async function getLearningSummary({ userId, sessionId }) {
  const context = await buildFullContext({ userId, sessionId, code: "", language: "python" });

  const prompt = buildAgentPrompt("learningSummary", context);
  const rawResponse = await callLLM(prompt.systemPrompt, prompt.userContent);
  return formatAgentResponse("learningSummary", rawResponse, context);
}

async function getOracleComparison({ userId, problemId, code, language }) {
  const Problem = require("../models/Problem");
  const problem = await Problem.findOne({ problemId }).lean();
  const oracleCode = problem?.oracleSolutions?.[language] || "";

  const comparison = compareSolutions(code, oracleCode, problemId, language);
  const context = await buildFullContext({ userId, problemId, code, language });
  context.codeAnalysis = analyzeStudentCode(code, language);

  const prompt = buildAgentPrompt("correctAnswer", {
    ...context,
    testResults: { verdict: "pass" },
  });

  const rawResponse = await callLLM(prompt.systemPrompt, prompt.userContent);

  return {
    ...formatAgentResponse("correctAnswer", rawResponse, context),
    comparison,
  };
}

async function getConfidenceReport({ code, language, executionResult, codeAnalysis, verdict }) {
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
  getLearningSummary,
  getOracleComparison,
  getConfidenceReport,
  callLLM,
  SYSTEM_PROMPTS,
};
