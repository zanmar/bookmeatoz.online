import { BaseEntity, Status } from './common.types';

export interface Tenant extends BaseEntity {
  name: string;
  subdomain: string; // unique
  status: Extract<Status, 'active' | 'inactive' | 'suspended'>;
  // settings JSONB can store theme, custom features, etc.
}

export interface TenantAuditLog extends BaseEntity {
  tenant_id: string;
  user_id?: string; // User who performed the action (if applicable)
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>; // JSONB
  ip_address?: string;
}
