/var/www/bookmeatoz.online_ts/
├── booking-backend/
│   ├── migrations/
│   │   ├── TIMESTAMP-comprehensive_initial_setup.ts
│   │   ├── TIMESTAMP-create_notifications_schema.ts
│   │   └── TIMESTAMP-add_reminder_flags_to_bookings.ts
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── booking.controller.ts
│   │   │   ├── business.controller.ts (Conceptual - needs creation if not done)
│   │   │   ├── customer.controller.ts
│   │   │   ├── employee.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── schedule.controller.ts
│   │   │   └── service.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── context.middleware.ts
│   │   │   ├── tenant.middleware.ts
│   │   │   └── validation.middleware.ts (Define actual schemas separately)
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── booking.routes.ts
│   │   │   ├── business.routes.ts (Conceptual - needs creation if not done)
│   │   │   ├── customer.routes.ts
│   │   │   ├── employee.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── schedule.routes.ts
│   │   │   └── service.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── booking.service.ts
│   │   │   ├── business.service.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── employee.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── schedule.service.ts
│   │   │   ├── scheduler.service.ts
│   │   │   └── service.service.ts
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── booking.types.ts
│   │   │   ├── business.types.ts
│   │   │   ├── common.types.ts
│   │   │   ├── customer.types.ts
│   │   │   ├── employee.types.ts
│   │   │   ├── index.ts
│   │   │   ├── notification.types.ts
│   │   │   ├── schedule.types.ts
│   │   │   ├── service.types.ts
│   │   │   ├── subscription.types.ts
│   │   │   └── tenant.types.ts
│   │   ├── utils/
│   │   │   ├── asyncContext.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── logger.ts
│   │   │   └── timezone.utils.ts
│   │   ├── test-setup/
│   │   │   └── jest.setup.ts (Optional)
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── .eslintrc.js
│   ├── .gitignore (Recommended: add node_modules/, dist/, .env, coverage/, logs/)
│   ├── babel.config.js (Optional)
│   ├── jest.config.js
│   ├── nodemon.json
│   ├── package.json
│   ├── .prettierrc.json
│   └── tsconfig.json
│
└── frontend/
    ├── public/
    │   ├── index.html
    │   ├── favicon.svg (Create this)
    │   └── logo-placeholder.svg (Create this)
    │   └── logo-placeholder-white.svg (Create this)
    ├── src/
    │   ├── assets/ (For any local images, fonts not from CDN)
    │   ├── components/
    │   │   ├── booking/
    │   │   │   ├── CustomerDetailsForm.tsx
    │   │   │   ├── DatePickerEnhanced.tsx
    │   │   │   ├── EmployeeSelector.tsx
    │   │   │   ├── ServiceSelector.tsx
    │   │   │   └── TimeSlotPicker.tsx
    │   │   ├── common/
    │   │   │   ├── ErrorBoundary.tsx
    │   │   │   ├── Spinner.tsx
    │   │   │   └── TimeDisplay.tsx
    │   │   ├── layouts/
    │   │   │   ├── AuthLayout.tsx
    │   │   │   ├── DashboardLayout.tsx
    │   │   │   └── MainLayout.tsx
    │   │   └── schedule/
    │   │       ├── AvailabilityOverridesManager.tsx
    │   │       └── WeeklyScheduleEditor.tsx
    │   ├── config/
    │   │   └── queryKeys.ts
    │   ├── contexts/
    │   │   ├── AuthContext.tsx
    │   │   └── TenantContext.tsx
    │   ├── hooks/
    │   │   ├── services.hooks.ts
    │   │   ├── useTimezone.ts
    │   │   └── (Other entity hooks: useEmployees.ts, useCustomers.ts, etc. - to be created)
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── ForgotPasswordPage.tsx
    │   │   │   ├── LoginPage.tsx
    │   │   │   ├── RegisterPage.tsx
    │   │   │   ├── ResetPasswordPage.tsx
    │   │   │   └── VerifyEmailPage.tsx
    │   │   ├── dashboard/
    │   │   │   ├── business/
    │   │   │   │   └── BusinessSettingsPage.tsx
    │   │   │   ├── bookings/
    │   │   │   │   └── ManageBookingsPage.tsx
    │   │   │   ├── customers/
    │   │   │   │   └── ManageCustomersPage.tsx
    │   │   │   ├── employees/
    │   │   │   │   ├── ManageEmployeeSchedulePage.tsx
    │   │   │   │   └── ManageEmployeesPage.tsx
    │   │   │   ├── services/
    │   │   │   │   └── ManageServicesPage.tsx
    │   │   │   └── UserDashboardPage.tsx
    │   │   ├── public/
    │   │   │   └── HomePage.tsx
    │   │   ├── tenant/
    │   │   │   ├── TenantHomePage.tsx
    │   │   │   └── TenantPublicBookingPage.tsx
    │   │   └── NotFoundPage.tsx
    │   ├── services/
    │   │   └── apiService.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── utils/
    │   │   └── toast.ts
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── .env.development (Example: VITE_API_BASE_URL=http://localhost:8084/api/v1)
    ├── .env.production (Example: VITE_API_BASE_URL=https://bookmeatoz.online/api/v1)
    ├── .eslintrc.cjs
    ├── .gitignore (Recommended: node_modules/, dist/, .env*)
    ├── index.html (This is actually in frontend/ root, Vite moves public/index.html to dist root)
    ├── package.json├── .env.developme
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts


File Contents
I will now provide the content for each file. Please note that for brevity, if a file's content was provided in a very recent turn and is unchanged, I might just reference its ID.

Backend Files (/var/www/bookmeatoz.online_ts/booking-backend/)
Root Directory:

// /var/www/bookmeatoz.online_ts/booking-backend/package.json
{
  "name": "booking-backend",
  "version": "1.0.0",
  "description": "Backend for BookMeAtOz",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "nodemon src/server.ts",
    "lint": "eslint . --ext .ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:migration:create": "node-pg-migrate create --migration-file-language ts",
    "db:migrate": "node-pg-migrate up",
    "db:migrate:down": "node-pg-migrate down",
    "db:migrate:status": "node-pg-migrate status"
  },
  "keywords": ["booking", "multi-tenant", "rbac"],
  "author": "AI Developer",
  "license": "ISC",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.13",
    "pg": "^8.11.5",
    "uuid": "^9.0.1",
    "winston": "^3.13.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@babel/core": "^7.24.6",
    "@babel/preset-env": "^7.24.6",
    "@babel/preset-typescript": "^7.24.6",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.12.12",
    "@types/node-cron": "^3.0.11",
    "@types/nodemailer": "^6.4.15",
    "@types/pg": "^8.11.6",
    "@types/uuid": "^9.0.8",
    "@typescript-eslint/eslint-plugin": "^7.10.0",
    "@typescript-eslint/parser": "^7.10.0",
    "babel-jest": "^29.7.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "jest": "^29.7.0",
    "node-pg-migrate": "^7.4.0",
    "nodemon": "^3.1.0",
    "prettier": "^3.2.5",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}


migrations/ Directory:

// migrations/TIMESTAMP-add_reminder_flags_to_bookings.ts
import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('bookings', {
    reminder_sent_24h: { type: 'BOOLEAN', default: false, notNull: true },
    reminder_sent_1h: { type: 'BOOLEAN', default: false, notNull: true },
  });
  pgm.addIndex('bookings', ['status', 'start_time', 'reminder_sent_24h']);
  pgm.addIndex('bookings', ['status', 'start_time', 'reminder_sent_1h']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // To drop indexes explicitly if needed, though dropColumn might handle it with cascade.
  // pgm.dropIndex('bookings', ['status', 'start_time', 'reminder_sent_1h']);
  // pgm.dropIndex('bookings', ['status', 'start_time', 'reminder_sent_24h']);
  pgm.dropColumn('bookings', 'reminder_sent_1h');
  pgm.dropColumn('bookings', 'reminder_sent_24h');
}


src/ Directory:

// /var/www/bookmeatoz.online_ts/booking-backend/src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http'; // For Socket.IO
import { Server as SocketIOServer, Socket } from 'socket.io'; // For Socket.IO
import jwt from 'jsonwebtoken'; // For Socket.IO auth

import logger from '@/utils/logger';
import { globalErrorHandler, AppError } from '@/utils/errorHandler';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { contextMiddleware } from '@/middleware/context.middleware';
import { DecodedUserToken } from '@/types';


// Import routes
import authRoutes from '@/routes/auth.routes';
import serviceRoutes from '@/routes/service.routes';
import employeeRoutes from '@/routes/employee.routes';
import customerRoutes from '@/routes/customer.routes';
import bookingRoutes from '@/routes/booking.routes';
import notificationRoutes from '@/routes/notification.routes';
// import scheduleRoutes from '@/routes/schedule.routes'; // Schedule routes are nested under employee routes

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app: Express = express();
const server = http.createServer(app); // Create HTTP server for Express app

// Socket.IO Setup
export const io = new SocketIOServer(server, {
  cors: {
    origin: (process.env.CORS_ORIGIN_WHITELIST || 'http://localhost:5173').split(','),
    methods: ["GET", "POST"]
  }
});

io.use(async (socket: Socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedUserToken;
      (socket as any).user = decoded; // Attach user to socket object
      next();
    } catch (err) {
      logger.warn('Socket Auth Error:', err);
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error - no token'));
  }
});

io.on('connection', (socket: Socket) => {
  const user = (socket as any).user as DecodedUserToken | undefined;
  if (!user || !user.userId) {
    socket.disconnect(true);
    return;
  }
  logger.info(`Socket connected: ${socket.id}, User ID: ${user.userId}`);
  socket.join(`user_${user.userId}`); // Each user joins their own room for personal notifications

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}, User ID: ${user.userId}`);
  });
});


// --- Global Middleware ---
app.use(helmet()); // Security headers

const corsOriginWhitelist = (process.env.CORS_ORIGIN_WHITELIST || '').split(',');
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsOriginWhitelist.indexOf(origin) !== -1 || corsOriginWhitelist.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS: Blocked by CORS policy', { origin });
      callback(new AppError(`Not allowed by CORS: ${origin}`, 403));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.http(message.trim()) },
  skip: (req: Request) => req.path === `${process.env.API_BASE_URL || '/api/v1'}/health`
}));

// Middleware Order is Important
app.use(tenantMiddleware); // 1. Resolves tenant/business from subdomain
// Auth middleware is applied per-route or globally if needed for all.
// For contextMiddleware to pick up req.userId, auth must have run if the route is protected.
app.use(contextMiddleware); // 2. Sets up AsyncLocalStorage for RLS and logging context

// --- API Routes ---
const API_BASE_URL = process.env.API_BASE_URL || '/api/v1';

app.get(`${API_BASE_URL}/health`, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP', timestamp: new Date().toISOString(),
    tenantId: req.tenantId, businessId: req.businessId, subdomain: req.subdomain,
  });
});

app.use(`${API_BASE_URL}/auth`, authRoutes);
app.use(`${API_BASE_URL}/services`, serviceRoutes); // Needs auth, business context
app.use(`${API_BASE_URL}/employees`, employeeRoutes); // Needs auth, business context
app.use(`${API_BASE_URL}/customers`, customerRoutes); // Needs auth, business context
app.use(`${API_BASE_URL}/bookings`, bookingRoutes); // Mixed public (availability) and auth routes
app.use(`${API_BASE_URL}/notifications`, notificationRoutes); // Needs auth

// Example for business settings (needs business.routes.ts and business.controller.ts)
// import businessRoutes from '@/routes/business.routes';
// app.use(`${API_BASE_URL}/businesses`, businessRoutes);


// --- Not Found Handler (404) ---
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// --- Global Error Handler ---
app.use(globalErrorHandler);

// Export server for server.ts to use, and io for services if needed (e.g. notificationService)
export { server, app }; // Exporting server for Socket.IO


// /var/www/bookmeatoz.online_ts/booking-backend/src/server.ts
import { server, app } from './app'; // Import server (for Socket.IO) and app (for Express)
import dotenv from 'dotenv';
import logger from '@/utils/logger';
import { testDBConnection } from '@/config/db';
import { initializeSchedulers } from './services/scheduler.service';

dotenv.config();

const PORT = process.env.PORT || 8083;

const startServer = async () => {
  try {
    await testDBConnection();

    if (process.env.NODE_ENV !== 'test') {
      initializeSchedulers(); // Initialize cron jobs
    }

    server.listen(PORT, () => { // Use server.listen (from http.createServer)
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`API base URL: ${process.env.API_BASE_URL || '/api/v1'}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
};

const gracefulShutdown = (signal: string) => { /* ... (as before) ... */ };
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => { /* ... (as before) ... */ });
process.on('uncaughtException', (error: Error) => { /* ... (as before) ... */ });

startServer();


src/config/ Directory:

src/types/ Directory:
(Consolidating DTOs into their respective type files or creating new ones like schedule.types.ts)

// /var/www/bookmeatoz.online_ts/booking-backend/src/types/booking.types.ts
import { BaseEntity, Status } from './common.types';

export interface Booking extends BaseEntity {
  business_id: string;
  customer_id: string;
  service_id: string;
  employee_id?: string | null;
  start_time: Date;
  end_time: Date;
  status: Extract<Status, 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'no_show'>;
  notes?: string | null;
  metadata?: Record<string, any>;
  booked_by_user_id?: string | null;
  cancellation_reason?: string | null;
  rescheduled_from_booking_id?: string | null;
  reminder_sent_24h?: boolean; // Added
  reminder_sent_1h?: boolean;  // Added
}

export interface CreateBookingDto {
  service_id: string;
  customer_id: string;
  employee_id?: string;
  start_time: string; // ISO Date string from client
  notes?: string;
}

export interface CreatePublicBookingDto extends Omit<CreateBookingDto, 'customer_id'> {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_id?: string; // Optional if backend handles linking to existing user by email
}

export interface UpdateBookingStatusDto {
  status: Booking['status'];
  cancellation_reason?: string;
  notes?: string;
}

export interface TimeSlot {
  start_time: string; // ISO string (UTC)
  end_time: string;   // ISO string (UTC)
  employee_id?: string; // employees.id
  is_available: boolean;
}

export interface AvailabilityQuery {
  service_id: string;
  date: string; // YYYY-MM-DD (interpreted in business's local timezone)
  employee_id?: string; // employees.id
  timezone?: string; // Client's IANA timezone (optional, for logging/context)
}


// /var/www/bookmeatoz.online_ts/booking-backend/src/types/employee.types.ts
import { BaseEntity, Status } from './common.types';
import { UserRole } from './user.types'; // Assuming UserRole is in user.types.ts

// Represents the 'employees' table record - an employment profile
export interface Employee extends BaseEntity { // BaseEntity provides id (employees.id), created_at, updated_at
  user_id: string; // FK to users.id
  business_id: string; // FK to businesses.id
  employment_status: Extract<Status, 'active' | 'inactive' | 'terminated' | 'pending_onboarding'>;
  // Add other employee-specific fields here if any (e.g., internal_code, job_title_override)
}

// Represents enriched employee information for display/API responses
export interface EmployeeDetails {
  id: string; // This is employees.id
  user_id: string; // This is users.id
  business_id: string;
  email: string; 
  name: string; 
  profile_picture_url?: string;
  role: UserRole; // Role from user_business_roles for this business
  employment_status: Employee['employment_status'];
  user_status: Extract<Status, 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'invited'>; // Global user status
  created_at: Date; // When the employee record (or role link) was created
  updated_at: Date;
}

// Represents an invitation to join a business as an employee
export interface EmployeeInvitation extends BaseEntity {
  business_id: string;
  email: string;
  role: UserRole;
  status: Extract<Status, 'pending' | 'accepted' | 'expired' | 'revoked'>;
  invitation_token_hash: string; // Store hash of token
  expires_at: Date;
  invited_by_user_id: string; // users.id
}

// From schedule.types.ts (or keep separate)
export interface WorkingHours extends BaseEntity {
    business_id?: string | null;
    employee_id: string; // FK to employees.id
    day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    start_time: string | null; // "HH:MM", null if is_off
    end_time: string | null;   // "HH:MM", null if is_off
    is_off: boolean;
}

export interface EmployeeAvailabilityOverride extends BaseEntity {
    employee_id: string; // FK to employees.id
    start_time: Date; // TIMESTAMPTZ (UTC)
    end_time: Date;   // TIMESTAMPTZ (UTC)
    is_unavailable: boolean;
    reason?: string;
}


// /var/www/bookmeatoz.online_ts/booking-backend/src/types/schedule.types.ts
export interface WorkingHourInput {
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  is_off?: boolean;
}

export type SetWorkingHoursDto = WorkingHourInput[];

export interface AvailabilityOverrideInput {
  start_time: string; // ISO Date string from client (will be parsed to UTC)
  end_time: string;   // ISO Date string from client (will be parsed to UTC)
  is_unavailable: boolean;
  reason?: string;
}

export interface UpdateAvailabilityOverrideDto extends Partial<AvailabilityOverrideInput> {}


// /var/www/bookmeatoz.online_ts/booking-backend/src/types/notification.types.ts
// Re-export from service or define here
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
  id: string; // UUID
  user_id: string; // users.id
  tenant_id?: string | null; // tenants.id
  business_id?: string | null; // businesses.id
  type: NotificationType;
  title?: string | null;
  content: string; // The notification message
  data?: Record<string, any> | null; // JSONB e.g., { bookingId: '...', serviceName: '...' }
  read_status: boolean;
  read_at?: Date | null; // TIMESTAMPTZ
  created_at: Date; // TIMESTAMPTZ
}


(Other type files: auth.types.ts, business.types.ts, common.types.ts, customer.types.ts, service.types.ts, subscription.types.ts, tenant.types.ts, user.types.ts remain as generated in previous steps, ensure they are complete and accurate.)

src/utils/ Directory:

asyncContext.ts (ID: bmo_backend_async_context)

errorHandler.ts (ID: bmo_backend_shared_types)

logger.ts (ID: bmo_backend_shared_types)

timezone.utils.ts (ID: bmo_backend_timezone_utils)

src/middleware/ Directory:

auth.middleware.ts (ID: bmo_backend_middleware_auth - Enhanced Authorization version)

context.middleware.ts (ID: bmo_backend_context_middleware)

tenant.middleware.ts (ID: bmo_backend_middleware_tenant)

validation.middleware.ts (ID: bmo_backend_validation_middleware - Define actual Zod schemas per module)

src/routes/ Directory:

auth.routes.ts (ID: bmo_backend_routes_auth)

booking.routes.ts (ID: bmo_backend_bookings_routes_slot_check)

customer.routes.ts (ID: bmo_backend_customers_routes)

employee.routes.ts (ID: bmo_backend_employees_routes - Updated for Schedules)

notification.routes.ts (ID: bmo_backend_notification_routes_controller)

schedule.routes.ts (ID: bmo_backend_schedule_routes)

service.routes.ts (ID: bmo_backend_routes_service)

business.routes.ts (Conceptual - Needs creation: similar structure for business CRUD, settings)

src/controllers/ Directory:

auth.controller.ts (ID: bmo_backend_controllers_auth)

booking.controller.ts (ID: bmo_backend_bookings_controller_slot_check)

customer.controller.ts (ID: bmo_backend_customers_controller)

employee.controller.ts (ID: bmo_backend_employees_controller)

notification.controller.ts (ID: bmo_backend_notification_routes_controller)

schedule.controller.ts (ID: bmo_backend_schedule_controller)

service.controller.ts (ID: bmo_backend_controllers_service)

business.controller.ts (Conceptual - Needs creation)

src/services/ Directory:

auth.service.ts (ID: bmo_backend_services_auth - JWT Enhancements version)

booking.service.ts (ID: bmo_backend_bookings_service - Advanced Validation & Concurrency version)

business.service.ts (ID: bmo_backend_business_service_tz_validation)

customer.service.ts (ID: bmo_backend_customers_service)

email.service.ts (ID: bmo_backend_email_service)

employee.service.ts (ID: bmo_backend_employees_service - ID Refinement version)

notification.service.ts (ID: bmo_backend_notification_service)

schedule.service.ts (ID: bmo_backend_schedule_service - Enhanced version)

scheduler.service.ts (ID: bmo_backend_scheduler_service)

service.service.ts (ID: bmo_backend_services_service)

src/test-setup/ Directory:

jest.setup.ts (ID: bmo_backend_jest_global_setup - Optional)

src/utils/__tests__/ Directory:

timezone.utils.spec.ts (ID: bmo_backend_unittest_timezone_utils)

Frontend Files (/var/www/bookmeatoz.online_ts/frontend/)
Root Directory:

// /var/www/bookmeatoz.online_ts/frontend/package.json
{
  "name": "bookmeatoz-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.4", // For react-hook-form + Zod
    "@tanstack/react-query": "^5.37.1",
    "@tanstack/react-query-devtools": "^5.37.1",
    "axios": "^1.7.2",
    "date-fns": "^3.6.0",
    "date-fns-tz": "^3.1.3",
    "react": "^18.2.0",
    "react-datepicker": "^6.9.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.51.5",
    "react-router-dom": "^6.23.1",
    "zod": "^3.23.8"
    // "react-toastify": "^10.0.0", // Or "sonner" - for actual toast library
    // "@fullcalendar/react": "^6.x.x", // If implementing advanced calendar
    // "@fullcalendar/daygrid": "^6.x.x",
    // "@fullcalendar/timegrid": "^6.x.x",
    // "@fullcalendar/interaction": "^6.x.x",
  },
  "devDependencies": {
    "@types/node": "^20.12.12", // For path in vite.config.ts
    "@types/react": "^18.2.66",
    "@types/react-datepicker": "^6.2.0",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}


public/ Directory:

favicon.svg (You need to create this)

logo-placeholder.svg (You need to create this)

logo-placeholder-white.svg (You need to create this)

src/ Directory:

src/types/ Directory:

src/contexts/ Directory:

// /var/www/bookmeatoz.online_ts/frontend/src/contexts/AuthContext.tsx
// ... (content from bmo_frontend_auth_context)
// Add this inside AuthProvider, within a useEffect:
useEffect(() => {
  const handleForcedLogout = () => {
    console.warn("AuthContext: Received forced logout event. Logging out.");
    clearToken(); // Ensure these are defined within AuthProvider or imported
    setUser(null);
    setIsAuthenticated(false);
    // No setIsLoadingAuth(false) here as it might interfere with ongoing auth init
    // Navigation should be handled by ProtectedRoute or router observing isAuthenticated
  };

  window.addEventListener('auth-logout-forced', handleForcedLogout);
  return () => {
    window.removeEventListener('auth-logout-forced', handleForcedLogout);
  };
}, []); // Add dependencies if clearToken, setUser, setIsAuthenticated are not stable
// ...


src/services/ Directory:

src/config/ Directory:

src/hooks/ Directory:

(Hooks for other entities like employees, customers, bookings, business settings, schedules are still needed here.)

src/components/common/ Directory:

ErrorBoundary.tsx (ID: bmo_frontend_error_boundary)

Spinner.tsx (ID: bmo_frontend_component_spinner)

TimeDisplay.tsx (ID: bmo_frontend_component_time_display)

src/components/layouts/ Directory:

AuthLayout.tsx (ID: bmo_frontend_layout_auth)

DashboardLayout.tsx (ID: bmo_frontend_layout_dashboard)

// /var/www/bookmeatoz.online_ts/frontend/src/components/layouts/MainLayout.tsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext'; // If needed for conditional header items

const MainLayout: React.FC = () => {
  // const { isAuthenticated, user } = useAuth();
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <img 
                    className="h-8 w-auto" 
                    src="/logo-placeholder.svg" 
                    alt="BookMeAtOz"
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/150x40/06b6d4/white?text=BookMeAtOz&font=Inter')}
                />
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {/* Example Nav Links - replace with actual public navigation */}
                <Link to="/" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                {/* <Link to="/features" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Features</Link> */}
                {/* <Link to="/pricing" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Pricing</Link> */}
              </div>
            </div>
            <div className="hidden md:block">
                {/* Example Auth Links */}
                {/* {isAuthenticated ? (
                    <Link to="/dashboard" className="btn btn-primary-outline text-sm">Dashboard</Link>
                ) : (
                    <Link to="/login" className="btn btn-primary text-sm">Login / Sign Up</Link>
                )} */}
                 <Link to="/login" className="text-sm font-medium text-primary hover:text-primary-dark">Login</Link>
                 <Link to="/dashboard" className="ml-4 text-sm font-medium text-white bg-primary hover:bg-primary-dark px-3 py-2 rounded-md">Go to Dashboard</Link>
            </div>
            <div className="-mr-2 flex md:hidden">
              {/* Mobile menu button */}
              <button type="button" className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary" aria-controls="mobile-menu" aria-expanded="false">
                <span className="sr-only">Open main menu</span>
                {/* Icon when menu is closed. */}
                {/* Heroicon name: outline/menu */}
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {/* Icon when menu is open. */}
                {/* Heroicon name: outline/x */}
                <svg className="hidden h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
        {/* Mobile menu, show/hide based on menu state. */}
        {/* <div className="md:hidden" id="mobile-menu"> ... </div> */}
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-neutral-darkest text-neutral-light py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          &copy; {new Date().getFullYear()} BookMeAtOz.online. All rights reserved.
          {/* Add footer links if needed */}
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;


src/components/booking/ Directory:

CustomerDetailsForm.tsx (ID: bmo_frontend_component_customer_details_form - with Zod Validation version)

DatePickerEnhanced.tsx (ID: bmo_frontend_component_datepicker_enhanced - Timezone Aware version)

EmployeeSelector.tsx (ID: bmo_frontend_component_employee_selector)

ServiceSelector.tsx (ID: bmo_frontend_component_service_selector)

TimeSlotPicker.tsx (ID: bmo_frontend_component_timeslot_picker - Using useTimezone version)

src/components/schedule/ Directory:

AvailabilityOverridesManager.tsx (ID: bmo_frontend_component_overrides_manager - Visual Calendar Concept & Refinements, with Toasts & Zod)

WeeklyScheduleEditor.tsx (ID: bmo_frontend_component_weekly_schedule_editor - Multi-block & Refinements, with Zod, with Time Input UX Notes)

src/pages/auth/ Directory:

ForgotPasswordPage.tsx (ID: bmo_frontend_page_forgot_password)

LoginPage.tsx (ID: bmo_frontend_page_login)

RegisterPage.tsx (ID: bmo_frontend_page_register)

ResetPasswordPage.tsx (ID: bmo_frontend_page_reset_password)

VerifyEmailPage.tsx (ID: bmo_frontend_page_verify_email)

src/pages/dashboard/ Subdirectories & Pages:

business/BusinessSettingsPage.tsx (Basic Placeholder - Needs Full Implementation)

// /var/www/bookmeatoz.online_ts/frontend/src/pages/dashboard/business/BusinessSettingsPage.tsx
import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types'; // Assuming PERMISSIONS are defined in types

const BusinessSettingsPage: React.FC = () => {
  const { businessInfo, isLoadingTenant } = useTenant();
  const { hasPermission } = useAuth();

  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_BUSINESS_SETTINGS);

  if (isLoadingTenant) return <p>Loading business information...</p>;
  if (!businessInfo) return <p className="text-red-500">No active business context found.</p>;
  if (!canManageSettings) return <p className="text-orange-500">You do not have permission to manage these settings.</p>;

  // TODO: Implement forms for:
  // 1. General Info (Name, Slug, Description)
  // 2. Contact Info (Phone, Address)
  // 3. Operating Hours (Business-wide defaults - link to schedule system)
  // 4. Timezone & Currency (CRITICAL)
  // 5. Booking Policies (cancellation, lead times)
  // 6. Online Booking Page Customization (theme, logo - advanced)
  // Use TanStack Query hooks to fetch and update settings.

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Business Settings for {businessInfo.name}</h1>
      <div className="space-y-8">
        <section className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-xl font-medium text-gray-800 mb-4">General Information</h2>
          <p className="text-gray-600">Edit business name, public description, contact details, timezone, and currency.</p>
          {/* Placeholder for form */}
          <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-500">
            Business Information Form (Name, Slug, Timezone, Currency, etc.) - To be implemented
          </div>
        </section>
        <section className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Default Business Hours</h2>
          <p className="text-gray-600">Set the standard operating hours for your business. Employee-specific schedules can override these.</p>
          {/* Placeholder for business-wide WeeklyScheduleEditor component */}
          <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-500">
            Business-wide Weekly Schedule Editor - To be implemented
          </div>
        </section>
         <section className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Booking Policies</h2>
          <p className="text-gray-600">Configure cancellation policies, minimum booking notice, booking window, etc.</p>
          <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-500">
            Booking Policy Configuration Form - To be implemented
          </div>
        </section>
        {/* Add more sections as needed */}
      </div>
    </div>
  );
};
export default BusinessSettingsPage;


bookings/ManageBookingsPage.tsx (ID: bmo_frontend_page_manage_bookings)

customers/ManageCustomersPage.tsx (ID: bmo_frontend_page_manage_customers)

employees/ManageEmployeeSchedulePage.tsx (ID: bmo_frontend_page_manage_employee_schedule - ID Fix, with Toasts)

employees/ManageEmployeesPage.tsx (ID: bmo_frontend_page_manage_employees - ID Link Fix version)

services/ManageServicesPage.tsx (ID: bmo_frontend_page_manage_services)

UserDashboardPage.tsx (Basic Placeholder - Needs Full Implementation)

// /var/www/bookmeatoz.online_ts/frontend/src/pages/dashboard/UserDashboardPage.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Link } from 'react-router-dom';

const UserDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { businessInfo, tenantInfo } = useTenant();

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">
        Welcome back, {user?.profile?.name || user?.email}!
      </h1>

      {businessInfo && (
        <p className="text-lg text-gray-700 mb-1">
          Current Business: <span className="font-medium">{businessInfo.name}</span>
        </p>
      )}
      {tenantInfo && !businessInfo && ( // If only tenant context, e.g. tenant admin not in specific business view
         <p className="text-lg text-gray-700 mb-1">
          Current Tenant: <span className="font-medium">{tenantInfo.name}</span>
        </p>
      )}
      <p className="text-sm text-gray-500 mb-6">This is your main dashboard. Quick actions and overviews will appear here.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for Upcoming Bookings Overview */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Upcoming Bookings</h2>
          <p className="text-gray-600">Your next 5 upcoming bookings will be listed here.</p>
          <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-400">
            Upcoming Bookings List - To be implemented
          </div>
           <Link to="bookings" className="mt-4 inline-block text-sm text-primary hover:underline">View All Bookings &rarr;</Link>
        </div>

        {/* Placeholder for Quick Actions */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="bookings/new" className="block btn btn-primary-outline w-full text-center">Create New Booking</Link>
            <Link to="customers" className="block btn btn-primary-outline w-full text-center">Manage Customers</Link>
            <Link to="services" className="block btn btn-primary-outline w-full text-center">Manage Services</Link>
          </div>
        </div>

        {/* Placeholder for Notifications/Alerts */}
        <div className="bg-white p-6 shadow rounded-lg md:col-span-2 lg:col-span-1">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Notifications & Alerts</h2>
          <p className="text-gray-600">Important system alerts or notifications will appear here.</p>
           <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-400">
            Notifications Area - To be implemented
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;


src/pages/public/ Directory:

HomePage.tsx (Basic Placeholder - Needs Full Implementation)

// /var/www/bookmeatoz.online_ts/frontend/src/pages/public/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">BookMeAtOz.online</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            The Smart Booking Solution
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Streamline your appointments, manage your services, and grow your business with ease.
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/register" // Or to a specific "get started" page for businesses
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
          >
            Get Started Today
          </Link>
          <Link
            to="/login" // Or a link to find businesses if that's a feature
            className="ml-4 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-primary-lightest hover:bg-primary-light"
          >
            Login / Find a Business
          </Link>
        </div>
        {/* Add sections for features, testimonials, etc. */}
      </div>
    </div>
  );
};

export default HomePage;


src/pages/tenant/ Directory:

TenantHomePage.tsx (Basic Placeholder - Needs Full Implementation)

// /var/www/bookmeatoz.online_ts/frontend/src/pages/tenant/TenantHomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import Spinner from '@/components/common/Spinner';

const TenantHomePage: React.FC = () => {
  const { businessInfo, isLoadingTenant, currentSubdomain } = useTenant();

  if (isLoadingTenant) {
    return <div className="flex justify-center items-center h-64"><Spinner size="h-10 w-10" /></div>;
  }

  if (!businessInfo) {
    return (
      <div className="text-center py-10 px-4">
        <h1 className="text-2xl font-semibold text-red-600">Business Not Found</h1>
        <p className="text-gray-600 mt-2">
          The business associated with the subdomain "<strong>{currentSubdomain}</strong>" could not be loaded.
        </p>
        <p className="mt-4">
            <Link to="/" className="text-primary hover:underline">Go to main site</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Business Logo - conceptual */}
          {/* {businessInfo.settings?.logoUrl && <img src={businessInfo.settings.logoUrl} alt={`${businessInfo.name} logo`} className="mx-auto h-24 w-auto mb-6"/>} */}
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Welcome to <span className="text-primary-dark">{businessInfo.name}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            {/* Business tagline or short description from businessInfo.settings?.description */}
            Your preferred place for [Type of Service, e.g., Haircuts, Consultations]. Book your appointment with us today!
          </p>
          <div className="mt-10">
            <Link
              to="/book" // Links to the TenantPublicBookingPage
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark transform transition hover:scale-105"
            >
              Book an Appointment
            </Link>
             {/* Optionally, link to list of services */}
            {/* <Link
              to="/services" 
              className="ml-4 inline-flex items-center justify-center px-8 py-3 border border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50"
            >
              View Our Services
            </Link> */}
          </div>
        </div>
        {/* Add more sections: Featured services, About Us, Contact Info, Map, Testimonials */}
      </div>
    </div>
  );
};

export default TenantHomePage;


TenantPublicBookingPage.tsx (ID: bmo_frontend_page_tenant_public_booking - Using Extracted Components, Timezone Aware, with Slot Re-validation, Zod in form)

src/pages/ Directory:

NotFoundPage.tsx (Basic Placeholder - Needs Implementation)

// /var/www/bookmeatoz.online_ts/frontend/src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
      <svg className="w-24 h-24 text-primary mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 14h6"></path></svg>
      <h1 className="text-5xl font-extrabold text-neutral-darkest mb-3">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p className="text-gray-500 max-w-md mb-8">
        Oops! The page you're looking for doesn't seem to exist. It might have been moved, deleted, or maybe you just mistyped the URL.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;


src/utils/ Directory:

toast.ts (ID: bmo_frontend_toast_utility - Simple placeholder)