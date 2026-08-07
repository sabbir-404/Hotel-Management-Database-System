import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hms_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle Token Expiration cleanly without interrupting public browsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      
      const currentPath = window.location.pathname;
      const isPublicPage = currentPath === '/' || currentPath === '/hotels' || currentPath === '/rooms' || currentPath === '/login';

      if (!isPublicPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
