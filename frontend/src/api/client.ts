import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie automatically
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

async function refreshAccessToken(): Promise<string> {
  const res = await axios.post<{ accessToken: string }>(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  accessToken = res.data.accessToken;
  return accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;

      try {
        // De-duplicate concurrent refresh calls — if multiple requests 401
        // simultaneously, only one refresh request should hit the server.
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        accessToken = null;
        // Refresh failed — surface as unauthenticated; calling code should
        // redirect to login. Not handled here to keep this module UI-agnostic.
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
