import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTenant } from './contexts/TenantContext';

// Common Loading Fallback
import Spinner from './components/common/Spinner'; // Assuming Spinner is in common

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-neutral-lightest">
    <Spinner size="h-16 w-16" color="text-primary" />
    <p className="ml-4 text-lg text-primary-dark">Loading Page...</p>
  </div>
);

// Layouts
const MainLayout = lazy(() => import('./components/layouts/MainLayout')); // Assuming this exists for public pages
const AuthLayout = lazy(() => import('./components/layouts/AuthLayout'));
const DashboardLayout = lazy(() => import('./components/layouts/DashboardLayout'));

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage')); // Create this page
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));   // Create this page
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));     // Create this page

// Public Pages
const HomePage = lazy(() => import('./pages/public/HomePage')); // Create this page
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ServicesPage = lazy(() => import('./pages/public/ServicesPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const TenantHomePage = lazy(() => import('./pages/tenant/TenantHomePage')); // Create this page
const TenantPublicBookingPage = lazy(() => import('./pages/tenant/TenantPublicBookingPage'));

// Authenticated Dashboard Pages
const UserDashboardPage = lazy(() => import('./pages/dashboard/UserDashboardPage')); // Create this page
const BusinessSettingsPage = lazy(() => import('./pages/dashboard/business/BusinessSettingsPage')); // Create this page
const ManageServicesPage = lazy(() => import('./pages/dashboard/services/ManageServicesPage'));
const ManageEmployeesPage = lazy(() => import('./pages/dashboard/employees/ManageEmployeesPage'));
const ManageCustomersPage = lazy(() => import('./pages/dashboard/customers/ManageCustomersPage'));
const ManageBookingsPage = lazy(() => import('./pages/dashboard/bookings/ManageBookingsPage'));

const NotFoundPage = lazy(() => import('./pages/NotFoundPage')); // Create this page

// Import MobileTestPage for testing
// const MobileTestPage = lazy(() => import('./pages/debug/MobileTestPage'));

// Import Mobile Debug Info
const MobileDebugInfo = lazy(() => import('./components/debug/MobileDebugInfo'));


interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, user, isLoadingAuth, hasRole } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user?.roles && !hasRole(allowedRoles as any)) { // Cast if UserRole type is strict
    console.warn(`User ${user.email} with roles [${user.roles.join(', ')}] tried to access a route requiring roles [${allowedRoles.join(', ')}]`);
    return <Navigate to="/dashboard/unauthorized" replace />; // Or a dedicated unauthorized page
  }

  return children ? <>{children}</> : <Outlet />;
};


function App() {
  const { tenantInfo, isLoadingTenant, currentSubdomain } = useTenant();
  const { initializeAuth, isLoadingAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoadingTenant || isLoadingAuth) {
    return <LoadingFallback />;
  }

  const isTenantSite = !!currentSubdomain && !!tenantInfo; // Ensure tenantInfo is also loaded

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* --- Authentication Routes --- */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        </Route>

        {/* --- Authenticated Dashboard Routes --- */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} >
          <Route index element={<UserDashboardPage />} />
          <Route path="services" element={<ProtectedRoute allowedRoles={['business_owner', 'manager', 'tenant_admin', 'system_admin']}><ManageServicesPage /></ProtectedRoute>} />
          <Route path="employees" element={<ProtectedRoute allowedRoles={['business_owner', 'manager', 'tenant_admin', 'system_admin']}><ManageEmployeesPage /></ProtectedRoute>} />
          <Route path="customers" element={<ProtectedRoute allowedRoles={['business_owner', 'manager', 'tenant_admin', 'system_admin']}><ManageCustomersPage /></ProtectedRoute>} />
          <Route path="bookings" element={<ProtectedRoute allowedRoles={['business_owner', 'manager', 'employee', 'tenant_admin', 'system_admin']}><ManageBookingsPage /></ProtectedRoute>} />
          <Route path="business-settings" element={<ProtectedRoute allowedRoles={['business_owner', 'tenant_admin', 'system_admin']}><BusinessSettingsPage /></ProtectedRoute>} />
          {/* Add more dashboard routes: e.g., "my-schedule" for employees, "tenant-admin", "system-admin" sections */}
          <Route path="unauthorized" element={<div><h2>Access Denied</h2><p>You do not have permission to view this page.</p></div>} />
        </Route>


        {/* --- Public Routes / Main Site vs Tenant Site --- */}
        {isTenantSite ? (
          <Route path="/" element={<MainLayout />}> {/* Tenant sites might use MainLayout or a specific TenantLayout */}
            <Route index element={<TenantHomePage />} />
            <Route path="book" element={<TenantPublicBookingPage />} />
            <Route path="book/:serviceIdFromUrl" element={<TenantPublicBookingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        ) : (
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="contact" element={<ContactPage />} />
            {/* <Route path="mobile-test" element={<MobileTestPage />} /> */}
            {/* Add other public pages for main site: pricing, features, about, contact */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        )}
         {/* Fallback for any other unmatched route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      
    </Suspense>
  );
}

export default App;
