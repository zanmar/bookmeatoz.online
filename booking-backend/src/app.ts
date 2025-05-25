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
import { authMiddleware } from '@/middleware/auth.middleware'; // Ensure this is correctly imported
import { contextMiddleware } from '@/middleware/context.middleware'; // Import new context middleware
import { DecodedUserToken } from '@/types'; // Assuming this type is defined for JWT payload

// Import routes
import authRoutes from '@/routes/auth.routes';
import serviceRoutes from '@/routes/service.routes';
import employeeRoutes from '@/routes/employee.routes'; // This now includes nested schedule.routes
import customerRoutes from '@/routes/customer.routes';
import bookingRoutes from '@/routes/booking.routes';
import notificationRoutes from '@/routes/notification.routes';
// import businessRoutes from '@/routes/business.routes'; // Placeholder if you create this file

dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Ensure .env is loaded

const app: Express = express();
const server = http.createServer(app); // Create HTTP server for Express app

// Socket.IO Setup
// Ensure CORS settings for Socket.IO match or are compatible with your frontend URL
const corsOriginSocket = (process.env.CORS_ORIGIN_WHITELIST || 'http://localhost:5173').split(',');

export const io = new SocketIOServer(server, {
  cors: {
    origin: corsOriginSocket,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO Authentication Middleware
io.use(async (socket: Socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['x-socket-token']; // Allow token via auth or header
  if (token && typeof token === 'string') {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedUserToken;
      // TODO: Optionally, perform a quick DB check to ensure the user is still active/valid
      // const userResult = await dbQuery('SELECT status FROM users WHERE id = $1', [decoded.userId]);
      // if (!userResult.rows.length || userResult.rows[0].status !== 'active') {
      //   return next(new Error('User inactive or not found'));
      // }
      (socket as any).user = decoded; // Attach decoded user payload to socket object
      next();
    } catch (err: any) {
      logger.warn('Socket Auth Error:', { message: err.message, tokenProvided: !!token });
      next(new Error('Authentication error: Invalid token'));
    }
  } else {
    logger.warn('Socket Auth Error: No token provided');
    next(new Error('Authentication error: No token provided'));
  }
});

io.on('connection', (socket: Socket) => {
  const user = (socket as any).user as DecodedUserToken | undefined;
  if (!user || !user.userId) {
    // This case should ideally be caught by the auth middleware,
    // but as a safeguard, disconnect if user info is missing.
    logger.warn(
      `Socket connection attempt without valid user context after auth middleware. SID: ${socket.id}`
    );
    socket.disconnect(true);
    return;
  }

  logger.info(`Socket connected: ${socket.id}, User ID: ${user.userId}`);
  socket.join(`user_${user.userId}`); // Each user joins their own room for personal notifications

  // Example: Listen for a client event
  socket.on('client_event_example', (data) => {
    logger.debug(`Received 'client_event_example' from user ${user.userId} with data:`, data);
    // socket.emit('server_response_example', { message: 'Data received!' });
  });

  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id}, User ID: ${user.userId}, Reason: ${reason}`);
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for SID ${socket.id}, User ID ${user.userId}:`, error);
  });
});

// --- Global Express Middleware ---
app.use(helmet()); // Security headers: XSS protection, frameguard, etc.

const corsOriginExpress = (process.env.CORS_ORIGIN_WHITELIST || 'http://localhost:5173').split(',');
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) or from whitelisted origins
    if (!origin || corsOriginExpress.includes(origin) || corsOriginExpress.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS: Blocked by Express CORS policy', { origin });
      callback(new AppError(`Not allowed by CORS: ${origin}`, 403));
    }
  },
  credentials: true, // Important for cookies, authorization headers with HTTPS
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// HTTP Request Logger (Morgan)
const API_BASE_URL_FOR_SKIP = process.env.API_BASE_URL || '/api/v1';
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req: Request) => req.path === `${API_BASE_URL_FOR_SKIP}/health`, // Skip logging for health checks
  })
);

// Middleware Order is Important for context propagation
app.use(tenantMiddleware); // 1. Resolves tenant/business from subdomain, populates req.tenantId, req.businessId
// Note: authMiddleware is applied per-route for protected routes.
// contextMiddleware runs on all requests to set up AsyncLocalStorage.
// It will pick up tenantId/businessId from tenantMiddleware, and userId/roles if authMiddleware has run before it for a specific route.
app.use(contextMiddleware); // 2. Sets up AsyncLocalStorage for RLS and richer logging context

// --- API Routes ---
const API_BASE_URL = process.env.API_BASE_URL || '/api/v1';

// Health Check Endpoint (publicly accessible)
app.get(`${API_BASE_URL}/health`, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    // These might be undefined if called directly without subdomain/auth
    tenantId: req.tenantId,
    businessId: req.businessId,
    subdomain: req.subdomain,
  });
});

// Mount application routes
app.use(`${API_BASE_URL}/auth`, authRoutes);
app.use(`${API_BASE_URL}/services`, serviceRoutes); // Protected by authMiddleware internally in routes file
app.use(`${API_BASE_URL}/employees`, employeeRoutes); // Protected by authMiddleware internally
app.use(`${API_BASE_URL}/customers`, customerRoutes); // Protected by authMiddleware internally
app.use(`${API_BASE_URL}/bookings`, bookingRoutes); // Contains mixed public and protected routes
app.use(`${API_BASE_URL}/notifications`, notificationRoutes); // Protected by authMiddleware internally

// Placeholder for business routes (if you create business.routes.ts)
// import businessRoutes from '@/routes/business.routes';
// app.use(`${API_BASE_URL}/businesses`, businessRoutes);

// --- Not Found Handler (404) ---
// This should be after all your specific routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(
      `API route not found: ${req.method} ${req.originalUrl}`,
      404,
      true,
      undefined,
      'ROUTE_NOT_FOUND'
    )
  );
});

// --- Global Error Handler ---
// This should be the last piece of middleware
app.use(globalErrorHandler);

// Export the HTTP server (for server.ts to start) and io (for services to emit events)
export { server, app };
