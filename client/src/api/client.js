import axios from 'axios';
import API from '../endpoints.js';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// CSRF token handling
let csrfToken = null;

async function fetchCsrfToken() {
  try {
    const { data } = await axios.get(`${API_URL}${API.CSRF_TOKEN}`);
    csrfToken = data.token;
    return csrfToken;
  } catch {
    // CSRF token fetch is non-critical for initial load
  }
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
    if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
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

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
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

    return Promise.reject(error);
  }
);

export { getToken, setTokens, clearTokens, getRefreshToken, fetchCsrfToken };
export default client;
