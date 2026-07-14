// Socratica AI — API Endpoint Paths
// All backend route paths centralized here.

const API = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
  },

  CSRF_TOKEN: "/csrf-token",

  // ── Problems ──────────────────────────────────────────────────────────────
  PROBLEMS: {
    LIST: "/problems",
    GET: (id) => `/problems/${id}`,
    TEMPLATE: (id, lang) => `/problems/${id}/template?lang=${lang}`,
  },

  // ── Submissions ───────────────────────────────────────────────────────────
  SUBMISSIONS: {
    CREATE: "/submissions",
    SESSION: (id) => `/submissions/session/${id}`,
    STATS: "/submissions/stats",
    RECENT: (limit) => `/submissions/recent?limit=${limit}`,
    SOLVED: "/submissions/solved",
    SESSION_ANALYSIS: (id) => `/submissions/session/${id}/analysis`,
  },

  // ── Execute Engine ────────────────────────────────────────────────────────
  EXECUTE: {
    RUN: "/execute/run",
    SAMPLES: "/execute/samples",
    SUBMIT: "/execute/submit",
  },

  // ── Courses ───────────────────────────────────────────────────────────────
  COURSES: {
    LIST: "/courses",
    UNLOCK_MODULE: (id) => `/courses/${id}/unlock`,
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS: {
    ACTIVE: "/notifications/active",
  },

  // ── AI Mentor ─────────────────────────────────────────────────────────────
  AI: {
    CHAT: "/ai/chat",
    HISTORY: (limit) => `/ai/history?limit=${limit}`,
    CONVERSATION: (id) => `/ai/conversation/${id}`,
    CLEAR_HISTORY: "/ai/history",
    SYLLABUS: "/ai/syllabus",
    DEBUG: "/ai/debug",
    CODE_REVIEW: "/ai/code-review",
    CODE_REVIEW_CONTEXTUAL: "/ai/code-review-contextual",
    ORACLE_COMPARISON: "/ai/oracle-comparison",
    LEARNING_SUMMARY: "/ai/learning-summary",
    CONTEXTUAL_HINT: "/ai/contextual-hint",
    CONFIDENCE: "/ai/confidence",
    QUIZ: "/ai/quiz",
    INTERVIEW: "/ai/interview",
    REFLECT: "/ai/reflect",
    LEARNING_PATH: "/ai/learning-path",
    GUEST_CHAT: "/ai/guest/chat",
    GUEST_SYLLABUS: "/ai/guest/syllabus",
    INSTRUCTOR: {
      CURRICULUM: "/ai/instructor/curriculum",
      ASSESSMENT: "/ai/instructor/assessment",
      INSIGHTS: "/ai/instructor/insights",
      PROBLEM_AUTHOR: "/ai/instructor/problem-author",
    },
    ADMIN: {
      PLATFORM_INTEL: "/ai/admin/platform-intel",
      CONTENT_QUALITY: "/ai/admin/content-quality",
      MODERATION: "/ai/admin/moderation",
    },
    SUPER_ADMIN: {
      HEALTH: "/ai/super-admin/health",
      SECURITY: "/ai/super-admin/security",
      GOVERNANCE: "/ai/super-admin/governance",
    },
    USAGE_STATS: (days) => `/ai/usage-stats?days=${days}`,
    INSIGHTS: "/ai/insights",
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  ADMIN: {
    USERS: {
      LIST: (page, search) => {
        const params = new URLSearchParams({ page, limit: 50 });
        if (search) params.set("search", search);
        return `/admin/users?${params}`;
      },
      UPDATE_ROLE: (id) => `/admin/users/${id}/role`,
      CREATE: "/admin/users",
      DELETE: (id) => `/admin/users/${id}`,
    },
    STATS: "/admin/stats",
    COURSES: {
      LIST: "/admin/courses",
      CREATE: "/admin/courses",
      UPDATE: (id) => `/admin/courses/${id}`,
      DELETE: (id) => `/admin/courses/${id}`,
    },
    MODULES: {
      LIST: "/admin/modules",
      CREATE: "/admin/modules",
      UPDATE: (id) => `/admin/modules/${id}`,
      DELETE: (id) => `/admin/modules/${id}`,
    },
    PROBLEMS: {
      LIST: "/admin/problems",
      CREATE: "/admin/problems",
      UPDATE: (id) => `/admin/problems/${id}`,
      DELETE: (id) => `/admin/problems/${id}`,
    },
    TEST_CASES: {
      LIST: (filters) => {
        const params = new URLSearchParams();
        if (filters?.problemId) params.set("problemId", filters.problemId);
        if (filters?.visibility) params.set("visibility", filters.visibility);
        if (filters?.category) params.set("category", filters.category);
        if (filters?.language) params.set("language", filters.language);
        const qs = params.toString();
        return `/admin/testcases${qs ? `?${qs}` : ""}`;
      },
      CREATE: "/admin/testcases",
      UPDATE: (id) => `/admin/testcases/${id}`,
      DELETE: (id) => `/admin/testcases/${id}`,
    },
    DRIVERS: {
      LIST: (filters) => {
        const params = new URLSearchParams();
        if (filters?.problemId) params.set("problemId", filters.problemId);
        if (filters?.language) params.set("language", filters.language);
        const qs = params.toString();
        return `/admin/drivers${qs ? `?${qs}` : ""}`;
      },
      CREATE: "/admin/drivers",
      DELETE: (id) => `/admin/drivers/${id}`,
    },
    REFERENCE_SOLUTIONS: {
      LIST: (filters) => {
        const params = new URLSearchParams();
        if (filters?.problemId) params.set("problemId", filters.problemId);
        if (filters?.language) params.set("language", filters.language);
        const qs = params.toString();
        return `/admin/reference-solutions${qs ? `?${qs}` : ""}`;
      },
      CREATE: "/admin/reference-solutions",
      UPDATE: (id) => `/admin/reference-solutions/${id}`,
      DELETE: (id) => `/admin/reference-solutions/${id}`,
    },
    PERMISSIONS: {
      LIST: "/admin/permissions",
      CREATE: "/admin/permissions",
      UPDATE: (id) => `/admin/permissions/${id}`,
      DELETE: (id) => `/admin/permissions/${id}`,
    },
    CONFIG: {
      GET: "/admin/config",
      UPDATE: (key) => `/admin/config/${key}`,
    },
    LOGS: {
      LIST: (page, params) => {
        const qp = new URLSearchParams({ page, limit: 50, ...params });
        return `/admin/logs?${qp}`;
      },
    },
    SECURITY: {
      OVERVIEW: "/admin/security/overview",
      FAILED_LOGINS: (page, days) => `/admin/security/failed-logins?page=${page}&days=${days}`,
      FORCE_LOGOUT: (id) => `/admin/security/force-logout/${id}`,
    },
    NOTIFICATIONS: {
      LIST: (page) => `/admin/notifications?page=${page}`,
      CREATE: "/admin/notifications",
      DELETE: (id) => `/admin/notifications/${id}`,
    },
    SUBMISSIONS: {
      USER: (userId, page, filters) => {
        const params = new URLSearchParams({ page, limit: 20 });
        if (filters?.problemId) params.set("problemId", filters.problemId);
        if (filters?.verdict) params.set("verdict", filters.verdict);
        return `/admin/submissions/user/${userId}?${params}`;
      },
      SESSION_ANALYSIS: (id) => `/admin/submissions/session/${id}/analysis`,
    },
    SESSIONS: {
      LIST: (page, filters) => {
        const params = new URLSearchParams({ page, limit: 50 });
        if (filters?.userId) params.set("userId", filters.userId);
        if (filters?.problemId) params.set("problemId", filters.problemId);
        if (filters?.finalVerdict) params.set("finalVerdict", filters.finalVerdict);
        return `/admin/sessions?${params}`;
      },
    },
  },
};

export default API;
