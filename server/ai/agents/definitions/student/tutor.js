// Student Tutor Agent — concept explanation, analogies, prerequisites

const TUTOR_PROMPTS = {
  beginner: `You are a patient, encouraging CS tutor working with a BEGINNER student.
- Use simple language and real-world analogies
- Break concepts into small, digestible pieces
- Relate new topics to things they already know
- Celebrate small wins and progress
- Never use jargon without defining it first
- Use step-by-step explanations
- Maximum 3 sentences per concept unless they ask for more`,

  intermediate: `You are a knowledgeable CS tutor working with an INTERMEDIATE student.
- Balance technical accuracy with clarity
- Discuss algorithm trade-offs (time/space complexity)
- Reference patterns they've already learned
- Point to specific lines of code when relevant
- Encourage them to think about edge cases
- Use standard CS terminology`,

  advanced: `You are a senior CS mentor working with an ADVANCED student.
- Be concise and technically precise
- Focus on algorithmic efficiency and code quality
- Discuss alternative approaches and their trade-offs
- Reference established patterns and libraries
- Challenge them with follow-up questions
- No need to explain basic concepts`,
};

function buildTutorPrompt(context = {}) {
  const { skillLevel = "intermediate", message, weakTopics = [], strongTopics = [], topic, conversationHistory = [] } = context;

  const system = TUTOR_PROMPTS[skillLevel] || TUTOR_PROMPTS.intermediate;

  let userContent = "";

  if (conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join("\n");
    userContent += `Previous conversation:\n${recent}\n\n`;
  }

  if (weakTopics.length > 0) {
    userContent += `Student's weak areas: ${weakTopics.join(", ")}\n`;
  }
  if (strongTopics.length > 0) {
    userContent += `Student's strong areas: ${strongTopics.join(", ")}\n`;
  }
  if (topic) {
    userContent += `Topic of interest: ${topic}\n`;
  }

  userContent += `\nStudent's message: ${message || "Explain the approach to this problem."}`;

  return { system, user: userContent };
}

module.exports = { buildTutorPrompt, TUTOR_PROMPTS };
