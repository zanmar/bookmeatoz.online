import { BaseEntity, Status } from './common.types';

export interface Business extends BaseEntity {
  tenant_id: string;
  name: string;
  slug: string; // unique within tenant or globally, based on requirements
  status: Extract<Status, 'active' | 'inactive' | 'suspended'>;
  subscription_status?: Extract<Status, 'active' | 'inactive' | 'past_due' | 'cancelled'>;
  timezone: string; // e.g., 'America/New_York'
  subdomain?: string | null; // This is the one tied to tenants.businesses.subdomain
  ssl_enabled?: boolean;
  ssl_status?: string; // e.g., 'pending_verification', 'active', 'failed'
  // settings JSONB for business-specific configurations like currency, opening hours, booking policies
}

export interface CreateBusinessDto {
  tenant_id: string;
  name: string;
  slug: string;
  timezone: string;
  currency?: string;
  subdomain?: string | null;
  ssl_enabled?: boolean;
  settings?: Record<string, any>;
  status?: string;
}

export interface UpdateBusinessDto {
  name?: string;
  slug?: string;
  timezone?: string;
  currency?: string;
  subdomain?: string | null;
  ssl_enabled?: boolean;
  settings?: Record<string, any>;
  status?: string;
  subscription_status?: string;
}
