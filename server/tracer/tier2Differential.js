function comparePerformance(studentTelemetry, oracleTelemetry) {
  const studentTimeMs = studentTelemetry.elapsed_ms || 0;
  const oracleTimeMs = oracleTelemetry.elapsed_ms || 0;
  const studentMemBytes = studentTelemetry.max_memory_bytes || 0;
  const oracleMemBytes = oracleTelemetry.max_memory_bytes || 0;

  const studentMemMb = Math.round(studentMemBytes / (1024 * 1024) * 100) / 100;
  const oracleMemMb = Math.round(oracleMemBytes / (1024 * 1024) * 100) / 100;

  return {
    studentTimeMs,
    oracleTimeMs,
    studentMemMb,
    oracleMemMb,
    timeRatio: oracleTimeMs > 0 ? Math.round((studentTimeMs / oracleTimeMs) * 100) / 100 : 0,
  };
}

function formatDifferentialReport(diff) {
  const timeDelta = diff.studentTimeMs - diff.oracleTimeMs;
  const memDelta = diff.studentMemMb - diff.oracleMemMb;

  return {
    verdict: diff.studentTimeMs > diff.oracleTimeMs * 2 ? 'slower' : 'comparable',
    executionTime: {
      student: diff.studentTimeMs,
      oracle: diff.oracleTimeMs,
      delta: timeDelta,
      ratio: diff.timeRatio,
    },
    memory: {
      student: diff.studentMemMb,
      oracle: diff.oracleMemMb,
      delta: memDelta,
    },
    summary: timeDelta > 100
      ? `Student solution was ${timeDelta}ms slower than the oracle`
      : 'Performance is comparable',
  };
}

module.exports = { comparePerformance, formatDifferentialReport };
