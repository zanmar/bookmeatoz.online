Database Architecture for BookMeAtOz (TypeScript Implementation)
The BookMeAtOz platform utilizes PostgreSQL (version 16.9 or later recommended) as its database system. The schema is meticulously designed to support robust multi-tenant operations, comprehensive booking and scheduling functionalities, secure data isolation through Row-Level Security (RLS), and efficient querying.

Core Principles
UTC Everywhere: All TIMESTAMPTZ fields are stored in UTC. Application logic is responsible for converting to/from business-specific or user-specific timezones for display and input.

UUIDs for Primary Keys: Most entities use UUIDs (uuid_generate_v4()) as primary keys for global uniqueness.

JSONB for Settings: Flexible settings columns (JSONB) are used on various tables for extensible configurations.

RLS for Data Isolation: Row-Level Security policies are extensively used to enforce tenant and business data boundaries.

Comprehensive Indexing: Indexes are applied to foreign keys, frequently queried columns, and columns used in date/time range queries to optimize performance.

updated_at Automation: A database trigger automatically updates the updated_at column on relevant tables.

Key Database Objects and Schema
The database schema is established and managed via migration scripts (e.g., using node-pg-migrate).

Extensions
uuid-ossp: For uuid_generate_v4() function.

plpgsql: For procedural language functions (triggers, RLS helpers).

Helper Functions
trigger_set_timestamp():

A trigger function that automatically sets the updated_at column to NOW() on any UPDATE operation for tables it's applied to.

RLS Context Functions: These functions retrieve session-level variables set by the application to inform RLS policies.

current_session_tenant_id() RETURNS UUID: Gets app.current_tenant_id.

current_session_business_id() RETURNS UUID: Gets app.current_business_id.

current_session_user_id() RETURNS UUID: Gets app.current_user_id.

is_system_admin() RETURNS BOOLEAN: Gets app.is_system_admin.

ENUM Types
Custom ENUM types are used for status columns to ensure data integrity:

tenant_status_type_v1: ('active', 'inactive', 'suspended')

business_status_type_v1: ('active', 'inactive', 'suspended', 'pending_setup')

service_status_type_v1: ('active', 'inactive', 'archived')

booking_status_type_v1: ('pending', 'confirmed', 'cancelled', 'completed', 'rejected', 'no_show')

user_status_type_v1: ('active', 'inactive', 'suspended', 'pending_verification', 'invited')

customer_status_type_v1: ('active', 'inactive', 'blacklisted')

subscription_status_type_v1: ('active', 'inactive', 'past_due', 'cancelled', 'trialing')

employee_status_type_v1: ('active', 'inactive', 'terminated', 'pending_onboarding')

user_business_role_status_type_v1: ('active', 'pending', 'revoked')

Core Table Definitions (Summary)
The following are key tables. Refer to the comprehensive_initial_setup.ts migration script for complete definitions, constraints, and indexes. All tables with created_at and updated_at utilize the trigger_set_timestamp() function.

tenants: Manages tenant accounts (groups of businesses).

id (UUID, PK), name (VARCHAR), subdomain (VARCHAR, UNIQUE), status (tenant_status_type_v1), settings (JSONB), created_at, updated_at.

users: Stores all platform user accounts.

id (UUID, PK), email (VARCHAR, UNIQUE), password_hash (VARCHAR), status (user_status_type_v1), profile (JSONB), email_verified (BOOLEAN), last_login_at (TIMESTAMPTZ), system_role (VARCHAR).

businesses: Represents individual businesses, linked to a tenant.

id (UUID, PK), tenant_id (UUID, FK to tenants), name (VARCHAR), slug (VARCHAR, UNIQUE), status (business_status_type_v1), timezone (VARCHAR), subdomain (VARCHAR, UNIQUE, SPARSE), currency (VARCHAR(3)), settings (JSONB).

employees: Employment profile linking a user to a specific business. Schedules are tied to employees.id.

id (UUID, PK), user_id (UUID, FK to users), business_id (UUID, FK to businesses), employment_status (employee_status_type_v1), settings (JSONB). Unique on (user_id, business_id).

user_business_roles: Defines a user's specific role(s) within a business.

id (UUID, PK), user_id (UUID, FK to users), business_id (UUID, FK to businesses), role (VARCHAR), status (user_business_role_status_type_v1). Unique on (user_id, business_id, role).

service_categories: Optional for organizing services within a business.

id (UUID, PK), business_id (UUID, FK to businesses), name (VARCHAR).

services: Service offerings by a business.

id (UUID, PK), business_id (UUID, FK to businesses), name (VARCHAR), description (TEXT), duration (INTEGER), price (DECIMAL), currency (VARCHAR(3)), status (service_status_type_v1), category_id (UUID, FK to service_categories), is_private (BOOLEAN), buffer_before_minutes (INTEGER), buffer_after_minutes (INTEGER), settings (JSONB). Unique on (business_id, name).

employee_services: Many-to-many mapping of employees to services they can perform.

id (UUID, PK), employee_id (UUID, FK to employees), service_id (UUID, FK to services). Unique on (employee_id, service_id).

working_hours: Defines recurring weekly schedules for employees (or business-wide defaults).

id (UUID, PK), employee_id (UUID, FK to employees, NULLABLE), business_id (UUID, FK to businesses, NULLABLE), day_of_week (SMALLINT), start_time (TIME), end_time (TIME), is_off (BOOLEAN).

employee_availability_overrides: Specific date/time exceptions to an employee's regular schedule.

id (UUID, PK), employee_id (UUID, FK to employees), start_time (TIMESTAMPTZ), end_time (TIMESTAMPTZ), is_unavailable (BOOLEAN), reason (TEXT).

customers: Customer records associated with a business.

id (UUID, PK), business_id (UUID, FK to businesses), user_id (UUID, FK to users, NULLABLE), email (VARCHAR), name (VARCHAR), phone (VARCHAR), profile_notes (TEXT), status (customer_status_type_v1). Unique on (business_id, email).

bookings: Core table for appointments.

id (UUID, PK), business_id (UUID, FK to businesses), customer_id (UUID, FK to customers), service_id (UUID, FK to services), employee_id (UUID, FK to employees, NULLABLE), start_time (TIMESTAMPTZ), end_time (TIMESTAMPTZ), status (booking_status_type_v1), notes (TEXT), metadata (JSONB), booked_by_user_id (UUID, FK to users), cancellation_reason (TEXT), rescheduled_from_booking_id (UUID, FK to bookings), reminder_sent_24h (BOOLEAN), reminder_sent_1h (BOOLEAN).

subscription_plans: Defines available subscription tiers.

id (VARCHAR, PK), name (VARCHAR), price (DECIMAL), currency (VARCHAR), billing_interval (VARCHAR), features (JSONB), various limit columns (max_businesses, etc.).

tenant_subscriptions: Links tenants to their active subscription plan.

id (UUID, PK), tenant_id (UUID, FK to tenants, UNIQUE), plan_id (VARCHAR, FK to subscription_plans), status (subscription_status_type_v1), various date fields for billing cycle.

Auth Support Tables: token_blacklist, password_resets, email_verifications.

Notification Tables: notifications.

Tenant Admin Tables: tenant_admins.

Table Relationships and Constraints
Hierarchical Structure: tenants -> businesses -> (services, employees, customers, service_categories) -> bookings. employees further links to working_hours, employee_availability_overrides, and employee_services.

Foreign Keys: Implemented with appropriate ON DELETE actions:

CASCADE: For tightly coupled data (e.g., if a business is deleted, its services, employees, customers, bookings are also deleted).

RESTRICT: For critical links where deletion should be prevented if referenced (e.g., cannot delete a service if it has bookings).

SET NULL: For optional relationships (e.g., if an employee is deleted, their employee_id on past bookings might be set to NULL).

Unique Constraints: Enforce uniqueness for emails, subdomains, slugs, names within specific scopes (e.g., service name per business).

Check Constraints: Validate data values (e.g., duration > 0, price >= 0, end_time > start_time, valid day_of_week).

Query Optimization Techniques
Indexing Strategy:

Primary Keys: Automatically indexed.

Foreign Keys: All foreign key columns are indexed to speed up joins.

Frequently Queried Columns: Indexes on email (users), subdomain (tenants, businesses), slug (businesses), status columns.

Date/Time Range Queries: Composite indexes on (business_id, start_time) and (employee_id, start_time) for the bookings table are critical for availability checks and calendar views. Indexes on start_time for employee_availability_overrides.

JSONB Columns: GIN indexes can be added to settings or metadata columns if specific keys within the JSON are frequently queried. (e.g., CREATE INDEX idx_bookings_metadata_payment_id ON bookings USING GIN ((metadata->'payment_intent_id'));)

Materialized Views (Conceptual):

For complex reporting or aggregated statistics (e.g., business_stats), materialized views can be beneficial and refreshed periodically.

Query Patterns:

CTEs (Common Table Expressions): Used in complex queries (like availability checks) to break down logic and improve readability.

Selective Column Fetching: Backend services should select only necessary columns (SELECT col1, col2 FROM ...) instead of SELECT *.

Partitioning (Future Consideration):

For very large tables like bookings or audit_logs, partitioning by date range (e.g., monthly) can improve query performance and manageability.

Connection Pooling and Context Management
Node.js pg Pool: The backend uses the pg library's connection pool (Pool) for managing database connections efficiently. Configuration includes max connections, idleTimeoutMillis, etc.

RLS Context Propagation (AsyncLocalStorage):

To support Row-Level Security, the application context (current tenantId, businessId, userId, isSystemAdmin) is tracked using Node.js AsyncLocalStorage.

A middleware (contextMiddleware.ts) populates this async local storage for each request after authentication and tenant resolution.

The database connection wrapper (src/config/db.ts) retrieves this context and sets PostgreSQL session variables (SET LOCAL app.current_tenant_id = '...') before executing queries. This makes the context available to RLS policies and SQL functions like current_session_tenant_id().

This updated database architecture provides a scalable, secure, and efficient foundation for the BookMeAtOz application, fully leveraging PostgreSQL features and aligning with the TypeScript implementation.