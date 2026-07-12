const STEP_PREVIEW_LIMIT = 15;

// ── Template selection: explicit tier + language ──────────────────────────────────
// Tier 1 (step-level trace) only exists for Python.
// JavaScript and C++ always resolve to Tier 2 (performance/stdout comparison).
function buildPrompt(params) {
  const { tier, language } = params;

  if (language !== 'python' && tier === 1) {
    console.warn(`[socraticPrompt] Forcing tier 2 for ${language} — tier 1 only supports Python`);
  }

  if (tier === 1 && language === 'python') {
    return buildTier1Prompt(params);
  }

  return buildTier2Prompt(params);
}

// ── Tier 1: step-level trace (Python only) ───────────────────────────────────────
function buildTier1Prompt({ code, language, problemStatement, traceData, previousHint }) {
  const snapshots = traceData.snapshots || [];
  const stepCount = traceData.steps || 0;
  const studentStdout = (traceData.studentStdout || '').trim();
  const oracleStdout = (traceData.oracleStdout || '').trim();

  const snapshotPreview = snapshots.length > 0
    ? snapshots.slice(0, STEP_PREVIEW_LIMIT).map(s =>
        `Step ${s.step} (line ${s.lineno}, ${s.function}): ${JSON.stringify(s.locals)}`
      ).join('\n') + (snapshots.length > STEP_PREVIEW_LIMIT
        ? `\n... (${snapshots.length - STEP_PREVIEW_LIMIT} more snapshots)`
        : '')
    : '';

  const previousSection = previousHint
    ? `\n## Previous Hint (do not repeat)\n${previousHint}\n`
    : '';

  return `You are a CS mentor reviewing a student's failed submission. You will be given: the problem statement, the student's code, the divergence point with relevant local variable state at that point. Ask one guiding question that leads the student toward noticing the conceptual gap. Never output corrected code, a code patch, or pseudocode that solves the problem.

## Problem
${problemStatement}

## Student Code (${language})
\`\`\`${language}
${code}
\`\`\`

## Execution Trace (${stepCount} steps)
${snapshotPreview}

## Output Comparison
Expected:   ${oracleStdout}
Got:        ${studentStdout}
## Verdict: fail${previousSection}

Ask one guiding question. Do not write code.`;
}

// ── Tier 2: performance/stdout comparison (all languages) ────────────────────────
function buildTier2Prompt({ code, language, problemStatement, performanceData, previousHint }) {
  const studentOut = (performanceData.studentStdout || '').trim();
  const oracleOut = (performanceData.oracleStdout || '').trim();
  const errorLog = performanceData.error || '';

  const previousSection = previousHint
    ? `\n## Previous Hint (do not repeat)\n${previousHint}\n`
    : '';

  return `You are a CS mentor reviewing a student's failed submission. You will be given: the problem statement, the student's code, the comparative performance result, and details about what went wrong. Ask one guiding question that leads the student toward noticing the conceptual gap. Never output corrected code, a code patch, or pseudocode that solves the problem.

## Problem
${problemStatement}

## Student Code (${language})
\`\`\`${language}
${code}
\`\`\`

## Execution
Expected output:   ${oracleOut}
Student output:    ${studentOut}
${errorLog ? `Error: ${errorLog}\n` : ''}
Time: student ${performanceData.studentTimeMs}ms vs oracle ${performanceData.oracleTimeMs}ms
Memory: student ${performanceData.studentMemMb}MB vs oracle ${performanceData.oracleMemMb}MB
## Verdict: fail${previousSection}

Ask one guiding question. Do not write code.`;
}

module.exports = { buildPrompt };