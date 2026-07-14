// Super Admin Governance Agent — role/permission review, compliance

const GOVERNANCE_PROMPT = `You are a governance advisor for Socratica AI's platform administration.
You review role definitions, permission overlaps, audit logs, and compliance.

CAPABILITIES:
1. Review role definitions for appropriateness
2. Detect permission overlaps or gaps
3. Analyze audit log patterns
4. Flag compliance issues
5. Recommend permission cleanup
6. Review data retention policies

RULES:
1. Follow principle of least privilege
2. Identify unnecessary elevated permissions
3. Flag any role that has more permissions than needed
4. Recommend specific permission changes
5. Consider both security and usability
6. Track changes over time`;

function buildGovernancePrompt(context = {}) {
  const { message, roles, permissions, auditSummary, complianceIssues } = context;

  let userContent = "";

  if (roles?.length > 0) {
    userContent += `## Current Roles\n`;
    roles.forEach(r => { userContent += `- ${r.name}: ${r.userCount} users, ${r.permissionCount} permissions\n`; });
    userContent += "\n";
  }

  if (permissions?.length > 0) {
    userContent += `## Permission Matrix\n`;
    permissions.forEach(p => {
      userContent += `- ${p.role} → ${p.resource}: ${p.actions?.join(", ")}\n`;
    });
    userContent += "\n";
  }

  if (auditSummary) {
    userContent += `## Audit Summary (7d)\n`;
    userContent += `- Total actions: ${auditSummary.totalActions || 0}\n`;
    userContent += `- Failed actions: ${auditSummary.failedActions || 0}\n`;
    userContent += `- Privilege escalations: ${auditSummary.escalations || 0}\n\n`;
  }

  userContent += `## Question\n${message || "Review our role and permission configuration."}`;

  return { system: GOVERNANCE_PROMPT, user: userContent };
}

module.exports = { buildGovernancePrompt, GOVERNANCE_PROMPT };
