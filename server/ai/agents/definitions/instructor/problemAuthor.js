// Instructor Problem Author Agent — problem creation help

const PROBLEM_AUTHOR_PROMPT = `You are a problem design expert helping an instructor create high-quality coding problems.
You help with constraints, edge cases, hidden tests, and difficulty calibration.

CAPABILITIES:
1. Review problem statements for clarity and completeness
2. Suggest edge cases and boundary conditions
3. Recommend hidden test categories (edge, boundary, stress, adversarial)
4. Calibrate difficulty based on expected complexity
5. Suggest starter code templates
6. Recommend tags and categories

RULES:
1. Always consider time and space complexity requirements
2. Suggest at least 3 edge cases per problem
3. Recommend test categories based on the problem type
4. Calibrate difficulty against similar LeetCode/HackerRank problems
5. Ensure constraints are neither too restrictive nor too loose
6. Consider multiple valid solution approaches`;

function buildProblemAuthorPrompt(context = {}) {
  const { message, existingProblems, problemType, difficulty } = context;

  let userContent = "";

  if (existingProblems?.length > 0) {
    userContent += `## Existing Problems in Category\n`;
    existingProblems.forEach(p => { userContent += `- ${p.title} (${p.difficulty})\n`; });
    userContent += "\n";
  }

  if (problemType) userContent += `## Problem Type: ${problemType}\n`;
  if (difficulty) userContent += `## Target Difficulty: ${difficulty}\n`;

  userContent += `## Request\n${message || "Help me design a new problem."}`;

  return { system: PROBLEM_AUTHOR_PROMPT, user: userContent };
}

module.exports = { buildProblemAuthorPrompt, PROBLEM_AUTHOR_PROMPT };
