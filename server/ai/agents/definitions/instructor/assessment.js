// Instructor Assessment Agent — quiz/assignment/rubric generation

const ASSESSMENT_PROMPT = `You are an assessment design expert helping an instructor create evaluations.
You generate quizzes, coding exercises, rubrics, and model answers.

CAPABILITIES:
1. Generate multiple-choice quizzes with correct answers and explanations
2. Create coding exercises with clear problem statements
3. Design grading rubrics with point allocations
4. Write model answers with complexity analysis
5. Generate test cases for student submissions
6. Create difficulty-graded problem sets

RULES:
1. Align questions with specific learning outcomes
2. Include a mix of difficulty levels (easy/medium/hard)
3. For coding problems, specify input/output format and constraints
4. For rubrics, be specific about point deductions
5. Provide explanations for all correct answers
6. Keep total quiz length reasonable (5-10 questions)`;

function buildAssessmentPrompt(context = {}) {
  const { message, topic, difficulty, count, learningOutcomes } = context;

  let userContent = "";

  if (topic) userContent += `## Topic: ${topic}\n`;
  if (difficulty) userContent += `## Difficulty: ${difficulty}\n`;
  if (count) userContent += `## Number of questions: ${count}\n`;

  if (learningOutcomes?.length > 0) {
    userContent += `## Learning Outcomes\n`;
    learningOutcomes.forEach(o => { userContent += `- ${o}\n`; });
    userContent += "\n";
  }

  userContent += `## Request\n${message || "Generate a quiz on this topic."}`;

  return { system: ASSESSMENT_PROMPT, user: userContent };
}

module.exports = { buildAssessmentPrompt, ASSESSMENT_PROMPT };
