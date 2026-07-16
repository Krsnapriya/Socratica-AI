import client, { setTokens, clearTokens } from './client.js';
import API from '../endpoints.js';

// ── Public Config (no auth) ──────────────────────────────────────────────
let _publicConfigCache = null;
let _publicConfigTs = 0;
const PUBLIC_CONFIG_TTL = 60000; // 60s

export async function getPublicConfig() {
  const now = Date.now();
  if (_publicConfigCache && now - _publicConfigTs < PUBLIC_CONFIG_TTL) {
    return _publicConfigCache;
  }
  const { data } = await client.get(API.PUBLIC_CONFIG);
  _publicConfigCache = data;
  _publicConfigTs = now;
  return data;
}

export function invalidatePublicConfig() {
  _publicConfigCache = null;
  _publicConfigTs = 0;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const { data } = await client.post(API.AUTH.LOGIN, { email, password });
  if (data.token) setTokens(data.token, data.refreshToken);
  return data;
}

export async function register(email, password) {
  const { data } = await client.post(API.AUTH.REGISTER, { email, password });
  if (data.token) setTokens(data.token, data.refreshToken);
  return data;
}

export async function fetchMe() {
  const { data } = await client.get(API.AUTH.ME);
  return data;
}

export async function logout() {
  try {
    await client.post(API.AUTH.LOGOUT);
  } catch {
  } finally {
    clearTokens();
  }
}

export async function updateProfile(payload) {
  const { data } = await client.put(API.AUTH.ME, payload);
  return data;
}

export async function forgotPassword(email) {
  const { data } = await client.post(API.AUTH.FORGOT_PASSWORD, { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await client.post(API.AUTH.RESET_PASSWORD, { token, password });
  return data;
}

export async function verifyEmail(token) {
  const { data } = await client.post(API.AUTH.VERIFY_EMAIL, { token });
  return data;
}

// ── Problems ──────────────────────────────────────────────────────────────────
export async function fetchProblems() {
  const { data } = await client.get(API.PROBLEMS.LIST);
  return data;
}

export async function fetchProblem(problemId) {
  const { data } = await client.get(API.PROBLEMS.GET(problemId));
  return data;
}

export async function fetchTemplate(problemId, lang) {
  const { data } = await client.get(API.PROBLEMS.TEMPLATE(problemId, lang));
  return data;
}

// ── Curriculum ────────────────────────────────────────────────────────────────
export async function fetchCourses() {
  const { data } = await client.get(API.COURSES.LIST);
  return data;
}

export async function unlockModule(moduleId) {
  const { data } = await client.post(API.COURSES.UNLOCK_MODULE(moduleId));
  return data;
}

// ── Submissions ───────────────────────────────────────────────────────────────
export async function submitCode({ code, language, problemId, sessionId }) {
  const { data } = await client.post(API.SUBMISSIONS.CREATE, { code, language, problemId, sessionId });
  return data;
}

export async function fetchSession(sessionId) {
  const { data } = await client.get(API.SUBMISSIONS.SESSION(sessionId));
  return data;
}

export async function fetchStats() {
  const { data } = await client.get(API.SUBMISSIONS.STATS);
  return data;
}

export async function fetchRecentActivity(limit = 10) {
  const { data } = await client.get(API.SUBMISSIONS.RECENT(limit));
  return data;
}

export async function fetchSolved() {
  const { data } = await client.get(API.SUBMISSIONS.SOLVED);
  return data;
}

export async function fetchSessionAnalysis(sessionId) {
  const { data } = await client.get(API.SUBMISSIONS.SESSION_ANALYSIS(sessionId));
  return data;
}

// ── Execute Engine (3 modes) ─────────────────────────────────────────────────
export async function runCode({ code, language, problemId, customInput }) {
  const { data } = await client.post(API.EXECUTE.RUN, { code, language, problemId, customInput });
  return data;
}

export async function runSamples({ code, language, problemId }) {
  const { data } = await client.post(API.EXECUTE.SAMPLES, { code, language, problemId });
  return data;
}

export async function submitSolution({ code, language, problemId, sessionId }) {
  const { data } = await client.post(API.EXECUTE.SUBMIT, { code, language, problemId, sessionId });
  return data;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export async function fetchActiveNotifications() {
  const { data } = await client.get(API.NOTIFICATIONS.ACTIVE);
  return data;
}

// ── Admin: Test Cases ────────────────────────────────────────────────────────
export async function fetchAdminTestCases(filters = {}) {
  const { data } = await client.get(API.ADMIN.TEST_CASES.LIST(filters));
  return data;
}

export async function createTestCase(payload) {
  const { data } = await client.post(API.ADMIN.TEST_CASES.CREATE, payload);
  return data;
}

export async function updateTestCase(id, payload) {
  const { data } = await client.put(API.ADMIN.TEST_CASES.UPDATE(id), payload);
  return data;
}

export async function deleteTestCase(id) {
  const { data } = await client.delete(API.ADMIN.TEST_CASES.DELETE(id));
  return data;
}

// ── Admin: Driver Templates ──────────────────────────────────────────────────
export async function fetchAdminDrivers(filters = {}) {
  const { data } = await client.get(API.ADMIN.DRIVERS.LIST(filters));
  return data;
}

export async function createDriver(payload) {
  const { data } = await client.post(API.ADMIN.DRIVERS.CREATE, payload);
  return data;
}

export async function deleteDriver(id) {
  const { data } = await client.delete(API.ADMIN.DRIVERS.DELETE(id));
  return data;
}

// ── Admin: Reference Solutions ─────────────────────────────────────────────
export async function fetchAdminReferenceSolutions(filters = {}) {
  const { data } = await client.get(API.ADMIN.REFERENCE_SOLUTIONS.LIST(filters));
  return data;
}

export async function createAdminReferenceSolution(solution) {
  const { data } = await client.post(API.ADMIN.REFERENCE_SOLUTIONS.CREATE, solution);
  return data;
}

export async function updateAdminReferenceSolution(id, updates) {
  const { data } = await client.put(API.ADMIN.REFERENCE_SOLUTIONS.UPDATE(id), updates);
  return data;
}

export async function deleteAdminReferenceSolution(id) {
  const { data } = await client.delete(API.ADMIN.REFERENCE_SOLUTIONS.DELETE(id));
  return data;
}

// ── Admin: Users ──────────────────────────────────────────────────────────────
export async function fetchAdminUsers(page = 1, search = '') {
  const { data } = await client.get(API.ADMIN.USERS.LIST(page, search));
  return data;
}

export async function fetchAdminStats() {
  const { data } = await client.get(API.ADMIN.STATS);
  return data;
}

export async function updateAdminUserRole(userId, role) {
  const { data } = await client.put(API.ADMIN.USERS.UPDATE_ROLE(userId), { role });
  return data;
}

export async function createAdminUser(payload) {
  const { data } = await client.post(API.ADMIN.USERS.CREATE, payload);
  return data;
}

export async function deleteAdminUser(userId) {
  const { data } = await client.delete(API.ADMIN.USERS.DELETE(userId));
  return data;
}

// ── Admin: Courses & Modules ──────────────────────────────────────────────────
export async function fetchAdminCourses() {
  const { data } = await client.get(API.ADMIN.COURSES.LIST);
  return data;
}

export async function createCourse(payload) {
  const { data } = await client.post(API.ADMIN.COURSES.CREATE, payload);
  return data;
}

export async function updateCourse(id, payload) {
  const { data } = await client.put(API.ADMIN.COURSES.UPDATE(id), payload);
  return data;
}

export async function deleteCourse(id) {
  const { data } = await client.delete(API.ADMIN.COURSES.DELETE(id));
  return data;
}

export async function fetchAdminModules() {
  const { data } = await client.get(API.ADMIN.MODULES.LIST);
  return data;
}

export async function createModule(payload) {
  const { data } = await client.post(API.ADMIN.MODULES.CREATE, payload);
  return data;
}

export async function updateModule(id, payload) {
  const { data } = await client.put(API.ADMIN.MODULES.UPDATE(id), payload);
  return data;
}

export async function deleteModule(id) {
  const { data } = await client.delete(API.ADMIN.MODULES.DELETE(id));
  return data;
}

// ── Admin: Problems ───────────────────────────────────────────────────────────
export async function fetchAdminProblems() {
  const { data } = await client.get(API.ADMIN.PROBLEMS.LIST);
  return data;
}

export async function createProblem(payload) {
  const { data } = await client.post(API.ADMIN.PROBLEMS.CREATE, payload);
  return data;
}

export async function updateProblem(id, payload) {
  const { data } = await client.put(API.ADMIN.PROBLEMS.UPDATE(id), payload);
  return data;
}

export async function deleteProblem(id) {
  const { data } = await client.delete(API.ADMIN.PROBLEMS.DELETE(id));
  return data;
}

// ── Admin: Permissions ────────────────────────────────────────────────────────
export async function fetchPermissions() {
  const { data } = await client.get(API.ADMIN.PERMISSIONS.LIST);
  return data;
}

export async function createPermission(payload) {
  const { data } = await client.post(API.ADMIN.PERMISSIONS.CREATE, payload);
  return data;
}

export async function updatePermission(id, payload) {
  const { data } = await client.put(API.ADMIN.PERMISSIONS.UPDATE(id), payload);
  return data;
}

export async function deletePermission(id) {
  const { data } = await client.delete(API.ADMIN.PERMISSIONS.DELETE(id));
  return data;
}

// ── Admin: Config ─────────────────────────────────────────────────────────────
export async function fetchSystemConfig() {
  const { data } = await client.get(API.ADMIN.CONFIG.GET);
  return data;
}

export async function updateSystemConfig(key, value) {
  const { data } = await client.put(API.ADMIN.CONFIG.UPDATE(key), { value });
  return data;
}

// ── Admin: Audit Logs ─────────────────────────────────────────────────────────
export async function fetchAdminLogs(page = 1, params = {}) {
  const { data } = await client.get(API.ADMIN.LOGS.LIST(page, params));
  return data;
}

// ── Admin: Security ───────────────────────────────────────────────────────────
export async function fetchSecurityOverview() {
  const { data } = await client.get(API.ADMIN.SECURITY.OVERVIEW);
  return data;
}

export async function fetchFailedLogins(page = 1, days = 7) {
  const { data } = await client.get(API.ADMIN.SECURITY.FAILED_LOGINS(page, days));
  return data;
}

export async function forceLogoutUser(userId) {
  const { data } = await client.post(API.ADMIN.SECURITY.FORCE_LOGOUT(userId));
  return data;
}

// ── Admin: Notifications ──────────────────────────────────────────────────────
export async function fetchAdminNotifications(page = 1) {
  const { data } = await client.get(API.ADMIN.NOTIFICATIONS.LIST(page));
  return data;
}

export async function createNotification(payload) {
  const { data } = await client.post(API.ADMIN.NOTIFICATIONS.CREATE, payload);
  return data;
}

export async function deleteNotification(id) {
  const { data } = await client.delete(API.ADMIN.NOTIFICATIONS.DELETE(id));
  return data;
}

// ── Admin: User Submissions & Sessions ────────────────────────────────────────
export async function fetchAdminUserSubmissions(userId, page = 1, filters = {}) {
  const { data } = await client.get(API.ADMIN.SUBMISSIONS.USER(userId, page, filters));
  return data;
}

export async function fetchAdminSessionAnalysis(sessionId) {
  const { data } = await client.get(API.ADMIN.SUBMISSIONS.SESSION_ANALYSIS(sessionId));
  return data;
}

export async function fetchAdminSessions(page = 1, filters = {}) {
  const { data } = await client.get(API.ADMIN.SESSIONS.LIST(page, filters));
  return data;
}

// ── AI Mentor ─────────────────────────────────────────────────────────────────
export async function aiChat({ message, sessionId, topic, context, style }) {
  const { data } = await client.post(API.AI.CHAT, { message, sessionId, topic, context, style });
  return data;
}

export async function aiSyllabus({ moduleId, problemId }) {
  const { data } = await client.post(API.AI.SYLLABUS, { moduleId, problemId });
  return data;
}

export async function aiDebug({ code, language, problemId, error, sessionId }) {
  const { data } = await client.post(API.AI.DEBUG, { code, language, problemId, error, sessionId });
  return data;
}

export async function aiCodeReview({ code, language, problemId, sessionId }) {
  const { data } = await client.post(API.AI.CODE_REVIEW, { code, language, problemId, sessionId });
  return data;
}

export async function aiQuiz({ moduleId, problemId, difficulty, count }) {
  const { data } = await client.post(API.AI.QUIZ, { moduleId, problemId, difficulty, count });
  return data;
}

export async function aiInterview({ topic, difficulty, type }) {
  const { data } = await client.post(API.AI.INTERVIEW, { topic, difficulty, type });
  return data;
}

export async function aiReflect({ sessionId, problemId }) {
  const { data } = await client.post(API.AI.REFLECT, { sessionId, problemId });
  return data;
}

export async function fetchAILearningPath() {
  const { data } = await client.get(API.AI.LEARNING_PATH);
  return data;
}

export async function fetchAIHistory(limit = 10) {
  const { data } = await client.get(API.AI.HISTORY(limit));
  return data;
}

export async function fetchAIConversation(sessionId) {
  const { data } = await client.get(API.AI.CONVERSATION(sessionId));
  return data;
}

export async function clearAIHistory(sessionId) {
  const { data } = await client.delete(API.AI.CLEAR_HISTORY, { data: { sessionId } });
  return data;
}

export async function aiCodeReviewContextual({ code, language, problemId }) {
  const { data } = await client.post(API.AI.CODE_REVIEW_CONTEXTUAL, { code, language, problemId });
  return data;
}

export async function aiOracleComparison({ code, language, problemId }) {
  const { data } = await client.post(API.AI.ORACLE_COMPARISON, { code, language, problemId });
  return data;
}

export async function aiLearningSummary({ sessionId }) {
  const { data } = await client.post(API.AI.LEARNING_SUMMARY, { sessionId });
  return data;
}

export async function aiContextualHint({ code, language, problemId, sessionId }) {
  const { data } = await client.post(API.AI.CONTEXTUAL_HINT, { code, language, problemId, sessionId });
  return data;
}

export async function aiConfidence({ code, language, problemId }) {
  const { data } = await client.post(API.AI.CONFIDENCE, { code, language, problemId });
  return data;
}

// ── Guest AI ────────────────────────────────────────────────────────────────
export async function aiGuestChat({ message, topic }) {
  const { data } = await client.post(API.AI.GUEST_CHAT, { message, topic });
  return data;
}

export async function aiGuestSyllabus({ problemId }) {
  const { data } = await client.post(API.AI.GUEST_SYLLABUS, { problemId });
  return data;
}

// ── Instructor AI ───────────────────────────────────────────────────────────
export async function aiInstructorCurriculum({ message, courses, moduleData }) {
  const { data } = await client.post(API.AI.INSTRUCTOR.CURRICULUM, { message, courses, moduleData });
  return data;
}

export async function aiInstructorAssessment({ message, problems, moduleData, assessmentType }) {
  const { data } = await client.post(API.AI.INSTRUCTOR.ASSESSMENT, { message, problems, moduleData, assessmentType });
  return data;
}

export async function aiInstructorInsights({ message, studentData, classData }) {
  const { data } = await client.post(API.AI.INSTRUCTOR.INSIGHTS, { message, studentData, classData });
  return data;
}

export async function aiInstructorProblemAuthor({ message, category, difficulty, existingProblems }) {
  const { data } = await client.post(API.AI.INSTRUCTOR.PROBLEM_AUTHOR, { message, category, difficulty, existingProblems });
  return data;
}

// ── Admin AI ────────────────────────────────────────────────────────────────
export async function aiAdminPlatformIntel({ message } = {}) {
  const params = message ? `?message=${encodeURIComponent(message)}` : '';
  const { data } = await client.get(`${API.AI.ADMIN.PLATFORM_INTEL}${params}`);
  return data;
}

export async function aiAdminContentQuality({ message, problems }) {
  const { data } = await client.post(API.AI.ADMIN.CONTENT_QUALITY, { message, problems });
  return data;
}

export async function aiAdminModeration({ message, flaggedContent, submissionPatterns }) {
  const { data } = await client.post(API.AI.ADMIN.MODERATION, { message, flaggedContent, submissionPatterns });
  return data;
}

// ── Super Admin AI ──────────────────────────────────────────────────────────
export async function aiSuperAdminHealth({ message } = {}) {
  const params = message ? `?message=${encodeURIComponent(message)}` : '';
  const { data } = await client.get(`${API.AI.SUPER_ADMIN.HEALTH}${params}`);
  return data;
}

export async function aiSuperAdminSecurity({ message }) {
  const { data } = await client.post(API.AI.SUPER_ADMIN.SECURITY, { message });
  return data;
}

export async function aiSuperAdminGovernance({ message }) {
  const { data } = await client.post(API.AI.SUPER_ADMIN.GOVERNANCE, { message });
  return data;
}

// ── AI Usage Stats (admin) ──────────────────────────────────────────────────
export async function fetchAIUsageStats(days = 7) {
  const { data } = await client.get(API.AI.USAGE_STATS(days));
  return data;
}
