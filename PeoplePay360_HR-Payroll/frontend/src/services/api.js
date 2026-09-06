import axios from 'axios';

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = `http://${hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Single shared in-flight refresh promise for all concurrent requests
let refreshPromise = null;

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('peoplepay360_token');
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatic Refresh Token Rotation Handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors
    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Skip retry for login, refresh, or requests that have already been retried once
    if (
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const currentRefreshToken = localStorage.getItem('peoplepay360_refresh_token');
    if (!currentRefreshToken) {
      localStorage.removeItem('peoplepay360_token');
      localStorage.removeItem('peoplepay360_refresh_token');
      localStorage.removeItem('peoplepay360_user');
      window.dispatchEvent(new Event('auth:session_expired'));
      return Promise.reject(error);
    }

    // Initialize the shared refresh promise if not already in-flight
    if (!refreshPromise) {
      refreshPromise = axios
        .post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: currentRefreshToken
        })
        .then((res) => {
          if (res.data && res.data.success) {
            const newAccessToken = res.data.accessToken || res.data.token;
            const newRefreshToken = res.data.refreshToken;

            localStorage.setItem('peoplepay360_token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('peoplepay360_refresh_token', newRefreshToken);
            }

            // Sync Authorization header defaults
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

            // Notify AuthContext of rotated tokens
            window.dispatchEvent(
              new CustomEvent('auth:token_rotated', {
                detail: { accessToken: newAccessToken, refreshToken: newRefreshToken }
              })
            );

            return newAccessToken;
          }
          throw new Error(res.data?.message || 'Token refresh was unsuccessful');
        })
        .catch((refreshErr) => {
          localStorage.removeItem('peoplepay360_token');
          localStorage.removeItem('peoplepay360_refresh_token');
          localStorage.removeItem('peoplepay360_user');
          window.dispatchEvent(new Event('auth:session_expired'));
          return Promise.reject(refreshErr);
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const freshAccessToken = await refreshPromise;

      // Update authorization header on the original request
      if (originalRequest.headers) {
        if (typeof originalRequest.headers.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${freshAccessToken}`);
        } else {
          originalRequest.headers['Authorization'] = `Bearer ${freshAccessToken}`;
          originalRequest.headers['authorization'] = `Bearer ${freshAccessToken}`;
        }
      }

      return api(originalRequest);
    } catch (retryErr) {
      return Promise.reject(retryErr);
    }
  }
);

export default api;
