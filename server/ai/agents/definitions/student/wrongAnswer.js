// Student Wrong Answer Agent — analyzes algorithm gaps by CATEGORY (never reveals tests)

const WRONG_ANSWER_PROMPT = `You are an algorithmic tutor analyzing why a student's solution produces wrong output.
Your goal is to help them identify the gap in their approach WITHOUT revealing test cases.

RULES:
1. NEVER reveal specific test inputs or expected outputs for hidden tests
2. You may reference PUBLIC test cases (examples given in the problem)
3. Focus on the ALGORITHMIC gap — what is their approach missing?
4. Discuss categories of inputs that might fail (e.g., "consider negative numbers", "what about empty arrays?")
5. Reference their attempt history to show patterns
6. Guide them toward thinking about edge cases without listing them
7. If you see a code bug, point to the exact line
8. Keep response under 250 words

FORMAT your response as:
**Approach:** [what their code does]
**Gap:** [what's missing or wrong in their logic]
**Think about:** [guiding questions, not test cases]
**Next step:** [specific action to take]`;

function buildWrongAnswerPrompt(context = {}) {
  const { code, language, problemTitle, problemStatement, executionResult, studentOutput, oracleOutput,
          codeAnalysis, attemptHistory, weakTopics, hiddenCategories, hintLevel, curriculum, problem } = context;

  let userContent = `## Problem: ${problemTitle || problem?.title || "Unknown"}\n`;
  if (problemStatement || problem?.statement) userContent += `${(problemStatement || problem?.statement || "").slice(0, 600)}\n\n`;

  userContent += `## Student's Code (${language})\n\`\`\`\n${(code || "").slice(0, 3000)}\n\`\`\`\n\n`;

  if (studentOutput) {
    userContent += `## Student's Output\n\`\`\`\n${studentOutput.slice(0, 500)}\n\`\`\`\n\n`;
  }

  if (hiddenCategories?.length > 0) {
    userContent += `## Hidden Test Categories Failed\n`;
    hiddenCategories.forEach(c => { userContent += `- ${c.category || "unknown"} (${c.count || 0} tests): ${c.hint}\n`; });
    userContent += "\n";
  }

  if (attemptHistory?.length > 0) {
    userContent += `## Attempt History (${attemptHistory.length} attempts)\n`;
    attemptHistory.slice(-3).forEach(a => {
      userContent += `- Round ${a.round}: ${a.verdict}${a.hint ? ` — hint was: "${a.hint.slice(0, 100)}"` : ""}\n`;
    });
    userContent += "\n";
  }

  if (codeAnalysis?.bugs?.length > 0) {
    userContent += `## Code Analysis\n`;
    codeAnalysis.bugs.forEach(b => { userContent += `- ${b.type} (${b.severity}): ${b.description}\n`; });
    userContent += "\n";
  }

  if (weakTopics?.length > 0) {
    userContent += `## Student Weak Areas: ${weakTopics.map(t => t.topic || t).join(", ")}\n\n`;
  }

  // Curriculum context for prerequisite-aware guidance
  if (curriculum?.knowledgeGraph?.prerequisites?.length > 0) {
    userContent += `## Prerequisite Topics\n`;
    userContent += `This problem involves ${curriculum.knowledgeGraph.currentTopic || "unknown"}. Prerequisites: ${curriculum.knowledgeGraph.prerequisites.map(p => `${p.name} (${p.category})`).join(", ")}\n`;
    userContent += `If the student struggles, consider whether they need to review prerequisite concepts first.\n\n`;
  }

  userContent += `Hint level: ${hintLevel || 1}/5. `;

  userContent += "Analyze the gap in their approach and guide them.";

  return { system: WRONG_ANSWER_PROMPT, user: userContent };
}

module.exports = { buildWrongAnswerPrompt, WRONG_ANSWER_PROMPT };
