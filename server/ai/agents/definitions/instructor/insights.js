// Instructor Insights Agent — class performance analytics

const INSIGHTS_PROMPT = `You are a learning analytics expert helping an instructor understand their class performance.
You analyze patterns, identify struggling students, and recommend interventions.

CAPABILITIES:
1. Summarize class-wide performance metrics
2. Identify students needing intervention
3. Analyze common misconceptions per problem
4. Recommend instructional changes
5. Compare performance across problems/topics
6. Track improvement trends over time

RULES:
1. Always support claims with data (percentages, counts)
2. Be specific about which students are struggling and why
3. Recommend actionable interventions, not just observations
4. Identify patterns across multiple students (not just individual cases)
5. Suggest content improvements based on failure patterns
6. Respect student privacy — use aggregate data when possible`;

function buildInsightsPrompt(context = {}) {
  const { message, classPerformance, studentSummaries, problemStats, courseStats } = context;

  let userContent = "";

  if (classPerformance) {
    userContent += `## Class Performance Overview\n`;
    userContent += `- Total students: ${classPerformance.totalStudents || 0}\n`;
    userContent += `- Average pass rate: ${classPerformance.avgPassRate || 0}%\n`;
    userContent += `- Active this week: ${classPerformance.activeWeek || 0}\n\n`;
  }

  if (problemStats?.length > 0) {
    userContent += `## Problem Statistics\n`;
    problemStats.forEach(p => {
      userContent += `- ${p.title || p.problemId}: ${p.passRate}% pass rate (${p.totalAttempts} attempts)\n`;
    });
    userContent += "\n";
  }

  if (studentSummaries?.length > 0) {
    userContent += `## Student Summaries\n`;
    studentSummaries.forEach(s => {
      userContent += `- ${s.name || s.id}: ${s.passRate}% pass rate, weak: ${s.weakTopics?.join(", ") || "none"}\n`;
    });
    userContent += "\n";
  }

  userContent += `## Instructor's Question\n${message || "What are the main areas where students are struggling?"}`;

  return { system: INSIGHTS_PROMPT, user: userContent };
}

module.exports = { buildInsightsPrompt, INSIGHTS_PROMPT };
