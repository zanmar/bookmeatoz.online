// This is a conceptual representation of folder creation.
// You would create these directories manually or via script in your project.

// /var/www/bookmeatoz.online_ts/frontend/src/components/
// /var/www/bookmeatoz.online_ts/frontend/src/components/common/ (e.g., Button, Input, Modal)
// /var/www/bookmeatoz.online_ts/frontend/src/components/layouts/ (e.g., MainLayout, AuthLayout, DashboardLayout)
// /var/www/bookmeatoz.online_ts/frontend/src/components/ui/ (More specific UI elements if needed)

// /var/www/bookmeatoz.online_ts/frontend/src/pages/
// /var/www/bookmeatoz.online_ts/frontend/src/pages/auth/
// /var/www/bookmeatoz.online_ts/frontend/src/pages/dashboard/
// /var/www/bookmeatoz.online_ts/frontend/src/pages/dashboard/business/
// /var/www/bookmeatoz.online_ts/frontend/src/pages/dashboard/services/
// /var/www/bookmeatoz.online_ts/frontend/src/pages/dashboard/bookings/
// /var/www/bookmeatoz.online_ts/frontend/src/pages/public/
// /var/www/bookmeatoz.online_ts/frontend/src/pages/tenant/

// /var/www/bookmeatoz.online_ts/frontend/src/contexts/

// /var/www/bookmeatoz.online_ts/frontend/src/hooks/ (e.g., useAuth, useTenant, useApi)

// /var/www/bookmeatoz.online_ts/frontend/src/types/ (shared frontend types)

// /var/www/bookmeatoz.online_ts/frontend/src/utils/ (helper functions)

// /var/www/bookmeatoz.online_ts/frontend/src/services/ (API service functions)

// /var/www/bookmeatoz.online_ts/frontend/src/assets/ (images, svgs, etc.)

// --- Initial Frontend Types ---
// /var/www/bookmeatoz.online_ts/frontend/src/types/index.ts
// (This mirrors some backend types for consistency, adapt as needed for frontend specific views)

export interface UserProfile {
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
}

export type UserRole = 'system_admin' | 'tenant_admin' | 'business_owner' | 'manager' | 'employee' | 'customer';
export type Permission = string; // Define specific permissions as needed, mirroring backend

export interface AuthenticatedUser {
  id: string;
  email: string;
  profile: UserProfile | null;
  roles: UserRole[];
  permissions?: Permission[]; // Derived permissions
  currentTenantId?: string;
  currentBusinessId?: string;
  isTenantAdmin?: boolean;
  // Add other fields from JWT or user object needed by frontend
}

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  // Add other tenant-specific details needed by frontend (e.g., theme, logo)
  settings?: Record<string, any>;
}

export interface BusinessInfo {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  timezone: string;
  // Add other business details needed by frontend
  settings?: Record<string, any>;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration: number; // minutes
  price: number; // or string
  // Add other service details
}

export interface Booking {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  employee_id?: string;
  start_time: string; // ISO Date string
  end_time: string; // ISO Date string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  notes?: string;
  // customerDetails, serviceDetails, employeeDetails might be populated for display
}

// API response structures
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string> | Array<{ field?: string; message: string }>;
  statusCode: number;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  statusCode: number;
}
