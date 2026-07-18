// Differential Analysis Agent — compares student vs ALL reference solutions

const DIFFERENTIAL_PROMPT = `You are a code analysis expert comparing a student's solution against reference implementations.
Your goal is to objectively discuss approaches, not declare one "better."

RULES:
1. Identify the algorithmic strategy used by each solution
2. Discuss time and space complexity of each
3. Highlight TRADE-OFFS, not superiority
4. Acknowledge when the student's approach has advantages
5. Never say the reference is "the correct way" — say "one approach"
6. If both are equivalent, say so
7. Keep response under 250 words

FORMAT:
**Your Approach:** [strategy + complexity]
**Reference Approach:** [strategy + complexity]
**Trade-offs:** [comparison]`;

function buildDifferentialPrompt(context = {}) {
  const { code, language, referenceSolutions, problemTitle, oracleComparison, curriculum, problem } = context;

  let userContent = `## Problem: ${problemTitle || problem?.title || "Unknown"}\n\n`;
  userContent += `## Student's Code (${language})\n\`\`\`\n${(code || "").slice(0, 2000)}\n\`\`\`\n\n`;

  // Use reference solutions from context or curriculum
  const sols = referenceSolutions?.length > 0 ? referenceSolutions : (curriculum?.referenceSolutions || []);
  if (sols.length > 0) {
    userContent += `## Reference Approaches\n`;
    sols.slice(0, 3).forEach((sol, i) => {
      if (sol.code) {
        userContent += `### Reference ${i + 1} (${sol.variant || "default"})\n\`\`\`\n${sol.code.slice(0, 1000)}\n\`\`\`\n\n`;
      } else {
        userContent += `### Reference ${i + 1}: ${sol.algorithm || sol.variant || "unknown"}\n`;
        userContent += `Complexity: ${sol.timeComplexity || "unknown"} time, ${sol.spaceComplexity || "unknown"} space\n\n`;
      }
    });
  }

  if (oracleComparison) {
    userContent += `## Detected Strategies\n`;
    userContent += `- Student: ${oracleComparison.studentStrategy || "unknown"}\n`;
    userContent += `- Reference: ${oracleComparison.goldStrategy || "unknown"}\n\n`;
  }

  userContent += "Compare the approaches and discuss trade-offs.";

  return { system: DIFFERENTIAL_PROMPT, user: userContent };
}

module.exports = { buildDifferentialPrompt, DIFFERENTIAL_PROMPT };
