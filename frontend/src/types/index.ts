// Add these exports first
export * from './service.types';
export * from './employee.types';
export * from './availability.types';
export * from './booking.types';

// --- Common & API Response Types ---
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string> | Array<{ field?: string; message: string }>;
  statusCode: number;
  errorCode?: string; // Custom error code from backend
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  // Backend might wrap pagination details differently, adjust as needed
  // For example, if backend sends pagination object:
  // pagination: {
  //   total: number;
  //   page: number;
  //   limit: number;
  //   totalPages: number;
  // };
}


// --- User & Auth Types ---
export interface UserProfile { // Existing UserProfile is more detailed, keeping it.
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
}

// New User interface as requested by subtask
export interface User {
  id: string;
  email: string;
  profile?: UserProfile;
  // other user fields...
}

export type UserRole =  // Existing UserRole is more comprehensive, keeping it.
  | 'system_admin' 
  | 'tenant_admin' 
  | 'business_owner' 
  | 'manager' 
  | 'employee' 
  | 'customer';

// This should mirror the PERMISSIONS object from the backend (types/user.types.ts)
// For simplicity, string is used here, but a const object imported or duplicated is better.
export type Permission = string; 
// Updated PERMISSIONS based on subtask and existing values.
// Kept as a const object for consistency with existing codebase.
export const PERMISSIONS = { 
  MANAGE_TENANTS: 'manage_tenants', // Existing & New
  VIEW_ALL_DATA: 'view_all_data', // Existing
  MANAGE_TENANT_BUSINESSES: 'manage_tenant_businesses', // Existing
  MANAGE_TENANT_USERS: 'manage_tenant_users', // Existing & New
  VIEW_TENANT_REPORTS: 'view_tenant_reports', // Existing
  MANAGE_TENANT_SUBSCRIPTIONS: 'manage_tenant_subscriptions', // Existing
  MANAGE_BUSINESS_SETTINGS: 'manage_business_settings', // Existing & New
  MANAGE_SERVICES: 'manage_services', // Existing & New
  VIEW_SERVICES : 'view:services', // New
  MANAGE_EMPLOYEES: 'manage_employees', // Existing & New
  VIEW_EMPLOYEES : 'view:employees', // New
  MANAGE_SCHEDULES: 'manage_schedules', // Existing & New
  VIEW_SCHEDULES : 'view:schedules', // New
  MANAGE_BOOKINGS: 'manage_bookings', // Existing (covers MANAGE_ALL_BOOKINGS from subtask)
  MANAGE_ALL_BOOKINGS : 'manage:all_bookings', // New (explicitly adding as per subtask, can be alias or distinct)
  CREATE_BOOKINGS: 'create_bookings', // Existing (covers CREATE_BOOKING from subtask)
  CREATE_BOOKING : 'create:booking', // New (explicitly adding as per subtask)
  VIEW_OWN_BOOKINGS: 'view_own_bookings', // Existing & New
  VIEW_BUSINESS_REPORTS: 'view_business_reports', // Existing
  MANAGE_CUSTOMERS: 'manage_customers', // Existing & New
  MANAGE_BUSINESS_BILLING: 'manage_business_billing', // Existing
  VIEW_OWN_SCHEDULE: 'view_own_schedule', // Existing
  MANAGE_OWN_BOOKINGS: 'manage_own_bookings', // Existing
  VIEW_ASSIGNED_BOOKINGS: 'view_assigned_bookings', // Existing
  MANAGE_OWN_PROFILE: 'manage_own_profile', // Existing
} as const;


export interface AuthenticatedUser {
  id: string; // users.id
  email: string;
  profile: UserProfile | null;
  roles: UserRole[];
  permissions?: Permission[];
  currentTenantId?: string; // If user is operating within a specific tenant context
  currentBusinessId?: string; // If user is operating within a specific business context
  isTenantAdmin?: boolean; // Specific flag if they are a tenant admin
  system_role?: UserRole; // Global system role if any
  // Add other fields from JWT or user object needed by frontend
}

export interface LoginResponseData { // Data within the successful login response
  accessToken: string;
  refreshToken?: string;
  user: AuthenticatedUser; // Or a slightly different User DTO for login response
}


// --- Tenant & Business Types ---
export interface TenantInfo { // Existing TenantInfo is more detailed, keeping it.
  id: string;
  name: string;
  subdomain: string;
  settings?: Record<string, any>; // e.g., theme, logo
  // other relevant public/contextual info
}

export interface BusinessInfo { // Existing BusinessInfo is more detailed, keeping it.
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  timezone: string; // IANA timezone string
  currency: string; // e.g., USD
  // other relevant public/contextual info
  settings?: Partial<BusinessSettings>; // Lean version of settings
}

export interface BusinessSettings {
  name?: string; // Name can also be top-level on BusinessInfo
  slug?: string; // Slug can also be top-level
  description?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  // Operational settings that might be in the JSONB field
  timezone?: string; // This is usually a top-level field on the Business table
  currency?: string; // This is usually a top-level field on the Business table
  cancellationPolicyDays?: number;
  bookingLeadTimeHours?: number;
  bookingWindowDays?: number;
  logoUrl?: string;
  coverImageUrl?: string;
  themeColor?: string;
  welcomeMessage?: string;
  // Add other settings based on backend `businesses.settings` JSONB structure
}

// DTO for updating business (top-level fields and settings)
export interface UpdateBusinessDto extends Partial<Omit<BusinessInfo, 'id' | 'tenant_id' | 'settings'>> {
    settings?: Partial<BusinessSettings>; // Allows updating nested settings
}
// For updating just the settings part, often through a dedicated endpoint
export interface UpdateBusinessSettingsDto extends Partial<BusinessSettings> {}


// Full Business Profile (often fetched for settings page)
export interface BusinessProfile extends BusinessInfo { // Extends lean BusinessInfo
    // BusinessInfo already has: id, tenant_id, name, slug, timezone
    // Add fields that are top-level on the backend 'businesses' table but not in lean BusinessInfo
    currency: string; // Already in BusinessInfo if defined there
    status?: string; // business_status_type_v1
    // The 'settings' here should be the fully typed BusinessSettings
    settings: BusinessSettings; 
}

// --- Service Types ---
// The old Service, CreateServiceDto, and UpdateServiceDto are removed as Service is now imported from './service.types'.

// --- Employee & Schedule Types ---
// Matches backend EmployeeDetails
export interface EmployeeDetails {
  id: string; // employees.id (PK of employees table)
  user_id: string; // users.id (FK in employees table)
  business_id: string;
  email: string;
  name: string;
  profile_picture_url?: string;
  role: UserRole; // Role from user_business_roles for this business
  employment_status: 'active' | 'inactive' | 'terminated' | 'pending_onboarding';
  user_status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'invited';
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
}

export interface WorkingHourInput { // For form input when setting weekly schedule
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  is_off: boolean;
}
export type SetWorkingHoursDto = WorkingHourInput[]; // Array of inputs for the week

export interface WorkingHours extends WorkingHourInput { // As returned from API
  id: string;
  employee_id: string; // employees.id
  business_id?: string | null; // if it's a business default hour
  created_at: string;
  updated_at: string;
}

export interface AvailabilityOverrideInput { // For form input
  start_time: string; // ISO Date string (client will send UTC representation)
  end_time: string;   // ISO Date string (client will send UTC representation)
  is_unavailable: boolean;
  reason?: string;
}
export interface EmployeeAvailabilityOverride extends AvailabilityOverrideInput {
  id: string;
  employee_id: string; // employees.id
  created_at: string;
  updated_at: string;
}


// --- Customer Types ---
export interface Customer {
  id: string;
  business_id: string;
  user_id?: string | null;
  email: string;
  name: string;
  phone?: string | null;
  profile_notes?: string | null;
  status: 'active' | 'inactive' | 'blacklisted';
  settings?: Record<string, any>;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
}
export interface CreateCustomerDto extends Omit<Customer, 'id' | 'business_id' | 'created_at' | 'updated_at'> {}
export interface UpdateCustomerDto extends Partial<Omit<Customer, 'id' | 'business_id' | 'user_id' | 'created_at' | 'updated_at'>> {}


// --- Booking Types ---
export interface Booking {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  employee_id?: string | null; // employees.id
  start_time: string; // ISO Date string (UTC)
  end_time: string;   // ISO Date string (UTC)
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'no_show';
  notes?: string | null;
  metadata?: {
    price_at_booking?: number;
    currency_at_booking?: string;
    buffer_before?: number;
    buffer_after?: number;
    [key:string]: any; // Allow other custom metadata
  } | null;
  booked_by_user_id?: string | null; // users.id
  cancellation_reason?: string | null;
  rescheduled_from_booking_id?: string | null;
  reminder_sent_24h?: boolean;
  reminder_sent_1h?: boolean;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string

  // Optional fields often joined by backend for display:
  customer_name?: string;
  customer_email?: string;
  service_name?: string;
  service_duration?: number;
  employee_name?: string;
}

export interface CreateBookingDto { // For staff creating a booking for an existing customer
  service_id: string;
  customer_id: string; // Existing customer.id for this business
  employee_id?: string; // employees.id
  start_time: string; // UTC ISO Date string from client (selected slot start)
  notes?: string;
}

export interface CreatePublicBookingDto { // For public booking page, customer might be new
  service_id: string;
  employee_id?: string; // employees.id
  start_time: string; // UTC ISO Date string
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  customer_id?: string; // Optional: if an existing customer (linked to a user) is booking
}

export interface UpdateBookingStatusDto {
  status: Booking['status'];
  cancellation_reason?: string;
  notes?: string;
}

// TimeSlot and AvailabilityQuery are now imported from './availability.types'.
// Their definitions are removed from here.

// --- Notification Types ---
export type NotificationType = 
  | 'booking_confirmed' 
  | 'booking_cancelled' 
  | 'booking_rescheduled'
  | 'booking_reminder_24h'
  | 'booking_reminder_1h'
  | 'employee_invited'
  | 'new_message'
  | 'system_announcement'
  | 'password_reset_request'
  | 'email_verification_request';

export interface Notification {
  id: string;
  user_id: string;
  tenant_id?: string | null;
  business_id?: string | null;
  type: NotificationType;
  title?: string | null;
  content: string;
  data?: Record<string, any> | null;
  read_status: boolean;
  read_at?: string | null; // ISO Date string
  created_at: string; // ISO Date string
}
