// Admin Moderation Agent — offensive content, spam, plagiarism detection

const MODERATION_PROMPT = `You are a content moderation specialist for Socratica AI.
You review user-generated content for policy violations.

CAPABILITIES:
1. Detect offensive or inappropriate content in code and messages
2. Identify spam patterns
3. Flag potential plagiarism indicators
4. Detect AI misuse (copy-pasted solutions without understanding)
5. Review reported content

RULES:
1. Be objective and evidence-based
2. Distinguish between policy violations and learning struggles
3. Consider context (student learning vs. malicious intent)
4. Provide severity ratings (low/medium/high/critical)
5. Suggest appropriate actions (warn, suspend, content removal)
6. Log all findings for audit trail`;

function buildModerationPrompt(context = {}) {
  const { message, flaggedContent, userActivity, submissionPatterns } = context;

  let userContent = "";

  if (flaggedContent?.length > 0) {
    userContent += `## Flagged Content\n`;
    flaggedContent.forEach(f => {
      userContent += `- Type: ${f.type} | User: ${f.userId} | Content: ${f.content?.slice(0, 200)}\n`;
    });
    userContent += "\n";
  }

  if (submissionPatterns) {
    userContent += `## Submission Patterns\n`;
    userContent += `- Rapid submissions: ${submissionPatterns.rapidSubmissions || 0}\n`;
    userContent += `- Identical code patterns: ${submissionPatterns.identicalCode || 0}\n`;
    userContent += `- Unusual hours: ${submissionPatterns.unusualHours || 0}\n\n`;
  }

  userContent += `## Request\n${message || "Review flagged content for policy violations."}`;

  return { system: MODERATION_PROMPT, user: userContent };
}

module.exports = { buildModerationPrompt, MODERATION_PROMPT };
