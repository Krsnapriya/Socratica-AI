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
8. Connect to the broader topic and suggest what to learn next
9. Keep response under 200 words

FORMAT your response as:
**Congratulations!** [brief celebration]
**Why it works:** [1-2 sentences]
**Complexity:** [time/space]
**Alternative approaches:** [if any, with trade-offs]
**Next challenge:** [suggestion based on curriculum progression]`;

function buildCorrectAnswerPrompt(context = {}) {
  const { code, language, problemTitle, problemStatement, tier2Result, oracleComparison, studentOutput, oracleOutput, curriculum, problem, student } = context;

  let userContent = `## Problem: ${problemTitle || problem?.title || "Unknown"}\n`;
  if (problemStatement || problem?.statement) userContent += `${(problemStatement || problem?.statement || "").slice(0, 400)}\n\n`;

  userContent += `## Student's Solution (${language})\n\`\`\`\n${(code || "").slice(0, 2000)}\n\`\`\`\n\n`;

  if (tier2Result) {
    userContent += `## Performance\n`;
    userContent += `- Student time: ${tier2Result.studentTimeMs}ms | Oracle time: ${tier2Result.oracleTimeMs}ms\n`;
    userContent += `- Student memory: ${tier2Result.studentMemMb}MB | Oracle memory: ${tier2Result.oracleMemMb}MB\n\n`;
  }

  // Reference solutions from curriculum context
  if (curriculum?.referenceSolutions?.length > 0) {
    userContent += `## Reference Approaches\n`;
    for (const rs of curriculum.referenceSolutions.slice(0, 3)) {
      userContent += `- ${rs.algorithm || rs.variant}: ${rs.timeComplexity || "unknown"} time, ${rs.spaceComplexity || "unknown"} space\n`;
    }
    userContent += "\n";
  }

  if (oracleComparison) {
    userContent += `## Comparison with Reference\n`;
    userContent += `- Student strategy: ${oracleComparison.studentStrategy || "detected"}\n`;
    userContent += `- Reference strategy: ${oracleComparison.goldStrategy || "detected"}\n`;
    if (oracleComparison.feedback) userContent += `- ${oracleComparison.feedback}\n`;
    userContent += "\n";
  }

  // Curriculum progression hint
  if (curriculum?.module) {
    userContent += `## Module Context\n`;
    userContent += `This problem is in "${curriculum.module.title}"`;
    if (curriculum.module.currentTopic) userContent += `, topic: ${curriculum.module.currentTopic}`;
    userContent += `\n\n`;
  }

  if (student?.weakTopics?.length > 0) {
    userContent += `Student's weak areas (consider suggesting practice): ${student.weakTopics.map(t => t.topic || t).join(", ")}\n\n`;
  }

  userContent += "Congratulate the student and provide the comparison.";

  return { system: CORRECT_PROMPT, user: userContent };
}

module.exports = { buildCorrectAnswerPrompt, CORRECT_PROMPT };
