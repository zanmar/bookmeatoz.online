import { UserRole, Permission, UserProfile } from './user.types';
import { BaseEntity } from './common.types';

export interface DecodedUserToken {
  userId: string; // User UUID
  email: string;
  roles: UserRole[]; // Roles relevant to the token's scope (e.g., system, or specific business)
  permissions?: Permission[]; // Derived permissions
  tenantId?: string; // If token is scoped to a tenant
  businessId?: string; // If token is scoped to a business
  isTenantAdmin?: boolean; // Specific flag from tenant_admins
  // Add other relevant fields from JWT payload
  iat: number;
  exp: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string; // If using refresh tokens
  user: {
    id: string;
    email: string;
    profile: UserProfile | null;
    roles: UserRole[]; // Global or most relevant roles
    // tenantId and businessId might be included if login is context-specific
  };
}

export interface TokenBlacklistEntry extends BaseEntity {
  token_hash: string; // SHA256 hash of the JTI or the token itself
  expires_at: Date; // When this blacklist entry can be cleaned up
}
