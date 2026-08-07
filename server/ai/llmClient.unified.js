// Unified LLM Client — single source of truth for all AI calls
const { config } = require("../configLoader");
const redis = require("../redis");

const NVIDIA_URL = process.env.NVIDIA_API_URL || `${config.llm.baseUrl}/chat/completions`;
const API_KEY = process.env.NVIDIA_API_KEY || process.env.OPENROUTER_API_KEY || "";
const DEFAULT_MODEL = process.env.LLM_MODEL || config.llm.model;

// ── Circuit Breaker (Redis-backed) ─────────────────────────────────────────
const cbThreshold = config.llm.circuitBreaker.threshold;
const cbResetMs = config.llm.circuitBreaker.resetMs;
const CB_FAILURES_KEY = "cb:failures";
const CB_OPENED_KEY = "cb:openedAt";

// In-memory fallback for circuit breaker
const cbMem = { failures: 0, openedAt: 0 };

async function cbIsOpen() {
  if (redis.isConnected()) {
    const failures = parseInt(await redis.get(CB_FAILURES_KEY)) || 0;
    const openedAt = parseInt(await redis.get(CB_OPENED_KEY)) || 0;
    if (failures < cbThreshold) return false;
    if (Date.now() - openedAt > cbResetMs) { await redis.del(CB_FAILURES_KEY); return false; }
    return true;
  }
  // In-memory fallback
  if (cbMem.failures < cbThreshold) return false;
  if (Date.now() - cbMem.openedAt > cbResetMs) { cbMem.failures = 0; return false; }
  return true;
}

async function cbRecordSuccess() {
  if (redis.isConnected()) {
    await redis.del(CB_FAILURES_KEY);
  } else {
    cbMem.failures = 0;
  }
}

async function cbRecordFailure() {
  if (redis.isConnected()) {
    const failures = await redis.incr(CB_FAILURES_KEY, cbResetMs);
    if (failures >= cbThreshold) {
      await redis.set(CB_OPENED_KEY, Date.now().toString(), cbResetMs);
    }
  } else {
    cbMem.failures++;
    if (cbMem.failures >= cbThreshold) cbMem.openedAt = Date.now();
  }
}

// ── Response Safety ─────────────────────────────────────────────────────────
const SOLUTION_PATTERNS = [
  /here\s+(is|'s|are)\s+(the\s+)?(complete|full|final|working)\s+(code|solution)/i,
  /```[\s\S]{20,}```/,
];

function sanitizeResponse(text) {
  if (!text) return "";
  // Only remove code blocks that are 4+ lines long (likely full solutions)
  // Keep short code snippets and all explanatory text
  let clean = text.replace(/```\w*\n[\s\S]{200,}?```/g, "[code block removed]");
  return clean.trim();
}

function isAdversarial(text) {
  if (!text) return false;
  return SOLUTION_PATTERNS.some(p => p.test(text));
}

// ── Token Counting (approximate) ────────────────────────────────────────────
// Improved estimation: ~4 chars per token for English, ~2 for CJK, ~1 for code-heavy text
function estimateTokens(text) {
  if (!text) return 0;
  const codeHeavy = /[{}\[\]();]/.test(text) ? 1.5 : 4;
  return Math.ceil(text.length / codeHeavy);
}

// ── Response Cache (Redis-backed with in-memory fallback) ────────────────────
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 200;

// In-memory fallback cache
const memCache = new Map();

function cacheKey(system, user) {
  let h = 0;
  const s = system + "|||" + user;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return h.toString(36);
}

async function cacheGet(key) {
  if (redis.isConnected()) {
    const raw = await redis.get(`cache:${key}`);
    return raw ? JSON.parse(raw) : null;
  }
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { memCache.delete(key); return null; }
  return entry.value;
}

async function cacheSet(key, value) {
  if (redis.isConnected()) {
    await redis.set(`cache:${key}`, JSON.stringify(value), CACHE_TTL);
    return;
  }
  if (memCache.size >= CACHE_MAX) {
    const oldest = memCache.keys().next().value;
    memCache.delete(oldest);
  }
  memCache.set(key, { value, ts: Date.now() });
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

  if (await cbIsOpen()) {
    return { text: "", error: "Circuit breaker open — LLM temporarily unavailable", cached: false, tokens: { in: 0, out: 0 } };
  }

  const inputTokens = estimateTokens(systemContent) + estimateTokens(userContent);
  if (inputTokens > 6000) {
    systemContent = systemContent.slice(0, 6000 * 4);
    userContent = userContent.slice(0, 6000 * 4);
  }

  if (useCache) {
    const key = cacheKey(systemContent, userContent);
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };
  }

  const body = {
    model,
    messages: [
      { role: "system", content: systemContent || "" },
      { role: "user", content: userContent || "" },
    ],
    temperature,
    top_p: topP,
    max_tokens: maxTokens,
    stream: false,
  };

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const reqStart = Date.now();
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
      const inTokens = data.usage?.prompt_tokens || inputTokens;

      let text = sanitizeResponse(raw);
      if (isAdversarial(text)) {
        text = "I can help you think through this problem. What approach are you considering?";
      }

      await cbRecordSuccess();
      const latencyMs = Date.now() - reqStart;
      const result = {
        text,
        cached: false,
        tokens: { in: inTokens, out: outTokens },
        model: data.model || model,
        latencyMs,
      };

      if (useCache) {
        const key = cacheKey(systemContent, userContent);
        await cacheSet(key, result);
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

  await cbRecordFailure();
  console.error(`[llm] callLLM FAILED after ${retries + 1} attempts: ${lastErr?.message || "unknown"}`);
  return { text: "", error: lastErr?.message || "LLM call failed", cached: false, tokens: { in: 0, out: 0 }, latencyMs: 0 };
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

  if (await cbIsOpen()) {
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
    const reqStart = Date.now();
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
      const inTokens = data.usage?.prompt_tokens || inputTokens;

      let text = sanitizeResponse(raw);
      if (isAdversarial(text)) {
        text = "I can help you think through this. What have you tried so far?";
      }

      await cbRecordSuccess();
      const latencyMs = Date.now() - reqStart;
      return { text, cached: false, tokens: { in: inTokens, out: outTokens }, model: data.model || model, latencyMs };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  await cbRecordFailure();
  console.error(`[llm] callLLMWithHistory FAILED after ${retries + 1} attempts: ${lastErr?.message || "unknown"}`);
  return { text: "", error: lastErr?.message || "LLM call failed", cached: false, tokens: { in: 0, out: 0 }, latencyMs: 0 };
}

// ── Health Check ────────────────────────────────────────────────────────────
async function getClientStatus() {
  const cbFailures = redis.isConnected()
    ? parseInt(await redis.get(CB_FAILURES_KEY)) || 0
    : cbMem.failures;
  const cbIsOpenNow = await cbIsOpen();
  const cacheSize = redis.isConnected()
    ? "?" // Redis manages its own memory
    : memCache.size;

  return {
    hasApiKey: !!API_KEY,
    model: DEFAULT_MODEL,
    circuitBreaker: { failures: cbFailures, isOpen: cbIsOpenNow, threshold: cbThreshold },
    cacheSize,
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
  const result = await callLLM(SYSTEM_SOCRATIC, prompt);

  // Never return silent empty text: surface the raw structured telemetry so the
  // workspace shows real evidence instead of a blank mentor pane.
  if (!result.text || result.error) {
    const telemetry =
      tier === 1 && traceData && (traceData.divergenceStep != null)
        ? `Divergence detected at step ${traceData.divergenceStep} (line ${traceData.studentLine ?? "?"}).\n` +
          (traceData.studentState ? `Student state: ${JSON.stringify(traceData.studentState).slice(0, 500)}\n` : "") +
          (traceData.oracleState ? `Oracle state: ${JSON.stringify(traceData.oracleState).slice(0, 500)}` : "")
        : (performanceData && (performanceData.studentTimeMs != null)
            ? `Student: ${performanceData.studentTimeMs}ms / ${performanceData.studentMemMb ?? "?"}MB vs Oracle: ${performanceData.oracleTimeMs ?? "?"}ms / ${performanceData.oracleMemMb ?? "?"}MB`
            : "Sandbox produced no telemetry for this submission.");
    const note = result.error ? ` (LLM unavailable: ${result.error})` : "";
    return `Mentor temporarily unavailable${note}. Raw telemetry:\n${telemetry}\n\nReview the divergence above and think about what changed between the two paths.`;
  }
  return result.text;
}

async function generateCompileHint(code, language, problemStatement, compileError, verdict) {
  const prompt = `The student submitted the following ${language} code for the problem below and received a compile error.\n\nProblem:\n${problemStatement}\n\nCode:\n${code}\n\nCompile Error:\n${compileError}\n\nProvide a short Socratic hint (2-3 sentences) that helps the student understand and fix the compile error on their own. Do not write or suggest code.`;
  const result = await callLLM(SYSTEM_COMPILE, prompt);
  return result.text;
}

// ── Convenience wrapper for orchestrator ────────────────────────────────────
function getLLMClient() {
  return {
    model: DEFAULT_MODEL,
    chat: async (systemPrompt, userPrompt, opts = {}) => {
      const result = await callLLM(systemPrompt, userPrompt, opts);
      // Return full result including tokens and latency for orchestrator tracking
      return { text: result.text, tokens: result.tokens, latencyMs: result.latencyMs, model: result.model, cached: result.cached, error: result.error };
    },
    chatWithHistory: async (messages, opts = {}) => {
      // messages should be [{role, content}...] — extract system message as systemContent
      const systemMsg = messages.find(m => m.role === "system");
      const nonSystemMsgs = messages.filter(m => m.role !== "system");
      const systemContent = systemMsg?.content || "You are a helpful AI assistant.";
      const result = await callLLMWithHistory(systemContent, nonSystemMsgs, opts);
      return { text: result.text, tokens: result.tokens, latencyMs: result.latencyMs, model: result.model, cached: result.cached, error: result.error };
    },
    status: getClientStatus,
  };
}

module.exports = { callLLM, callLLMWithHistory, getLLMClient, sanitizeResponse, isAdversarial, getClientStatus };
