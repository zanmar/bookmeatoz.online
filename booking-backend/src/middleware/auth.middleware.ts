// /var/www/bookmeatoz.online_ts/booking-backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query as dbQuery } from '@/config/db';
import logger from '@/utils/logger';
import { AppError } from '@/utils/errorHandler';
import { DecodedUserToken, UserRole, Permission, PERMISSIONS, User } from '@/types';
import { getAppContext } from '@/utils/asyncContext'; // For accessing context

const JWT_SECRET = process.env.JWT_SECRET!;
// ... (ROLE_PERMISSIONS_MAP as defined and refined previously) ...
// Example ROLE_PERMISSIONS_MAP (ensure this is complete and accurate for your app)
const ROLE_PERMISSIONS_MAP: Record<string, Permission[]> = {
  system_admin: Object.values(PERMISSIONS),
  tenant_admin: [
    PERMISSIONS.MANAGE_TENANT_BUSINESSES,
    PERMISSIONS.MANAGE_TENANT_USERS,
    PERMISSIONS.VIEW_TENANT_REPORTS,
    PERMISSIONS.MANAGE_TENANT_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_BUSINESS_SETTINGS,
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.MANAGE_SCHEDULES,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.VIEW_BUSINESS_REPORTS,
    PERMISSIONS.MANAGE_CUSTOMERS,
  ],
  business_owner: [
    /* ... */ PERMISSIONS.MANAGE_BUSINESS_SETTINGS,
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.MANAGE_SCHEDULES,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.VIEW_BUSINESS_REPORTS,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_BUSINESS_BILLING,
  ],
  manager: [
    /* ... */ PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.MANAGE_SCHEDULES,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.VIEW_BUSINESS_REPORTS,
    PERMISSIONS.MANAGE_CUSTOMERS,
  ],
  employee: [
    /* ... */ PERMISSIONS.VIEW_OWN_SCHEDULE,
    PERMISSIONS.MANAGE_OWN_BOOKINGS,
    PERMISSIONS.VIEW_ASSIGNED_BOOKINGS,
  ],
  customer: [
    /* ... */ PERMISSIONS.CREATE_BOOKINGS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
  ],
};

export const authMiddleware = {
  authenticate: async (req: Request, res: Response, next: NextFunction) => {
    // ... (existing authentication logic: get token, verify, check blacklist, fetch user) ...
    // Ensure req.userId, req.roles, req.permissions, req.tokenData are populated.
    // The contextMiddleware will pick these up for AsyncLocalStorage.
    // This part remains largely the same as the previous robust version.
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer '))
        return next(new AppError('Authentication required. No token provided.', 401));
      const token = authHeader.split(' ')[1];
      if (!token) return next(new AppError('Authentication required. Token format invalid.', 401));

      let decodedPayload: DecodedUserToken;
      try {
        decodedPayload = jwt.verify(token, JWT_SECRET) as DecodedUserToken;
      } catch (error: any) {
        if (error.name === 'TokenExpiredError')
          return next(
            new AppError(
              'Token expired. Please log in again.',
              401,
              true,
              undefined,
              'TOKEN_EXPIRED'
            )
          );
        return next(
          new AppError(
            'Invalid token. Authentication failed.',
            401,
            true,
            undefined,
            'INVALID_TOKEN'
          )
        );
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const blacklistResult = await dbQuery(
        'SELECT 1 FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW()',
        [tokenHash]
      );
      if (blacklistResult.rows.length > 0)
        return next(new AppError('Token has been revoked.', 401, true, undefined, 'TOKEN_REVOKED'));

      const userResult = await dbQuery(
        'SELECT id, email, status, profile, email_verified, system_role FROM users WHERE id = $1',
        [decodedPayload.userId]
      );
      if (userResult.rows.length === 0)
        return next(new AppError('User not found.', 401, true, undefined, 'USER_NOT_FOUND'));

      const user: User = userResult.rows[0];
      if (user.status !== 'active')
        return next(
          new AppError(
            `User account is ${user.status}. Access denied.`,
            403,
            true,
            undefined,
            'USER_INACTIVE'
          )
        );

      req.user = decodedPayload; // JWT payload
      req.userId = user.id; // Confirmed user ID from DB
      req.tokenData = decodedPayload;

      // Role and Permission Hydration (crucial for subsequent middleware)
      const userRoles: UserRole[] = [];
      if (user.system_role) userRoles.push(user.system_role as UserRole); // Add system role first

      // Get tenantId and businessId from AsyncLocalStorage if already set by tenantMiddleware
      const appContext = getAppContext();
      const currentTenantId = appContext?.tenantId || decodedPayload.tenantId; // Prefer context, fallback to token
      const currentBusinessId = appContext?.businessId || decodedPayload.businessId; // Prefer context

      if (currentBusinessId) {
        const businessRolesResult = await dbQuery(
          'SELECT role FROM user_business_roles WHERE user_id = $1 AND business_id = $2 AND status = $3',
          [user.id, currentBusinessId, 'active']
        );
        userRoles.push(...businessRolesResult.rows.map((r) => r.role as UserRole));
        req.businessId = currentBusinessId; // Ensure it's on req if resolved this way
      }
      if (currentTenantId && !currentBusinessId) {
        // If only tenant context (e.g. tenant admin dashboard)
        const tenantAdminResult = await dbQuery(
          'SELECT role FROM tenant_admins WHERE user_id = $1 AND tenant_id = $2',
          [user.id, currentTenantId]
        );
        userRoles.push(...tenantAdminResult.rows.map((r) => r.role as UserRole));
        req.tenantId = currentTenantId; // Ensure it's on req
      }

      if (userRoles.length === 0 && !user.system_role) userRoles.push('customer'); // Default if no other roles
      req.roles = [...new Set(userRoles)];

      const userPermissions: Permission[] = [];
      req.roles.forEach((role) => {
        userPermissions.push(...(ROLE_PERMISSIONS_MAP[role] || []));
      });
      req.permissions = [...new Set(userPermissions)];

      logger.debug(
        `User ${req.userId} authenticated. Roles: [${req.roles.join(', ')}]. Context: T=${currentTenantId}, B=${currentBusinessId}`
      );
      next();
    } catch (error) {
      /* ... (existing error handling) ... */ next(error);
    }
  },

  requireTenantContext: (req: Request, res: Response, next: NextFunction) => {
    const appContext = getAppContext();
    if (!appContext?.tenantId) {
      return next(
        new AppError(
          'Tenant context is required for this operation.',
          400,
          true,
          undefined,
          'TENANT_CONTEXT_REQUIRED'
        )
      );
    }
    // req.tenantId should also be populated by tenantMiddleware for direct use if needed
    if (!req.tenantId && appContext.tenantId) req.tenantId = appContext.tenantId;
    next();
  },

  requireBusinessContext: (req: Request, res: Response, next: NextFunction) => {
    const appContext = getAppContext();
    if (!appContext?.businessId) {
      return next(
        new AppError(
          'Business context is required for this operation.',
          400,
          true,
          undefined,
          'BUSINESS_CONTEXT_REQUIRED'
        )
      );
    }
    if (!req.businessId && appContext.businessId) req.businessId = appContext.businessId;
    next();
  },

  // authorizePermissions (refined from previous)
  authorizePermissions: (requiredPermissions: Permission[] | Permission) => {
    const permissionsArray = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !req.permissions) {
        // req.permissions populated by authenticate middleware
        return next(
          new AppError(
            'Authentication required with permissions for this action.',
            401,
            true,
            undefined,
            'AUTH_REQUIRED_FOR_PERMISSION_CHECK'
          )
        );
      }
      const hasRequiredPermission = permissionsArray.every((perm) =>
        req.permissions!.includes(perm)
      );
      if (!hasRequiredPermission) {
        logger.warn(
          `Authorization failed for user ${req.userId}. Required: [${permissionsArray.join(', ')}], Has: [${req.permissions.join(', ')}] on route ${req.originalUrl}`
        );
        return next(
          new AppError(
            'Forbidden. You do not have the required permissions.',
            403,
            true,
            undefined,
            'INSUFFICIENT_PERMISSIONS'
          )
        );
      }
      next();
    };
  },

  // validateResourceAccess: This is highly context-specific.
  // It would typically involve fetching the resource and checking its ownership against current context.
  // Example for a generic check (would need a service to fetch resource owner)
  // validateResourceAccess: (resourceType: string, getResourceOwnerInfo: (resourceId: string, client?: PoolClient) => Promise<{tenantId?: string, businessId?: string, userId?: string} | null>) => {
  //   return async (req: Request, res: Response, next: NextFunction) => {
  //     const resourceId = req.params.id || req.params[`${resourceType}Id`]; // Common param names
  //     if (!resourceId) return next(new AppError(`Resource ID for ${resourceType} not found in request.`, 400));
  //     const appContext = getAppContext();
  //     if (!appContext?.userId && !appContext?.isSystemAdmin) return next(new AppError('User context required to validate resource access.', 401));

  //     try {
  //       const ownerInfo = await getResourceOwnerInfo(resourceId);
  //       if (!ownerInfo) return next(new AppError(`${resourceType} not found.`, 404));

  //       if (appContext?.isSystemAdmin) return next();

  //       let authorized = false;
  //       if (ownerInfo.tenantId && ownerInfo.tenantId === appContext?.tenantId) authorized = true;
  //       else if (ownerInfo.businessId && ownerInfo.businessId === appContext?.businessId) authorized = true;
  //       else if (ownerInfo.userId && ownerInfo.userId === appContext?.userId) authorized = true;
  //       else authorized = false; // If none of the above matched, not authorized for non-admin

  //       if (!authorized) return next(new AppError(`Forbidden. You do not have access to this ${resourceType}.`, 403));
  //       next();
  //     } catch (error) {
  //       next(error);
  //     }
  //   };
  // }
  // Note: validateResourceAccess is better implemented within each service method where resource is fetched,
  // or by RLS policies directly. A generic middleware is hard to make truly secure and efficient.
  // RLS is the preferred way for row-level access. This middleware is more for "can this user even attempt an operation on this type of resource in this context".

  // Business access validation middleware
  validateBusinessAccess: (req: Request, res: Response, next: NextFunction) => {
    // Implementation: check req.businessId and user permissions
    if (!req.businessId) return res.status(403).json({ error: 'No business context' });
    // Add RBAC check here if needed
    next();
  },
};

export default authMiddleware;
