// Student Hint Agent — 5-level Socratic hints

const HINT_LEVELS = [
  { level: 1, name: "Conceptual Nudge", description: "1-2 sentence conceptual question" },
  { level: 2, name: "Algorithm Direction", description: "Names the algorithmic category" },
  { level: 3, name: "Specific Guidance", description: "Points to specific code area" },
  { level: 4, name: "Pseudocode Hint", description: "Numbered pseudocode steps" },
  { level: 5, name: "Detailed Explanation", description: "Full explanation, near-solution (no code)" },
];

const HINT_PROMPTS = {
  1: `You are Socrates — a master of the Socratic method. Give a level 1 hint.
RULES:
- Ask ONE conceptual question that makes them think about the problem
- Do NOT name any algorithm or technique
- Do NOT describe any approach
- Keep it to 1-2 sentences
- The question should guide them to discover the key insight`,

  2: `You are Socrates — a master of the Socratic method. Give a level 2 hint.
RULES:
- Name the general algorithmic CATEGORY (e.g., "hashing", "two pointers", "binary search")
- Do NOT give specific implementation details
- Explain WHY this category applies to the problem
- Keep it to 2-3 sentences`,

  3: `You are Socrates — a master of the Socratic method. Give a level 3 hint.
RULES:
- Point to a specific part of their code or approach
- Explain what that part should do differently
- Give directional guidance, not full pseudocode
- Keep it to 3-4 sentences`,

  4: `You are Socrates — a master of the Socratic method. Give a level 4 hint.
RULES:
- Provide numbered pseudocode steps (4-6 steps)
- Each step should be 1 sentence
- Do NOT write actual code
- The pseudocode should be clear enough to implement from
- Focus on the core algorithm, not edge cases`,

  5: `You are Socrates — a master of the Socratic method. Give a level 5 hint.
RULES:
- Provide a detailed explanation of the complete approach
- Explain time and space complexity
- Discuss edge cases to handle
- Do NOT write the solution code
- This should be detailed enough that they can implement it themselves
- Keep it under 300 words`,
};

function getHintLevel(context) {
  const { attemptHistory = [], currentRound = 1 } = context;
  let consecutiveWrong = 0;
  for (let i = attemptHistory.length - 1; i >= 0; i--) {
    if (attemptHistory[i].verdict !== "pass") consecutiveWrong++;
    else break;
  }
  return Math.min(5, consecutiveWrong + 1);
}

function buildHintPrompt(context = {}) {
  const { code, language, problemTitle, problemStatement, attemptHistory, weakTopics, hiddenCategories,
          codeAnalysis, executionResult, hintLevel: forcedLevel, previousHint, curriculum, problem } = context;

  const level = forcedLevel || getHintLevel(context);
  const system = HINT_PROMPTS[level] || HINT_PROMPTS[1];

  let userContent = `## Problem: ${problemTitle || problem?.title || "Unknown"}\n`;
  if (problemStatement || problem?.statement) userContent += `${(problemStatement || problem?.statement || "").slice(0, 800)}\n\n`;

  if (code) {
    userContent += `## Student's Current Code (${language})\n\`\`\`\n${code.slice(0, 2500)}\n\`\`\`\n\n`;
  }

  if (executionResult?.stdout) {
    userContent += `## Output\n\`\`\`\n${executionResult.stdout.slice(0, 300)}\n\`\`\`\n\n`;
  }

  if (hiddenCategories?.length > 0) {
    userContent += `## Failed Test Categories\n`;
    hiddenCategories.forEach(c => { userContent += `- ${c.category || "unknown"}: ${c.hint}\n`; });
    userContent += "\n";
  }

  if (attemptHistory?.length > 0) {
    userContent += `## Previous Attempts: ${attemptHistory.length}\n`;
    attemptHistory.slice(-2).forEach(a => {
      userContent += `- Round ${a.round}: ${a.verdict}\n`;
    });
    userContent += "\n";
  }

  if (previousHint) {
    userContent += `## Previous Hint (DO NOT REPEAT)\n${previousHint}\n\n`;
  }

  if (weakTopics?.length > 0) {
    userContent += `## Student Weak Areas: ${weakTopics.map(t => t.topic || t).join(", ")}\n\n`;
  }

  if (codeAnalysis?.bugs?.length > 0) {
    userContent += `## Code Bugs Found\n`;
    codeAnalysis.bugs.forEach(b => { userContent += `- ${b.type}: ${b.description}\n`; });
    userContent += "\n";
  }

  // Curriculum context for prerequisite-aware hints
  if (curriculum?.knowledgeGraph?.prerequisites?.length > 0) {
    userContent += `## Concept Context\n`;
    userContent += `This problem uses ${curriculum.knowledgeGraph.currentTopic || "unknown"}. Key prerequisites: ${curriculum.knowledgeGraph.prerequisites.map(p => p.name).join(", ")}\n\n`;
  }

  userContent += `Provide a LEVEL ${level} hint. Hint level: ${level}/5 (${HINT_LEVELS[level - 1]?.name}).`;

  return { system, user: userContent, level };
}

module.exports = { buildHintPrompt, getHintLevel, HINT_LEVELS };
