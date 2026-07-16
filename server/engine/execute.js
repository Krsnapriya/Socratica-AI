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

async function runCode({ code, language, customInput, problemId }) {
  const problem = await Problem.findOne({ problemId }).lean();
  if (!problem) throw new Error("Problem not found");

  const driverConfig = problem.driverConfig?.get?.(language) || problem.driverConfig?.[language] || null;
  const codeWithDriver = buildStudentCodeWithDriver(code, driverConfig, language);

  try {
    const result = await executeInContainer({
      code: codeWithDriver,
      language,
      stdin: customInput || "",
      timeLimitMs: problem.executionConfig?.defaultTimeLimitMs || problem.timeLimitMs,
      memoryLimitMb: problem.executionConfig?.defaultMemoryLimitMb || problem.memoryLimitMb,
      compileTimeoutMs: problem.executionConfig?.compileTimeoutMs,
    });

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
      // Docker unavailable — fallback to local execution
      const result = await runFallback({
        code: codeWithDriver,
        language,
        stdin: customInput || "",
        timeLimitMs: problem.executionConfig?.defaultTimeLimitMs || problem.timeLimitMs,
      });
      return {
        mode: "run",
        stdout: result.stdout || "",
        stderr: "",
        error: result.error || null,
        elapsed_ms: result.elapsed_ms || 0,
        max_memory_bytes: result.max_memory_bytes || 0,
        exitCode: null,
        steps: 0,
        fallback: true,
      };
    }
    if (err.message === "container_timeout") {
      return { mode: "run", stdout: "", stderr: "", error: "timeout", elapsed_ms: 0, max_memory_bytes: 0, exitCode: null, steps: 0 };
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

  const driverConfig = problem.driverConfig?.get?.(language) || problem.driverConfig?.[language] || null;
  const codeWithDriver = buildStudentCodeWithDriver(code, driverConfig, language);
  const results = [];
  let useFallback = false;

  for (const tc of testCases) {
    try {
      const result = useFallback
        ? await runFallback({
            code: codeWithDriver,
            language,
            stdin: tc.input,
            timeLimitMs: tc.timeLimitMs || problem.timeLimitMs,
          })
        : await executeInContainer({
            code: codeWithDriver,
            language,
            stdin: tc.input,
            timeLimitMs: tc.timeLimitMs || problem.timeLimitMs,
            memoryLimitMb: tc.memoryLimitMb || problem.memoryLimitMb,
            compileTimeoutMs: problem.executionConfig?.compileTimeoutMs,
          });

      if (!useFallback && isCompileError(result)) {
        const formatted = formatCompileError(result);
        return { mode: "samples", verdict: "compile_error", compileError: formatted.compileError, results: [] };
      }

      const actualOutput = (result.stdout || "").trim();
      const expectedOutput = (tc.expectedOutput || "").trim();
      const passed = actualOutput === expectedOutput && actualOutput !== "";

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
        // Docker unavailable — switch to fallback for remaining tests
        useFallback = true;
        // Re-run this test case with fallback
        try {
          const result = await runFallback({
            code: codeWithDriver,
            language,
            stdin: tc.input,
            timeLimitMs: tc.timeLimitMs || problem.timeLimitMs,
          });
          const actualOutput = (result.stdout || "").trim();
          const expectedOutput = (tc.expectedOutput || "").trim();
          const passed = actualOutput === expectedOutput && actualOutput !== "";
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
          elapsed_ms: 0,
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

  const oracleCode = problem.oracleSolutions?.[language];
  if (!oracleCode) throw new Error(`No oracle solution found for ${language}`);

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

  const driverConfig = problem.driverConfig?.get?.(language) || problem.driverConfig?.[language] || null;
  const codeWithDriver = buildStudentCodeWithDriver(code, driverConfig, language);

  let runResult;
  let useFallback = false;
  try {
    runResult = await executeWithOracle({
      studentCode: codeWithDriver,
      oracleCode,
      language,
      timeLimitMs: problem.executionConfig?.defaultTimeLimitMs || problem.timeLimitMs,
      memoryLimitMb: problem.executionConfig?.defaultMemoryLimitMb || problem.memoryLimitMb,
      compileTimeoutMs: problem.executionConfig?.compileTimeoutMs,
    });
  } catch (err) {
    if (err.message === "system_judge_error") {
      // Docker unavailable — fallback: run both student and oracle separately
      useFallback = true;
      const [studentResult, oracleResult] = await Promise.all([
        runFallback({ code: codeWithDriver, language, timeLimitMs: problem.executionConfig?.defaultTimeLimitMs || problem.timeLimitMs }),
        runFallback({ code: oracleCode, language, timeLimitMs: problem.executionConfig?.defaultTimeLimitMs || problem.timeLimitMs }),
      ]);
      runResult = { student: studentResult, oracle: oracleResult };
    } else if (err.message === "container_timeout") {
      const sub = await Submission.create({
        userId, problemId, sessionId: sId, code, language, round: roundNum,
        verdict: "timeout", tier: 2,
        tier2Result: { studentTimeMs: 0, oracleTimeMs: 0, studentMemMb: 0, oracleMemMb: 0 },
      });
      await Session.updateOne({ sessionId: sId }, { roundCount: roundNum, endedAt: new Date() });
      return { mode: "submit", ...sub.toObject(), sessionId: sId };
    }
    if (err.message === "system_judge_error") {
      const sub = await Submission.create({
        userId, problemId, sessionId: sId, code, language, round: roundNum,
        verdict: "system_judge_error", tier: 2,
        tier2Result: { studentTimeMs: 0, oracleTimeMs: 0, studentMemMb: 0, oracleMemMb: 0 },
        hint: "The sandbox encountered an infrastructure failure. Please retry.",
      });
      await Session.updateOne({ sessionId: sId }, { roundCount: roundNum, endedAt: new Date() });
      return { mode: "submit", ...sub.toObject(), sessionId: sId };
    }
    throw err;
  }

  const student = runResult.student || {};
  const oracle = runResult.oracle || {};

  if (isCompileError(student)) {
    const formatted = formatCompileError(student);
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

  let verdict = "fail";
  if (student.error) {
    if (student.error === "timeout") verdict = "timeout";
    else if (student.error.includes("oom") || student.error.includes("OutOfMemory")) verdict = "memory_exceeded";
    else verdict = "fail";
  } else {
    const sOut = (student.stdout || "").trim();
    const oOut = (oracle.stdout || "").trim();
    if (sOut === oOut && sOut !== "") verdict = "pass";
  }

  const studentTimeMs = student.elapsed_ms || 0;
  const oracleTimeMs = oracle.elapsed_ms || 0;
  const studentMemMb = Math.round((student.max_memory_bytes || 0) / (1024 * 1024) * 100) / 100;
  const oracleMemMb = Math.round((oracle.max_memory_bytes || 0) / (1024 * 1024) * 100) / 100;

  let finalTier = 2;
  let traceLog = undefined;
  let divergenceStep = undefined;

  let aiAnalysisData = undefined;
  let hintContent = undefined;
  let hintLevel = undefined;

  if (verdict === "fail") {
    const { summary } = analyzeTraces({ studentTelemetry: student, oracleTelemetry: oracle, language });
    finalTier = summary.tier;
    if (summary.tier === 1) {
      traceLog = (await require("../tracer/traceAligner").truncateSnapshots(student.snapshots)) || [];
      divergenceStep = summary.divergenceStep;
    }

    const previousHint = roundNum > 1
      ? (await Submission.findOne({ sessionId: sId, round: roundNum - 1 }).select("hint").lean())?.hint || undefined
      : undefined;

    const executionResultForAI = {
      stdout: student.stdout || "",
      stderr: student.stderr || "",
      error: student.error || null,
      exitCode: student.exit_code,
      elapsedMs: studentTimeMs,
      memoryBytes: student.max_memory_bytes || 0,
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
    const aiResult = await getAIResponse({
      userId, problemId, sessionId: sId, code, language,
      executionResult: { stdout: student.stdout || "", error: null },
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

  const sub = await Submission.create({
    userId, problemId, sessionId: sId, code, language, round: roundNum,
    verdict, tier: finalTier, traceLog, divergenceStep,
    tier2Result: { studentTimeMs, oracleTimeMs, studentMemMb, oracleMemMb },
    hint: hintContent,
    hintLevel,
    aiAnalysis: aiAnalysisData,
    executionMode: "submit",
  });

  const sessionUpdate = { roundCount: roundNum, endedAt: new Date() };
  if (verdict === "pass") sessionUpdate.finalVerdict = "pass";
  else if (roundNum >= maxRounds) sessionUpdate.finalVerdict = "max_attempts_reached";
  await Session.updateOne({ sessionId: sId }, { $set: sessionUpdate });

  return { mode: "submit", ...sub.toObject(), sessionId: sId };
}

module.exports = { runCode, runSamples, submitSolution };
