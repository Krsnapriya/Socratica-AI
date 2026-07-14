// Unified LLM Client — single source of truth for all AI calls
const config = require("../config");

const NVIDIA_URL = process.env.NVIDIA_API_URL || `${config.llm.baseUrl}/chat/completions`;
const API_KEY = process.env.NVIDIA_API_KEY || process.env.OPENROUTER_API_KEY || "";
const DEFAULT_MODEL = process.env.LLM_MODEL || config.llm.model;

// ── Circuit Breaker ─────────────────────────────────────────────────────────
const cb = { failures: 0, openedAt: 0, threshold: config.llm.circuitBreaker.threshold, resetMs: config.llm.circuitBreaker.resetMs };

function cbIsOpen() {
  if (cb.failures < cb.threshold) return false;
  if (Date.now() - cb.openedAt > cb.resetMs) { cb.failures = 0; return false; }
  return true;
}

function cbRecordSuccess() { cb.failures = 0; }
function cbRecordFailure() {
  cb.failures++;
  if (cb.failures >= cb.threshold) cb.openedAt = Date.now();
}

// ── Response Safety ─────────────────────────────────────────────────────────
const SOLUTION_PATTERNS = [
  /here\s+(is|'s|are)\s+(the\s+)?(complete|full|final|working)\s+code/i,
  /def\s+\w+\s*\(|function\s+\w+\s*\(|class\s+\w+/i,
  /```[\s\S]{20,}```/,
];

function sanitizeResponse(text) {
  if (!text) return "";
  let clean = text.replace(/```[\s\S]*?```/g, "[code block removed]");
  clean = clean.replace(/`[^`]{3,}`/g, "");
  const lines = clean.split("\n");
  const codeLike = /^\s*(def |function |class |import |from |#include|const |let |var |return |if |for |while |print\()/;
  return lines.filter(l => !codeLike.test(l)).join("\n").trim();
}

function isAdversarial(text) {
  if (!text) return false;
  return SOLUTION_PATTERNS.some(p => p.test(text));
}

// ── Token Counting (approximate) ────────────────────────────────────────────
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// ── Response Cache ──────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 200;

function cacheKey(system, user) {
  let h = 0;
  const s = system + "|||" + user;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return h.toString(36);
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.value;
}

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { value, ts: Date.now() });
}

// ── Main Call Function ──────────────────────────────────────────────────────
async function callLLM(systemContent, userContent, opts = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    topP = 0.9,
    maxTokens = 4096,
    timeoutMs = 15000,
    retries = 2,
    useCache = false,
  } = opts;

  if (!API_KEY) {
    return { text: "", error: "No LLM API key configured", cached: false, tokens: { in: 0, out: 0 } };
  }

  if (cbIsOpen()) {
    return { text: "", error: "Circuit breaker open — LLM temporarily unavailable", cached: false, tokens: { in: 0, out: 0 } };
  }

  const inputTokens = estimateTokens(systemContent) + estimateTokens(userContent);
  if (inputTokens > 6000) {
    systemContent = systemContent.slice(0, 6000 * 4);
    userContent = userContent.slice(0, 6000 * 4);
  }

  if (useCache) {
    const key = cacheKey(systemContent, userContent);
    const cached = cacheGet(key);
    if (cached) return { ...cached, cached: true };
  }

  const body = {
    model,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
    temperature,
    top_p: topP,
    max_tokens: maxTokens,
    stream: false,
  };

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const resp = await fetch(NVIDIA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        throw new Error(`LLM API ${resp.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const outTokens = data.usage?.completion_tokens || estimateTokens(raw);

      let text = sanitizeResponse(raw);
      if (isAdversarial(text)) {
        text = "I can help you think through this problem. What approach are you considering?";
      }

      cbRecordSuccess();
      const result = {
        text,
        cached: false,
        tokens: { in: inputTokens, out: outTokens },
        model: data.model || model,
        latencyMs: 0,
      };

      if (useCache) {
        const key = cacheKey(systemContent, userContent);
        cacheSet(key, result);
      }

      return result;
    } catch (err) {
      lastErr = err;
      if (err.name === "AbortError") {
        if (attempt < retries) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
      }
      if (attempt < retries) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
    }
  }

  cbRecordFailure();
  return { text: "", error: lastErr?.message || "LLM call failed", cached: false, tokens: { in: 0, out: 0 } };
}

// ── Multi-turn Conversation Call ────────────────────────────────────────────
async function callLLMWithHistory(systemContent, messages, opts = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    topP = 0.9,
    maxTokens = 4096,
    timeoutMs = 15000,
    retries = 2,
  } = opts;

  if (!API_KEY) {
    return { text: "", error: "No LLM API key configured", cached: false, tokens: { in: 0, out: 0 } };
  }

  if (cbIsOpen()) {
    return { text: "", error: "Circuit breaker open", cached: false, tokens: { in: 0, out: 0 } };
  }

  const allMessages = [{ role: "system", content: systemContent }, ...messages];
  const inputTokens = allMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  const body = {
    model,
    messages: allMessages,
    temperature,
    top_p: topP,
    max_tokens: maxTokens,
    stream: false,
  };

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const resp = await fetch(NVIDIA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        throw new Error(`LLM API ${resp.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const outTokens = data.usage?.completion_tokens || estimateTokens(raw);

      let text = sanitizeResponse(raw);
      if (isAdversarial(text)) {
        text = "I can help you think through this. What have you tried so far?";
      }

      cbRecordSuccess();
      return { text, cached: false, tokens: { in: inputTokens, out: outTokens }, model: data.model || model };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  cbRecordFailure();
  return { text: "", error: lastErr?.message || "LLM call failed", cached: false, tokens: { in: 0, out: 0 } };
}

// ── Health Check ────────────────────────────────────────────────────────────
function getClientStatus() {
  return {
    hasApiKey: !!API_KEY,
    model: DEFAULT_MODEL,
    circuitBreaker: { failures: cb.failures, isOpen: cbIsOpen(), threshold: cb.threshold },
    cacheSize: cache.size,
  };
}

// ── Socratic Hint Generators (backward-compatible with old llmClient.js) ───
const SYSTEM_SOCRATIC = "You are a world-class computer science professor grading an algorithmic implementation. You will be given: the problem statement, the student's code, the divergence point (or, if a step-level match wasn't possible, the comparative performance result), and relevant local variable state at that point. Ask one guiding Socratic question that leads the student toward noticing the conceptual gap. Do not author code solutions or provide syntax patches — strict enforcement, no exceptions.";
const SYSTEM_COMPILE = "You are a world-class computer science professor reviewing a student's compile error. You will be given: the problem statement, the student's code, and the compiler error message. Ask one guiding Socratic question that helps the student understand what the error means and how to fix it. Do not write or suggest code. Strict enforcement — no code patches, no pseudocode, no syntax fixes.";

async function generateSocraticHint({ code, language, problemStatement, verdict, tier, traceData, performanceData, previousHint }) {
  const { buildPrompt } = require("./socraticPrompt");
  const prompt = buildPrompt({
    code, language, problemStatement, verdict, tier,
    traceData: traceData || {},
    performanceData: performanceData || {},
    previousHint,
  });
  const result = await callLLM([
    { role: "system", content: SYSTEM_SOCRATIC },
    { role: "user", content: prompt },
  ]);
  return result.text;
}

async function generateCompileHint(code, language, problemStatement, compileError, verdict) {
  const prompt = `The student submitted the following ${language} code for the problem below and received a compile error.\n\nProblem:\n${problemStatement}\n\nCode:\n${code}\n\nCompile Error:\n${compileError}\n\nProvide a short Socratic hint (2-3 sentences) that helps the student understand and fix the compile error on their own. Do not write or suggest code.`;
  const result = await callLLM([
    { role: "system", content: SYSTEM_COMPILE },
    { role: "user", content: prompt },
  ]);
  return result.text;
}

// ── Convenience wrapper for orchestrator ────────────────────────────────────
function getLLMClient() {
  return {
    model: DEFAULT_MODEL,
    chat: async (systemPrompt, userPrompt) => {
      const result = await callLLM([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);
      return result.text;
    },
    chatWithHistory: async (messages) => {
      const result = await callLLMWithHistory(messages);
      return result.text;
    },
    status: getClientStatus,
  };
}

module.exports = { callLLM, callLLMWithHistory, getLLMClient, sanitizeResponse, isAdversarial, getClientStatus };
