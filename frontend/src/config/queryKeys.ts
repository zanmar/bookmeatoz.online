

// Query keys should be structured to allow for easy invalidation and selection.
// Generally: [entityName, type (list/detail), params/id]

export const queryKeys = {
  all: ['allBookMeAtOzData'] as const, // Root key for global invalidation if needed

  // Auth
  currentUser: ['currentUser'] as const,

  // Tenants
  tenants: {
    all: () => [...queryKeys.all, 'tenants'] as const,
    lists: () => [...queryKeys.tenants.all(), 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.tenants.lists(), filters || {}] as const,
    details: () => [...queryKeys.tenants.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.tenants.details(), id] as const,
    current: () => [...queryKeys.tenants.all(), 'current'] as const, // For current tenant from context
  },

  // Businesses
  businesses: {
    all: () => [...queryKeys.all, 'businesses'] as const,
    lists: () => [...queryKeys.businesses.all(), 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.businesses.lists(), filters || {}] as const,
    details: () => [...queryKeys.businesses.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.businesses.details(), id] as const,
    byTenant: (tenantId: string | null | undefined) => [...queryKeys.businesses.all(), 'byTenant', tenantId || 'none'] as const,
    current: () => [...queryKeys.businesses.all(), 'current'] as const, // For current business from context
    publicProfileBySubdomain: (subdomain: string) => [...queryKeys.businesses.all(), 'publicProfile', subdomain] as const,
  },
  
  // Services
  services: {
    all: (businessId?: string | null) => [...queryKeys.businesses.detail(businessId || 'current'), 'services'] as const,
    lists: (businessId?: string | null) => [...queryKeys.services.all(businessId), 'list'] as const,
    list: (businessId: string | null | undefined, filters?: Record<string, any>) => 
        [...queryKeys.services.lists(businessId), filters || {}] as const,
    details: (businessId?: string | null) => [...queryKeys.services.all(businessId), 'detail'] as const,
    detail: (businessId: string | null | undefined, serviceId: string) => 
        [...queryKeys.services.details(businessId), serviceId] as const,
    publicListByBusiness: (businessId: string) => [...queryKeys.services.all(businessId), 'publicList'] as const,
  },

  // Employees (employeeId here is employees.id)
  employees: {
    all: (businessId?: string | null) => [...queryKeys.businesses.detail(businessId || 'current'), 'employees'] as const,
    lists: (businessId?: string | null) => [...queryKeys.employees.all(businessId), 'list'] as const,
    list: (businessId: string | null | undefined, filters?: Record<string, any>) => 
        [...queryKeys.employees.lists(businessId), filters || {}] as const,
    details: (businessId?: string | null) => [...queryKeys.employees.all(businessId), 'detail'] as const,
    detail: (businessId: string | null | undefined, employeeId: string) => 
        [...queryKeys.employees.details(businessId), employeeId] as const,
    publicListByService: (businessId: string, serviceId: string) => 
        [...queryKeys.employees.all(businessId), 'publicListByService', serviceId] as const,
  },

  // Schedules (for a specific employee)
  schedules: {
    all: (employeeId: string) => [...queryKeys.employees.detail('anyBusiness', employeeId), 'schedule'] as const, // 'anyBusiness' if employeeId is globally unique for schedules
    workingHours: (employeeId: string) => [...queryKeys.schedules.all(employeeId), 'workingHours'] as const,
    overrides: (employeeId: string, dateRange?: {from?: string, to?: string}) => 
        [...queryKeys.schedules.all(employeeId), 'overrides', dateRange || {}] as const,
  },

  // Customers
  customers: {
    all: (businessId?: string | null) => [...queryKeys.businesses.detail(businessId || 'current'), 'customers'] as const,
    lists: (businessId?: string | null) => [...queryKeys.customers.all(businessId), 'list'] as const,
    list: (businessId: string | null | undefined, filters?: Record<string, any>, pagination?: {page: number, limit: number}) => 
        [...queryKeys.customers.lists(businessId), filters || {}, pagination || {}] as const,
    details: (businessId?: string | null) => [...queryKeys.customers.all(businessId), 'detail'] as const,
    detail: (businessId: string | null | undefined, customerId: string) => 
        [...queryKeys.customers.details(businessId), customerId] as const,
  },

  // Bookings
  bookings: {
    all: (businessId?: string | null) => [...queryKeys.businesses.detail(businessId || 'current'), 'bookings'] as const,
    lists: (businessId?: string | null) => [...queryKeys.bookings.all(businessId), 'list'] as const,
    list: (businessId: string | null | undefined, filters?: Record<string, any>, pagination?: {page: number, limit: number}) =>
        [...queryKeys.bookings.lists(businessId), filters || {}, pagination || {}] as const,
    details: (businessId?: string | null) => [...queryKeys.bookings.all(businessId), 'detail'] as const,
    detail: (businessId: string | null | undefined, bookingId: string) => 
        [...queryKeys.bookings.details(businessId), bookingId] as const,
    availability: (businessId: string, query: AvailabilityQuery) => 
        [...queryKeys.bookings.all(businessId), 'availability', query] as const,
    slotCheck: (businessId: string, params: {service_id: string, start_time: string, employee_id?: string}) =>
        [...queryKeys.bookings.all(businessId), 'slotCheck', params] as const,
  },
  
  // Add other entities like user profiles, subscriptions etc.
};
