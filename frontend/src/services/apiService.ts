import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiSuccessResponse, ApiErrorResponse } from '@/types'; // Assuming these are in src/types
// import { AuthContextType } from '@/contexts/AuthContext'; // Avoid direct import to prevent circular deps if AuthContext uses apiService

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig { // Use InternalAxiosRequestConfig for interceptors
  _retry?: boolean;
  _isRetryForTokenRefresh?: boolean;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

// --- Request Interceptor ---
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => { // Type config explicitly
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // console.log('Starting Request', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error: AxiosError) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// This is where token refresh logic is crucial.
// We need a way to access the refresh token logic, ideally without circular dependencies.
// One way is to have a separate function or event bus that AuthContext subscribes to.
// For this example, we'll simulate it and assume a function `attemptTokenRefresh` exists.

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// This function would ideally live in or be callable by AuthContext
// It should return the new accessToken or throw an error if refresh fails.
const attemptTokenRefresh = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken'); // Assuming refresh token is stored
  if (!refreshToken) {
    console.error('No refresh token available for refresh attempt.');
    // Dispatch a global logout event or directly call logout logic
    window.dispatchEvent(new CustomEvent('auth-logout-forced'));
    return Promise.reject(new Error('No refresh token.'));
  }
  try {
    // Use a separate axios instance for refresh to avoid interceptor loop
    const refreshAxiosInstance = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
    const response = await refreshAxiosInstance.post('/auth/refresh-token', { refreshToken });
    
    const newAccessToken = response.data.data.accessToken;
    const newRefreshToken = response.data.data.refreshToken; // If backend rotates refresh tokens

    if (!newAccessToken) {
      throw new Error('New access token not received from refresh endpoint.');
    }

    localStorage.setItem('accessToken', newAccessToken);
    if (newRefreshToken) { // If backend rotates refresh tokens
        localStorage.setItem('refreshToken', newRefreshToken);
    }
    apiService.setAuthToken(newAccessToken); // Update default header for subsequent requests
    
    console.log('Token refreshed successfully.');
    return newAccessToken;
  } catch (refreshError: any) {
    console.error('Token refresh attempt failed:', refreshError.response?.data || refreshError.message);
    // Dispatch a global logout event or directly call logout logic
    window.dispatchEvent(new CustomEvent('auth-logout-forced'));
    return Promise.reject(refreshError);
  }
};


axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiSuccessResponse>) => {
    return response; // TanStack Query will typically access response.data
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || error.message;
      const errorCode = (data as any)?.errorCode; // Custom error code from backend

      // Handle 401 Unauthorized - Potential token expiry
      if (status === 401 && errorCode !== 'INVALID_CREDENTIALS' && !originalRequest._isRetryForTokenRefresh) { // Don't retry if it was already a retry or simple bad creds
        if (!isRefreshing) {
          isRefreshing = true;
          originalRequest._isRetryForTokenRefresh = true; // Mark this request to avoid loop if refresh itself fails with 401
          
          try {
            const newAccessToken = await attemptTokenRefresh();
            processQueue(null, newAccessToken); // Process queued requests with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return axiosInstance(originalRequest); // Retry original request with new token
          } catch (refreshError: any) {
            processQueue(refreshError, null); // Reject queued requests
            // Logout should be triggered by attemptTokenRefresh failure via event
            return Promise.reject(data || error); // Propagate original 401 or refresh error
          } finally {
            isRefreshing = false;
          }
        } else {
          // Add request to queue if another request is already refreshing token
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          }).catch(err => {
            return Promise.reject(err); // Propagate error from queue processing
          });
        }
      }
      
      // For other errors, create a structured error object
      const structuredError: ApiErrorResponse = {
        success: false,
        message: errorMessage,
        errors: data?.errors,
        statusCode: status,
        ...(errorCode && { errorCode }), // Add custom error code if present
      };
      return Promise.reject(structuredError);

    } else if (error.request) {
      // Network error
      console.error('Network Error:', error.request);
      const networkError: ApiErrorResponse = {
        success: false, message: 'Network error. Please check your connection.', statusCode: 0, errorCode: 'NETWORK_ERROR'
      };
      return Promise.reject(networkError);
    } else {
      // Setup error
      console.error('Axios Setup Error:', error.message);
      const setupError: ApiErrorResponse = {
        success: false, message: error.message || 'An unexpected error occurred.', statusCode: 0, errorCode: 'SETUP_ERROR'
      };
      return Promise.reject(setupError);
    }
  }
);

// Request Cancellation: TanStack Query handles this automatically for its queries
// when components unmount or query keys change, if using AbortController.
// For manual cancellation with Axios:
// const source = axios.CancelToken.source();
// apiService.get('/some-endpoint', { cancelToken: source.token });
// source.cancel('Operation canceled by the user.');

const apiService = {
  setAuthToken: (token: string | null) => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
  },
  // Generic methods now return the full AxiosResponse for TanStack Query to handle
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiSuccessResponse<T>>> => {
    return axiosInstance.get(url, config);
  },
  post: async <T = any, R = any>(url: string, data?: T, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiSuccessResponse<R>>> => {
    return axiosInstance.post(url, data, config);
  },
  put: async <T = any, R = any>(url: string, data?: T, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiSuccessResponse<R>>> => {
    return axiosInstance.put(url, data, config);
  },
  patch: async <T = any, R = any>(url: string, data?: T, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiSuccessResponse<R>>> => {
    return axiosInstance.patch(url, data, config);
  },
  delete: async <R = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiSuccessResponse<R>>> => {
    return axiosInstance.delete(url, config);
  },
};

export default apiService;
