// /var/www/bookmeatoz.online_ts/booking-backend/src/middleware/tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';
import {
  query as dbQuery,
  setTenantContextInSession,
  clearTenantContextInSession,
  getClient,
} from '@/config/db';
import logger from '@/utils/logger';
import { AppError } from '@/utils/errorHandler';
import { PoolClient } from 'pg';

// Middleware to extract subdomain and resolve tenant/business context
export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const hostname = req.headers.host || ''; // e.g., 'mybiz.bookmeatoz.online' or 'bookmeatoz.online'
  const parts = hostname.split('.');

  req.subdomain = null;
  req.tenantId = undefined;
  req.businessId = undefined;

  // Check if it's a potential subdomain request
  // Assuming main domain is bookmeatoz.online (2 parts) or www.bookmeatoz.online (3 parts)
  // Subdomains would be like tenant.bookmeatoz.online (3 parts)
  // This logic might need adjustment based on exact domain structure
  const isLikelySubdomain = parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api';

  if (isLikelySubdomain) {
    req.subdomain = parts[0];
    logger.debug(`Detected potential subdomain: ${req.subdomain}`);

    const client: PoolClient | null = null;
    try {
      // Resolve tenant and business from subdomain
      // The SQL query is based on the 'multi_tenancy.md' document.
      const tenantQuery = `
        SELECT t.id as tenant_id, b.id as business_id, b.status as business_status, t.status as tenant_status
        FROM businesses b
        JOIN tenants t ON b.tenant_id = t.id
        WHERE b.subdomain = $1;
      `;
      const result = await dbQuery(tenantQuery, [req.subdomain]);

      if (result.rows.length > 0) {
        const data = result.rows[0];
        if (data.tenant_status !== 'active') {
          logger.warn(
            `Tenant ${data.tenant_id} associated with subdomain ${req.subdomain} is not active (status: ${data.tenant_status}).`
          );
          // Depending on policy, you might deny access or allow limited access
          // For now, let's deny if tenant is not active.
          return next(new AppError(`Tenant account is ${data.tenant_status}.`, 403));
        }
        if (data.business_status !== 'active') {
          logger.warn(
            `Business ${data.business_id} (subdomain ${req.subdomain}) is not active (status: ${data.business_status}).`
          );
          // Deny if business is not active.
          return next(new AppError(`Business account is ${data.business_status}.`, 403));
        }

        req.tenantId = data.tenant_id;
        req.businessId = data.business_id;
        logger.info(
          `Tenant context resolved for subdomain '${req.subdomain}': tenantId=${req.tenantId}, businessId=${req.businessId}`
        );

        // Set tenant context in DB session if RLS is used and a DB client is managed per request
        // This part is complex and depends on how you manage DB clients (per request vs. global pool for simple queries)
        // For RLS to work with `current_setting`, the `app.tenant_id` must be set within the transaction/session.
        // If you get a client from the pool for each request:
        // client = await getClient(); // Get a client from the pool
        // req.dbClient = client; // Attach to request for later use and release
        // await setTenantContextInSession(client, req.tenantId, req.businessId);

        // // Ensure client is released and context is cleared after the request
        // const originalEnd = res.end;
        // res.end = function (...args: any[]) {
        //   if (client) {
        //     clearTenantContextInSession(client)
        //       .catch(err => logger.error('Error clearing tenant context on res.end', { error: err }))
        //       .finally(() => {
        //         client!.release();
        //         logger.debug('DB client released on res.end');
        //       });
        //   }
        //   return originalEnd.apply(this, args);
        // };
      } else {
        logger.warn(`No active tenant/business found for subdomain: ${req.subdomain}`);
        // Optionally, you could allow the request to proceed without tenant context
        // or return a 404/403 error.
        // For now, let's proceed without setting tenantId/businessId if not found.
        // If a subdomain MUST resolve to a tenant, then:
        // return next(new AppError(`Business not found for subdomain: ${req.subdomain}`, 404));
      }
    } catch (error) {
      logger.error('Error resolving tenant from subdomain:', { subdomain: req.subdomain, error });
      return next(new AppError('Failed to resolve tenant information.', 500));
    } /*finally {
        // This finally block is only relevant if you acquire a client within this middleware
        // if (client && !req.dbClient) { // If client was acquired but not passed on
        //  client.release();
        //  logger.debug('DB client released in tenantMiddleware finally block');
        // }
    }*/
  } else {
    logger.debug('No subdomain detected or processing main domain request.');
  }

  next();
};
