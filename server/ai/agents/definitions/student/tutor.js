// Student Tutor Agent — concept explanation, analogies, prerequisites
// Now includes full problem context, student code, and execution results

const TUTOR_PROMPTS = {
  beginner: `You are a patient, encouraging CS tutor working with a BEGINNER student.
- Use simple language and real-world analogies
- Break concepts into small, digestible pieces
- Relate new topics to things they already know
- Celebrate small wins and progress
- Never use jargon without defining it first
- Use step-by-step explanations
- Maximum 3 sentences per concept unless they ask for more
- When the student shares code, explain what each part does line by line
- If they have errors, explain the error in plain language before suggesting fixes`,

  intermediate: `You are a knowledgeable CS tutor working with an INTERMEDIATE student.
- Balance technical accuracy with clarity
- Discuss algorithm trade-offs (time/space complexity)
- Reference patterns they've already learned
- Point to specific lines of code when relevant
- Encourage them to think about edge cases
- Use standard CS terminology
- When reviewing their code, reference specific lines and explain the reasoning
- If test cases fail, help them trace through the logic to find the issue`,

  advanced: `You are a senior CS mentor working with an ADVANCED student.
- Be concise and technically precise
- Focus on algorithmic efficiency and code quality
- Discuss alternative approaches and their trade-offs
- Reference established patterns and libraries
- Challenge them with follow-up questions
- No need to explain basic concepts
- When reviewing code, focus on correctness, edge cases, and optimization opportunities
- If tests fail, focus on the algorithmic root cause, not syntax`,
};

function buildTutorPrompt(context = {}) {
  const {
    skillLevel = "intermediate",
    message,
    weakTopics = [],
    strongTopics = [],
    topic,
    conversationHistory = [],
    problem,
    submission,
    execution,
    testResults,
    hiddenTestInfo,
    student,
    curriculum,
  } = context;

  // Use actual skill level from student profile if available
  const effectiveSkill = student?.skillLevel || skillLevel;
  const system = TUTOR_PROMPTS[effectiveSkill] || TUTOR_PROMPTS.intermediate;

  let userContent = "";

  // If code passes all tests, tell the tutor explicitly
  if (execution?.verdict === "pass" || execution?.allTestsPassed) {
    userContent += `**IMPORTANT: The student's code PASSES all ${execution.totalTestCount || "?"} test cases.** `;
    userContent += `Do NOT suggest their code is wrong or incomplete. `;
    userContent += `If they ask "is this correct?", confirm it is correct and discuss the approach.\n\n`;
  }

  // ── Curriculum Context ──────────────────────────────────────────────────
  if (curriculum) {
    if (curriculum.course) {
      userContent += `## Course: ${curriculum.course.title}\n`;
    }
    if (curriculum.module) {
      userContent += `**Module:** ${curriculum.module.title}`;
      if (curriculum.module.currentTopic) userContent += ` — Topic: ${curriculum.module.currentTopic}`;
      userContent += `\n`;
      if (curriculum.module.prerequisites?.length > 0) {
        userContent += `**Prerequisites:** ${curriculum.module.prerequisites.map(p => p.title).join(", ")}\n`;
      }
    }
    if (curriculum.knowledgeGraph?.prerequisites?.length > 0) {
      userContent += `**Concept Prerequisites:** ${curriculum.knowledgeGraph.prerequisites.map(p => `${p.name} (${p.category})`).join(", ")}\n`;
    }
    if (curriculum.referenceSolutions?.length > 0) {
      userContent += `**Available reference approaches:** ${curriculum.referenceSolutions.map(r => `${r.algorithm || r.variant} (${r.timeComplexity || "unknown"})`).join("; ")}\n`;
    }
    userContent += `\n`;
  }

  // ── Problem Context ──────────────────────────────────────────────────────
  if (problem) {
    userContent += `## Current Problem\n`;
    userContent += `**${problem.title}** (${problem.difficulty || "unknown"}, ${problem.category || "unknown"})\n`;
    userContent += `${problem.statement || problem.description || "No description available."}\n`;
    if (problem.tags?.length > 0) {
      userContent += `Tags: ${problem.tags.join(", ")}\n`;
    }
    userContent += `\n`;
  }

  // ── Student's Code ───────────────────────────────────────────────────────
  if (submission?.code) {
    userContent += `## Student's Code (${submission.language || "unknown"})\n`;
    userContent += `\`\`\`${submission.language || ""}\n${submission.code}\n\`\`\`\n\n`;
  }

  // ── Execution Results ────────────────────────────────────────────────────
  if (execution) {
    userContent += `## Execution Results\n`;
    if (execution.error) {
      userContent += `Error: ${execution.error}\n`;
    }
    if (execution.stderr) {
      userContent += `Stderr: ${execution.stderr.slice(0, 500)}\n`;
    }
    if (execution.stdout) {
      userContent += `Stdout: \`${execution.stdout.slice(0, 300)}\`\n`;
    }
    if (execution.elapsedMs > 0) {
      userContent += `Runtime: ${execution.elapsedMs}ms\n`;
    }
    userContent += `\n`;
  }

  // ── Test Results ─────────────────────────────────────────────────────────
  if (testResults?.results?.length > 0) {
    const passed = testResults.results.filter(r => r.passed).length;
    const total = testResults.results.length;
    userContent += `## Test Results (${passed}/${total} passed)\n`;
    const failures = testResults.results.filter(r => !r.passed).slice(0, 3);
    for (const fail of failures) {
      userContent += `- Input: \`${fail.input || "(stdin)"}\` → Expected: \`${fail.expectedOutput}\` → Got: \`${fail.actualOutput || fail.error || "(no output)"}\`\n`;
    }
    userContent += `\n`;
  }

  // ── Hidden Test Categories (sanitized) ───────────────────────────────────
  if (hiddenTestInfo?.failedCategories?.length > 0) {
    const totalFailed = hiddenTestInfo.failedCategories.reduce((sum, c) => sum + (c.count || 0), 0);
    if (totalFailed > 0) {
      userContent += `## Hidden Test Hint\n`;
      userContent += `${totalFailed} hidden test(s) still failing. ${hiddenTestInfo.generalHint || ""}\n\n`;
    }
  }

  // ── Attempt History ──────────────────────────────────────────────────────
  if (submission?.attemptHistory?.length > 0) {
    userContent += `## Previous Attempts (${submission.attemptHistory.length}/${submission.maxRounds || 5})\n`;
    for (const attempt of submission.attemptHistory.slice(-3)) {
      userContent += `- Round ${attempt.round || "?"}: ${attempt.verdict || "unknown"}${attempt.hint ? ` (hint given)` : ""}\n`;
    }
    userContent += `\n`;
  }

  // ── Conversation History ─────────────────────────────────────────────────
  if (conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join("\n");
    userContent += `## Previous Conversation\n${recent}\n\n`;
  }

  // ── Student Profile ──────────────────────────────────────────────────────
  if (weakTopics.length > 0) {
    userContent += `Weak areas: ${weakTopics.join(", ")}\n`;
  }
  if (strongTopics.length > 0) {
    userContent += `Strong areas: ${strongTopics.join(", ")}\n`;
  }
  if (student?.passRate > 0) {
    userContent += `Overall pass rate: ${student.passRate}%\n`;
  }
  if (student?.streak > 0) {
    userContent += `Study streak: ${student.streak} days\n`;
  }

  // ── Student's Message ────────────────────────────────────────────────────
  userContent += `\n## Student's Question\n${message || "Help me understand this problem."}`;

  return { system, user: userContent };
}

module.exports = { buildTutorPrompt, TUTOR_PROMPTS };
