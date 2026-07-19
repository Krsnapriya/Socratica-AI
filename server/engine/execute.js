const { executeInContainer, executeWithOracle, buildStudentCodeWithDriver, runFallback } = require("./sandbox");
const { isCompileError, formatCompileError } = require("../sandbox/compileErrorHandler");
const { analyzeTraces } = require("../tracer/traceAligner");
const { getAIResponse } = require("../ai/orchestrator");
const TestCase = require("../models/TestCase");
const DriverTemplate = require("../models/DriverTemplate");
const Problem = require("../models/Problem");

async function getDriverForProblem(problemId, language) {
  const template = await DriverTemplate.findOne({ problemId, language }).lean();
  if (template) return template;
  return null;
}

async function getTestCasesForProblem(problemId, visibility, language) {
  const filter = { problemId, enabled: true };
  if (visibility) filter.visibility = visibility;
  if (language) {
    filter.$or = [{ language: "all" }, { language }];
  }
  return TestCase.find(filter).sort({ order: 1, createdAt: 1 }).lean();
}

// DB-first driver loading: try DB, then fall back to inline config
async function loadDriver(problemId, language) {
  const dbDriver = await getDriverForProblem(problemId, language);
  if (dbDriver) {
    return { driverCode: dbDriver.driverCode, wrapperType: dbDriver.wrapperType || "function", functionName: dbDriver.functionName };
  }
  const problem = await Problem.findOne({ problemId }).lean();
  if (problem) {
    const inline = problem.driverConfig?.get?.(language) || problem.driverConfig?.[language] || null;
    if (inline) return { ...inline, wrapperType: inline.wrapperType || "function" };
  }
  return null;
}

// Comparison helper: handles empty outputs, whitespace, trailing newlines
function outputsMatch(actual, expected) {
  const a = (actual || "").trim();
  const e = (expected || "").trim();
  if (a === e) return true;
  // Normalize line endings and whitespace for comparison
  const normalize = (s) => s.replace(/\r\n/g, "\n").replace(/\s+$/gm, "").trim();
  return normalize(a) === normalize(e);
}

async function runCode({ code, language, customInput, problemId }) {
  const problem = await Problem.findOne({ problemId }).lean();
  if (!problem) throw new Error("Problem not found");

  const driverConfig = await loadDriver(problemId, language);
  const codeWithDriver = buildStudentCodeWithDriver(code, driverConfig, language);
  const timeLimitMs = problem.executionConfig?.defaultTimeLimitMs || problem.timeLimitMs || 10000;
  const memoryLimitMb = problem.executionConfig?.defaultMemoryLimitMb || problem.memoryLimitMb || 256;

  try {
    const result = await executeInContainer({
      code: codeWithDriver,
      language,
      stdin: customInput || "",
      timeLimitMs,
      memoryLimitMb,
      compileTimeoutMs: problem.executionConfig?.compileTimeoutMs,
    });

    if (isCompileError(result)) {
      const formatted = formatCompileError(result);
      return {
        mode: "run",
        stdout: "",
        stderr: formatted.compileError,
        error: "compile_error",
        elapsed_ms: result.elapsed_ms || 0,
        max_memory_bytes: result.max_memory_bytes || 0,
        exitCode: result.exit_code ?? 1,
        steps: result.steps || 0,
      };
    }

    return {
      mode: "run",
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      error: result.error || null,
      elapsed_ms: result.elapsed_ms || 0,
      max_memory_bytes: result.max_memory_bytes || 0,
      exitCode: result.exit_code ?? null,
      steps: result.steps || 0,
    };
  } catch (err) {
    if (err.message === "system_judge_error") {
      const result = await runFallback({
        code: codeWithDriver,
        language,
        stdin: customInput || "",
        timeLimitMs,
      });
      return {
        mode: "run",
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        error: result.error || null,
        elapsed_ms: result.elapsed_ms || 0,
        max_memory_bytes: result.max_memory_bytes || 0,
        exitCode: null,
        steps: 0,
        fallback: true,
      };
    }
    if (err.message === "container_timeout") {
      return { mode: "run", stdout: "", stderr: "", error: "timeout", elapsed_ms: timeLimitMs, max_memory_bytes: 0, exitCode: null, steps: 0 };
    }
    throw err;
  }
}

async function runSamples({ code, language, problemId }) {
  const problem = await Problem.findOne({ problemId }).lean();
  if (!problem) throw new Error("Problem not found");

  let testCases = await getTestCasesForProblem(problemId, "public", language);
  if (testCases.length === 0) {
    testCases = (problem.testCases || []).map((tc, i) => ({
      ...tc,
      visibility: "public",
      category: "sample",
      order: i,
    }));
  }

  const driverConfig = await loadDriver(problemId, language);
  const codeWithDriver = buildStudentCodeWithDriver(code, driverConfig, language);
  const timeLimitMs = problem.executionConfig?.defaultTimeLimitMs || problem.timeLimitMs || 10000;
  const results = [];
  let useFallback = false;

  for (const tc of testCases) {
    try {
      const result = useFallback
        ? await runFallback({
            code: codeWithDriver,
            language,
            stdin: tc.input,
            timeLimitMs: tc.timeLimitMs || timeLimitMs,
          })
        : await executeInContainer({
            code: codeWithDriver,
            language,
            stdin: tc.input,
            timeLimitMs: tc.timeLimitMs || timeLimitMs,
            memoryLimitMb: tc.memoryLimitMb || problem.memoryLimitMb || 256,
            compileTimeoutMs: problem.executionConfig?.compileTimeoutMs,
          });

      if (!useFallback && isCompileError(result)) {
        const formatted = formatCompileError(result);
        return { mode: "samples", verdict: "compile_error", compileError: formatted.compileError, results: [] };
      }

      const actualOutput = (result.stdout || "").trim();
      const expectedOutput = (tc.expectedOutput || "").trim();
      const passed = outputsMatch(actualOutput, expectedOutput);

      results.push({
        input: tc.input,
        expectedOutput,
        actualOutput,
        passed,
        visible: tc.visibility === "public",
        description: tc.description || "",
        category: tc.category || "sample",
        elapsed_ms: result.elapsed_ms || 0,
        max_memory_bytes: result.max_memory_bytes || 0,
        error: result.error || null,
      });
    } catch (err) {
      if (err.message === "system_judge_error") {
        useFallback = true;
        try {
          const result = await runFallback({
            code: codeWithDriver,
            language,
            stdin: tc.input,
            timeLimitMs: tc.timeLimitMs || timeLimitMs,
          });
          const actualOutput = (result.stdout || "").trim();
          const expectedOutput = (tc.expectedOutput || "").trim();
          const passed = outputsMatch(actualOutput, expectedOutput);
          results.push({
            input: tc.input,
            expectedOutput,
            actualOutput,
            passed,
            visible: tc.visibility === "public",
            description: tc.description || "",
            category: tc.category || "sample",
            elapsed_ms: result.elapsed_ms || 0,
            max_memory_bytes: result.max_memory_bytes || 0,
            error: result.error || null,
          });
        } catch (_) {
          results.push({
            input: tc.input,
            expectedOutput: tc.expectedOutput || "",
            actualOutput: "",
            passed: false,
            visible: tc.visibility === "public",
            description: tc.description || "",
            category: tc.category || "sample",
            elapsed_ms: 0,
            max_memory_bytes: 0,
            error: "fallback_error",
          });
        }
      } else if (err.message === "container_timeout") {
        results.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: "",
          passed: false,
          visible: tc.visibility === "public",
          description: tc.description || "",
          category: tc.category || "sample",
          elapsed_ms: timeLimitMs,
          max_memory_bytes: 0,
          error: "timeout",
        });
      } else {
        throw err;
      }
    }
  }

  const allPassed = results.length > 0 && results.every(r => r.passed);
  return {
    mode: "samples",
    verdict: allPassed ? "pass" : "fail",
    results,
    totalTests: results.length,
    passedTests: results.filter(r => r.passed).length,
  };
}

async function submitSolution({ code, language, problemId, sessionId, userId }) {
  const Submission = require("../models/Submission");
  const Session = require("../models/Session");

  const problem = await Problem.findOne({ problemId }).lean();
  if (!problem) throw new Error("Problem not found");

  const sId = sessionId || require("crypto").randomUUID();
  const latestRound = await Submission.findOne({ sessionId: sId }).sort({ round: -1 }).select("round").lean();
  const roundNum = (latestRound?.round || 0) + 1;
  const maxRounds = problem.maxRounds || 5;
  if (roundNum > maxRounds) {
    return { mode: "submit", verdict: "max_attempts_reached", error: `Max ${maxRounds} attempts reached for this session` };
  }

  await Session.findOneAndUpdate(
    { sessionId: sId },
    { $setOnInsert: { sessionId: sId, userId, problemId, startedAt: new Date() }, $set: { roundCount: 0 } },
    { upsert: true }
  );

  const driverConfig = await loadDriver(problemId, language);
  const codeWithDriver = buildStudentCodeWithDriver(code, driverConfig, language);
  const timeLimitMs = problem.executionConfig?.defaultTimeLimitMs || problem.timeLimitMs || 10000;
  const memoryLimitMb = problem.executionConfig?.defaultMemoryLimitMb || problem.memoryLimitMb || 256;
  const compileTimeoutMs = problem.executionConfig?.compileTimeoutMs;

  // ── Step 1: Run compilation check ────────────────────────────────────────
  let compilationResult;
  try {
    compilationResult = await executeInContainer({
      code: codeWithDriver, language, stdin: "",
      timeLimitMs, memoryLimitMb, compileTimeoutMs,
    });
  } catch (err) {
    if (err.message === "system_judge_error") {
      // Fallback: try local execution
      compilationResult = await runFallback({
        code: codeWithDriver, language, stdin: "", timeLimitMs,
      });
    } else if (err.message === "container_timeout") {
      const sub = await Submission.create({
        userId, problemId, sessionId: sId, code, language, round: roundNum,
        verdict: "timeout", tier: 2,
        tier2Result: { studentTimeMs: 0, oracleTimeMs: 0, studentMemMb: 0, oracleMemMb: 0 },
        executionMode: "submit",
      });
      await Session.updateOne({ sessionId: sId }, { roundCount: roundNum, endedAt: new Date() });
      return { mode: "submit", ...sub.toObject(), sessionId: sId };
    } else {
      throw err;
    }
  }

  // Check for compile errors
  if (isCompileError(compilationResult)) {
    const formatted = formatCompileError(compilationResult);
    const aiResult = await getAIResponse({
      userId, problemId, sessionId: sId, code, language,
      executionResult: { error: "compile_error", stderr: formatted.compileError },
    }).catch(() => null);
    const sub = await Submission.create({
      userId, problemId, sessionId: sId, code, language, round: roundNum,
      verdict: "compile_error", tier: 2,
      tier2Result: { studentTimeMs: 0, oracleTimeMs: 0, studentMemMb: 0, oracleMemMb: 0 },
      hint: aiResult?.response || formatted.compileError,
      hintLevel: aiResult?.level,
      aiAnalysis: aiResult ? { agent: aiResult.agent, confidence: aiResult.confidence, response: aiResult.response } : undefined,
      executionMode: "submit",
    });
    await Session.updateOne({ sessionId: sId }, { roundCount: roundNum, endedAt: new Date() });
    return { mode: "submit", ...sub.toObject(), sessionId: sId };
  }

  // Check for runtime errors on the compilation run
  if (compilationResult.error) {
    const aiResult = await getAIResponse({
      userId, problemId, sessionId: sId, code, language,
      executionResult: {
        stdout: compilationResult.stdout || "",
        stderr: compilationResult.stderr || "",
        error: compilationResult.error,
        exitCode: compilationResult.exit_code,
      },
    }).catch(() => null);

    let verdict = "fail";
    if (compilationResult.error === "timeout") verdict = "timeout";
    else if (compilationResult.error.includes("oom") || compilationResult.error.includes("OutOfMemory")) verdict = "memory_exceeded";

    const sub = await Submission.create({
      userId, problemId, sessionId: sId, code, language, round: roundNum,
      verdict, tier: 2,
      tier2Result: { studentTimeMs: compilationResult.elapsed_ms || 0, oracleTimeMs: 0, studentMemMb: 0, oracleMemMb: 0 },
      hint: aiResult?.response || compilationResult.error,
      hintLevel: aiResult?.level,
      aiAnalysis: aiResult ? { agent: aiResult.agent, confidence: aiResult.confidence, response: aiResult.response } : undefined,
      executionMode: "submit",
    });
    await Session.updateOne({ sessionId: sId }, { roundCount: roundNum, endedAt: new Date() });
    return { mode: "submit", ...sub.toObject(), sessionId: sId };
  }

  // ── Step 2: Run ALL test cases (public + hidden) — test cases = source of truth ──
  const allTestCases = await getTestCasesForProblem(problemId, null, language);
  const testResults = [];
  let useFallback = false;

  // Fallback: if no test cases found in DB, try inline problem.testCases
  let effectiveTestCases = allTestCases;
  if (effectiveTestCases.length === 0) {
    effectiveTestCases = (problem.testCases || []).map((tc, i) => ({
      ...tc,
      visibility: tc.visibility || (i < 2 ? "public" : "hidden"),
      category: tc.category || "sample",
      order: i,
      enabled: tc.enabled !== false,
    }));
    console.warn(`[execute] No DB test cases for ${problemId} — using ${effectiveTestCases.length} inline test cases`);
  }

  if (effectiveTestCases.length === 0) {
    // No test cases at all — treat as system error, not student failure
    console.error(`[execute] No test cases found for ${problemId} in any source`);
    const sub = await Submission.create({
      userId, problemId, sessionId: sId, code, language, round: roundNum,
      verdict: "system_judge_error", tier: 2,
      tier2Result: { studentTimeMs: 0, oracleTimeMs: 0, studentMemMb: 0, oracleMemMb: 0 },
      hint: "No test cases available for this problem. Please contact support.",
      executionMode: "submit",
      testSummary: { totalTests: 0, passedTests: 0, failedCategories: [] },
    });
    await Session.updateOne({ sessionId: sId }, { roundCount: roundNum, endedAt: new Date() });
    return { mode: "submit", ...sub.toObject(), sessionId: sId, testResults: [], totalTests: 0, passedTests: 0, failedCategories: [] };
  }

  for (const tc of effectiveTestCases) {
    try {
      const result = useFallback
        ? await runFallback({ code: codeWithDriver, language, stdin: tc.input, timeLimitMs: tc.timeLimitMs || timeLimitMs })
        : await executeInContainer({
            code: codeWithDriver, language, stdin: tc.input,
            timeLimitMs: tc.timeLimitMs || timeLimitMs,
            memoryLimitMb: tc.memoryLimitMb || memoryLimitMb,
            compileTimeoutMs,
          });

      const actualOutput = (result.stdout || "").trim();
      const expectedOutput = (tc.expectedOutput || "").trim();
      const passed = outputsMatch(actualOutput, expectedOutput);

      testResults.push({
        input: tc.input,
        expectedOutput,
        actualOutput,
        passed,
        visible: tc.visibility === "public",
        description: tc.description || "",
        category: tc.category || "sample",
        elapsed_ms: result.elapsed_ms || 0,
        max_memory_bytes: result.max_memory_bytes || 0,
        error: result.error || null,
      });
    } catch (err) {
      if (err.message === "system_judge_error") {
        useFallback = true;
        try {
          const result = await runFallback({ code: codeWithDriver, language, stdin: tc.input, timeLimitMs: tc.timeLimitMs || timeLimitMs });
          const actualOutput = (result.stdout || "").trim();
          const expectedOutput = (tc.expectedOutput || "").trim();
          testResults.push({
            input: tc.input, expectedOutput, actualOutput,
            passed: outputsMatch(actualOutput, expectedOutput),
            visible: tc.visibility === "public", description: tc.description || "",
            category: tc.category || "sample", elapsed_ms: result.elapsed_ms || 0,
            max_memory_bytes: result.max_memory_bytes || 0, error: result.error || null,
          });
        } catch (_) {
          testResults.push({
            input: tc.input, expectedOutput: tc.expectedOutput || "", actualOutput: "",
            passed: false, visible: tc.visibility === "public", description: tc.description || "",
            category: tc.category || "sample", elapsed_ms: 0, max_memory_bytes: 0, error: "fallback_error",
          });
        }
      } else if (err.message === "container_timeout") {
        testResults.push({
          input: tc.input, expectedOutput: tc.expectedOutput || "", actualOutput: "",
          passed: false, visible: tc.visibility === "public", description: tc.description || "",
          category: tc.category || "sample", elapsed_ms: timeLimitMs, max_memory_bytes: 0, error: "timeout",
        });
      } else {
        throw err;
      }
    }
  }

  // ── Step 3: Determine verdict from test results ──────────────────────────
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const allPassed = totalTests > 0 && passedTests === totalTests;

  const studentTimeMs = compilationResult.elapsed_ms || 0;
  const studentMemMb = Math.round((compilationResult.max_memory_bytes || 0) / (1024 * 1024) * 100) / 100;

  // ── Step 4: Run oracle for differential analysis (teaching, not grading) ──
  let oracleTimeMs = 0;
  let oracleMemMb = 0;
  let oracleOutput = null;

  const oracleCode = problem.oracleSolutions?.[language];
  if (oracleCode) {
    try {
      const oracleResult = await executeInContainer({
        code: oracleCode, language, stdin: "",
        timeLimitMs, memoryLimitMb, compileTimeoutMs,
      }).catch(() => runFallback({ code: oracleCode, language, stdin: "", timeLimitMs }));

      oracleTimeMs = oracleResult.elapsed_ms || 0;
      oracleMemMb = Math.round((oracleResult.max_memory_bytes || 0) / (1024 * 1024) * 100) / 100;
      oracleOutput = {
        stdout: oracleResult.stdout || "",
        stderr: oracleResult.stderr || "",
        exitCode: oracleResult.exit_code,
      };
    } catch (_) {
      // Oracle execution failed — continue without it
    }
  }

  // ── Step 5: Build verdict and AI analysis ────────────────────────────────
  let verdict = allPassed ? "pass" : "fail";
  if (!allPassed && testResults.some(r => r.error === "timeout")) verdict = "timeout";

  let finalTier = allPassed ? 0 : 2;
  let traceLog = undefined;
  let divergenceStep = undefined;
  let aiAnalysisData = undefined;
  let hintContent = undefined;
  let hintLevel = undefined;

  if (verdict === "fail") {
    // Trace analysis for tier determination
    const { summary } = analyzeTraces({
      studentTelemetry: compilationResult, oracleTelemetry: compilationResult, language,
    });
    finalTier = summary.tier;
    if (summary.tier === 1) {
      traceLog = (await require("../tracer/traceAligner").truncateSnapshots(compilationResult.snapshots)) || [];
      divergenceStep = summary.divergenceStep;
    }

    const previousHint = roundNum > 1
      ? (await Submission.findOne({ sessionId: sId, round: roundNum - 1 }).select("hint").lean())?.hint || undefined
      : undefined;

    // Build rich execution result for AI with test failure details
    const failedTests = testResults.filter(r => !r.passed);
    const executionResultForAI = {
      stdout: compilationResult.stdout || "",
      stderr: compilationResult.stderr || "",
      error: compilationResult.error || null,
      exitCode: compilationResult.exit_code,
      elapsedMs: studentTimeMs,
      memoryBytes: compilationResult.max_memory_bytes || 0,
      // Include test results so AI knows exactly what failed
      testResults: testResults.map(r => ({
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput,
        passed: r.passed,
        category: r.category,
        error: r.error,
      })),
      failedTestCount: failedTests.length,
      passedTestCount: passedTests,
      totalTestCount: totalTests,
    };

    const aiResult = await getAIResponse({
      userId, problemId, sessionId: sId, code, language,
      executionResult: executionResultForAI,
      previousHint,
    }).catch(() => null);

    if (aiResult) {
      hintContent = aiResult.response;
      hintLevel = aiResult.level;
      aiAnalysisData = {
        agent: aiResult.agent,
        confidence: aiResult.confidence,
        response: aiResult.response,
      };
    }
  } else if (verdict === "pass") {
    // On pass: celebrate + compare with oracle approach
    const aiResult = await getAIResponse({
      userId, problemId, sessionId: sId, code, language,
      executionResult: {
        stdout: compilationResult.stdout || "",
        error: null,
        testResults: testResults.map(r => ({
          input: r.input, expectedOutput: r.expectedOutput,
          actualOutput: r.actualOutput, passed: r.passed, category: r.category,
        })),
        passedTestCount: passedTests,
        totalTestCount: totalTests,
      },
      explicitAgent: "correctAnswer",
    }).catch(() => null);

    if (aiResult) {
      hintContent = aiResult.response;
      aiAnalysisData = {
        agent: aiResult.agent,
        confidence: aiResult.confidence,
        response: aiResult.response,
        oracleComparison: aiResult.comparison || undefined,
      };
    }
  }

  // ── Step 6: Save submission ───────────────────────────────────────────────
  const sub = await Submission.create({
    userId, problemId, sessionId: sId, code, language, round: roundNum,
    verdict, tier: finalTier, traceLog, divergenceStep,
    tier2Result: { studentTimeMs, oracleTimeMs, studentMemMb, oracleMemMb },
    hint: hintContent,
    hintLevel,
    aiAnalysis: aiAnalysisData,
    executionMode: "submit",
    // Store test results for frontend display
    testSummary: { totalTests, passedTests, failedCategories: getFailedCategories(testResults) },
    oracleOutput,
  });

  const sessionUpdate = { roundCount: roundNum, endedAt: new Date() };
  if (verdict === "pass") sessionUpdate.finalVerdict = "pass";
  else if (roundNum >= maxRounds) sessionUpdate.finalVerdict = "max_attempts_reached";
  await Session.updateOne({ sessionId: sId }, { $set: sessionUpdate });

  // ── Step 7: Return rich response with test results ───────────────────────
  return {
    mode: "submit",
    ...sub.toObject(),
    sessionId: sId,
    // Frontend can display these directly
    testResults: testResults.filter(r => r.visible), // Only show public tests
    totalTests,
    passedTests,
    failedCategories: getFailedCategories(testResults),
  };
}

// Helper: summarize failed test categories for the response
function getFailedCategories(testResults) {
  const categories = {};
  for (const r of testResults) {
    if (!r.passed) {
      const cat = r.category || "unknown";
      if (!categories[cat]) categories[cat] = { failed: 0, total: 0 };
      categories[cat].failed++;
    }
    const cat = r.category || "unknown";
    if (!categories[cat]) categories[cat] = { failed: 0, total: 0 };
    categories[cat].total++;
  }
  return Object.entries(categories)
    .filter(([_, v]) => v.failed > 0)
    .map(([category, v]) => ({ category, failed: v.failed, total: v.total }));
}

module.exports = { runCode, runSamples, submitSolution };
