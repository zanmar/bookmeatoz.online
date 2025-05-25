Multi-Tenancy Implementation for BookMeAtOz (TypeScript)
BookMeAtOz employs a robust multi-tenant architecture designed to provide each tenant (and their associated businesses) with a logically isolated environment. The primary strategy involves subdomain-based tenant identification, database-level data segregation using Row-Level Security (RLS), and application-level context management.

1. Tenant Identification and Routing
a. Subdomain-based Identification
DNS Configuration: A wildcard DNS record (e.g., *.bookmeatoz.online) points to the application's load balancer/web server.

Tenant/Business Subdomains:

Tenants might have a primary subdomain (e.g., mytenantgroup.bookmeatoz.online) defined in the tenants table.

Individual businesses within a tenant can also have their own unique subdomains (e.g., hairsalon.bookmeatoz.online or mybarber.mytenantgroup.bookmeatoz.online - depending on desired structure) defined in the businesses table. The current implementation leans towards globally unique business subdomains.

Request Handling Flow:

Client request to business-subdomain.bookmeatoz.online.

Nginx/Load Balancer: Forwards the request, preserving the Host header.

Frontend (React - TenantContext.tsx):

Detects the subdomain from window.location.hostname.

Fetches business/tenant-specific branding, settings, and public data (like services) using an API endpoint that can resolve context by subdomain (e.g., /api/v1/public/business-profile-by-subdomain/:subdomain).

Backend (Node.js/Express - tenantMiddleware.ts):

Extracts the subdomain from the Host header of incoming API requests.

Queries the businesses table (and tenants table via join) to find the matching business_id and tenant_id.

Populates req.subdomain, req.tenantId, and req.businessId.

Backend (contextMiddleware.ts & asyncContext.ts):

Takes req.tenantId, req.businessId, req.userId (from authMiddleware) and stores them in an AsyncLocalStorage store. This makes the context available throughout the request lifecycle without explicit passing.

Backend (db.ts - Database Connection Wrapper):

Before executing any query, retrieves the context from AsyncLocalStorage.

Sets PostgreSQL session variables: SET LOCAL app.current_tenant_id = '...', SET LOCAL app.current_business_id = '...', SET LOCAL app.current_user_id = '...'.

PostgreSQL Database:

Row-Level Security (RLS) policies use these session variables (via functions like current_session_tenant_id()) to filter data automatically, ensuring queries only access data relevant to the current context.

b. Backend Subdomain and Context Resolution (tenantMiddleware.ts, contextMiddleware.ts)
// Relevant parts from src/middleware/tenant.middleware.ts (Conceptual)
// const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   const hostname = req.headers.host || '';
//   const parts = hostname.split('.');
//   // ... logic to extract subdomain ...
//   if (req.subdomain) {
//     // Query DB: SELECT t.id as tenant_id, b.id as business_id FROM businesses b JOIN tenants t ... WHERE b.subdomain = $1
//     // req.tenantId = result.rows[0].tenant_id;
//     // req.businessId = result.rows[0].business_id;
//   }
//   next();
// };

// Relevant parts from src/middleware/context.middleware.ts (Conceptual)
// import { asyncLocalStorage } from '@/utils/asyncContext';
// const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
//   const store = {
//     requestId: uuidv4(),
//     tenantId: req.tenantId,
//     businessId: req.businessId,
//     userId: req.userId,
//     isSystemAdmin: req.roles?.includes('system_admin')
//   };
//   asyncLocalStorage.run(store, () => {
//     next();
//   });
// };

2. Data Isolation Strategy: Row-Level Security (RLS)
RLS is the primary mechanism for ensuring strict data isolation between tenants and businesses at the database level.

a. RLS Helper Functions (PostgreSQL)
These SQL functions are created by migrations and used within RLS policies to access the application context set in the database session:

-- Fetches 'app.current_tenant_id' session variable
CREATE OR REPLACE FUNCTION current_session_tenant_id() RETURNS UUID AS $$ ... $$ LANGUAGE plpgsql;
-- Fetches 'app.current_business_id' session variable
CREATE OR REPLACE FUNCTION current_session_business_id() RETURNS UUID AS $$ ... $$ LANGUAGE plpgsql;
-- Fetches 'app.current_user_id' session variable
CREATE OR REPLACE FUNCTION current_session_user_id() RETURNS UUID AS $$ ... $$ LANGUAGE plpgsql;
-- Fetches 'app.is_system_admin' session variable (boolean)
CREATE OR REPLACE FUNCTION is_system_admin() RETURNS BOOLEAN AS $$ ... $$ LANGUAGE plpgsql;

b. RLS Policies
RLS policies are applied to all relevant tables. Examples:

tenants table:

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_policy_tenants ON tenants
  FOR ALL USING (is_system_admin() OR id = current_session_tenant_id())
  WITH CHECK (is_system_admin() OR id = current_session_tenant_id());

businesses table:

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_policy_businesses ON businesses
  FOR ALL USING (is_system_admin() OR tenant_id = current_session_tenant_id() OR id = current_session_business_id())
  WITH CHECK (is_system_admin() OR tenant_id = current_session_tenant_id());

Business-Owned Tables (e.g., services, customers, bookings):
These tables have a direct business_id foreign key. Policies typically allow access if:

The user is a system admin.

The record's business_id matches current_session_business_id().

The record's business_id belongs to a business within the current_session_tenant_id() (for tenant admins).

The current_session_user_id() has a specific role in the record's business_id (e.g., an employee viewing bookings for their assigned business).

-- Example for 'services' table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_policy_services ON services
  FOR ALL USING (
    is_system_admin() OR
    business_id = current_session_business_id() OR
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = services.business_id AND b.tenant_id = current_session_tenant_id())
    -- Potentially add more conditions for specific user roles if needed beyond business/tenant context
  )
  WITH CHECK (
    is_system_admin() OR
    business_id = current_session_business_id() OR
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = services.business_id AND b.tenant_id = current_session_tenant_id())
  );

Employee-Related Schedule Tables (working_hours, employee_availability_overrides):
These are linked to employees.id, which in turn is linked to businesses.id. Policies ensure:

System admins have access.

An employee (current_session_user_id()) can access their own schedule (by matching employees.user_id).

Users with management roles within the employee's business (current_session_business_id()) can access the schedule.

c. Setting RLS Context in Database Connections (src/config/db.ts)
The backend's database connection logic uses AsyncLocalStorage to retrieve the current request's context and sets session-local variables before executing queries:

// Simplified from src/config/db.ts
// async function setRLSVariables(client: PoolClient): Promise<void> {
//   const appContext = getAppContext(); // From AsyncLocalStorage
//   if (appContext) {
//     await client.query(`SET LOCAL app.current_tenant_id = '${appContext.tenantId || ''}';`); // Use NULL or handle appropriately
//     await client.query(`SET LOCAL app.current_business_id = '${appContext.businessId || ''}';`);
//     await client.query(`SET LOCAL app.current_user_id = '${appContext.userId || ''}';`);
//     await client.query(`SET LOCAL app.is_system_admin = '${appContext.isSystemAdmin ? 'true' : 'false'}';`);
//   } else { /* Handle missing context, default to restrictive settings */ }
// }

// // query() and getClient() functions in db.ts call setRLSVariables()

3. Database Schema for Tenant Management
The following tables are central to the multi-tenant architecture (refer to database_architecture.md and migration scripts for full details):

tenants:

id (UUID PK)

name (VARCHAR)

subdomain (VARCHAR UNIQUE): Primary subdomain for the tenant group.

status (tenant_status_type_v1)

settings (JSONB): For tenant-wide settings, themes, feature flags.

businesses:

id (UUID PK)

tenant_id (UUID FK tenants.id): Links business to a tenant.

name (VARCHAR)

subdomain (VARCHAR UNIQUE SPARSE): Optional business-specific subdomain.

timezone (VARCHAR): Crucial for all date/time operations for this business.

currency (VARCHAR(3))

status (business_status_type_v1)

settings (JSONB): For business-specific configurations (e.g., booking policies, opening hours defaults).

tenant_admins:

id (UUID PK)

tenant_id (UUID FK tenants.id)

user_id (UUID FK users.id)

role (VARCHAR): e.g., 'tenant_admin', 'tenant_billing_manager'.

user_business_roles:

id (UUID PK)

user_id (UUID FK users.id)

business_id (UUID FK businesses.id)

role (VARCHAR): e.g., 'business_owner', 'manager', 'employee'.

This table, along with the employees table, defines a user's relationship and permissions within a specific business.

All other data tables (e.g., services, employees, customers, bookings, working_hours) are linked to a businesses.id, thereby inheriting tenant isolation through RLS policies that chain up to the business and tenant context.

4. Resource Allocation and Management per Tenant
Tenant resource usage is managed primarily through subscription plans.

a. Subscription Schema
subscription_plans: Defines available plans (e.g., 'free', 'basic', 'pro').

id (VARCHAR PK)

name (VARCHAR)

price (DECIMAL), currency (VARCHAR), billing_interval (VARCHAR)

features (JSONB): Generic feature flags.

Specific limit columns: max_businesses (INTEGER), max_employees_per_business (INTEGER), max_bookings_per_month (INTEGER), max_storage_gb (INTEGER), max_api_calls_per_day (INTEGER).

tenant_subscriptions: Links a tenant to their active plan and tracks its status.

id (UUID PK)

tenant_id (UUID FK tenants.id, UNIQUE)

plan_id (VARCHAR FK subscription_plans.id)

status (subscription_status_type_v1)

Billing cycle dates (current_period_start, current_period_end, expires_at).

b. Enforcing Resource Limits (Conceptual)
While the database schema supports limits, the actual enforcement logic resides in the application layer (backend services):

API Rate Limiting: Middleware can check max_api_calls_per_day for the current tenant's subscription and reject requests if limits are exceeded. This would involve tracking API calls (e.g., in a request_traces table or Redis).

Feature Flags: Services check features JSONB or specific limit columns from the tenant's active subscription plan before allowing certain actions (e.g., creating more businesses than allowed, accessing a pro feature).

Storage Quotas: File upload services would check max_storage_gb and current usage (e.g., from a tenant_files table) before allowing new uploads.

The code for these runtime checks (e.g., rateLimitByTenant, checkStorageQuota from your original multi_tenancy.md) would be implemented in backend middleware or service layers, querying the tenant_subscriptions and subscription_plans tables.

5. Tenant Onboarding and Management
Tenant Creation: Typically handled by system administrators or a separate signup flow for new tenants.

Business Creation: Tenant administrators can create and manage businesses within their tenant, subject to subscription plan limits.

User Invitation: Business managers or tenant admins can invite users to join specific businesses with defined roles.

This multi-layered approach, combining subdomain routing, application-level context management with AsyncLocalStorage, and robust database-level RLS, provides a strong foundation for secure and scalable multi-tenancy in BookMeAtOz.