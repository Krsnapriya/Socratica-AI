const { analyzeStudentCode } = require("../codeAnalyzer");
const { compareSolutions } = require("../oracleComparator");
const { getHintLevel, buildHintPrompt } = require("../hintProgression");
const { scoreConfidence, formatConfidence } = require("../confidenceScorer");

const SYSTEM_PROMPTS = {
  compilerError: `You are a world-class computer science professor reviewing a student's compiler error.

Your role:
- Reference the student's ACTUAL code (line numbers, variable names, expressions)
- Explain the error in the context of their specific code
- Never give generic "what is a TypeError" explanations
- Be precise about what went wrong and where
- Guide them to fix it themselves

Rules:
- Reference specific lines and expressions from their code
- Explain WHY the error occurs in their specific context
- Suggest what they should change without writing the code
- Keep response under 4 sentences`,

  runtimeError: `You are a world-class debugger analyzing a student's runtime error.

Your role:
- Identify which line failed and why
- Determine what variable or input caused the error
- Explain the error in context of their code
- Guide them to understand and fix the issue

Rules:
- Reference their actual code
- Explain what the runtime state likely was
- Suggest what they should check
- Never paste corrected code`,

  wrongAnswer: `You are a world-class algorithmic tutor analyzing why a student's solution gives wrong answers.

Your role:
- Analyze their algorithm against the problem requirements
- Identify the logical gap between their approach and correctness
- Reference specific parts of their code that likely cause the issue
- Guide them toward the right approach

CRITICAL RULES:
- NEVER reveal hidden test cases or hidden test inputs
- NEVER say "your code fails test case X"
- Instead say "your approach may not handle [category description]"
- You know which CATEGORIES failed (e.g., "edge cases", "stress tests") but never the actual tests
- Frame failures as algorithmic weaknesses, not test-case-specific problems`,

  correctAnswer: `You are a world-class computer science mentor celebrating a student's success and providing deeper insight.

Your role:
- Congratulate the student
- Compare their approach with the reference solution
- Highlight trade-offs objectively
- Suggest optimizations if any
- Recommend next steps

Rules:
- Be genuinely encouraging
- Present the comparison as two valid approaches, not "correct vs wrong"
- Highlight what the student did well
- Only suggest improvements if they exist
- Keep it educational`,

  hint: `You are Socrates. You are a master of the Socratic method - guiding students through questions rather than giving answers.

Your role:
- Ask questions that lead the student to discover the answer
- Never reveal the solution
- Build on what they already know
- Reference their weak areas gently
- Adapt to their current hint level

Rules:
- Level 1: Ask a conceptual question
- Level 2: Name the approach category
- Level 3: Point to their specific code issue
- Level 4: Provide pseudocode outline
- Level 5: Detailed explanation (still no direct code)

Never break character. Never give the answer directly.`,

  codeReview: `You are a world-class code reviewer at a top tech company.

Your role:
- Review code quality, not correctness
- Identify code smells, anti-patterns, naming issues
- Suggest improvements for readability and maintainability
- Estimate complexity

Rules:
- Be constructive, not harsh
- Prioritize issues by impact
- Use specific examples from their code
- Keep feedback actionable`,

  learningSummary: `You are a learning analytics AI for a computer science education platform.

Your role:
- Summarize what the student accomplished in this session
- Identify their growth areas
- Recommend next topics based on their weak areas
- Provide encouragement

Rules:
- Be specific about what they solved
- Reference their actual submissions
- Don't be generic
- Make recommendations actionable`,

  confidenceLow: `The student's code has low confidence indicators. Be extra careful:
- Acknowledge uncertainty
- Encourage them to verify their approach
- Ask clarifying questions
- Don't present uncertain advice as fact`,
};

function selectAgent(context) {
  const { execution, testResults, codeAnalysis } = context;

  if (execution?.error === "compile_error" || execution?.stderr?.includes("error:")) {
    return "compilerError";
  }

  if (execution?.error === "runtime_error" || execution?.error === "timeout") {
    return "runtimeError";
  }

  if (testResults?.verdict === "pass") {
    return "correctAnswer";
  }

  if (testResults?.verdict === "fail") {
    return "wrongAnswer";
  }

  if (codeAnalysis?.bugs?.some(b => b.severity === "high")) {
    return "runtimeError";
  }

  return "hint";
}

function buildAgentPrompt(agentType, context) {
  const systemPrompt = SYSTEM_PROMPTS[agentType];
  const { problem, submission, student, execution, testResults, hiddenCategories, attemptHistory, weakTopics } = context;

  const failedCategories = hiddenCategories
    .filter(c => c.count > 0)
    .map(c => `- ${c.label} (${c.count} tests): ${c.hint}`)
    .join("\n");

  const attemptSummary = attemptHistory
    .map(a => `Round ${a.round}: ${a.verdict}`)
    .join("\n");

  const highBugs = codeAnalysis?.bugs?.filter(b => b.severity === "high") || [];
  const mediumBugs = codeAnalysis?.bugs?.filter(b => b.severity === "medium") || [];
  const complexityFindings = codeAnalysis?.complexity || [];

  let userContent = `STUDENT CODE:
\`\`\`${submission?.language}
${submission?.code?.slice(0, 3000)}
\`\`\`

PROBLEM:
${problem?.title} (${problem?.difficulty}, ${problem?.category})
${problem?.statement?.slice(0, 800)}

ATTEMPT: ${submission?.currentRound}/${submission?.maxRounds}
`;

  if (attemptSummary) {
    userContent += `\nATTEMPT HISTORY:\n${attemptSummary}\n`;
  }

  if (execution) {
    userContent += `\nEXECUTION RESULT:
Error: ${execution.error || "none"}
Stdout: ${execution.stdout?.slice(0, 500) || "(empty)"}
Stderr: ${execution.stderr?.slice(0, 500) || "(empty)"}
Exit Code: ${execution.exitCode}
Runtime: ${execution.elapsedMs}ms
Memory: ${Math.round(execution.memoryBytes / 1024)}KB\n`;
  }

  if (failedCategories) {
    userContent += `\nFAILED HIDDEN TEST CATEGORIES:\n${failedCategories}\n`;
  }

  if (highBugs.length > 0 || mediumBugs.length > 0) {
    userContent += `\nCODE ANALYSIS:
High-severity issues: ${highBugs.map(b => b.message).join(", ") || "none"}
Medium-severity issues: ${mediumBugs.map(b => b.message).join(", ") || "none"}\n`;
  }

  if (complexityFindings.length > 0) {
    userContent += `\nCOMPLEXITY ANALYSIS:
${complexityFindings.map(c => `- ${c.complexity}: ${c.description}`).join("\n")}\n`;
  }

  if (weakTopics.length > 0) {
    userContent += `\nSTUDENT WEAK AREAS: ${weakTopics.map(w => `${w.topic} (${w.solveRate}%)`).join(", ")}\n`;
  }

  userContent += `\nSTUDENT PROFILE:
Solve rate: ${context.passRate}%
Streak: ${context.streak} days\n`;

  if (agentType === "correctAnswer") {
    const oracleCode = problem?.oracleSolution || "";
    const comparison = compareSolutions(submission?.code, oracleCode, problem?.id, submission?.language);
    userContent += `\nORACLE COMPARISON:
Your approach: ${comparison.student.strategy} (${comparison.student.complexity} time, ${comparison.student.space} space)
Reference approach: ${comparison.oracle.strategy} (${comparison.oracle.complexity} time, ${comparison.oracle.space} space)
${comparison.comparison}\n`;
  }

  if (agentType === "wrongAnswer") {
    userContent += `\nRemember: NEVER reveal hidden test inputs. Reference CATEGORIES only.
Categories that may have failed: ${hiddenCategories?.map(c => c.label).join(", ") || "unknown"}\n`;
  }

  if (agentType === "learningSummary") {
    const recentHistory = attemptHistory?.slice(-10) || [];
    userContent += `\nRECENT SUBMISSIONS:
${recentHistory.map(a => `Round ${a.round}: ${a.verdict} (${a.language})`).join("\n")}

Topics attempted: ${student?.topicStats ? Object.entries(student.topicStats).map(([t, s]) => `${t}: ${s.solved}/${s.attempted}`).join(", ") : "N/A"}
Weak areas: ${weakTopics?.map(w => w.topic).join(", ") || "none identified"}
Strong areas: ${student?.strongTopics?.map(t => t.topic).join(", ") || "none identified"}\n`;
  }

  return { systemPrompt, userContent };
}

function formatAgentResponse(agentType, rawResponse, context) {
  const confidence = scoreConfidence({
    code: context.submission?.code,
    language: context.submission?.language,
    executionResult: context.execution,
    codeAnalysis: context.codeAnalysis,
    verdict: context.testResults?.verdict,
  });

  return {
    agent: agentType,
    response: rawResponse,
    confidence,
    confidenceLabel: formatConfidence(confidence),
    level: agentType === "hint" ? getHintLevel(context) : null,
  };
}

module.exports = {
  SYSTEM_PROMPTS,
  selectAgent,
  buildAgentPrompt,
  formatAgentResponse,
};
