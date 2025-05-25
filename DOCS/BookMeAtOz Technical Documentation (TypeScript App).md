BookMeAtOz Technical Documentation (TypeScript Implementation)
Version: 1.0 (Reflecting TypeScript Full-Stack Development)
Date: May 23, 2025

Table of Contents
Introduction & System Overview

System Architecture

Frontend Implementation (React + Vite + TypeScript)

Backend Implementation (Node.js + Express + TypeScript)

Database Architecture (PostgreSQL)

Multi-Tenant Architecture

Employee Scheduling System

Booking System Core

Notification System

Security Implementation

API Documentation Strategy

Testing Strategy

Deployment & Infrastructure Overview

Scaling Strategy Overview

Future Considerations

1. Introduction & System Overview
BookMeAtOz is a comprehensive, multi-tenant Software-as-a-Service (SaaS) platform designed for businesses to manage their services, staff schedules, customer bookings, and client relationships. It aims to provide a seamless booking experience for end-customers and powerful administrative tools for business owners and staff.

This document outlines the technical architecture and implementation details of the BookMeAtOz application, built using a modern TypeScript-first approach for both frontend and backend.

Core Technologies:

Frontend: React with Vite, TypeScript, Tailwind CSS, TanStack Query (React Query), react-router-dom, react-hook-form, Zod, date-fns-tz.

Backend: Node.js with Express.js, TypeScript, PostgreSQL (using pg library).

Database: PostgreSQL.

Key Architectural Patterns: RESTful API, Multi-Tenancy (subdomain-based with RLS), Role-Based Access Control (RBAC).

2. System Architecture
The system follows a distributed, multi-tier architecture:

Client-Side (Frontend): A Single Page Application (SPA) built with React, responsible for user interface and interaction.

Application Server (Backend): A Node.js/Express.js RESTful API server handling business logic, data processing, and database interactions.

Database Server: A PostgreSQL database storing all persistent data.

Supporting Services (Conceptual/Planned):

Email Service (e.g., SMTP provider via Nodemailer).

Job Queue & Scheduler (e.g., node-cron for reminders, BullMQ for email queue).

Caching Layer (e.g., Redis).

WebSocket Server (e.g., Socket.IO integrated with Express) for real-time notifications.

(Refer to system_infrastructure.md for a more detailed deployment architecture diagram including load balancers, CDN, etc.)

3. Frontend Implementation (React + Vite + TypeScript)
The frontend provides an intuitive and responsive user experience for both business administrators and end-customers making bookings.

Build Tool: Vite for fast development and optimized production builds.

Language: TypeScript for strong typing and improved maintainability.

UI Library: React with functional components and Hooks.

Styling: Tailwind CSS for utility-first styling.

Routing: react-router-dom for client-side navigation.

State Management:

Global UI State: React Context API (AuthContext for authentication status and user info, TenantContext for current business/tenant details based on subdomain).

Server State & Caching: TanStack Query (React Query) for managing API data fetching, caching, mutations, optimistic updates, and background synchronization. Custom hooks are created per entity (e.g., useServices, useBookings).

Forms: react-hook-form for efficient form handling, integrated with zod for schema-based validation.

API Communication: A centralized apiService.ts using axios with request/response interceptors for:

Automatic attachment of JWT authentication headers.

Token refresh logic (conceptualized, relies on AuthContext for actual refresh mechanism).

Standardized error handling.

Timezone Handling: date-fns and date-fns-tz are used for robust date/time manipulation and timezone conversions, ensuring times are displayed correctly based on user or business context. A useTimezone custom hook provides utility functions.

Key UI Components:

Layouts: AuthLayout (for login/register), DashboardLayout (for authenticated business users, with dynamic sidebar and header), MainLayout (for public-facing pages).

Common Components: Spinner, ErrorBoundary, TimeDisplay (timezone-aware).

Specialized Components:

Booking Flow: ServiceSelector, EmployeeSelector, DatePickerEnhanced (using react-datepicker), TimeSlotPicker, CustomerDetailsForm.

Scheduling: WeeklyScheduleEditor, AvailabilityOverridesManager (with OverrideFormModal).

Key Features Implemented/Planned:

Public booking page for tenants (TenantPublicBookingPage.tsx).

Authenticated dashboard for business staff to manage services, employees, customers, bookings, and schedules.

User authentication (login, registration, password reset, email verification).

4. Backend Implementation (Node.js + Express + TypeScript)
The backend API is built with Node.js and Express.js, using TypeScript for type safety and scalability.

Framework: Express.js for routing and middleware.

Language: TypeScript, compiled to JavaScript.

API Design: RESTful principles, with versioned endpoints (e.g., /api/v1/...).

Authentication & Authorization:

JWT (JSON Web Tokens): Short-lived access tokens and longer-lived refresh tokens (conceptualized storage and rotation). Handled by auth.service.ts and auth.middleware.ts.

Password Hashing: bcrypt for securely hashing user passwords.

RBAC (Role-Based Access Control): A comprehensive permission system (PERMISSIONS enum) and role-to-permission mapping (ROLE_PERMISSIONS_MAP). Authorization middleware (authorizePermissions, authorizeRoles) enforces access.

Token Blacklisting: Implemented for logout to invalidate access tokens.

Database Interaction:

Native pg library (node-postgres) for direct PostgreSQL interaction.

Connection pooling configured in src/config/db.ts.

Parameterized queries used throughout to prevent SQL injection.

Multi-Tenancy Context Propagation:

tenantMiddleware.ts: Resolves tenantId and businessId from subdomains or request parameters.

AsyncLocalStorage (src/utils/asyncContext.ts): Used to store and propagate request-specific context (tenantId, businessId, userId, isSystemAdmin) throughout the application without explicit parameter passing.

contextMiddleware.ts: Populates AsyncLocalStorage after tenant and auth resolution.

The database connection wrapper in db.ts uses this context to set session-local variables for RLS.

Key Services (src/services/): Modularized business logic for each entity:

auth.service.ts: User registration, login, token management, password reset, email verification.

business.service.ts: Business CRUD, settings management (including timezone validation).

service.service.ts: Service CRUD.

employee.service.ts: Employee profile management, role assignment.

schedule.service.ts: Management of working_hours and employee_availability_overrides, including overlap validation and booking conflict checks for overrides.

customer.service.ts: Customer CRUD for businesses.

booking.service.ts: Core booking logic, including complex availability calculation (getAvailableSlots, checkSlotAvailabilityDetailedInternal) respecting timezones, schedules, overrides, buffers, and existing bookings. Implements concurrency considerations (SELECT FOR UPDATE, transaction isolation) and "any available employee" logic.

notification.service.ts: Manages creation and retrieval of in-app notifications.

email.service.ts: Handles sending transactional emails using Nodemailer (with Ethereal for dev, SMTP for prod).

scheduler.service.ts: Uses node-cron to schedule recurring jobs like sending booking reminders.

Error Handling: A centralized globalErrorHandler and AppError custom error class provide consistent error responses.

Logging: Winston (src/utils/logger.ts) for structured, leveled logging, including request logging via Morgan.

Input Validation: Zod schemas and a validateRequest middleware (src/middleware/validation.middleware.ts) for validating API request bodies, parameters, and query strings.

Timezone Handling: date-fns-tz utilities (src/utils/timezone.utils.ts) for conversions between UTC and business timezones. All backend logic aims to process and store times in UTC.

5. Database Architecture (PostgreSQL)
(This section summarizes the updated database_architecture.md)

Schema Management: Migrations using node-pg-migrate.

Core Tables: tenants, users, businesses, employees, user_business_roles, services, service_categories, employee_services, working_hours, employee_availability_overrides, customers, bookings, subscription_plans, tenant_subscriptions, notifications, token_blacklist, password_resets, email_verifications, tenant_admins.

Data Types: UUIDs for PKs, TIMESTAMPTZ for all date/times (stored in UTC), JSONB for flexible settings, ENUM types for statuses.

Relationships & Constraints: Comprehensive foreign keys with ON DELETE actions, UNIQUE constraints, CHECK constraints.

Indexing: Strategic indexing on FKs, frequently filtered columns (email, subdomain, status), and date/time columns in bookings, working_hours, overrides for performance.

Functions & Triggers:

trigger_set_timestamp(): Auto-updates updated_at.

RLS helper functions (current_session_tenant_id(), etc.) to read session variables.

Row-Level Security (RLS): Implemented on all tenant-specific and business-specific tables to enforce data isolation based on application context set via session variables.

6. Multi-Tenant Architecture
(This section summarizes the updated multi_tenancy.md)

Identification: Primarily subdomain-based for businesses (e.g., mybiz.bookmeatoz.online). Tenants group businesses.

Data Isolation: Achieved via PostgreSQL RLS policies, which are dynamically applied based on session variables (app.current_tenant_id, app.current_business_id, app.current_user_id) set by the backend.

Application Context: AsyncLocalStorage is used in the backend to maintain request-specific context, which is then used to set the database session variables for RLS.

Resource Management: Subscription plans (subscription_plans, tenant_subscriptions) define limits (e.g., max employees, bookings), with enforcement logic in backend services.

7. Employee Scheduling System
Weekly Recurring Schedules (working_hours):

Employees have a default weekly schedule with multiple time blocks per day possible.

Backend service (schedule.service.ts) handles CRUD and validates against overlapping blocks within the same day.

Frontend (WeeklyScheduleEditor.tsx) provides a UI for managing these, using Zod for input validation.

Specific Date Overrides (employee_availability_overrides):

Allows defining periods of unavailability (time off, breaks) or special availability.

Backend service handles CRUD and checks for conflicts with existing confirmed/pending bookings when marking as unavailable.

Frontend (AvailabilityOverridesManager.tsx with OverrideFormModal.tsx) allows managing these, with robust timezone handling for date/time inputs using date-fns-tz and Zod validation.

Cascading Logic (Conceptual for Availability): Availability checks (booking.service.ts) consider:

Business-wide operating hours (if employee has no specific schedule - future enhancement).

Employee's specific working_hours.

employee_availability_overrides (which take precedence).

8. Booking System Core
Availability Calculation (booking.service.ts -> getAvailableSlots):

Considers service duration, employee qualifications (employee_services), employee working hours, employee availability overrides, existing bookings, and service buffer times.

All calculations are performed respecting the business's configured timezone, with internal operations often in UTC.

Handles "any available employee" scenarios by iterating through qualified staff.

Booking Creation (booking.service.ts -> createBooking):

Performs robust re-validation of slot availability within the database transaction.

Uses SELECT ... FOR UPDATE on the employee record (if specified) to mitigate concurrency issues when checking availability and creating the booking. Transaction isolation level set to REPEATABLE READ.

Handles creation/linking of customer records.

Stores booking times in UTC.

Records price and currency at the time of booking in metadata.

Public Slot Check (isSlotStillAvailable): An endpoint allows the frontend to re-verify a slot's availability just before final submission.

9. Notification System
Email Notifications (email.service.ts):

Nodemailer setup for sending emails via SMTP (production) or Ethereal/console (development).

Templates (basic HTML structure, to be enhanced) for booking confirmations, reminders, user account actions (welcome, password reset), employee invitations.

Timezone-aware formatting of dates/times in email content using formatInTimeZone.

Conceptual: Queuing system (e.g., BullMQ) for asynchronous email sending in production.

In-App Notifications (notification.service.ts):

Database schema (notifications table) to store user-specific notifications.

Backend service for creating, fetching, and marking notifications as read.

Conceptual: WebSocket (Socket.IO) integration for real-time delivery of in-app notifications to connected clients. Socket.IO server setup in app.ts with basic JWT authentication for socket connections.

Scheduled Reminders (scheduler.service.ts):

node-cron used to schedule jobs for sending booking reminders (e.g., 24h and 1h before).

Jobs query for upcoming bookings, check reminder flags, and trigger email/in-app notifications.

Requires reminder_sent_24h and reminder_sent_1h boolean flags in the bookings table.

10. Security Implementation
(This section summarizes the updated security_considerations.md)

Authentication:

JWTs: Short-lived access tokens (e.g., 15 min), longer-lived refresh tokens (e.g., 30 days). Secure HTTPOnly cookies for refresh tokens are recommended for web clients.

Token Blacklisting: Implemented on logout for access tokens. Conceptual for refresh token rotation/blacklisting.

Authorization:

RBAC: Defined roles and permissions (PERMISSIONS enum, ROLE_PERMISSIONS_MAP).

Middleware: authMiddleware.authorizePermissions and authMiddleware.authorizeRoles enforce access to API endpoints.

Contextual checks like isTenantAdmin, validateBusinessAccess.

Data Isolation:

Primary mechanism: PostgreSQL Row-Level Security (RLS) policies on all sensitive tables, driven by session variables set via AsyncLocalStorage context.

Input Validation:

Server-side: Zod schemas and validateRequest middleware for all API inputs (bodies, params, queries).

Client-side: react-hook-form with zod for frontend forms.

Password Security: bcrypt for hashing passwords. Secure password reset flow with expiring tokens.

Data Encryption:

HTTPS/SSL/TLS for all data in transit (Nginx responsibility in deployment).

Conceptual: Encryption at rest for sensitive database fields if required (PostgreSQL pgcrypto or application-level encryption).

Other:

helmet middleware for common security headers.

cors middleware configured for allowed origins.

Regular dependency updates and security audits are recommended.

11. API Documentation Strategy
Plan: Implement OpenAPI/Swagger documentation.

Tooling: swagger-jsdoc (to generate specs from JSDoc comments in route/controller files) or a similar tool.

Content: Document all public and internal API endpoints, including:

Request/response schemas (can be derived from Zod schemas).

Authentication requirements (JWT Bearer token).

Required roles/permissions.

Path and query parameters.

Example requests and responses.

Standardized error response codes and schemas.

Hosting: Serve the Swagger UI from a dedicated endpoint on the backend (e.g., /api-docs).

12. Testing Strategy
Unit Tests (Backend - Jest with ts-jest):

Focus on utility functions (timezone, validation helpers), individual service methods (with mocked database interactions), and authentication logic.

Test timezone-sensitive functions with various inputs.

API Integration Tests (Backend - Supertest + Jest):

Test API endpoint groups (Auth, Services, Employees, Bookings, etc.) against a real test database (seeded or reset between tests).

Verify request validation, authentication, authorization (RBAC), RLS-based multi-tenant isolation, and correct responses.

Cover edge cases like concurrent booking attempts.

Frontend Unit/Component Tests (Vitest/Jest + React Testing Library):

Test individual React components, custom hooks, and utility functions.

Mock API calls for component tests that fetch data.

Frontend End-to-End Tests (Conceptual - Cypress/Playwright):

Simulate full user flows (registration, login, booking, managing settings).

Test Data: Scripts to generate realistic seed data for development and testing environments.

CI/CD Integration (Conceptual - GitHub Actions):

Automate running all tests on pushes/pull requests.

Automate API documentation generation and publishing.

Report test coverage.

13. Deployment & Infrastructure Overview
(This section summarizes system_infrastructure.md)

Target Environment: VPS (e.g., Ubuntu-based).

Backend Deployment:

Node.js application managed by a process manager like PM2 (for clustering, restarts, logging).

Environment variables for configuration.

Frontend Deployment:

Static build generated by Vite (dist folder).

Served by Nginx or a static hosting service.

Database: Self-hosted PostgreSQL instance on the VPS or a managed database service.

Reverse Proxy (Nginx):

Handles incoming traffic, SSL/TLS termination.

Routes requests to the frontend static files or the backend API application.

Configured for subdomain routing.

CDN (e.g., Cloudflare): For caching static assets (frontend build, images) and providing DDoS protection.

Load Balancer (Conceptual for >1 VPS): If scaling beyond a single VPS, a load balancer (e.g., HAProxy, Nginx, or cloud provider's LB) would distribute traffic across multiple backend instances.

14. Scaling Strategy Overview
(This section summarizes scaling_strategy.md)

Horizontal Scaling:

Frontend: Stateless, easily scaled by serving static files from multiple CDN edge locations or web servers.

Backend API Servers: Stateless (JWT auth, session context via AsyncLocalStorage), can be scaled horizontally by running multiple instances (e.g., using PM2 cluster mode or container orchestration like Docker Swarm/Kubernetes) behind a load balancer.

Vertical Scaling:

Database Primary Node: Initially scaled vertically (more CPU, RAM, faster disks) for write performance.

Redis Cache Server: Can be scaled vertically.

Database Read Replicas: Implement PostgreSQL read replicas to offload read-heavy queries from the primary database, improving read performance and overall database throughput.

Caching:

Client-Side: TanStack Query for caching API responses in the frontend.

CDN Caching: For static frontend assets.

Backend Caching (Redis): For frequently accessed, less volatile data (e.g., business settings, subscription plan details, popular service details).

Database Sharding (Future Consideration): For very large scale, tenant-based or time-based sharding of the PostgreSQL database might be considered.

Asynchronous Processing: Utilize job queues (e.g., BullMQ with Redis) for background tasks like email sending, report generation, and other long-running processes to avoid blocking the main API request-response cycle.

15. Future Considerations
Full Real-time Collaboration/Updates: Deeper WebSocket integration for features beyond basic notifications (e.g., live calendar updates for staff as bookings come in).

Payment Gateway Integration: For handling paid services and subscriptions (Stripe, Paddle, etc.).

Advanced Reporting & Analytics: For businesses and system administrators.

Full Localization (i18n) & Internationalization (l10n): For supporting multiple languages, currencies, and regional formats.

Mobile Applications: Native or PWA development.

Third-Party Integrations: Calendar sync (Google Calendar, Outlook Calendar), accounting software, marketing tools.

Enhanced Security Audits & Measures: Regular penetration testing, advanced DDoS mitigation, Web Application Firewall (WAF).

This technical documentation provides a snapshot of the BookMeAtOz application's architecture and implementation based on the TypeScript stack. It should be a living document, updated as the system evolves.