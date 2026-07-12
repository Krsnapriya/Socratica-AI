const { comparePerformance } = require('./tier2Differential');

const STEP_CAP = 5000;
const VALUE_PREVIEW_LIMIT = 20;
const STEP_COUNT_TOLERANCE_RATIO = 0.15;
const STEP_COUNT_MIN_RATIO = 0.1;
const STEP_COUNT_MAX_RATIO = 10;

function truncateValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') return val.length > 200 ? val.slice(0, 200) + '...' : val;
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (Array.isArray(val)) {
    const preview = val.slice(0, VALUE_PREVIEW_LIMIT).map(truncateValue);
    return val.length > VALUE_PREVIEW_LIMIT
      ? [...preview, `... (${val.length} total)`]
      : preview;
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val);
    const truncated = {};
    for (const k of keys.slice(0, VALUE_PREVIEW_LIMIT)) {
      truncated[k] = truncateValue(val[k]);
    }
    if (keys.length > VALUE_PREVIEW_LIMIT) truncated['...'] = `${keys.length} keys total`;
    return truncated;
  }
  return val;
}

function truncateSnapshots(snapshots) {
  if (!Array.isArray(snapshots)) return snapshots;
  return snapshots.map(s => ({
    ...s,
    locals: s.locals ? truncateValue(s.locals) : {},
  }));
}

function extractSteps(telemetry) {
  if (!telemetry || !Array.isArray(telemetry.snapshots)) return [];
  return telemetry.snapshots.map(s => ({
    step: s.step,
    line: s.lineno,
    function: s.function,
    locals: s.locals ? truncateValue(s.locals) : {},
  }));
}

function stepCountWithinTolerance(studentSteps, oracleSteps) {
  const sCount = studentSteps.length;
  const oCount = oracleSteps.length;
  if (oCount === 0) return false;
  const ratio = sCount / oCount;
  if (ratio >= STEP_COUNT_MIN_RATIO && ratio <= STEP_COUNT_MAX_RATIO) {
    if (ratio >= 1 - STEP_COUNT_TOLERANCE_RATIO && ratio <= 1 + STEP_COUNT_TOLERANCE_RATIO) return true;
    return true;
  }
  return false;
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

function hasRecursionError(telemetry) {
  if (!telemetry) return false;
  if (telemetry.error && telemetry.error.includes('RecursionError')) return true;
  if (telemetry.error && telemetry.error.includes('recursion_limit_exceeded')) return true;
  return false;
}

function shouldPromoteToTier2(studentTelemetry, oracleTelemetry, language) {
  if (language === 'javascript') return true;
  if (language === 'cpp') return true;
  if (language !== 'python') return true;
  if (hasRecursionError(studentTelemetry)) return true;
  if ((studentTelemetry.steps || 0) > STEP_CAP) return true;
  if (studentTelemetry.error) return true;

  const studentSteps = extractSteps(studentTelemetry);
  const oracleSteps = extractSteps(oracleTelemetry);
  if (!stepCountWithinTolerance(studentSteps, oracleSteps)) return true;

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
      summary.divergenceLocals = ds.locals;
    }
  }

  return summary;
}

function analyzeTraces({ studentTelemetry, oracleTelemetry, language }) {
  const promote = shouldPromoteToTier2(studentTelemetry, oracleTelemetry, language);

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

module.exports = { extractSteps, alignTraces, shouldPromoteToTier2, summarizeDiff, analyzeTraces, truncateSnapshots, truncateValue, hasRecursionError };
