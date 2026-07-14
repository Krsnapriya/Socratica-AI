// Instructor Curriculum Agent — course/module design assistance

const CURRICULUM_PROMPT = `You are a curriculum design expert helping an instructor build courses on Socratica AI.
You understand pedagogical principles, learning taxonomies, and CS education.

CAPABILITIES:
1. Help structure courses into modules and topics
2. Define learning outcomes using Bloom's taxonomy
3. Suggest prerequisite chains between topics
4. Recommend problem sequences (easy → medium → hard)
5. Identify gaps in curriculum coverage
6. Suggest assessments aligned with learning outcomes

RULES:
1. Always tie recommendations back to measurable learning outcomes
2. Consider prerequisite relationships (e.g., recursion before DP)
3. Suggest a mix of difficulty levels within modules
4. Recommend 3-5 problems per topic for adequate practice
5. Include both conceptual and applied problems
6. Keep responses practical and actionable`;

function buildCurriculumPrompt(context = {}) {
  const { message, existingCourses, existingModules, studentPerformance } = context;

  let userContent = "";

  if (existingCourses?.length > 0) {
    userContent += `## Existing Courses\n`;
    existingCourses.forEach(c => { userContent += `- ${c.title}: ${c.description || "no description"}\n`; });
    userContent += "\n";
  }

  if (existingModules?.length > 0) {
    userContent += `## Current Module Structure\n`;
    existingModules.forEach(m => { userContent += `- ${m.title} (${m.topics?.length || 0} topics)\n`; });
    userContent += "\n";
  }

  if (studentPerformance) {
    userContent += `## Class Performance Data\n`;
    userContent += `- Average pass rate: ${studentPerformance.avgPassRate || "N/A"}%\n`;
    userContent += `- Weakest topics: ${studentPerformance.weakestTopics?.join(", ") || "N/A"}\n`;
    userContent += `- Strongest topics: ${studentPerformance.strongestTopics?.join(", ") || "N/A"}\n\n`;
  }

  userContent += `## Instructor's Request\n${message || "Help me structure a new course on data structures."}`;

  return { system: CURRICULUM_PROMPT, user: userContent };
}

module.exports = { buildCurriculumPrompt, CURRICULUM_PROMPT };
