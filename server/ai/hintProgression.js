const HINT_LEVELS = [
  {
    level: 1,
    name: "Conceptual Nudge",
    description: "High-level direction without revealing approach",
    prompt: "Provide a brief conceptual nudge (1-2 sentences) that points the student toward the right idea without naming the algorithm or approach. Think Socrates: ask a question that makes them think.",
  },
  {
    level: 2,
    name: "Algorithm Direction",
    description: "Name the approach or category",
    prompt: "Name the algorithmic category or general approach that would solve this (e.g., 'hash-based lookup', 'divide and conquer', 'dynamic programming'). Explain WHY this category fits in 2-3 sentences. Do NOT provide code.",
  },
  {
    level: 3,
    name: "Specific Guidance",
    description: "Point to the specific area of their code",
    prompt: "Identify the specific part of the student's code that needs to change and explain what they should do differently. Reference line numbers or variable names. Do NOT write code for them.",
  },
  {
    level: 4,
    name: "Pseudocode Hint",
    description: "Provide pseudocode or logic outline",
    prompt: "Provide a brief pseudocode outline or logic description of the correct approach. Use natural language, not actual code. Format it as numbered steps.",
  },
  {
    level: 5,
    name: "Detailed Explanation",
    description: "Full explanation with near-solution",
    prompt: "Provide a detailed explanation of the solution approach, including the algorithm steps, key data structures, and edge cases to handle. You may reference the reference solution's approach but still do not paste their exact code.",
  },
];

function getHintLevel(context) {
  const { attemptHistory, currentRound } = context;
  if (!attemptHistory || attemptHistory.length === 0) return 1;

  const consecutiveWrong = attemptHistory.filter(a => a.verdict !== "pass").length;
  const level = Math.min(5, Math.max(1, consecutiveWrong + 1));
  return level;
}

function buildHintPrompt(context, level) {
  const hintConfig = HINT_LEVELS[Math.min(level, 5) - 1];
  const { problem, submission, student, execution, hiddenCategories, weakTopics, attemptHistory } = context;

  const failedCategories = hiddenCategories
    .filter(c => c.count > 0)
    .map(c => `- ${c.label}: ${c.hint}`)
    .join("\n");

  const attemptSummary = attemptHistory
    .map(a => `Round ${a.round}: ${a.verdict}${a.hint ? ` (hint was given)` : ""}`)
    .join("\n");

  const weakTopicsList = weakTopics.length > 0
    ? `Student's weak areas: ${weakTopics.map(w => `${w.topic} (${w.solveRate}% solve rate)`).join(", ")}`
    : "";

  const previousHints = attemptHistory
    .filter(a => a.hint)
    .map(a => `Previous hint: ${a.hint}`)
    .join("\n");

  return {
    systemPrompt: hintConfig.prompt,
    userContent: `STUDENT CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Problem: ${problem?.title} (${problem?.difficulty})
Category: ${problem?.category}
Statement: ${problem?.statement?.slice(0, 500)}

Student's Code (${submission?.language}):
\`\`\`${submission?.language}
${submission?.code?.slice(0, 2000)}
\`\`\`

Current Attempt: ${submission?.currentRound} of ${submission?.maxRounds}
Previous Attempts: ${attemptSummary || "None yet"}

${failedCategories ? `Hidden Test Categories That May Have Failed:\n${failedCategories}` : ""}

${weakTopicsList ? `\nStudent's Weak Areas:\n${weakTopicsList}` : ""}

${previousHints ? `\nPreviously Given Hints:\n${previousHints}` : ""}

${execution?.error ? `\nExecution Error: ${execution.error}` : ""}
${execution?.stderr ? `\nStderr: ${execution.stderr?.slice(0, 300)}` : ""}

Student Profile:
- Solve rate: ${context.passRate}%
- Streak: ${context.streak} days
- Topics strong: ${context.strongTopics?.map(t => t.topic).join(", ") || "N/A"}
- Topics weak: ${context.weakTopics?.map(t => t.topic).join(", ") || "N/A"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK: Provide Hint Level ${level} (${hintConfig.name}).
${hintConfig.prompt}

Keep it under 3 sentences. Do NOT reveal hidden test cases or the oracle solution. Do NOT write code.`,
  };
}

module.exports = { HINT_LEVELS, getHintLevel, buildHintPrompt };
