import { AsyncLocalStorage } from 'async_hooks';

interface AppContext {
  tenantId?: string;
  businessId?: string;
  userId?: string;
  isSystemAdmin?: boolean;
  requestId?: string; // For logging correlation
  permissions?: string[]; // Add permissions for RBAC enforcement
}

export const asyncLocalStorage = new AsyncLocalStorage<AppContext>();

export const getAppContext = (): AppContext | undefined => {
  return asyncLocalStorage.getStore();
};
