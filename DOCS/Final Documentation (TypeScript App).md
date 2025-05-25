BookMeAtOz Final Technical Documentation (TypeScript Implementation)
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

Supporting Services (Implemented/Planned):

Email Service (Nodemailer with SMTP/Ethereal).

Job Queue & Scheduler (node-cron for reminders; conceptual BullMQ for email queue).

Caching Layer (Conceptual - e.g., Redis).

WebSocket Server (Socket.IO integrated with Express) for real-time notifications.

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

Token refresh logic (including request queuing).

Standardized error handling.

Timezone Handling: date-fns and date-fns-tz are used for robust date/time manipulation and timezone conversions. A useTimezone custom hook provides utility functions to ensure times are displayed and processed correctly based on user or business context.

Key UI Components:

Layouts: AuthLayout, DashboardLayout (with dynamic sidebar), MainLayout.

Common Components: Spinner, ErrorBoundary, TimeDisplay (timezone-aware).

Specialized Components:

Booking Flow: ServiceSelector, EmployeeSelector, DatePickerEnhanced (using react-datepicker), TimeSlotPicker, CustomerDetailsForm (with Zod validation).

Scheduling: WeeklyScheduleEditor (multi-block per day, Zod validation), AvailabilityOverridesManager (with OverrideFormModal using Zod and timezone conversions).

Key Features Implemented/Planned:

Public booking page for tenants (TenantPublicBookingPage.tsx) with service, date, time selection, and customer details input.

Authenticated dashboard for business staff:

User authentication (Login, Register, Forgot/Reset Password, Email Verification pages implemented).

Management pages (partially implemented, ongoing TanStack Query integration) for Services, Employees, Customers, Bookings, Schedules.

Business Settings page (placeholder, to be implemented).

4. Backend Implementation (Node.js + Express + TypeScript)
The backend API is built with Node.js and Express.js, using TypeScript for type safety and scalability.

Framework: Express.js for routing and middleware.

Language: TypeScript, compiled to JavaScript.

API Design: RESTful principles, with versioned endpoints (e.g., /api/v1/...).

Authentication & Authorization:

JWT: Short-lived access tokens (e.g., 15 min), longer-lived refresh tokens (e.g., 30 days). Handled by auth.service.ts and auth.middleware.ts.

Password Hashing: bcrypt.

RBAC: PERMISSIONS enum and ROLE_PERMISSIONS_MAP. Middleware (authorizePermissions, authorizeRoles, requireTenantContext, requireBusinessContext) enforces access.

Token Blacklisting: For logout.

Database Interaction:

Native pg library with connection pooling.

Parameterized queries.

Multi-Tenancy Context Propagation:

tenantMiddleware.ts: Resolves context from subdomains.

AsyncLocalStorage (src/utils/asyncContext.ts): Propagates request-specific context (tenantId, businessId, userId, isSystemAdmin).

contextMiddleware.ts: Populates AsyncLocalStorage.

db.ts wrapper sets PostgreSQL session variables (SET LOCAL app.current_...) for RLS.

Key Services (src/services/):

auth.service.ts: User lifecycle, token management.

business.service.ts: Business CRUD, timezone validation.

service.service.ts: Service CRUD.

employee.service.ts: Employee profile management, role assignment (with consistent ID handling: employees.id for schedules, users.id for roles).

schedule.service.ts: Management of working_hours (multi-block per day, overlap validation) and employee_availability_overrides (booking conflict checks).

customer.service.ts: Customer CRUD.

booking.service.ts: Core booking logic, including advanced availability calculation (getAvailableSlots, checkSlotAvailabilityDetailedInternal) respecting timezones, schedules, overrides, buffers, existing bookings. Implements concurrency considerations (SELECT FOR UPDATE, transaction isolation REPEATABLE READ) and "any available employee" logic. Includes isSlotStillAvailable for pre-submission checks.

notification.service.ts: In-app notification CRUD.

email.service.ts: Nodemailer for transactional emails, with basic templates and timezone-aware content.

scheduler.service.ts: node-cron for booking reminders (requires reminder_sent_ flags on bookings).

Error Handling: globalErrorHandler and AppError class.

Logging: Winston for structured logging.

Input Validation: Zod schemas and validateRequest middleware for API inputs.

Timezone Handling: date-fns-tz utilities (src/utils/timezone.utils.ts) for backend conversions. All backend logic aims to process and store times in UTC, interpreting inputs based on business timezone.

5. Database Architecture (PostgreSQL)
(This section reflects the comprehensive_initial_setup.ts migration)

Schema Management: Migrations via node-pg-migrate.

Core Tables: tenants, users, businesses, employees, user_business_roles, services, service_categories, employee_services, working_hours, employee_availability_overrides, customers, bookings (with reminder flags), subscription_plans, tenant_subscriptions, notifications, token_blacklist, password_resets, email_verifications, tenant_admins.

Data Types: UUIDs for PKs, TIMESTAMPTZ (stored UTC), JSONB, ENUMs for statuses.

Relationships & Constraints: FKs with ON DELETE actions, UNIQUE constraints, CHECK constraints.

Indexing: Strategic indexing for performance, especially on date/time columns and FKs.

Functions & Triggers: trigger_set_timestamp() for updated_at. RLS helper functions (current_session_tenant_id(), etc.).

Row-Level Security (RLS): Implemented on all relevant tables, driven by session variables set via AsyncLocalStorage context.

6. Multi-Tenant Architecture
Identification: Subdomain-based for businesses.

Data Isolation: PostgreSQL RLS policies.

Application Context: AsyncLocalStorage for request-specific context propagation to DB session variables.

Resource Management: Subscription plans define limits; enforcement is conceptual in backend services.

7. Employee Scheduling System
Weekly Recurring Schedules (working_hours):

Backend service supports multiple, non-overlapping time blocks per day for an employee.

Frontend (WeeklyScheduleEditor.tsx) uses react-hook-form with Zod for managing these, displaying times relative to business timezone.

Specific Date Overrides (employee_availability_overrides):

Backend service allows CRUD and checks for booking conflicts when marking as unavailable.

Frontend (AvailabilityOverridesManager.tsx with OverrideFormModal.tsx) uses react-datepicker, react-hook-form, Zod, and date-fns-tz for robust, timezone-aware input and editing.

Cascading Logic (Conceptual for Availability): booking.service.ts is designed to first check employee-specific schedules, then potentially fall back to business defaults (if implemented), with overrides taking highest precedence.

8. Booking System Core
Availability Calculation (booking.service.ts): Advanced logic considering all scheduling components, service details (duration, buffers), existing bookings, and business timezone. Handles "any available employee".

Booking Creation (booking.service.ts): Robust re-validation of slot availability within a REPEATABLE READ transaction, using SELECT ... FOR UPDATE on employee records to mitigate concurrency. Handles new/existing customer linking. Stores booking times in UTC and metadata like price at booking.

Public Slot Check (isSlotStillAvailable): Frontend uses this for pre-submission validation.

9. Notification System
Email Notifications (email.service.ts): Nodemailer setup, basic templates for key events (welcome, password reset, booking confirmation/reminder), timezone-aware date formatting. Conceptual queue for production.

In-App Notifications (notification.service.ts): DB schema and service for CRUD. Conceptual WebSocket (Socket.IO) integration for real-time delivery.

Scheduled Reminders (scheduler.service.ts): node-cron for booking reminders, triggering email/in-app notifications. Requires reminder_sent_ flags on bookings.

10. Security Implementation
Authentication: JWTs (short-lived access, longer-lived refresh - conceptual rotation), bcrypt, token blacklisting.

Authorization: RBAC with defined permissions and roles, enforced by middleware. RLS for data access.

Input Validation: Zod for both frontend forms and backend API inputs.

Data Isolation: RLS is the primary mechanism.

Other: helmet, cors.

11. API Documentation Strategy
Plan: OpenAPI/Swagger.

Tooling: swagger-jsdoc or similar.

Content: Document all endpoints, request/response schemas (from Zod), auth, errors, examples.

12. Testing Strategy
Backend Unit Tests: Jest with ts-jest for utilities and services (mocking DB). Example for timezone.utils.ts provided.

Backend API Integration Tests (Conceptual): Supertest + Jest against a test database.

Frontend Unit/Component Tests (Conceptual): Vitest/Jest + React Testing Library.

CI/CD (Conceptual): GitHub Actions for automating tests, docs, coverage.

13. Deployment & Infrastructure Overview
Target: VPS (Ubuntu).

Backend: Node.js with PM2.

Frontend: Static build from Vite, served by Nginx.

Database: PostgreSQL.

Reverse Proxy: Nginx for routing, SSL.

CDN (Conceptual): Cloudflare.

14. Scaling Strategy Overview
Horizontal: Frontend (CDN), Backend API (PM2 cluster/containers).

Vertical: DB Primary, Cache.

Database: Read Replicas.

Caching: TanStack Query (client), CDN (static), Redis (backend - conceptual).

Async Processing: Job queues for emails, etc. (conceptual for full implementation).

15. Future Considerations
Full Real-time (WebSockets beyond basic notifications).

Payment Gateway Integration.

Advanced Reporting.

Full i18n & l10n.

Mobile Apps.

Third-Party Integrations.

This document provides a comprehensive technical overview of the BookMeAtOz application as developed with TypeScript, highlighting its architecture, key features, and implementation strategies. It should be maintained as a living document.