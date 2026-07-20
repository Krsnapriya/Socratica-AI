// Student Correct Answer Agent — celebrates + compares student code with oracle line-by-line

const CORRECT_PROMPT = `You are a CS mentor who has just confirmed the student's solution passes ALL test cases.

Your PRIMARY job: Analyze the student's code against the reference (oracle) solution line-by-line and explain every difference meticulously.

RULES:
1. Celebrate briefly: "Great work! Your solution passes all X test cases!"
2. IMMEDIATELY pivot to code comparison — this is the main value
3. Analyze the student's code line-by-line vs the oracle code
4. For EACH meaningful difference, explain:
   - What the student did differently
   - Whether it's equivalent, better, or worse
   - WHY one approach might be preferable (readability, performance, edge cases)
5. Discuss time/space complexity of BOTH solutions
6. Point out if the student's approach handles edge cases differently
7. If the student's approach is simpler/more elegant, PRAISE it genuinely
8. If the oracle is more efficient, explain the trade-off without implying the student is wrong
9. Suggest related problems or optimizations
10. Keep response under 400 words

FORMAT your response as:
**All tests passed!** [X/X test cases]

**Your approach:** [1-2 sentence summary of what the student did]

**Reference approach:** [1-2 sentence summary of what the oracle does]

**Line-by-line comparison:**
[For each meaningful difference:]
- **Student line(s):** \`student code snippet\`
- **Oracle line(s):** \`oracle code snippet\`
- **Analysis:** [what's different, why it matters, which is better for this case]

**Complexity comparison:**
| Aspect | Your Solution | Reference Solution |
|--------|--------------|-------------------|
| Time   | ...          | ...               |
| Space  | ...          | ...               |

**Key insight:** [the most important takeaway from comparing the two]

**Optional optimizations:** [if any, framed as learning opportunities]

If no oracle code is available, analyze the student's solution on its own: correctness, efficiency, readability, edge case handling, and suggest improvements.`;

function buildCorrectAnswerPrompt(context = {}) {
  const { code, language, problemTitle, problemStatement, tier2Result, oracleComparison,
          studentOutput, oracleOutput, curriculum, problem, student,
          oracleComparisonData, oracleCode } = context;

  let userContent = `## Problem: ${problemTitle || problem?.title || "Unknown"}\n`;
  if (problemStatement || problem?.statement) userContent += `${(problemStatement || problem?.statement || "").slice(0, 400)}\n\n`;

  userContent += `## Student's Solution (${language})\n\`\`\`\n${(code || "").slice(0, 3000)}\n\`\`\`\n\n`;

  // Oracle code for line-by-line comparison
  const effectiveOracleCode = oracleComparisonData?.oracleCode || oracleCode || context.problem?.oracleSolution || "";
  if (effectiveOracleCode) {
    userContent += `## Reference (Oracle) Solution (${language})\n\`\`\`\n${effectiveOracleCode.slice(0, 3000)}\n\`\`\`\n\n`;
    userContent += `**IMPORTANT:** Compare the student's code above with the oracle code above, line-by-line. Explain every meaningful difference.\n\n`;
  }

  // Oracle comparison data (complexity/strategy detection)
  if (oracleComparison) {
    userContent += `## Strategy Comparison\n`;
    userContent += `- Student strategy: ${oracleComparison.studentStrategy || oracleComparison.student?.strategy || "detected"}\n`;
    userContent += `- Reference strategy: ${oracleComparison.goldStrategy || oracleComparison.oracle?.strategy || "detected"}\n`;
    if (oracleComparison.feedback) userContent += `- ${oracleComparison.feedback}\n`;
    if (oracleComparison.comparison) userContent += `- ${oracleComparison.comparison}\n`;
    userContent += "\n";
  }

  // Performance comparison
  if (tier2Result) {
    userContent += `## Performance\n`;
    userContent += `- Student time: ${tier2Result.studentTimeMs}ms | Oracle time: ${tier2Result.oracleTimeMs}ms\n`;
    userContent += `- Student memory: ${tier2Result.studentMemMb}MB | Oracle memory: ${tier2Result.oracleMemMb}MB\n\n`;
  }

  if (oracleComparisonData) {
    userContent += `## Oracle Execution\n`;
    userContent += `- Oracle time: ${oracleComparisonData.oracleTimeMs}ms | Oracle memory: ${oracleComparisonData.oracleMemoryMb}MB\n`;
    userContent += `- Oracle output matches student: ${(oracleComparisonData.oracleOutput || "").trim() === (studentOutput || "").trim() ? "Yes" : "Different output (both correct)"}\n\n`;
  }

  // Reference solutions from curriculum context
  if (curriculum?.referenceSolutions?.length > 0) {
    userContent += `## Reference Approaches\n`;
    for (const rs of curriculum.referenceSolutions.slice(0, 3)) {
      userContent += `- ${rs.algorithm || rs.variant}: ${rs.timeComplexity || "unknown"} time, ${rs.spaceComplexity || "unknown"} space\n`;
    }
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

  userContent += "Celebrate the student's achievement and provide the detailed line-by-line code comparison.";

  return { system: CORRECT_PROMPT, user: userContent };
}

module.exports = { buildCorrectAnswerPrompt, CORRECT_PROMPT };
