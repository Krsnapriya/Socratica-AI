// Socratica AI — Frontend Constants
// All hardcoded values centralized here.

// ── localStorage Keys ──────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN: "socratica-token",
  REFRESH_TOKEN: "socratica-refresh-token",
  EMAIL: "socratica-email",
  LAST_SESSION_ID: "socratica-last-session-id",
};

// ── Roles ──────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  STUDENT: "student",
  GUEST: "guest",
};

export const ROLE_OPTIONS = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT, ROLES.GUEST];

// ── Languages ──────────────────────────────────────────────────────────────
export const LANGUAGES = [
  { id: "python", label: "Python 3.10", ext: ".py" },
  { id: "cpp", label: "C++20", ext: ".cpp" },
  { id: "javascript", label: "JavaScript", ext: ".js" },
];

export const LANGUAGE_IDS = LANGUAGES.map(l => l.id);

// ── Problem Categories ─────────────────────────────────────────────────────
export const CATEGORIES = [
  "Arrays & Hashing",
  "Two Pointers",
  "Searching & Sorting",
  "Dynamic Programming",
  "Math & DP",
  "Stacks & Linked Lists",
  "Greedy Algorithms",
];

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

// ── Reference Solution Variants ────────────────────────────────────────────
export const SOLUTION_VARIANTS = [
  "most_readable",
  "fastest",
  "least_memory",
  "functional",
  "interview_style",
];

// ── AI Defaults ────────────────────────────────────────────────────────────
export const AI_DEFAULTS = {
  temperature: 0.7,
  maxTokens: 4096,
  quizDifficulty: "medium",
  quizCount: 3,
  mentoringStyle: "mentoring",
  prompts: {
    curriculum: "Help me design a curriculum for this course. What topics should I cover and in what order?",
    assessment: "Generate a quiz for this module",
    insights: "Give me insights on student performance and class engagement.",
    platformIntel: "Give me a platform health overview.",
    security: "Give me a security overview of the platform.",
    governance: "Review our role and permission configuration.",
    guestChat: "Tell me about Socratica AI and what you can help me with.",
    guestSyllabus: "Select a problem first to explore its topic.",
    explainApproach: "Can you explain the approach to solve this problem? I want to understand the algorithm, not get the code.",
    chatDefault: "I have a question.",
  },
};

// ── Feature Defaults ───────────────────────────────────────────────────────
export const FEATURE_DEFAULTS = {
  maintenanceMode: false,
  allowRegistration: true,
  enableAIHints: true,
  aiProvider: "nvidia",
};

// ── Default Limits ─────────────────────────────────────────────────────────
export const DEFAULT_LIMITS = {
  adminPageSize: 50,
  recentActivityLimit: 10,
  aiHistoryLimit: 10,
  failedLoginsDays: 7,
  aiUsageStatsDays: 7,
  notificationLimit: 10,
  maxWeakAreas: 10,
  maxStrengths: 5,
};

// ── Compiler Defaults (for admin dashboard) ────────────────────────────────
export const COMPILER_DEFAULTS = {
  python: { memoryMb: 256, timeoutMs: 8000 },
  cpp: { memoryMb: 512, timeoutMs: 12000 },
  javascript: { memoryMb: 256, timeoutMs: 8000 },
};

// ── Notification Types & Audiences ─────────────────────────────────────────
export const NOTIFICATION_TYPES = ['broadcast', 'info', 'warning', 'announcement'];
export const NOTIFICATION_AUDIENCES = ['all', 'students', 'instructors', 'admins'];

// ── Audit Log Types ────────────────────────────────────────────────────────
export const LOG_FILTER_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'audit', label: 'Audit Only' },
  { value: 'submissions', label: 'Submissions Only' },
];

// ── Sandbox Info ───────────────────────────────────────────────────────────
export const SANDBOX_INFO = {
  images: {
    python: 'socratica/sandbox-python',
    cpp: 'socratica/sandbox-cpp',
    javascript: 'socratica/sandbox-javascript',
  },
  engine: 'Docker containers (configured in languageConfigs.js)',
};

// ── Admin Display Constants ────────────────────────────────────────────────
export const DIFFICULTY_STYLES = {
  Easy: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
  Medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  Hard: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
};

export const ROLE_BADGE_STYLES = {
  super_admin: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' },
  admin: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  instructor: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/30' },
  student: { bg: 'bg-on-surface/10', text: 'text-on-surface', border: 'border-on-surface/30' },
  guest: { bg: 'bg-on-surface/10', text: 'text-on-surface', border: 'border-on-surface/30' },
};

export const NOTIFICATION_TYPE_STYLES = {
  broadcast: { bg: 'bg-surface-container', text: 'text-on-surface-variant', border: 'border-outline-variant' },
  info: { bg: 'bg-surface-container', text: 'text-on-surface-variant', border: 'border-outline-variant' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  announcement: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
};

export const AUDIT_LOG_TYPE_STYLES = {
  audit: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/30' },
  submissions: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
};

// ── Admin Config Defaults ─────────────────────────────────────────────────
export const ACTIVE_SESSION_THRESHOLD_MINUTES = 15;
export const SECURITY_WINDOW_DAYS = 7;
export const SECURITY_WINDOW_HOURS = 24;
export const DEFAULT_AI_PROVIDER = 'nvidia';
export const DEFAULT_ROLE = 'student';
export const SESSION_DURATION_HOURS = 24;
export const API_KEY_ENV_HINT = 'Set via environment variable: NVIDIA_API_KEY';

// ── Permission Actions ────────────────────────────────────────────────────
export const PERMISSION_ACTIONS = ['create', 'read', 'update', 'delete', 'manage', 'access'];
export const PERMISSION_RESOURCES = ['users', 'courses', 'modules', 'problems', 'submissions', 'compiler', 'ai', 'notifications', 'permissions', 'audit_logs', 'analytics'];

// ── Platform Modules (for module-level access control) ───────────────────────
export const PLATFORM_MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'curriculum', label: 'Curriculum', icon: 'school' },
  { key: 'compiler', label: 'Compiler', icon: 'terminal' },
  { key: 'ai', label: 'AI Mentor', icon: 'smart_toy' },
  { key: 'analytics', label: 'Analytics', icon: 'insights' },
  { key: 'user-management', label: 'User Management', icon: 'group' },
  { key: 'settings', label: 'Platform Settings', icon: 'settings' },
];

// ── UI Timing ──────────────────────────────────────────────────────────────
export const UI_TIMING = {
  savedBannerMs: 3000,
  toastDurationMs: 4000,
};

// ── Branding ───────────────────────────────────────────────────────────────
export const BRANDING = {
  name: "Socratica AI",
  tagline: "Differential Execution Judge",
  sandboxInfo: "Sandbox \u00b7 Network-isolated \u00b7 256MB RAM \u00b7 2s CPU cap",
};

// ── Role-Based AI Welcome Texts ────────────────────────────────────────────
export const ROLE_AI_WELCOME = {
  [ROLES.INSTRUCTOR]: { title: "AI Teaching Assistant", desc: "Design curricula, generate assessments, and analyze class performance. I help you teach more effectively." },
  [ROLES.ADMIN]: { title: "AI Operations Analyst", desc: "Get platform intelligence, content quality reports, and moderation insights. Data-driven decisions for your platform." },
  [ROLES.SUPER_ADMIN]: { title: "AI System Advisor", desc: "Monitor system health, review security posture, and ensure governance compliance. Strategic insights for your infrastructure." },
  [ROLES.GUEST]: { title: "Welcome to Socratica AI", desc: "Explore our AI-powered learning platform. Ask questions about topics or sign up for a personalized experience." },
  [ROLES.STUDENT]: { title: "Your AI Mentor", desc: "Ask questions about algorithms, get hints, or review your approach. I won't give you the code." },
};

// ── Role-Based AI Quick Actions ────────────────────────────────────────────
export const ROLE_AI_ACTIONS = {
  [ROLES.STUDENT]: [
    { id: "review", label: "Code Review", icon: "rate_review", color: "text-secondary" },
    { id: "quiz", label: "Quiz Me", icon: "quiz", color: "text-tertiary" },
    { id: "explain", label: "Explain Approach", icon: "lightbulb", color: "text-primary" },
    { id: "reflect", label: "Reflect", icon: "psychology", color: "text-secondary" },
    { id: "oracle", label: "Compare to Gold", icon: "compare_arrows", color: "text-tertiary" },
    { id: "hint", label: "Contextual Hint", icon: "tips_and_updates", color: "text-primary" },
    { id: "confidence", label: "Confidence Check", icon: "speed", color: "text-secondary" },
  ],
  [ROLES.INSTRUCTOR]: [
    { id: "curriculum", label: "Curriculum Design", icon: "school", color: "text-primary" },
    { id: "assessment", label: "Generate Assessment", icon: "quiz", color: "text-secondary" },
    { id: "insights", label: "Class Insights", icon: "insights", color: "text-tertiary" },
    { id: "chat", label: "Ask Question", icon: "chat", color: "text-primary" },
  ],
  [ROLES.ADMIN]: [
    { id: "platform-intel", label: "Platform Intel", icon: "analytics", color: "text-primary" },
    { id: "chat", label: "Ask Question", icon: "chat", color: "text-secondary" },
  ],
  [ROLES.SUPER_ADMIN]: [
    { id: "health", label: "System Health", icon: "monitor_heart", color: "text-primary" },
    { id: "security", label: "Security Review", icon: "security", color: "text-error" },
    { id: "governance", label: "Governance", icon: "admin_panel_settings", color: "text-secondary" },
    { id: "chat", label: "Ask Question", icon: "chat", color: "text-primary" },
  ],
  [ROLES.GUEST]: [
    { id: "guest-chat", label: "Ask a Question", icon: "chat", color: "text-primary" },
    { id: "guest-syllabus", label: "Explore Topic", icon: "explore", color: "text-secondary" },
  ],
};

// ── Role-Based AI Placeholder ──────────────────────────────────────────────
export const ROLE_AI_PLACEHOLDER = {
  [ROLES.INSTRUCTOR]: "Ask about curriculum, assessments, or class insights...",
  [ROLES.ADMIN]: "Ask about platform analytics or content quality...",
  [ROLES.SUPER_ADMIN]: "Ask about system health, security, or governance...",
  [ROLES.GUEST]: "Ask a question to explore Socratica AI...",
  [ROLES.STUDENT]: "Ask your mentor...",
};

// ── Monaco Editor Config ───────────────────────────────────────────────────
export const EDITOR_CONFIG = {
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 14,
  minimap: { enabled: false },
  lineNumbers: "on",
  roundedSelection: true,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 12 },
};

// ── Layout ─────────────────────────────────────────────────────────────────
export const LAYOUT = {
  maxContentWidth: "max-w-[1440px]",
  customInputHeight: "140px",
  heroMinHeight: "280px",
};
