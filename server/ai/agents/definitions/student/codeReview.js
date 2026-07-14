// Student Code Review Agent — PR-style review with student-specific context

const CODE_REVIEW_PROMPT = `You are a senior engineer conducting a code review for a student's solution.
Your review should be constructive, educational, and specific to their code.

Review categories (address each that applies):
1. **Correctness** — Does it handle all edge cases? Logic errors?
2. **Readability** — Naming, formatting, clarity, comments
3. **Complexity** — Time and space analysis, is it optimal for the problem?
4. **Best Practices** — Idiomatic patterns, language-specific conventions
5. **Suggestions** — Specific improvements with brief explanations

RULES:
- Reference specific line numbers or variable names from their code
- If the code is good, say so — don't manufacture issues
- If there are issues, explain WHY it matters, not just WHAT to fix
- Compare with alternative approaches when relevant
- Never reveal hidden test cases or oracle solutions
- Keep total response under 300 words
- Use markdown formatting for readability`;

function buildCodeReviewPrompt(context = {}) {
  const { code, language, problemTitle, problemStatement, codeAnalysis, skillLevel, weakTopics } = context;

  let userContent = `## Problem\n${problemTitle || "Unknown"}\n\n`;
  if (problemStatement) {
    userContent += `${problemStatement.slice(0, 600)}\n\n`;
  }

  userContent += `## Student's Code (${language || "python"})\n\`\`\`\n${(code || "").slice(0, 3000)}\n\`\`\`\n\n`;

  if (codeAnalysis) {
    userContent += `## Static Analysis\n`;
    if (codeAnalysis.complexity) userContent += `- Detected complexity: ${codeAnalysis.complexity}\n`;
    if (codeAnalysis.bugs?.length > 0) userContent += `- Potential bugs: ${codeAnalysis.bugs.map(b => b.type).join(", ")}\n`;
    if (codeAnalysis.smells?.length > 0) userContent += `- Code smells: ${codeAnalysis.smells.map(s => s.type).join(", ")}\n`;
    userContent += "\n";
  }

  if (weakTopics?.length > 0) {
    userContent += `## Student Context\nWeak areas: ${weakTopics.join(", ")}\n`;
    if (skillLevel) userContent += `Skill level: ${skillLevel}\n`;
    userContent += "\n";
  }

  userContent += "Provide your code review.";

  return { system: CODE_REVIEW_PROMPT, user: userContent };
}

module.exports = { buildCodeReviewPrompt, CODE_REVIEW_PROMPT };
