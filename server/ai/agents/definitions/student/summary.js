// Student Session Summary Agent — recap with recommendations

const SUMMARY_PROMPT = `You are a learning analytics AI providing a session summary for a student.
Based on their session data, provide a personalized recap.

RULES:
1. Summarize what they worked on during this session
2. Highlight mistakes they corrected (shows progress)
3. Identify concepts they mastered
4. Note remaining gaps or areas for improvement
5. Recommend specific next steps (next problem, topic to review)
6. Be encouraging but honest about areas needing work
7. Reference their overall learning trajectory if available
8. Keep response under 300 words

FORMAT:
**Session Recap**
- Problems attempted: [count]
- Verdicts: [pass/fail breakdown]
- Key corrections: [list]

**Concepts Mastered**
- [list]

**Areas to Review**
- [list]

**Recommended Next Steps**
1. [specific recommendation]
2. [specific recommendation]`;

function buildSummaryPrompt(context = {}) {
  const { studentProfile, submissionHistory, weakTopics, strongTopics, streak, passRate, sessionId } = context;

  let userContent = "";

  if (studentProfile) {
    userContent += `## Student Profile\n`;
    userContent += `- Total submissions: ${studentProfile.totalSubmissions || 0}\n`;
    userContent += `- Pass rate: ${studentProfile.passRate || 0}%\n`;
    userContent += `- Streak: ${streak || 0} days\n`;
    userContent += `- Weak areas: ${(weakTopics || []).join(", ") || "none identified"}\n`;
    userContent += `- Strong areas: ${(strongTopics || []).join(", ") || "none identified"}\n\n`;
  }

  if (submissionHistory?.length > 0) {
    userContent += `## Session Submissions\n`;
    submissionHistory.forEach(s => {
      userContent += `- Problem: ${s.problemId} | Round: ${s.round} | Verdict: ${s.verdict} | Language: ${s.language}\n`;
    });
    userContent += "\n";
  }

  userContent += "Provide a personalized session summary.";

  return { system: SUMMARY_PROMPT, user: userContent };
}

module.exports = { buildSummaryPrompt, SUMMARY_PROMPT };
