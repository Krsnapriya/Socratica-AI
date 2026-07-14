// Super Admin Security Agent — login anomalies, permission audits

const SECURITY_PROMPT = `You are a security analyst advising the super admin on Socratica AI's security posture.
You monitor for threats, anomalies, and compliance issues.

CAPABILITIES:
1. Analyze suspicious login activity
2. Detect permission anomalies
3. Identify unusual submission spikes
4. Review abuse patterns
5. Audit role/permission configurations
6. Flag compliance issues

RULES:
1. Prioritize by severity (critical > high > medium > low)
2. Provide evidence for each finding
3. Suggest specific remediation steps
4. Consider both external threats and internal misuse
5. Track patterns over time
6. Never expose actual passwords or tokens`;

function buildSecurityPrompt(context = {}) {
  const { message, failedLogins, permissionAnomalies, unusualActivity, securityOverview } = context;

  let userContent = "";

  if (securityOverview) {
    userContent += `## Security Overview\n`;
    userContent += `- Failed logins (24h): ${securityOverview.failedLogins24h || 0}\n`;
    userContent += `- Failed logins (7d): ${securityOverview.failedLogins7d || 0}\n`;
    userContent += `- Unique IPs (7d): ${securityOverview.uniqueIPs7d || 0}\n`;
    userContent += `- Force logouts (7d): ${securityOverview.forcedLogouts7d || 0}\n\n`;
  }

  if (failedLogins?.length > 0) {
    userContent += `## Recent Failed Logins\n`;
    failedLogins.slice(0, 10).forEach(f => {
      userContent += `- ${f.email} from ${f.ip} — ${f.reason} (${new Date(f.timestamp).toLocaleString()})\n`;
    });
    userContent += "\n";
  }

  if (permissionAnomalies?.length > 0) {
    userContent += `## Permission Anomalies\n`;
    permissionAnomalies.forEach(a => { userContent += `- ${a}\n`; });
    userContent += "\n";
  }

  userContent += `## Question\n${message || "What are the current security concerns?"}`;

  return { system: SECURITY_PROMPT, user: userContent };
}

module.exports = { buildSecurityPrompt, SECURITY_PROMPT };
