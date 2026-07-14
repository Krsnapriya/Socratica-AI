// Super Admin System Health Agent — DB, storage, API latency, compiler health

const HEALTH_PROMPT = `You are a system architect advising the super admin on Socratica AI's infrastructure health.
You analyze system metrics and recommend operational actions.

CAPABILITIES:
1. Summarize database status and performance
2. Report storage usage and trends
3. Monitor API latency and error rates
4. Track compiler/sandbox health
5. Monitor AI API availability and costs
6. Recommend scaling or optimization actions

RULES:
1. Prioritize critical issues (downtime, data loss risk)
2. Quantify impact (affected users, error rate)
3. Suggest specific remediation steps
4. Consider cost implications of recommendations
5. Track trends over time, not just current state
6. Flag security concerns immediately`;

function buildHealthPrompt(context = {}) {
  const { message, dbStats, apiStats, compilerStats, aiStats, storageStats } = context;

  let userContent = "";

  if (dbStats) {
    userContent += `## Database Status\n`;
    userContent += `- Connection: ${dbStats.connectionState || "unknown"}\n`;
    userContent += `- Collections: ${dbStats.collections || 0}\n`;
    userContent += `- Documents: ${dbStats.totalDocuments || 0}\n`;
    userContent += `- Storage: ${dbStats.storageSize || "unknown"}\n\n`;
  }

  if (apiStats) {
    userContent += `## API Metrics\n`;
    userContent += `- Avg latency: ${apiStats.avgLatency || 0}ms\n`;
    userContent += `- Error rate: ${apiStats.errorRate || 0}%\n`;
    userContent += `- Requests/min: ${apiStats.requestsPerMin || 0}\n`;
    userContent += `- Active sessions: ${apiStats.activeSessions || 0}\n\n`;
  }

  if (compilerStats) {
    userContent += `## Compiler Health\n`;
    userContent += `- Sandbox containers: ${compilerStats.activeContainers || 0}\n`;
    userContent += `- Queue depth: ${compilerStats.queueDepth || 0}\n`;
    userContent += `- Avg compile time: ${compilerStats.avgCompileTime || 0}ms\n`;
    userContent += `- Failure rate: ${compilerStats.failureRate || 0}%\n\n`;
  }

  if (aiStats) {
    userContent += `## AI System Status\n`;
    userContent += `- Circuit breaker: ${aiStats.circuitBreakerOpen ? "OPEN" : "closed"}\n`;
    userContent += `- API calls today: ${aiStats.callsToday || 0}\n`;
    userContent += `- Tokens used: ${aiStats.tokensUsed || 0}\n`;
    userContent += `- Avg latency: ${aiStats.avgLatency || 0}ms\n`;
    userContent += `- Error rate: ${aiStats.errorRate || 0}%\n\n`;
  }

  userContent += `## Question\n${message || "Give me a system health summary."}`;

  return { system: HEALTH_PROMPT, user: userContent };
}

module.exports = { buildHealthPrompt, HEALTH_PROMPT };
