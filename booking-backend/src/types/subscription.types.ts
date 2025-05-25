import { BaseEntity, Status } from './common.types';

// Subscription types placeholder

export interface SubscriptionPlan extends BaseEntity {
  id: string; // e.g., 'basic', 'professional', 'enterprise' (from DB, not UUID)
  name: string;
  price: number;
  currency: string; // e.g., 'USD'
  billing_interval: 'month' | 'year';
  features: Record<string, any>; // JSONB, e.g., { max_businesses: 1, max_employees_per_business: 5 }
  max_businesses: number;
  max_employees_per_business: number;
  max_bookings_per_month: number;
  max_storage_gb: number;
  max_api_calls_per_day: number;
}

export interface TenantSubscription extends BaseEntity {
  tenant_id: string;
  plan_id: string; // Corresponds to SubscriptionPlan.id
  status: Extract<Status, 'active' | 'inactive' | 'past_due' | 'cancelled' | 'trialing'>;
  started_at: Date;
  expires_at?: Date | null;
  current_period_start?: Date;
  current_period_end?: Date;
  payment_method_details?: Record<string, any>;
}
