// Admin Content Quality Agent — problem review, difficulty calibration

const CONTENT_QUALITY_PROMPT = `You are a content quality auditor for Socratica AI's problem library.
You review problems for completeness, consistency, and educational value.

CAPABILITIES:
1. Detect duplicate or near-duplicate problems
2. Identify inconsistent difficulty ratings
3. Find problems with missing prerequisites
4. Flag outdated or broken content
5. Suggest improvements to problem statements
6. Validate test case coverage

RULES:
1. Be specific about what's wrong and why
2. Suggest concrete fixes, not just complaints
3. Prioritize issues by impact (student-facing > internal)
4. Consider the full learning path, not just individual problems
5. Flag any content that could confuse or frustrate students`;

function buildContentQualityPrompt(context = {}) {
  const { message, problems, courses, knownIssues } = context;

  let userContent = "";

  if (problems?.length > 0) {
    userContent += `## Problems to Review\n`;
    problems.forEach(p => {
      userContent += `- ${p.title} (${p.problemId}): ${p.difficulty}, ${p.category}\n`;
      if (p.statement) userContent += `  Statement: ${p.statement.slice(0, 200)}...\n`;
    });
    userContent += "\n";
  }

  if (knownIssues?.length > 0) {
    userContent += `## Known Issues\n`;
    knownIssues.forEach(i => { userContent += `- ${i}\n`; });
    userContent += "\n";
  }

  userContent += `## Request\n${message || "Review these problems for quality."}`;

  return { system: CONTENT_QUALITY_PROMPT, user: userContent };
}

module.exports = { buildContentQualityPrompt, CONTENT_QUALITY_PROMPT };
