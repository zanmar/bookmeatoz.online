import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query as dbQuery, getClient } from '@/config/db';
import { AppError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import {
  User,
  DecodedUserToken,
  LoginResponse,
  UserRole,
  Permission,
  PERMISSIONS,
  TokenBlacklistEntry,
} from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Default to 15 minutes
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'; // Default to 30 days

// ... (ROLE_PERMISSIONS_MAP_SERVICE as before)

// Helper to generate tokens
const generateTokens = (
  user: Pick<User, 'id' | 'email' | 'system_role'>,
  currentRoles: UserRole[],
  currentTenantId?: string,
  currentBusinessId?: string
): { accessToken: string; refreshToken: string } => {
  const accessTokenPayload: Partial<DecodedUserToken> = {
    userId: user.id,
    email: user.email,
    roles: currentRoles,
    ...(currentTenantId && { tenantId: currentTenantId }),
    ...(currentBusinessId && { businessId: currentBusinessId }),
  };
  const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
  const refreshTokenPayload = { userId: user.id, type: 'refresh', version: 1 };
  const refreshToken = jwt.sign(refreshTokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
  return { accessToken, refreshToken };
};

export const authService = {
  // ... (register as before) ...
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    requestedRole?: UserRole;
  }): Promise<User> => {
    const { email, password, name, requestedRole } = userData;
    // Check if user already exists
    const existing = await dbQuery('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) throw new AppError('Email already registered.', 409);
    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const profile = { name };
    const status = 'active';
    const email_verified = false;
    const system_role = requestedRole || 'customer';
    await dbQuery(
      'INSERT INTO users (id, email, password_hash, status, profile, email_verified, system_role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        id,
        email.toLowerCase(),
        password_hash,
        status,
        JSON.stringify(profile),
        email_verified,
        system_role,
      ]
    );
    return {
      id,
      email: email.toLowerCase(),
      password_hash,
      status,
      profile,
      email_verified,
      system_role,
      created_at: new Date(),
      updated_at: new Date(),
    } as User;
  },

  login: async (
    email: string,
    passwordInput: string,
    loginTenantId?: string,
    loginBusinessId?: string
  ): Promise<LoginResponse> => {
    const userResult = await dbQuery(
      'SELECT id, email, password_hash, status, profile, system_role, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (userResult.rows.length === 0)
      throw new AppError('Invalid email or password.', 401, true, undefined, 'INVALID_CREDENTIALS');
    const user: User = userResult.rows[0];

    if (user.status !== 'active')
      throw new AppError(
        `User account is ${user.status}. Access denied.`,
        403,
        true,
        undefined,
        'USER_INACTIVE'
      );
    // if (!user.email_verified) throw new AppError('Please verify your email before logging in.', 403, true, undefined, 'EMAIL_NOT_VERIFIED');

    const isPasswordValid = await bcrypt.compare(passwordInput, user.password_hash);
    if (!isPasswordValid)
      throw new AppError('Invalid email or password.', 401, true, undefined, 'INVALID_CREDENTIALS');

    // Determine roles for the token based on login context (if provided) or defaults
    let effectiveRoles: UserRole[] = [];
    if (user.system_role) effectiveRoles.push(user.system_role as UserRole);

    let determinedTenantId = loginTenantId;
    const determinedBusinessId = loginBusinessId;

    if (determinedBusinessId) {
      const bizRoles = await dbQuery(
        'SELECT role FROM user_business_roles WHERE user_id = $1 AND business_id = $2 AND status = $3',
        [user.id, determinedBusinessId, 'active']
      );
      effectiveRoles.push(...bizRoles.rows.map((r) => r.role as UserRole));
      if (!determinedTenantId) {
        // Infer tenant from business if not explicitly provided
        const bizTenant = await dbQuery('SELECT tenant_id FROM businesses WHERE id = $1', [
          determinedBusinessId,
        ]);
        if (bizTenant.rows.length > 0) determinedTenantId = bizTenant.rows[0].tenant_id;
      }
    } else if (determinedTenantId) {
      const tenantAdminRoles = await dbQuery(
        'SELECT role FROM tenant_admins WHERE user_id = $1 AND tenant_id = $2',
        [user.id, determinedTenantId]
      );
      effectiveRoles.push(...tenantAdminRoles.rows.map((r) => r.role as UserRole));
    }

    if (effectiveRoles.length === 0 && !user.system_role) effectiveRoles.push('customer');
    effectiveRoles = [...new Set(effectiveRoles)];

    const { accessToken, refreshToken } = generateTokens(
      user,
      effectiveRoles,
      determinedTenantId,
      determinedBusinessId
    );

    await dbQuery('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    logger.info(
      `User logged in: ${user.email} (ID: ${user.id}). Roles: [${effectiveRoles.join(', ')}] Context: T=${determinedTenantId}, B=${determinedBusinessId}`
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        roles: effectiveRoles,
      },
    };
  },

  logout: async (token: string, tokenExp: number): Promise<void> => {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(tokenExp * 1000);
    try {
      await dbQuery(
        'INSERT INTO token_blacklist (token_hash, expires_at) VALUES ($1, $2) ON CONFLICT (token_hash) DO NOTHING',
        [tokenHash, expiresAt]
      );
      logger.info(`Access token blacklisted (hash: ${tokenHash.substring(0, 10)}...)`);
    } catch (error) {
      logger.error('Error blacklisting access token:', { error });
    }
  },

  /**
   * Refreshes the access token using a valid refresh token.
   * Re-evaluates user context and roles for the new session.
   */
  refreshAccessToken: async (
    incomingRefreshToken: string
  ): Promise<{ accessToken: string; refreshToken?: string }> => {
    try {
      const decoded = jwt.verify(incomingRefreshToken, JWT_REFRESH_SECRET) as {
        userId: string;
        type?: string;
        version?: number;
      };
      if (decoded.type !== 'refresh') {
        throw new AppError(
          'Invalid refresh token type.',
          401,
          true,
          undefined,
          'INVALID_REFRESH_TOKEN'
        );
      }

      // Optionally: Check if refresh token is blacklisted (see advanced comment above)

      const userResult = await dbQuery(
        'SELECT id, email, status, system_role FROM users WHERE id = $1 AND status = $2',
        [decoded.userId, 'active']
      );
      if (userResult.rows.length === 0) {
        throw new AppError('User not found or inactive.', 401, true, undefined, 'USER_NOT_FOUND');
      }
      const user: Pick<User, 'id' | 'email' | 'system_role'> = userResult.rows[0];

      // Re-evaluate roles/context for the new token (minimal context for refresh)
      const effectiveRoles: UserRole[] = [];
      if (user.system_role) effectiveRoles.push(user.system_role as UserRole);
      if (effectiveRoles.length === 0) effectiveRoles.push('customer');

      const { accessToken, refreshToken: newRefreshTokenIfRotating } = generateTokens(
        user,
        effectiveRoles
      );
      logger.info(`Access token refreshed for user: ${user.email}`);
      return { accessToken, refreshToken: newRefreshTokenIfRotating };
    } catch (error: any) {
      logger.error('Error refreshing token:', { error });
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          'Invalid or expired refresh token. Please log in again.',
          401,
          true,
          undefined,
          'INVALID_REFRESH_TOKEN'
        );
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to refresh token.', 500);
    }
  },

  // ... (getUserById, getContextualUser, password reset, email verification as before) ...
  async getUserById(userId: string): Promise<User | null> {
    /* ... */ return null;
  },
  async getContextualUser(userId: string, tenantId?: string, businessId?: string): Promise<any> {
    /* ... */ return {};
  },
  async requestPasswordReset(email: string): Promise<void> {
    /* ... */
  },
  async resetPassword(token: string, newPasswordInput: string): Promise<void> {
    /* ... */
  },
  async verifyEmail(token: string): Promise<void> {
    /* ... */
  },
};
