// Agent Index — exports all agent prompt builders

const { buildGuestPrompt } = require("./definitions/guest");
const { buildTutorPrompt } = require("./definitions/student/tutor");
const { buildCodeReviewPrompt } = require("./definitions/student/codeReview");
const { buildCompilerPrompt } = require("./definitions/student/compiler");
const { buildRuntimePrompt } = require("./definitions/student/runtime");
const { buildWrongAnswerPrompt } = require("./definitions/student/wrongAnswer");
const { buildCorrectAnswerPrompt } = require("./definitions/student/celebration");
const { buildHintPrompt, getHintLevel, HINT_LEVELS } = require("./definitions/student/hint");
const { buildSummaryPrompt } = require("./definitions/student/summary");
const { buildCurriculumPrompt } = require("./definitions/instructor/curriculum");
const { buildAssessmentPrompt } = require("./definitions/instructor/assessment");
const { buildInsightsPrompt } = require("./definitions/instructor/insights");
const { buildProblemAuthorPrompt } = require("./definitions/instructor/problemAuthor");
const { buildPlatformIntelPrompt } = require("./definitions/admin/platformIntel");
const { buildContentQualityPrompt } = require("./definitions/admin/contentQuality");
const { buildModerationPrompt } = require("./definitions/admin/moderation");
const { buildHealthPrompt } = require("./definitions/superAdmin/health");
const { buildSecurityPrompt } = require("./definitions/superAdmin/security");
const { buildGovernancePrompt } = require("./definitions/superAdmin/governance");

const AGENT_BUILDERS = {
  // Guest
  guestTutor: buildGuestPrompt,

  // Student
  tutorAgent: buildTutorPrompt,
  codeReviewAgent: buildCodeReviewPrompt,
  compilerAgent: buildCompilerPrompt,
  runtimeAgent: buildRuntimePrompt,
  wrongAnswerAgent: buildWrongAnswerPrompt,
  correctAnswerAgent: buildCorrectAnswerPrompt,
  hintAgent: buildHintPrompt,
  differentialAgent: null,
  summaryAgent: buildSummaryPrompt,

  // Instructor
  instructorCurriculumAgent: buildCurriculumPrompt,
  instructorAssessmentAgent: buildAssessmentPrompt,
  instructorInsightsAgent: buildInsightsPrompt,
  instructorProblemAgent: buildProblemAuthorPrompt,

  // Admin
  adminPlatformAgent: buildPlatformIntelPrompt,
  adminContentAgent: buildContentQualityPrompt,
  adminModerationAgent: buildModerationPrompt,

  // Super Admin
  superAdminHealthAgent: buildHealthPrompt,
  superAdminSecurityAgent: buildSecurityPrompt,
  superAdminGovernanceAgent: buildGovernancePrompt,
};

function buildAgentPrompt(agentType, context) {
  const builder = AGENT_BUILDERS[agentType];
  if (!builder) return { system: "You are a helpful AI assistant.", user: JSON.stringify(context) };
  return builder(context);
}

module.exports = {
  buildAgentPrompt,
  getHintLevel,
  HINT_LEVELS,
  AGENT_BUILDERS,
};
