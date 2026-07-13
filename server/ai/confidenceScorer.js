function scoreConfidence({ code, language, executionResult, codeAnalysis, verdict }) {
  let syntaxConfidence = 95;
  let logicConfidence = 70;
  let optimizationConfidence = 50;

  if (executionResult?.error === "compile_error") {
    syntaxConfidence = 30;
    logicConfidence = 10;
    optimizationConfidence = 0;
  } else if (executionResult?.error === "runtime_error") {
    syntaxConfidence = 85;
    logicConfidence = 40;
    optimizationConfidence = 20;
  } else if (executionResult?.error === "timeout") {
    syntaxConfidence = 90;
    logicConfidence = 50;
    optimizationConfidence = 10;
  } else if (verdict === "pass") {
    syntaxConfidence = 98;
    logicConfidence = 95;
    optimizationConfidence = 70;
  } else if (verdict === "fail") {
    syntaxConfidence = 90;
    logicConfidence = 40;
    optimizationConfidence = 30;
  }

  if (codeAnalysis) {
    const highBugs = codeAnalysis.bugs?.filter(b => b.severity === "high") || [];
    const medBugs = codeAnalysis.bugs?.filter(b => b.severity === "medium") || [];
    if (highBugs.length > 0) {
      logicConfidence = Math.max(20, logicConfidence - highBugs.length * 15);
    }
    if (medBugs.length > 0) {
      logicConfidence = Math.max(30, logicConfidence - medBugs.length * 5);
    }

    const hasExponential = codeAnalysis.complexity?.some(c => c.complexity === "O(2^n)");
    if (hasExponential) {
      optimizationConfidence = Math.max(10, optimizationConfidence - 30);
    }
  }

  const linesOfCode = code?.split("\n").length || 0;
  if (linesOfCode < 5) {
    logicConfidence = Math.max(20, logicConfidence - 20);
  }

  const overallConfidence = Math.round(
    syntaxConfidence * 0.3 + logicConfidence * 0.5 + optimizationConfidence * 0.2
  );

  return {
    overall: overallConfidence,
    syntax: syntaxConfidence,
    logic: logicConfidence,
    optimization: optimizationConfidence,
  };
}

function formatConfidence(confidence) {
  if (confidence.overall >= 85) return "High confidence";
  if (confidence.overall >= 60) return "Moderate confidence";
  if (confidence.overall >= 40) return "Some uncertainty";
  return "Low confidence - recommend verifying approach";
}

module.exports = { scoreConfidence, formatConfidence };
