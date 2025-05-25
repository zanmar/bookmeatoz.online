Security Considerations for BookMeAtOz (TypeScript Implementation)
Security is a paramount concern for the BookMeAtOz platform. This document outlines the key security measures implemented and considered throughout the application stack to protect user data, ensure tenant isolation, and maintain system integrity.

1. Authentication
Robust authentication mechanisms are in place to verify user identities.

a. JWT-based Authentication (Backend: auth.service.ts, auth.middleware.ts)
Access Tokens: Short-lived JSON Web Tokens (JWTs) are issued upon successful login (e.g., 15-30 minute expiry, configurable via JWT_EXPIRES_IN). These tokens are signed using a strong secret (JWT_SECRET) and contain user identity, roles, and potentially tenant/business context.

Refresh Tokens: Longer-lived refresh tokens (e.g., 7-30 days, configurable via JWT_REFRESH_EXPIRES_IN) are issued alongside access tokens. These are used to obtain new access tokens without requiring users to re-enter credentials.

Secure Storage (Frontend): Refresh tokens should be stored securely on the client-side, typically in an HttpOnly cookie to prevent XSS attacks from accessing them. Access tokens can be stored in memory (e.g., React Context state).

Rotation (Conceptual): For enhanced security, refresh token rotation (issuing a new refresh token and blacklisting the old one upon use) is a recommended practice to implement.

Token Transmission: Tokens are transmitted via the Authorization: Bearer <token> header over HTTPS.

Token Blacklisting (Backend: auth.service.ts, token_blacklist table): Upon logout, the JTI (JWT ID) or a hash of the access token is added to a blacklist with an expiry matching the token's original expiry. This prevents reuse of stolen tokens until they naturally expire. Refresh tokens can also be blacklisted if compromised or rotated.

b. Password Management (Backend: auth.service.ts, users table)
Hashing: User passwords are not stored in plaintext. bcrypt is used to hash passwords with a strong salt, storing only the hash (password_hash) in the database.

Password Reset: A secure password reset flow is implemented:

User requests a reset for their email.

A unique, time-limited, single-use token is generated and stored (hashed) in the password_resets table.

A reset link containing this token is emailed to the user.

Upon accessing the link, the user provides a new password, which is then hashed and updated. The reset token is marked as used.

Password Strength: Enforced on both client-side (Zod schema in RegisterPage.tsx, ResetPasswordPage.tsx) and server-side (during user registration/password update) to meet complexity requirements (e.g., length, character types).

c. Email Verification (Backend: auth.service.ts, email_verifications table)
New user registrations trigger an email verification process.

A unique, time-limited token is generated and sent to the user's email.

The user's email_verified status in the users table is set to true only after successful token validation.

Access to certain features might be restricted until email verification is complete.

2. Authorization and Access Control
a. Role-Based Access Control (RBAC) (Backend: auth.middleware.ts, types/user.types.ts)
Roles: A defined set of user roles (e.g., system_admin, tenant_admin, business_owner, manager, employee, customer) determines broad access levels. Roles are assigned contextually (e.g., a user is a 'manager' for a specific business).

Permissions: A granular list of permissions (PERMISSIONS enum) defines specific actions users can perform (e.g., MANAGE_SERVICES, CREATE_BOOKINGS).

Role-Permission Mapping (ROLE_PERMISSIONS_MAP): A central mapping associates roles with their granted permissions.

Middleware Enforcement:

authMiddleware.authenticate: Verifies JWT and populates req.user, req.roles, req.permissions.

authMiddleware.authorizeRoles([...]): Restricts access to routes based on user roles.

authMiddleware.authorizePermissions([...]): Restricts access based on specific permissions.

Contextual checks like isTenantAdmin and validateBusinessAccess ensure users operate within their designated tenant/business boundaries.

b. Multi-Tenant Data Isolation (Row-Level Security - RLS)
Database Level: PostgreSQL RLS policies are the primary mechanism for ensuring tenants and businesses cannot access each other's data.

Application Context (AsyncLocalStorage):

The backend uses AsyncLocalStorage to maintain request-specific context (tenantId, businessId, userId, isSystemAdmin).

This context is retrieved by the database connection wrapper (src/config/db.ts) and used to set PostgreSQL session variables (e.g., SET LOCAL app.current_tenant_id = '...').

RLS Policies: Defined in database migrations (e.g., comprehensive_initial_setup.ts), these policies use SQL helper functions (e.g., current_session_tenant_id()) to filter data based on the active session variables. This ensures queries automatically return only data relevant to the current authenticated user and their context.

Middleware (tenantMiddleware.ts, contextMiddleware.ts): Responsible for resolving and setting up this application context at the start of each request.

3. Input Validation and Sanitization
Server-Side Validation (Backend: validation.middleware.ts, Zod schemas):

All API inputs (request bodies, URL parameters, query strings) are rigorously validated against Zod schemas.

This prevents malformed data, type mismatches, and potential injection vectors beyond SQL (e.g., NoSQL injection if other data stores were used, command injection).

Standardized validation error responses are returned to the client.

Client-Side Validation (Frontend: react-hook-form + Zod):

Forms use react-hook-form with zodResolver for immediate user feedback and to reduce invalid requests to the server. This is a UX enhancement, not a replacement for server-side validation.

Parameterized Queries (Backend: src/config/db.ts):

All database interactions via the pg library use parameterized queries, which is the primary defense against SQL injection vulnerabilities.

Output Encoding (Frontend): React inherently helps prevent XSS by escaping data rendered in JSX. Care is taken if dangerouslySetInnerHTML is ever used (which should be rare and with sanitized input).

4. Data Encryption
Data in Transit (HTTPS/SSL/TLS):

All communication between clients (browser, mobile apps) and the backend API, and between the backend and the database (if not on localhost), must be over HTTPS.

Nginx (as a reverse proxy) is configured to terminate SSL/TLS using certificates (e.g., from Let's Encrypt for bookmeatoz.online and *.bookmeatoz.online).

HSTS (HTTP Strict Transport Security) header is enabled to enforce HTTPS.

Data at Rest:

Passwords: Hashed using bcrypt (as covered in Authentication).

Sensitive Data (Conceptual): For highly sensitive data beyond passwords (e.g., certain PII in user.profile or customer.settings if applicable, payment details if stored directly which is not recommended), consider application-level encryption before database storage or utilizing PostgreSQL's pgcrypto extension. The current implementation uses application-level encryption utilities (src/utils/security.ts or similar, if implemented for specific fields like payment details in the original Markdown). The ENCRYPTION_KEY in .env would support this.

Database Encryption: Full-disk encryption for the database server and transparent data encryption (TDE) offered by some managed PostgreSQL services provide further layers.

5. API Security Best Practices
Least Privilege: Users and API clients are granted only the permissions necessary for their roles and tasks.

Rate Limiting (Conceptual/Planned): To prevent abuse and DoS attacks, API rate limiting should be implemented (e.g., using express-rate-limit or Nginx), potentially tiered based on tenant subscription plans.

CORS (Cross-Origin Resource Sharing) (Backend: app.ts): Configured to allow requests only from whitelisted frontend origins (CORS_ORIGIN_WHITELIST in .env).

Security Headers (Backend: helmet in app.ts): helmet middleware sets various HTTP headers to improve security (e.g., X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, X-XSS-Protection).

Content Security Policy (CSP) (Conceptual - Nginx/Frontend): A strong CSP header should be implemented to mitigate XSS and data injection attacks by restricting the sources from which content can be loaded.

6. Session Management (Token-Based)
The system is primarily stateless on the backend, relying on JWTs for session information.

If refresh tokens are stored in HttpOnly, Secure, SameSite cookies on the frontend, this adds a layer of protection against XSS.

7. Subdomain Security & SSL/TLS Management
Wildcard SSL Certificates: Used to cover *.bookmeatoz.online and the main domain, ensuring all tenant/business subdomains are served over HTTPS. Managed via Certbot or similar.

Certificate Auto-Renewal: Automated processes (e.g., cron job running certbot renew) ensure certificates remain valid.

HSTS: Enforces HTTPS across all subdomains.

8. Audit Logging
tenant_audit_logs table (Conceptual/Planned): Captures significant actions performed by tenant administrators or system administrators affecting tenant configurations or data.

Application Logs (Winston): Detailed application logs capture requests, errors, and important events, including user IDs and tenant/business context where available, for security monitoring and forensics.

9. Dependency Management & Vulnerability Scanning
Regularly update all third-party libraries and dependencies (both frontend and backend) to patch known vulnerabilities (e.g., using npm audit or yarn audit, Snyk, Dependabot).

10. Error Handling & Information Disclosure
Generic error messages are returned to clients for unexpected server errors to avoid leaking sensitive system information.

Detailed error information is logged internally for debugging.

Validation errors provide specific feedback on which fields are problematic.

11. Regular Security Audits & Testing
Penetration Testing (Recommended): Periodically engage third-party security professionals to conduct penetration tests.

Code Reviews: Focus on security aspects during code reviews.

Security-Focused Testing: Integration tests should specifically verify authorization logic, RLS data isolation, and input validation edge cases.

By implementing these security considerations, BookMeAtOz aims to provide a secure and trustworthy platform for its users and their data. Security is an ongoing process, requiring continuous vigilance and adaptation to new threats.