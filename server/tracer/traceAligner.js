const { comparePerformance } = require('./tier2Differential');

const STEP_CAP = 5000;

function extractSteps(telemetry) {
  if (!telemetry || !Array.isArray(telemetry.snapshots)) return [];
  return telemetry.snapshots.map(s => ({
    step: s.step,
    line: s.lineno,
    function: s.function,
    locals: s.locals || {},
  }));
}

function alignTraces(studentTelemetry, oracleTelemetry) {
  const studentSteps = extractSteps(studentTelemetry);
  const oracleSteps = extractSteps(oracleTelemetry);

  const maxSteps = Math.min(studentSteps.length, oracleSteps.length);
  let divergenceStep = null;
  let divergenceIndex = -1;

  for (let i = 0; i < maxSteps; i++) {
    const sLocals = JSON.stringify(studentSteps[i].locals);
    const oLocals = JSON.stringify(oracleSteps[i].locals);
    if (sLocals !== oLocals) {
      divergenceStep = studentSteps[i].step;
      divergenceIndex = i;
      break;
    }
  }

  return {
    studentSteps,
    oracleSteps,
    divergenceStep,
    divergenceIndex,
    totalStudentSteps: studentTelemetry.steps || 0,
    totalOracleSteps: oracleTelemetry.steps || 0,
  };
}

function shouldPromoteToTier2(studentTelemetry, language) {
  // Tier 1 (step-level trace alignment) only exists for Python.
  // JavaScript and C++ always resolve to Tier 2 (performance/stdout comparison).
  if (language === 'javascript') return true;
  if (language === 'cpp') return true;
  if (language !== 'python') return true; // unknown language — safe fallback

  // Python: promote to Tier 2 if trace is too long or errored
  if ((studentTelemetry.steps || 0) > STEP_CAP) return true;
  if (studentTelemetry.error) return true;
  return false;
}

function summarizeDiff(diff) {
  const summary = {
    tier: diff.tier,
    totalStudentSteps: diff.totalStudentSteps,
    totalOracleSteps: diff.totalOracleSteps,
    divergenceStep: diff.divergenceStep,
  };

  if (diff.tier === 1) {
    summary.traceLength = diff.studentSteps ? diff.studentSteps.length : 0;
    summary.hasDivergence = diff.divergenceStep !== null;
    if (diff.divergenceStep !== null && diff.divergenceIndex >= 0 && diff.studentSteps) {
      const ds = diff.studentSteps[diff.divergenceIndex];
      summary.divergenceLine = ds.line;
      summary.divergenceFunction = ds.function;
    }
  }

  return summary;
}

function analyzeTraces({ studentTelemetry, oracleTelemetry, language }) {
  const promote = shouldPromoteToTier2(studentTelemetry, language);

  if (promote) {
    const perfDiff = comparePerformance(studentTelemetry, oracleTelemetry);
    const diff = {
      tier: 2,
      totalStudentSteps: studentTelemetry.steps || 0,
      totalOracleSteps: oracleTelemetry.steps || 0,
      divergenceStep: null,
      ...perfDiff,
    };

    return { diff, summary: summarizeDiff({ ...diff, tier: 2 }) };
  }

  const alignment = alignTraces(studentTelemetry, oracleTelemetry);
  const diff = { tier: 1, ...alignment };

  return { diff, summary: summarizeDiff({ ...diff, tier: 1 }) };
}

module.exports = { extractSteps, alignTraces, shouldPromoteToTier2, summarizeDiff, analyzeTraces };
