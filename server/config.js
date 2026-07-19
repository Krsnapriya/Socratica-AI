// Socratica AI — Centralized Configuration
// All hardcoded values live here. Override via env vars or SystemConfig.

const config = {
  // ── Sandbox / Docker ────────────────────────────────────────────────────
  sandbox: {
    languages: {
      python: {
        ext: ".py",
        image: process.env.SANDBOX_PYTHON_IMAGE || "socratica/sandbox-python:latest",
        memoryMb: parseInt(process.env.SANDBOX_PYTHON_MEMORY) || 256,
        cpuQuota: parseInt(process.env.SANDBOX_PYTHON_CPU) || 50000,
        timeoutMs: parseInt(process.env.SANDBOX_PYTHON_TIMEOUT) || 8000,
        compileTimeoutMs: 0,
        compile: null,
        run: "python3 {file}",
      },
      cpp: {
        ext: ".cpp",
        image: process.env.SANDBOX_CPP_IMAGE || "socratica/sandbox-cpp:latest",
        memoryMb: parseInt(process.env.SANDBOX_CPP_MEMORY) || 512,
        cpuQuota: parseInt(process.env.SANDBOX_CPP_CPU) || 100000,
        timeoutMs: parseInt(process.env.SANDBOX_CPP_TIMEOUT) || 12000,
        compileTimeoutMs: parseInt(process.env.SANDBOX_CPP_COMPILE_TIMEOUT) || 15000,
        compile: "g++ -std=c++17 -O2 -pipe -s {file} -o {bin}",
        run: "./{bin}",
      },
      javascript: {
        ext: ".js",
        image: process.env.SANDBOX_JS_IMAGE || "socratica/sandbox-javascript:latest",
        memoryMb: parseInt(process.env.SANDBOX_JS_MEMORY) || 256,
        cpuQuota: parseInt(process.env.SANDBOX_JS_CPU) || 50000,
        timeoutMs: parseInt(process.env.SANDBOX_JS_TIMEOUT) || 8000,
        compileTimeoutMs: 0,
        compile: null,
        run: "node {file}",
      },
    },
    cpuPeriod: parseInt(process.env.SANDBOX_CPU_PERIOD) || 100000,
    pidsLimit: parseInt(process.env.SANDBOX_PIDS_LIMIT) || 256,
    tmpfsSizeMb: parseInt(process.env.SANDBOX_TMPFS_SIZE) || 64,
    containerUser: process.env.SANDBOX_CONTAINER_USER || "1000:1000",
    graceTimeoutMs: parseInt(process.env.SANDBOX_GRACE_TIMEOUT) || 5000,
  },

  // ── Tracer ──────────────────────────────────────────────────────────────
  tracer: {
    maxSnapshots: parseInt(process.env.TRACER_MAX_SNAPSHOTS) || 2000,
    maxStdoutBytes: parseInt(process.env.TRACER_MAX_STDOUT) || 4096,
  },

  // ── LLM / AI ────────────────────────────────────────────────────────────
llm: {
    baseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
    model: process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7,
    topP: parseFloat(process.env.LLM_TOP_P) || 0.9,
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 4096,
    timeoutMs: parseInt(process.env.LLM_TIMEOUT) || 15000,
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES) || 2,
    circuitBreaker: {
      threshold: parseInt(process.env.LLM_CB_THRESHOLD) || 20,
      resetMs: parseInt(process.env.LLM_CB_RESET_MS) || 10000,
    },
  },

  // ── Rate Limiting ────────────────────────────────────────────────────────
  rateLimits: {
    api: {
      windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_API_MAX) || 100,
    },
    compiler: {
      windowMs: parseInt(process.env.RATE_LIMIT_COMPILER_WINDOW) || 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_COMPILER_MAX) || 10,
    },
    auth: {
      windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 20,
    },
    aiByRole: {
      guest: { requests: parseInt(process.env.RATE_LIMIT_GUEST) || 5, windowMs: 60000 },
      student: { requests: parseInt(process.env.RATE_LIMIT_STUDENT) || 30, windowMs: 60000 },
      instructor: { requests: parseInt(process.env.RATE_LIMIT_INSTRUCTOR) || 50, windowMs: 60000 },
      admin: { requests: parseInt(process.env.RATE_LIMIT_ADMIN) || 100, windowMs: 60000 },
      super_admin: { requests: parseInt(process.env.RATE_LIMIT_SUPER_ADMIN) || 200, windowMs: 60000 },
    },
  },

  // ── CSRF ─────────────────────────────────────────────────────────────────
  csrf: {
    maxAgeMs: parseInt(process.env.CSRF_MAX_AGE) || 86400000, // 24h
  },

  // ── Execution Limits ─────────────────────────────────────────────────────
  execution: {
    minCodeLength: parseInt(process.env.MIN_CODE_LENGTH) || 10,
    maxCustomInputBytes: parseInt(process.env.MAX_CUSTOM_INPUT) || 10000,
  },

  // ── AI Memory / Learning ─────────────────────────────────────────────────
  learning: {
    pathCacheTtlMs: parseInt(process.env.LEARNING_PATH_CACHE_TTL) || 3600000,
    weakAreaThreshold: parseInt(process.env.WEAK_AREA_THRESHOLD) || 2,
    maxWeakAreas: parseInt(process.env.MAX_WEAK_AREAS) || 10,
    maxStrengths: parseInt(process.env.MAX_STRENGTHS) || 5,
    maxCommonMistakes: parseInt(process.env.MAX_COMMON_MISTAKES) || 50,
    recentSubmissionWindow: parseInt(process.env.RECENT_SUBMISSION_WINDOW) || 50,
  },

  // ── Notifications ────────────────────────────────────────────────────────
  notifications: {
    activeLimit: parseInt(process.env.NOTIFICATION_LIMIT) || 10,
  },

  // ── Seed Data ────────────────────────────────────────────────────────────
  seed: {
    emails: {
      super_admin: process.env.SEED_SUPER_ADMIN_EMAIL || "super@socratica.ai",
      admin: process.env.SEED_ADMIN_EMAIL || "admin@socratica.ai",
      instructor: process.env.SEED_INSTRUCTOR_EMAIL || "instructor@socratica.ai",
      student: process.env.SEED_STUDENT_EMAIL || "student@socratica.ai",
      guest: process.env.SEED_GUEST_EMAIL || "guest@socratica.ai",
    },
  },

  // ── Roles ────────────────────────────────────────────────────────────────
  roles: ["super_admin", "admin", "instructor", "student", "guest"],
};

module.exports = config;
