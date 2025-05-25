import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import toast from './utils/toast'; // Assuming your toast utility
import { optimizeForMobile } from './utils/mobileOptimization';
import { ApiErrorResponse } from './types';

// Initialize mobile optimizations immediately
setTimeout(() => {
  console.log('Applying mobile optimizations');
  optimizeForMobile();
}, 100);

// Global error handler for React Query
const handleQueryError = (error: unknown, contextType: 'query' | 'mutation') => {
  const err = error as ApiErrorResponse; // Assuming API errors are of this type
  console.error(`Global ${contextType} Error:`, err);
  let message = `An unexpected ${contextType} error occurred.`;
  if (err && err.message) {
    message = err.message;
  }
  // Show a global toast notification for errors
  toast.error(message, 7000); // Longer duration for errors

  // Specific handling for 401/403 that might not have been caught by apiService interceptor's refresh logic,
  // or if a query runs without a token initially.
  if (err && (err.statusCode === 401 || err.statusCode === 403)) {
    // Could trigger a global logout event if not already handled by token refresh logic
    // window.dispatchEvent(new CustomEvent('auth-logout-forced'));
    // For now, just a toast. AuthContext should handle actual logout on token expiry.
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes: data is fresh for 5 mins
      cacheTime: 1000 * 60 * 30, // 30 minutes: garbage collect inactive queries after 30 mins (for v4 compatibility)
      retry: (failureCount, error) => {
        const err = error as ApiErrorResponse;
        if (err.statusCode === 404 || err.statusCode === 403 || err.statusCode === 401) {
          return false; // Don't retry for "Not Found" or auth errors
        }
        return failureCount < 2; // Retry other errors up to 2 times (total 3 attempts)
      },
      refetchOnWindowFocus: true, // Refetch on window focus
      // queryFn: defaultQueryFn, // Can define a default query function if desired
    },
    mutations: {
      // onError: (error) => handleQueryError(error, 'mutation'), // Handled by MutationCache
    },
  },
  queryCache: new QueryCache({
    onError: (error) => handleQueryError(error, 'query'),
  }),
  mutationCache: new MutationCache({
    onError: (error) => handleQueryError(error, 'mutation'),
  }),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TenantProvider>
          <AuthProvider> {/* AuthProvider might need access to queryClient for invalidating auth queries on logout */}
            <App />
          </AuthProvider>
        </TenantProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
