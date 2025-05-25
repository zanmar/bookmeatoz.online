// Centralized permissions constants for BookMeAtOz frontend
// Keep in sync with backend permissions if needed

export const PERMISSIONS = {
  MANAGE_TENANTS: 'manage_tenants',
  VIEW_ALL_DATA: 'view_all_data',
  MANAGE_TENANT_BUSINESSES: 'manage_tenant_businesses',
  MANAGE_TENANT_USERS: 'manage_tenant_users',
  VIEW_TENANT_REPORTS: 'view_tenant_reports',
  MANAGE_TENANT_SUBSCRIPTIONS: 'manage_tenant_subscriptions',
  MANAGE_BUSINESS_SETTINGS: 'manage_business_settings',
  MANAGE_SERVICES: 'manage_services',
  MANAGE_EMPLOYEES: 'manage_employees',
  MANAGE_SCHEDULES: 'manage_schedules',
  MANAGE_BOOKINGS: 'manage_bookings',
  VIEW_BUSINESS_REPORTS: 'view_business_reports',
  MANAGE_CUSTOMERS: 'manage_customers',
  MANAGE_BUSINESS_BILLING: 'manage_business_billing',
  VIEW_OWN_SCHEDULE: 'view_own_schedule',
  MANAGE_OWN_BOOKINGS: 'manage_own_bookings',
  VIEW_ASSIGNED_BOOKINGS: 'view_assigned_bookings',
  CREATE_BOOKINGS: 'create_bookings',
  VIEW_OWN_BOOKINGS: 'view_own_bookings',
  MANAGE_OWN_PROFILE: 'manage_own_profile',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
