const { buildPrompt } = require('./socraticPrompt');

const API_KEY = process.env.NVIDIA_API_KEY;
const BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;
const MAX_TOKENS = 16384;
const REASONING_BUDGET = 16384;

const CB_THRESHOLD = 5;
const CB_RESET_MS = 30_000;

let cbState = 'CLOSED';
let cbFailures = [];
let cbOpenedAt = 0;

function recordSuccess() {
  cbFailures = [];
  cbState = 'CLOSED';
}

function recordFailure() {
  const now = Date.now();
  cbFailures = cbFailures.filter(t => now - t < 60_000);
  cbFailures.push(now);
  if (cbFailures.length >= CB_THRESHOLD) {
    cbState = 'OPEN';
    cbOpenedAt = now;
    console.warn('[llmClient] Circuit breaker OPEN after', cbFailures.length, 'failures in 60s');
  }
}

function canAttempt() {
  if (cbState === 'CLOSED') return true;
  if (cbState === 'HALF_OPEN') return true;
  if (Date.now() - cbOpenedAt >= CB_RESET_MS) {
    cbState = 'HALF_OPEN';
    console.info('[llmClient] Circuit breaker HALF_OPEN — probing');
    return true;
  }
  return false;
}

const CODE_BLOCK_RE = /```[\s\S]*?```/g;

function stripCodeBlocks(text) {
  return text.replace(CODE_BLOCK_RE, '').trim();
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
        const body = await resp.text().catch(() => '');
        if ((resp.status === 429 || resp.status >= 500) && attempt < MAX_RETRIES) {
          const backoff = Math.min(1000 * 2 ** (attempt - 1), 4000);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
        throw new Error(`LLM API error: ${resp.status} ${body.slice(0, 200)}`);
      }
      return resp;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const backoff = Math.min(1000 * 2 ** (attempt - 1), 4000);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  throw lastErr;
}

async function callLLM(systemContent, userContent) {
  if (!API_KEY) {
    console.warn('[llmClient] NVIDIA_API_KEY not set');
    return "The AI mentor is currently unavailable because the API key is not configured. Please contact your administrator.";
  }

  if (!canAttempt()) {
    console.warn('[llmClient] Circuit breaker OPEN — skipping request');
    return "The AI mentor is temporarily unavailable due to high demand. Please try again shortly.";
  }

  try {
    const resp = await fetchWithRetry(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent },
        ],
        temperature: 1,
        top_p: 0.95,
        max_tokens: MAX_TOKENS,
        stream: false,
      }),
    });

    const data = await resp.json();
    const choice = data?.choices?.[0];
    if (!choice) throw new Error('Empty LLM response');

    let hint = choice.message?.content?.trim();
    const reasoning = choice.message?.reasoning_content?.trim();

    if (!hint && !reasoning) throw new Error('Empty LLM response (no content or reasoning)');
    if (!hint) hint = reasoning;

    hint = stripCodeBlocks(hint);
    if (hint.length < 10) throw new Error('Response too short after stripping');

    recordSuccess();
    return hint;
  } catch (err) {
    recordFailure();
    console.error('[llmClient] Error:', err.message);
    return "I'm having trouble connecting to my knowledge base right now. Let me review what I can see:\n\nYour code ran and produced output that didn't match the expected result. Check your logic, edge cases, and variable assignments carefully. If the issue persists, try working through the problem with a debugger or paper trace.";
  }
}

const SYSTEM_SOCRATIC = 'You are a CS mentor reviewing a student\'s failed submission. You will be given: the problem statement, the student\'s code, the divergence point (or, if a step-level match wasn\'t possible, the comparative performance result), and relevant local variable state at that point. Ask one guiding question that leads the student toward noticing the conceptual gap. Never output corrected code, a code patch, or pseudocode that solves the problem.';

async function generateSocraticHint({ code, language, problemStatement, verdict, tier, traceData, performanceData, previousHint }) {
  const prompt = buildPrompt({
    code, language, problemStatement, verdict, tier,
    traceData: traceData || {},
    performanceData: performanceData || {},
    previousHint,
  });
  return callLLM(SYSTEM_SOCRATIC, prompt);
}

const SYSTEM_COMPILE = `You are a Socratic programming mentor. A student's code has a compile error.
Never write code for the student. Explain what the error means and guide them toward fixing it with a question.
Do not provide the corrected code. Keep your response to 2-3 sentences.`;

async function generateCompileHint(code, language, problemStatement, compileError, verdict) {
  const prompt = `The student submitted the following ${language} code for the problem below and received a compile error.\n\nProblem:\n${problemStatement}\n\nCode:\n${code}\n\nCompile Error:\n${compileError}\n\nProvide a short Socratic hint (2-3 sentences) that helps the student understand and fix the compile error on their own. Do not write or suggest code.`;
  return callLLM(SYSTEM_COMPILE, prompt);
}

module.exports = { generateSocraticHint, generateCompileHint };
