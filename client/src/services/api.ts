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
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/guest-login');
      
      if (!isAuthEndpoint) {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
        
        const currentPath = window.location.pathname;
        const isPublicPage = currentPath === '/' || currentPath === '/hotels' || currentPath === '/rooms' || currentPath === '/login' || currentPath === '/guest-login' || currentPath === '/register';

        if (!isPublicPage) {
          if (currentPath === '/guest-dashboard' || currentPath === '/my-bookings') {
            window.location.href = '/guest-login';
          } else {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
