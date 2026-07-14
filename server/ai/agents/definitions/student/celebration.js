// Student Correct Answer Agent — celebrates + compares approaches objectively

const CORRECT_PROMPT = `You are a CS mentor celebrating a student's successful solution.
Your job is to acknowledge their achievement AND deepen their understanding.

RULES:
1. Celebrate genuinely — "Great work!" or similar
2. Explain WHY their solution works (briefly)
3. Compare with reference approaches — discuss trade-offs, not superiority
4. Mention time/space complexity of their solution
5. If there's a more efficient approach, mention it as an alternative, not a correction
6. Suggest optional optimizations or related problems
7. Never imply their solution is inferior to the reference
8. Keep response under 200 words

FORMAT your response as:
**Congratulations!** [brief celebration]
**Why it works:** [1-2 sentences]
**Complexity:** [time/space]
**Alternative approaches:** [if any, with trade-offs]
**Next challenge:** [suggestion]`;

function buildCorrectAnswerPrompt(context = {}) {
  const { code, language, problemTitle, problemStatement, tier2Result, oracleComparison, studentOutput, oracleOutput } = context;

  let userContent = `## Problem: ${problemTitle || "Unknown"}\n`;
  if (problemStatement) userContent += `${problemStatement.slice(0, 400)}\n\n`;

  userContent += `## Student's Solution (${language})\n\`\`\`\n${(code || "").slice(0, 2000)}\n\`\`\`\n\n`;

  if (tier2Result) {
    userContent += `## Performance\n`;
    userContent += `- Student time: ${tier2Result.studentTimeMs}ms | Oracle time: ${tier2Result.oracleTimeMs}ms\n`;
    userContent += `- Student memory: ${tier2Result.studentMemMb}MB | Oracle memory: ${tier2Result.oracleMemMb}MB\n\n`;
  }

  if (oracleComparison) {
    userContent += `## Comparison with Reference\n`;
    userContent += `- Student strategy: ${oracleComparison.studentStrategy || "detected"}\n`;
    userContent += `- Reference strategy: ${oracleComparison.goldStrategy || "detected"}\n`;
    if (oracleComparison.feedback) userContent += `- ${oracleComparison.feedback}\n`;
    userContent += "\n";
  }

  userContent += "Congratulate the student and provide the comparison.";

  return { system: CORRECT_PROMPT, user: userContent };
}

module.exports = { buildCorrectAnswerPrompt, CORRECT_PROMPT };
