import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// CSRF not needed — backend uses JWT auth, not cookie sessions

async function fetchCsrfToken() {
  return null;
}

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

function getToken() {
  return localStorage.getItem('socratica-token');
}

function getRefreshToken() {
  return localStorage.getItem('socratica-refresh-token');
}

function setTokens(accessToken, refreshToken) {
  localStorage.setItem('socratica-token', accessToken);
  if (refreshToken) localStorage.setItem('socratica-refresh-token', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('socratica-token');
  localStorage.removeItem('socratica-refresh-token');
}

client.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ALWAYS reject non-2xx — no silent error objects leaking into state
    if (!error.response) {
      // Network error or timeout
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        setTokens(newToken, newRefreshToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // All non-401 errors: reject with parsed error message
    const msg = error.response?.data?.error
      || error.response?.data?.message
      || `Request failed (${error.response.status})`;
    const err = new Error(msg);
    err.status = error.response.status;
    err.data = error.response.data;
    return Promise.reject(err);
  }
);

export { getToken, setTokens, clearTokens, getRefreshToken, fetchCsrfToken };
export default client;
