// models.ts
// Stub file for TypeScript type resolution. Add your model exports here as needed.

// BookMeAtOz - Main Database Models (TypeScript interfaces)
// Generated based on migrations and documentation

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'invited';
  profile: UserProfile | null;
  email_verified: boolean;
  last_login_at?: string;
  system_role?: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_setup';
  timezone: string;
  subdomain?: string;
  currency: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  business_id: string;
  employment_status: 'active' | 'inactive' | 'terminated' | 'pending_onboarding';
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface UserBusinessRole {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  status: 'active' | 'pending' | 'revoked';
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration: number;
  price: string;
  currency: string;
  status: 'active' | 'inactive' | 'archived';
  category_id?: string;
  is_private?: boolean;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface EmployeeService {
  id: string;
  employee_id: string;
  service_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkingHour {
  id: string;
  employee_id?: string;
  business_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_off: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAvailabilityOverride {
  id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  is_unavailable: boolean;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  user_id?: string;
  email: string;
  name: string;
  phone?: string;
  profile_notes?: string;
  status: 'active' | 'inactive' | 'blacklisted';
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  employee_id?: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'no_show';
  notes?: string;
  metadata?: any;
  booked_by_user_id?: string;
  cancellation_reason?: string;
  rescheduled_from_booking_id?: string;
  reminder_sent_24h?: boolean;
  reminder_sent_1h?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  currency: string;
  billing_interval: string;
  features: any;
  max_businesses: number;
  max_employees_per_business: number;
  max_bookings_per_month: number;
  max_storage_gb: number;
  max_api_calls_per_day: number;
  is_public: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'past_due' | 'cancelled' | 'trialing';
  started_at: string;
  expires_at?: string;
  trial_ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  payment_provider?: string;
  payment_provider_subscription_id?: string;
  payment_method_details?: any;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantAdmin {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface TokenBlacklist {
  id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface PasswordReset {
  id: string;
  user_id: string;
  token: string;
  token_hash?: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface EmailVerification {
  id: string;
  user_id: string;
  token: string;
  token_hash?: string;
  expires_at: string;
  verified_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  tenant_id?: string;
  business_id?: string;
  type: string;
  title?: string;
  content: string;
  data?: any;
  read_status: boolean;
  read_at?: string;
  created_at: string;
}
