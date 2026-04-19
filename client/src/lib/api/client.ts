import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors and normalization
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Auto Logout)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login?expired=true';
      }
    }

    // Normalize error message from backend successResponse/errorResponse structure
    const backendMessage = error.response?.data?.error?.message || error.response?.data?.message;
    const message = backendMessage || error.message || 'An unexpected error occurred';
    
    const normalizedError = new Error(message);
    (normalizedError as any).status = error.response?.status;
    (normalizedError as any).data = error.response?.data;
    (normalizedError as any).code = error.response?.data?.error?.code;

    return Promise.reject(normalizedError);
  }
);

export { apiClient };
export default apiClient;
