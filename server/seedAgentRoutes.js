// Seed Agent Routes — populates AgentRoute collection.
const AgentRoute = require("./models/AgentRoute");

const DEFAULT_ROUTES = [
  // Guest
  { role: "guest", action: "chat", agents: ["guestTutor"] },
  { role: "guest", action: "code-review", agents: ["guestTutor"] },
  { role: "guest", action: "quiz", agents: ["guestTutor"] },
  { role: "guest", action: "syllabus", agents: ["guestTutor"] },
  { role: "guest", action: "default", agents: ["guestTutor"] },

  // Student
  { role: "student", action: "compile_error", agents: ["compilerAgent"] },
  { role: "student", action: "runtime_error", agents: ["runtimeAgent"] },
  { role: "student", action: "timeout", agents: ["runtimeAgent"] },
  { role: "student", action: "memory_exceeded", agents: ["runtimeAgent"] },
  { role: "student", action: "fail", agents: ["wrongAnswerAgent"] },
  { role: "student", action: "pass", agents: ["correctAnswerAgent", "differentialAgent"] },
  { role: "student", action: "hint", agents: ["hintAgent"] },
  { role: "student", action: "code-review", agents: ["codeReviewAgent"] },
  { role: "student", action: "code-review-contextual", agents: ["codeReviewAgent"] },
  { role: "student", action: "oracle-comparison", agents: ["differentialAgent"] },
  { role: "student", action: "learning-summary", agents: ["summaryAgent"] },
  { role: "student", action: "contextual-hint", agents: ["hintAgent"] },
  { role: "student", action: "quiz", agents: ["tutorAgent"] },
  { role: "student", action: "syllabus", agents: ["tutorAgent"] },
  { role: "student", action: "chat", agents: ["tutorAgent"] },
  { role: "student", action: "reflect", agents: ["summaryAgent"] },
  { role: "student", action: "debug", agents: ["runtimeAgent"] },
  { role: "student", action: "default", agents: ["tutorAgent"] },

  // Instructor
  { role: "instructor", action: "student-insights", agents: ["instructorInsightsAgent"] },
  { role: "instructor", action: "curriculum-design", agents: ["instructorCurriculumAgent"] },
  { role: "instructor", action: "assessment-gen", agents: ["instructorAssessmentAgent"] },
  { role: "instructor", action: "problem-author", agents: ["instructorProblemAgent"] },
  { role: "instructor", action: "class-dashboard", agents: ["instructorInsightsAgent"] },
  { role: "instructor", action: "chat", agents: ["instructorCurriculumAgent"] },
  { role: "instructor", action: "default", agents: ["instructorCurriculumAgent"] },

  // Admin
  { role: "admin", action: "platform-intel", agents: ["adminPlatformAgent"] },
  { role: "admin", action: "content-quality", agents: ["adminContentAgent"] },
  { role: "admin", action: "moderation", agents: ["adminModerationAgent"] },
  { role: "admin", action: "anomaly-report", agents: ["adminPlatformAgent"] },
  { role: "admin", action: "chat", agents: ["adminPlatformAgent"] },
  { role: "admin", action: "default", agents: ["adminPlatformAgent"] },

  // Super Admin
  { role: "super_admin", action: "system-health", agents: ["superAdminHealthAgent"] },
  { role: "super_admin", action: "security-review", agents: ["superAdminSecurityAgent"] },
  { role: "super_admin", action: "governance", agents: ["superAdminGovernanceAgent"] },
  { role: "super_admin", action: "chat", agents: ["superAdminHealthAgent"] },
  { role: "super_admin", action: "default", agents: ["superAdminHealthAgent"] },
];

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

async function seedAgentRoutes() {
  let created = 0;
  let updated = 0;

  for (const route of DEFAULT_ROUTES) {
    const existing = await AgentRoute.findOne({ role: route.role, action: route.action });
    if (existing) {
      await AgentRoute.updateOne(
        { role: route.role, action: route.action },
        { $set: { agents: route.agents } }
      );
      updated++;
    } else {
      await AgentRoute.create({ ...route, gates: DEFAULT_GATES });
      created++;
    }
  }

  console.log(`[seedAgentRoutes] Created: ${created}, Updated: ${updated}`);
  return { created, updated };
}

module.exports = seedAgentRoutes;
