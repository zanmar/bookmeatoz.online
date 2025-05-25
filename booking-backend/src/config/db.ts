import { Pool, PoolConfig, PoolClient } from 'pg';
import dotenv from 'dotenv';
import logger from '@/utils/logger';
import { getAppContext } from '@/utils/asyncContext'; // Import context getter

dotenv.config();

// ... (baseConfig setup as before) ...
const baseConfig: PoolConfig = {
  /* ... */
};
const primaryPoolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // ...add any other needed PoolConfig options here
};
export const pool = new Pool(primaryPoolConfig);
// ... (event listeners for pool) ...
const readPool: Pool | null = null;
if (process.env.DB_REPLICA_HOST) {
  /* ... setup readPool ... */
}

// Helper to set RLS context variables on a client
async function setRLSVariables(client: PoolClient): Promise<void> {
  const appContext = getAppContext();
  if (appContext) {
    // Use 'SET LOCAL' to scope these to the current transaction/session for this client.
    // The RLS functions in PostgreSQL will use current_setting('app.current_tenant_id', true).
    if (appContext.tenantId) {
      await client.query(`SET LOCAL app.current_tenant_id = '${appContext.tenantId}';`);
    } else {
      await client.query(`SET LOCAL app.current_tenant_id = NULL;`); // Explicitly NULL if not present
    }
    if (appContext.businessId) {
      await client.query(`SET LOCAL app.current_business_id = '${appContext.businessId}';`);
    } else {
      await client.query(`SET LOCAL app.current_business_id = NULL;`);
    }
    if (appContext.userId) {
      await client.query(`SET LOCAL app.current_user_id = '${appContext.userId}';`);
    } else {
      await client.query(`SET LOCAL app.current_user_id = NULL;`);
    }
    if (appContext.isSystemAdmin !== undefined) {
      await client.query(
        `SET LOCAL app.is_system_admin = '${appContext.isSystemAdmin ? 'true' : 'false'}';`
      );
    } else {
      await client.query(`SET LOCAL app.is_system_admin = 'false';`);
    }
    logger.debug('RLS context variables set for DB client', { context: appContext });
  } else {
    // Default to restrictive context if no app context is found (e.g., background job)
    // Or handle as an error depending on application requirements.
    logger.warn(
      'No AsyncLocalStorage context found for RLS. Defaulting session vars to NULL/false.'
    );
    await client.query(`SET LOCAL app.current_tenant_id = NULL;`);
    await client.query(`SET LOCAL app.current_business_id = NULL;`);
    await client.query(`SET LOCAL app.current_user_id = NULL;`);
    await client.query(`SET LOCAL app.is_system_admin = 'false';`);
  }
}

// Unified query function - now uses a client with RLS vars set
export const query = async (text: string, params?: any[], isWriteOperation = false) => {
  const targetPool = isWriteOperation || !readPool ? pool : readPool;
  let client: PoolClient | null = null;
  try {
    client = await targetPool.connect();
    await setRLSVariables(client); // Set RLS context for this client's session
    const start = Date.now();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', {
      text,
      duration,
      rows: res.rowCount,
      context: getAppContext(),
    });
    return res;
  } catch (error: any) {
    logger.error('Database query error', {
      text,
      params,
      error: error.message,
      stack: error.stack,
      context: getAppContext(),
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Get a client for transactions - RLS vars will be set on this client
export const getClient = async (isWriteOperation = true): Promise<PoolClient> => {
  const targetPool = isWriteOperation || !readPool ? pool : readPool; // Transactions usually to primary
  const client = await targetPool.connect();
  // RLS variables will be set when this client is first used for a query via the wrapper,
  // or we can set them immediately here. Setting them immediately is safer for transactions.
  await setRLSVariables(client);
  logger.debug('DB Client acquired from pool with RLS context set.');
  return client;
};

// ... (testDBConnection as before) ...
export const testDBConnection = async (): Promise<void> => {
  /* ... */
};

// The explicit setTenantContextInSession and clearTenantContextInSession are no longer needed
// as setRLSVariables handles this automatically when a client is used.
export function setTenantContextInSession(client: any, tenantId: string) {
  // Implementation here
}

export function clearTenantContextInSession(client: any) {
  // Implementation here
}

export type { PoolClient };
