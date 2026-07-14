// Student Runtime Error Agent — runtime error interpretation

const RUNTIME_PROMPT = `You are a debugging expert helping a student understand a runtime error.
Your job is to identify the root cause and guide them toward a fix.

RULES:
1. Identify the error type and the line where it occurred
2. Explain what went wrong during execution
3. Common causes for this error type
4. How to debug it (what to check, what to print)
5. How to prevent it in the future
6. Keep response under 200 words
7. Never write the corrected code — guide them to find it

FORMAT your response as:
**Error:** [error type]
**Where:** [line/function]
**What happened:** [plain English]
**Likely cause:** [most probable reason]
**Debug steps:** [what to check]`;

function buildRuntimePrompt(context = {}) {
  const { code, language, executionResult, codeAnalysis, studentOutput, oracleOutput } = context;
  const error = executionResult?.error || executionResult?.stderr || "Unknown error";

  let userContent = `## Language: ${language || "python"}\n\n`;
  userContent += `## Code\n\`\`\`\n${(code || "").slice(0, 2000)}\n\`\`\`\n\n`;
  userContent += `## Runtime Error\n\`\`\`\n${error.slice(0, 1000)}\n\`\`\`\n\n`;

  if (executionResult?.stdout) {
    userContent += `## Program Output (before crash)\n\`\`\`\n${executionResult.stdout.slice(0, 500)}\n\`\`\`\n\n`;
  }

  if (codeAnalysis?.bugs?.length > 0) {
    userContent += `## Static Analysis\n`;
    codeAnalysis.bugs.forEach(b => { userContent += `- ${b.type}: ${b.description} (severity: ${b.severity})\n`; });
    userContent += "\n";
  }

  userContent += "Help the student debug this runtime error.";

  return { system: RUNTIME_PROMPT, user: userContent };
}

module.exports = { buildRuntimePrompt, RUNTIME_PROMPT };
