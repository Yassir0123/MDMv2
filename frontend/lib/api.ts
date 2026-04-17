import axios from 'axios';
import { emitAppDataSync } from '@/lib/app-data-sync';
import { emitNotificationsRefresh } from '@/lib/notification-sync';

// 1. Create Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. REQUEST Interceptor (Attaches Token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. RESPONSE Interceptor (Handles Expiration)
api.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || '').toLowerCase();
    const url = response.config?.url || '';
    const shouldTriggerNotificationsRefresh =
      ["post", "put", "patch", "delete"].includes(method) &&
      !url.includes('/auth/login') &&
      !url.includes('/notifications');
    const shouldTriggerAppDataSync =
      ["post", "put", "patch", "delete"].includes(method) &&
      !url.includes('/auth/login') &&
      !url.includes('/notifications/read') &&
      !url.includes('/notifications');

    if (shouldTriggerNotificationsRefresh) {
      emitNotificationsRefresh(`api:${method}:${url}`);
    }

    if (shouldTriggerAppDataSync) {
      emitAppDataSync(`api:${method}:${url}`);
    }

    return response; // Request was successful
  },
  (error) => {
    // If Backend says "Unauthorized" (401) or "Forbidden" (403)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      
      // A. Check if we are already on the login page to avoid loops
      if (window.location.pathname !== '/login') {
        console.warn("Session expired or invalid token. Logging out...");
        
        // B. Clear local storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // C. Force redirect to login
        // We use window.location instead of useNavigate because this is outside a React Component
        window.location.href = "/"; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
