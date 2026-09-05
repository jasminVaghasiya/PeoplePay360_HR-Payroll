import axios from 'axios';

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = `http://${hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('peoplepay360_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // Handle 401 Unauthorized / Token Expired
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      const refreshToken = localStorage.getItem('peoplepay360_refresh_token');

      if (!refreshToken) {
        // No refresh token available, logout session
        localStorage.removeItem('peoplepay360_token');
        localStorage.removeItem('peoplepay360_refresh_token');
        localStorage.removeItem('peoplepay360_user');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        if (res.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = res.data;

          localStorage.setItem('peoplepay360_token', accessToken);
          localStorage.setItem('peoplepay360_refresh_token', newRefreshToken);

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          processQueue(null, accessToken);
          isRefreshing = false;

          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        // Session expired - clear state
        localStorage.removeItem('peoplepay360_token');
        localStorage.removeItem('peoplepay360_refresh_token');
        localStorage.removeItem('peoplepay360_user');
        window.dispatchEvent(new Event('auth:session_expired'));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
