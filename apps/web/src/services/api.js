// apps/web/src/services/api.ts
// Axios base instance with auth interceptor
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1';
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});
// Response interceptor for error handling
apiClient.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        // Token expired — clean up and redirect to home
        localStorage.removeItem('cp-calendar-auth');
        window.location.href = '/';
    }
    return Promise.reject(error);
});
//# sourceMappingURL=api.js.map