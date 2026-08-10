import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const jwt = localStorage.getItem('flashbook_jwt');
    if (jwt) {
      config.headers.Authorization = `Bearer ${jwt}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('flashbook_jwt');
      localStorage.removeItem('flashbook_user');
      if (window.location.pathname !== '/session-expired' && window.location.pathname !== '/login') {
        window.location.href = '/session-expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
