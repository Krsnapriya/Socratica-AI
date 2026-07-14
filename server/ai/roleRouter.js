// Role Router — determines which agents handle requests based on user role + context
const config = require("../config");

const AGENT_ROUTES = {
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
    chat: ["adminPlatformAgent"],
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

function getAgentsForRequest(role, action, context = {}) {
  const roleRoutes = AGENT_ROUTES[role] || AGENT_ROUTES.student;

  if (context.executionResult?.error === "compile_error") return roleRoutes.compile_error || roleRoutes.default;
  if (context.executionResult?.error === "runtime_error") return roleRoutes.runtime_error || roleRoutes.default;
  if (context.executionResult?.error === "timeout") return roleRoutes.timeout || roleRoutes.default;
  if (context.executionResult?.error === "oom") return roleRoutes.memory_exceeded || roleRoutes.default;
  if (context.verdict === "fail") return roleRoutes.fail || roleRoutes.default;
  if (context.verdict === "pass") return roleRoutes.pass || roleRoutes.default;

  return roleRoutes[action] || roleRoutes.default || ["tutorAgent"];
}

function shouldGateContent(role, contentType) {
  const gates = {
    oracleSolution: ["student", "guest"],
    hiddenTests: ["student", "guest", "instructor"],
    studentEmail: ["guest"],
    submissionHistory: ["guest"],
    aiMemory: ["guest"],
    systemMetrics: ["guest", "student", "instructor"],
    securityLogs: ["guest", "student", "instructor", "admin"],
    costData: ["guest", "student", "instructor"],
  };
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

module.exports = { getAgentsForRequest, shouldGateContent, getRateLimit, getPersonaStyle, AGENT_ROUTES };
