import { Request, Response, NextFunction } from 'express';
import { asyncLocalStorage } from '@/utils/asyncContext';
import { v4 as uuidv4 } from 'uuid'; // For request ID

export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const store: Record<string, any> = {
    requestId: req.headers['x-request-id'] || uuidv4(),
  };

  // tenantId and businessId are populated by tenantMiddleware
  if (req.tenantId) store.tenantId = req.tenantId;
  if (req.businessId) store.businessId = req.businessId;

  // userId and roles are populated by authMiddleware
  if (req.userId) store.userId = req.userId;
  if (req.roles?.includes('system_admin')) {
    // Check your actual system admin role name
    store.isSystemAdmin = true;
  } else {
    store.isSystemAdmin = false;
  }

  asyncLocalStorage.run(store, () => {
    // Make context available on req.logger if it's extended
    if (req.logger && typeof req.logger.child === 'function') {
      req.logger = req.logger.child({
        requestId: store.requestId,
        tenantId: store.tenantId,
        businessId: store.businessId,
        userId: store.userId,
      });
    }
    next();
  });
};
