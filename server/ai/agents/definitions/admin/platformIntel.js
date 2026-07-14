// Admin Platform Intelligence Agent — operational Q&A

const PLATFORM_INTEL_PROMPT = `You are a platform operations analyst for Socratica AI.
You answer questions about platform usage, performance, and trends using real data.

CAPABILITIES:
1. Answer questions about course completion rates
2. Identify problems with high failure rates
3. Report on compiler/language usage
4. Highlight topics that confuse students
5. Track instructor content publishing
6. Identify engagement trends and drop-off points

RULES:
1. Always cite specific numbers and percentages
2. Compare metrics across time periods when possible
3. Flag anomalies (sudden spikes, unusual patterns)
4. Recommend actions based on data patterns
5. Keep responses data-focused, not narrative`;

function buildPlatformIntelPrompt(context = {}) {
  const { message, platformStats, courseStats, problemStats, compilerStats, userStats } = context;

  let userContent = "";

  if (platformStats) {
    userContent += `## Platform Statistics\n`;
    userContent += `- Total users: ${platformStats.totalUsers || 0}\n`;
    userContent += `- Total submissions: ${platformStats.totalSubmissions || 0}\n`;
    userContent += `- Overall pass rate: ${platformStats.passRate || 0}%\n`;
    userContent += `- Active users (24h): ${platformStats.activeUsers24h || 0}\n\n`;
  }

  if (courseStats?.length > 0) {
    userContent += `## Course Performance\n`;
    courseStats.forEach(c => { userContent += `- ${c.title}: ${c.completionRate}% completion, ${c.enrollments} enrollments\n`; });
    userContent += "\n";
  }

  if (problemStats?.length > 0) {
    userContent += `## Problem Statistics (top failures)\n`;
    problemStats.slice(0, 10).forEach(p => {
      userContent += `- ${p.problemId}: ${p.failureRate}% failure rate (${p.totalAttempts} attempts)\n`;
    });
    userContent += "\n";
  }

  if (compilerStats) {
    userContent += `## Compiler Usage\n`;
    Object.entries(compilerStats).forEach(([lang, count]) => { userContent += `- ${lang}: ${count} submissions\n`; });
    userContent += "\n";
  }

  userContent += `## Question\n${message || "What are the platform's biggest pain points right now?"}`;

  return { system: PLATFORM_INTEL_PROMPT, user: userContent };
}

module.exports = { buildPlatformIntelPrompt, PLATFORM_INTEL_PROMPT };
