// Agent Index — exports all agent prompt builders
// DB prompts (AIPrompt collection) override hardcoded prompts when available.

const AIPrompt = require("../../models/AIPrompt");

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
const { buildDifferentialPrompt } = require("./definitions/differential");

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
  differentialAgent: buildDifferentialPrompt,
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

// Map AGENT_BUILDERS keys → AIPrompt agentType names
const AGENT_TYPE_MAP = {
  guestTutor: "guestTutor",
  tutorAgent: "tutor",
  codeReviewAgent: "codeReview",
  compilerAgent: "compiler",
  runtimeAgent: "runtime",
  hintAgent: "hint",
  differentialAgent: "differential",
  summaryAgent: "summary",
  instructorCurriculumAgent: "instructorCurriculum",
  instructorAssessmentAgent: "instructorAssessment",
  instructorInsightsAgent: "instructorInsights",
  adminPlatformAgent: "adminPlatform",
  adminContentAgent: "adminContent",
  superAdminHealthAgent: "superAdminHealth",
};

// DB prompt cache: { agentType: { systemPrompt, expiresAt } }
const DB_PROMPT_CACHE = new Map();
const DB_PROMPT_TTL_MS = 60_000;

async function loadDBPrompt(agentType) {
  const cached = DB_PROMPT_CACHE.get(agentType);
  if (cached && cached.expiresAt > Date.now()) return cached.systemPrompt;

  try {
    const doc = await AIPrompt.findOne({ agentType, isActive: true }).sort({ version: -1 });
    if (doc?.systemPrompt) {
      DB_PROMPT_CACHE.set(agentType, { systemPrompt: doc.systemPrompt, expiresAt: Date.now() + DB_PROMPT_TTL_MS });
      return doc.systemPrompt;
    }
  } catch { /* DB unavailable — fall back to hardcoded */ }

  DB_PROMPT_CACHE.set(agentType, { systemPrompt: null, expiresAt: Date.now() + DB_PROMPT_TTL_MS });
  return null;
}

async function buildAgentPrompt(agentType, context) {
  const builder = AGENT_BUILDERS[agentType];
  if (!builder) return { system: "You are a helpful AI assistant.", user: JSON.stringify(context) };

  const prompt = builder(context);

  // Try to override system prompt from DB
  const dbAgentType = AGENT_TYPE_MAP[agentType];
  if (dbAgentType) {
    const dbSystemPrompt = await loadDBPrompt(dbAgentType);
    if (dbSystemPrompt) {
      return { ...prompt, system: dbSystemPrompt };
    }
  }

  return prompt;
}

function invalidateDBPromptCache(agentType) {
  if (agentType) {
    DB_PROMPT_CACHE.delete(agentType);
  } else {
    DB_PROMPT_CACHE.clear();
  }
}

module.exports = {
  buildAgentPrompt,
  getHintLevel,
  HINT_LEVELS,
  AGENT_BUILDERS,
  invalidateDBPromptCache,
};
