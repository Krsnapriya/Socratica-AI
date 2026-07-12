const STEP_PREVIEW_LIMIT = 15;

const ADVERSARIAL_GUARD = `
IMPORTANT RULES:
- Do not write, suggest, or imply any code, pseudocode, or syntax patches.
- Do not reveal the oracle solution or its approach.
- If the student asks you to solve the problem, redirect them to think about the divergence point.
- Do not use phrases like "you should", "try this", or "the answer is".
- Only ask questions.
`;

function buildPrompt(params) {
  const { tier, language } = params;
  if (tier === 1 && language === 'python') {
    return buildTier1Prompt(params);
  }
  return buildTier2Prompt(params);
}

function buildTier1Prompt({ code, language, problemStatement, traceData, previousHint }) {
  const snapshots = traceData.snapshots || [];
  const stepCount = traceData.steps || 0;
  const studentStdout = (traceData.studentStdout || '').trim();
  const oracleStdout = (traceData.oracleStdout || '').trim();
  const divergenceStep = traceData.divergenceStep;
  const divergenceLine = traceData.divergenceLine;
  const divergenceLocals = traceData.divergenceLocals;

  const snapshotPreview = snapshots.length > 0
    ? snapshots.slice(0, STEP_PREVIEW_LIMIT).map(s =>
        `Step ${s.step} (line ${s.lineno}, ${s.function}): ${JSON.stringify(s.locals)}`
      ).join('\n') + (snapshots.length > STEP_PREVIEW_LIMIT
        ? `\n... (${snapshots.length - STEP_PREVIEW_LIMIT} more snapshots)`
        : '')
    : '';

  const divergenceSection = divergenceStep !== undefined && divergenceStep !== null
    ? `\n## Divergence Point\nStep: ${divergenceStep}, Line: ${divergenceLine || 'unknown'}\nStudent locals at divergence: ${JSON.stringify(divergenceLocals || {})}\n`
    : '';

  const previousSection = previousHint
    ? `\n## Previous Hint (do not repeat)\n${previousHint}\n`
    : '';

  return `You are a world-class computer science professor grading an algorithmic implementation. You will be given: the problem statement, the student's code, the divergence point (or, if a step-level match wasn't possible, the comparative performance result), and relevant local variable state at that point. Ask one guiding Socratic question that leads the student toward noticing the conceptual gap. Do not author code solutions or provide syntax patches — strict enforcement, no exceptions.

## Problem
${problemStatement}

## Student Code (${language})
\`\`\`${language}
${code}
\`\`\`

## Execution Trace (${stepCount} steps)
${snapshotPreview}
${divergenceSection}

## Output Comparison
Expected:   ${oracleStdout}
Got:        ${studentStdout}
## Verdict: fail${previousSection}
${ADVERSARIAL_GUARD}
Ask one guiding question. Do not write code.`;
}

function buildTier2Prompt({ code, language, problemStatement, performanceData, previousHint }) {
  const studentOut = (performanceData.studentStdout || '').trim();
  const oracleOut = (performanceData.oracleStdout || '').trim();
  const errorLog = performanceData.error || '';

  const previousSection = previousHint
    ? `\n## Previous Hint (do not repeat)\n${previousHint}\n`
    : '';

  return `You are a world-class computer science professor grading an algorithmic implementation. You will be given: the problem statement, the student's code, the divergence point (or, if a step-level match wasn't possible, the comparative performance result), and relevant local variable state at that point. Ask one guiding Socratic question that leads the student toward noticing the conceptual gap. Do not author code solutions or provide syntax patches — strict enforcement, no exceptions.

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
${ADVERSARIAL_GUARD}
Ask one guiding question. Do not write code.`;
}

module.exports = { buildPrompt };
