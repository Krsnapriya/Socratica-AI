// Role Router — determines which agents handle requests based on user role + context
// Reads from DB (AgentRoute collection) with fallback to hardcoded defaults.
const { config } = require("../configLoader");

// ── Hardcoded defaults ──────────────────────────────────────────────────
const DEFAULT_AGENT_ROUTES = {
  guest: {
    chat: ["guestTutor"],
    "code-review": ["guestTutor"],
    quiz: ["guestTutor"],
    syllabus: ["guestTutor"],
    default: ["guestTutor"],
  },
  student: {
    compile_error: ["compilerAgent"],
    runtime_error: ["runtimeAgent"],
    timeout: ["runtimeAgent"],
    memory_exceeded: ["runtimeAgent"],
    fail: ["wrongAnswerAgent"],
    pass: ["correctAnswerAgent", "differentialAgent"],
    hint: ["hintAgent"],
    "code-review": ["codeReviewAgent"],
    "code-review-contextual": ["codeReviewAgent"],
    "oracle-comparison": ["differentialAgent"],
    "learning-summary": ["summaryAgent"],
    "contextual-hint": ["hintAgent"],
    quiz: ["tutorAgent"],
    syllabus: ["tutorAgent"],
    chat: ["tutorAgent"],
    reflect: ["summaryAgent"],
    debug: ["runtimeAgent"],
    default: ["tutorAgent"],
  },
  instructor: {
    "student-insights": ["instructorInsightsAgent"],
    "curriculum-design": ["instructorCurriculumAgent"],
    "assessment-gen": ["instructorAssessmentAgent"],
    "problem-author": ["instructorProblemAgent"],
    "class-dashboard": ["instructorInsightsAgent"],
    chat: ["instructorCurriculumAgent"],
    default: ["instructorCurriculumAgent"],
  },
admin: {
    "platform-intel": ["adminPlatformAgent"],
    "content-quality": ["adminContentAgent"],
    moderation: ["adminModerationAgent"],
    "anomaly-report": ["adminPlatformAgent"],
    chat: ["tutorAgent"],  // In workspace, admin acts as tutor
    default: ["adminPlatformAgent"],
  },
  super_admin: {
    "system-health": ["superAdminHealthAgent"],
    "security-review": ["superAdminSecurityAgent"],
    governance: ["superAdminGovernanceAgent"],
    chat: ["superAdminHealthAgent"],
    default: ["superAdminHealthAgent"],
  },
};

const DEFAULT_GATES = {
  oracleSolution: ["student", "guest"],
  hiddenTests: ["student", "guest", "instructor"],
  studentEmail: ["guest"],
  submissionHistory: ["guest"],
  aiMemory: ["guest"],
  systemMetrics: ["guest", "student", "instructor"],
  securityLogs: ["guest", "student", "instructor", "admin"],
  costData: ["guest", "student", "instructor"],
};

// ── DB cache ────────────────────────────────────────────────────────────
let dbRoutes = null;
let dbGates = null;
let dbCacheTimestamp = 0;
const DB_CACHE_TTL = 60000;

async function loadFromDB() {
  const now = Date.now();
  if (dbRoutes && now - dbCacheTimestamp < DB_CACHE_TTL) return;

  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      dbCacheTimestamp = now;
      dbRoutes = DEFAULT_AGENT_ROUTES;
      dbGates = DEFAULT_GATES;
      return;
    }

    const AgentRoute = require("../models/AgentRoute");
    const routes = await AgentRoute.find({ isActive: true }).lean();

    if (routes.length === 0) {
      dbCacheTimestamp = now;
      dbRoutes = DEFAULT_AGENT_ROUTES;
      dbGates = DEFAULT_GATES;
      return;
    }

    // Build routes map from DB
    const routesMap = {};
    let gatesFromDB = null;

    for (const route of routes) {
      if (!routesMap[route.role]) routesMap[route.role] = {};
      routesMap[route.role][route.action] = route.agents;
      if (route.gates && !gatesFromDB) gatesFromDB = route.gates;
    }

    // Merge with defaults (DB overrides, defaults fill gaps)
    for (const [role, actions] of Object.entries(DEFAULT_AGENT_ROUTES)) {
      if (!routesMap[role]) routesMap[role] = {};
      for (const [action, agents] of Object.entries(actions)) {
        if (!routesMap[role][action]) routesMap[role][action] = agents;
      }
    }

    dbCacheTimestamp = now;
    dbRoutes = routesMap;
    dbGates = gatesFromDB || DEFAULT_GATES;
  } catch {
    dbCacheTimestamp = now;
    dbRoutes = DEFAULT_AGENT_ROUTES;
    dbGates = DEFAULT_GATES;
  }
}

function getRoutes() {
  return dbRoutes || DEFAULT_AGENT_ROUTES;
}

function getGates() {
  return dbGates || DEFAULT_GATES;
}

// ── Public API ──────────────────────────────────────────────────────────

function getAgentsForRequest(role, action, context = {}) {
  const roleRoutes = getRoutes()[role] || getRoutes().student;

  if (context.executionResult?.error === "compile_error") return roleRoutes.compile_error || roleRoutes.default;
  if (context.executionResult?.error === "runtime_error") return roleRoutes.runtime_error || roleRoutes.default;
  if (context.executionResult?.error === "timeout") return roleRoutes.timeout || roleRoutes.default;
  if (context.executionResult?.error === "oom") return roleRoutes.memory_exceeded || roleRoutes.default;
  if (context.verdict === "fail") return roleRoutes.fail || roleRoutes.default;
  if (context.verdict === "pass") return roleRoutes.pass || roleRoutes.default;

  return roleRoutes[action] || roleRoutes.default || ["tutorAgent"];
}

function shouldGateContent(role, contentType) {
  const gates = getGates();
  const blocked = gates[contentType] || [];
  return blocked.includes(role);
}

function getRateLimit(role) {
  return config.rateLimits.aiByRole[role] || config.rateLimits.aiByRole.student;
}

function getPersonaStyle(role, userContext = {}) {
  if (role === "guest") {
    return { tone: "friendly", detail: "moderate", nudgeRegistration: true };
  }
  if (role === "student") {
    const level = userContext.skillLevel || "intermediate";
    return {
      tone: level === "beginner" ? "encouraging" : level === "advanced" ? "concise" : "mentoring",
      detail: level === "beginner" ? "high" : level === "advanced" ? "minimal" : "moderate",
      useAnalogies: level === "beginner",
      preferredStyle: userContext.preferredStyle || "socratic",
    };
  }
  if (role === "instructor") {
    return { tone: "professional", detail: "high", focus: "pedagogy" };
  }
  if (role === "admin") {
    return { tone: "analytical", detail: "data-driven", focus: "operations" };
  }
  if (role === "super_admin") {
    return { tone: "strategic", detail: "comprehensive", focus: "governance" };
  }
  return { tone: "mentoring", detail: "moderate" };
}

module.exports = { loadFromDB, getAgentsForRequest, shouldGateContent, getRateLimit, getPersonaStyle, DEFAULT_AGENT_ROUTES };
