// Re-export all types for easier imports
export * from './common.types';
export * from './user.types';
export * from './tenant.types';
export * from './business.types';
export * from './service.types';
export * from './employee.types';
export * from './booking.types';
export * from './customer.types';
export * from './auth.types';
export * from './subscription.types';

// Import types for augmentation
import type { DecodedUserToken } from './auth.types';
import type { UserRole, Permission } from './user.types';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: DecodedUserToken; // From JWT
      userId?: string; // UUID of the authenticated user
      tenantId?: string; // UUID of the current tenant
      businessId?: string; // UUID of the current business (if applicable)
      subdomain?: string | null; // Detected subdomain
      roles?: UserRole[]; // Roles of the user in the current business context
      permissions?: Permission[]; // Permissions derived from roles
      tokenData?: DecodedUserToken; // Raw decoded JWT payload
      // If using request-scoped DB client from pool
      // dbClient?: import('pg').PoolClient;
      logger?: import('winston').Logger;
    }
  }
}

export {};
