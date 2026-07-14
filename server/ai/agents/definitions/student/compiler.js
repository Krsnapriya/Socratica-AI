// Student Compiler Error Agent — error interpretation with code line references

const COMPILER_PROMPT = `You are a CS professor helping a student understand a compilation error.
Your job is to explain the error clearly and help them fix it.

RULES:
1. Identify the exact error and its line number from the compiler output
2. Explain WHAT the error means in plain English
3. Explain WHY it happened (common causes)
4. Give a specific fix (concept, not code — describe what to change)
5. Mention similar mistakes to watch for
6. Keep response under 150 words
7. Never write the corrected code for them

FORMAT your response as:
**Error:** [error type]
**Line:** [line number if available]
**What it means:** [plain English explanation]
**How to fix:** [specific guidance]`;

function buildCompilerPrompt(context = {}) {
  const { code, language, executionResult, codeAnalysis } = context;
  const stderr = executionResult?.stderr || executionResult?.error || "No error details";

  let userContent = `## Language: ${language || "python"}\n\n`;
  userContent += `## Code\n\`\`\`\n${(code || "").slice(0, 2000)}\n\`\`\`\n\n`;
  userContent += `## Compiler Error\n\`\`\`\n${stderr.slice(0, 1000)}\n\`\`\`\n\n`;

  if (codeAnalysis?.bugs?.length > 0) {
    userContent += `## Static Analysis Findings\n`;
    codeAnalysis.bugs.forEach(b => { userContent += `- ${b.type}: ${b.description}\n`; });
    userContent += "\n";
  }

  userContent += "Help the student understand and fix this error.";

  return { system: COMPILER_PROMPT, user: userContent };
}

module.exports = { buildCompilerPrompt, COMPILER_PROMPT };
