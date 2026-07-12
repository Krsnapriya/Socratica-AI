import client, { setTokens, clearTokens } from './client.js';

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  if (data.token) setTokens(data.token, data.refreshToken);
  return data;
}

export async function register(email, password) {
  const { data } = await client.post('/auth/register', { email, password });
  if (data.token) setTokens(data.token, data.refreshToken);
  return data;
}

export async function fetchMe() {
  const { data } = await client.get('/auth/me');
  return data;
}

export async function logout() {
  try {
    await client.post('/auth/logout');
  } catch {
  } finally {
    clearTokens();
  }
}

export async function updateProfile(payload) {
  const { data } = await client.put('/auth/me', payload);
  return data;
}

export async function forgotPassword(email) {
  const { data } = await client.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await client.post('/auth/reset-password', { token, password });
  return data;
}

export async function verifyEmail(token) {
  const { data } = await client.post('/auth/verify-email', { token });
  return data;
}

// ── Problems ──────────────────────────────────────────────────────────────────
export async function fetchProblems() {
  const { data } = await client.get('/problems');
  return data;
}

export async function fetchProblem(problemId) {
  const { data } = await client.get(`/problems/${problemId}`);
  return data;
}

export async function fetchTemplate(problemId, lang) {
  const { data } = await client.get(`/problems/${problemId}/template?lang=${lang}`);
  return data;
}

// ── Curriculum ────────────────────────────────────────────────────────────────
export async function fetchCourses() {
  const { data } = await client.get('/courses');
  return data;
}

export async function unlockModule(moduleId) {
  const { data } = await client.post(`/courses/${moduleId}/unlock`);
  return data;
}

// ── Submissions ───────────────────────────────────────────────────────────────
export async function submitCode({ code, language, problemId, sessionId }) {
  const { data } = await client.post('/submissions', { code, language, problemId, sessionId });
  return data;
}

export async function fetchSession(sessionId) {
  const { data } = await client.get(`/submissions/session/${sessionId}`);
  return data;
}

export async function fetchStats() {
  const { data } = await client.get('/submissions/stats');
  return data;
}

export async function fetchRecentActivity(limit = 10) {
  const { data } = await client.get(`/submissions/recent?limit=${limit}`);
  return data;
}

export async function fetchSolved() {
  const { data } = await client.get('/submissions/solved');
  return data;
}

// ── Admin: Users ──────────────────────────────────────────────────────────────
export async function fetchAdminUsers(page = 1, search = '') {
  const params = new URLSearchParams({ page, limit: 50 });
  if (search) params.set('search', search);
  const { data } = await client.get(`/admin/users?${params}`);
  return data;
}

export async function fetchAdminStats() {
  const { data } = await client.get('/admin/stats');
  return data;
}

export async function updateAdminUserRole(userId, role) {
  const { data } = await client.put(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function createAdminUser(payload) {
  const { data } = await client.post('/admin/users', payload);
  return data;
}

export async function deleteAdminUser(userId) {
  const { data } = await client.delete(`/admin/users/${userId}`);
  return data;
}

// ── Admin: Courses & Modules ──────────────────────────────────────────────────
export async function fetchAdminCourses() {
  const { data } = await client.get('/admin/courses');
  return data;
}

export async function createCourse(payload) {
  const { data } = await client.post('/admin/courses', payload);
  return data;
}

export async function updateCourse(id, payload) {
  const { data } = await client.put(`/admin/courses/${id}`, payload);
  return data;
}

export async function deleteCourse(id) {
  const { data } = await client.delete(`/admin/courses/${id}`);
  return data;
}

export async function fetchAdminModules() {
  const { data } = await client.get('/admin/modules');
  return data;
}

export async function createModule(payload) {
  const { data } = await client.post('/admin/modules', payload);
  return data;
}

export async function updateModule(id, payload) {
  const { data } = await client.put(`/admin/modules/${id}`, payload);
  return data;
}

export async function deleteModule(id) {
  const { data } = await client.delete(`/admin/modules/${id}`);
  return data;
}

// ── Admin: Problems ───────────────────────────────────────────────────────────
export async function fetchAdminProblems() {
  const { data } = await client.get('/admin/problems');
  return data;
}

export async function createProblem(payload) {
  const { data } = await client.post('/admin/problems', payload);
  return data;
}

export async function updateProblem(id, payload) {
  const { data } = await client.put(`/admin/problems/${id}`, payload);
  return data;
}

export async function deleteProblem(id) {
  const { data } = await client.delete(`/admin/problems/${id}`);
  return data;
}

// ── Admin: Permissions ────────────────────────────────────────────────────────
export async function fetchPermissions() {
  const { data } = await client.get('/admin/permissions');
  return data;
}

export async function createPermission(payload) {
  const { data } = await client.post('/admin/permissions', payload);
  return data;
}

export async function updatePermission(id, payload) {
  const { data } = await client.put(`/admin/permissions/${id}`, payload);
  return data;
}

export async function deletePermission(id) {
  const { data } = await client.delete(`/admin/permissions/${id}`);
  return data;
}

// ── Admin: Config ─────────────────────────────────────────────────────────────
export async function fetchSystemConfig() {
  const { data } = await client.get('/admin/config');
  return data;
}

export async function updateSystemConfig(key, value) {
  const { data } = await client.put(`/admin/config/${key}`, { value });
  return data;
}

// ── Admin: Audit Logs ─────────────────────────────────────────────────────────
export async function fetchAdminLogs(page = 1, params = {}) {
  const qp = new URLSearchParams({ page, limit: 50, ...params });
  const { data } = await client.get(`/admin/logs?${qp}`);
  return data;
}

// ── Admin: Security ───────────────────────────────────────────────────────────
export async function fetchSecurityOverview() {
  const { data } = await client.get('/admin/security/overview');
  return data;
}

export async function fetchFailedLogins(page = 1, days = 7) {
  const { data } = await client.get(`/admin/security/failed-logins?page=${page}&days=${days}`);
  return data;
}

export async function forceLogoutUser(userId) {
  const { data } = await client.post(`/admin/security/force-logout/${userId}`);
  return data;
}

// ── Admin: Notifications ──────────────────────────────────────────────────────
export async function fetchAdminNotifications(page = 1) {
  const { data } = await client.get(`/admin/notifications?page=${page}`);
  return data;
}

export async function createNotification(payload) {
  const { data } = await client.post('/admin/notifications', payload);
  return data;
}

export async function deleteNotification(id) {
  const { data } = await client.delete(`/admin/notifications/${id}`);
  return data;
}

// ── Notifications (public) ────────────────────────────────────────────────────
export async function fetchActiveNotifications() {
  const { data } = await client.get('/notifications/active');
  return data;
}
