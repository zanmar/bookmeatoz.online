import { BaseEntity, Status } from './common.types';
import { UserProfile } from './user.types';

export interface Customer extends BaseEntity {
  user_id?: string | null; // If the customer is also a platform user
  business_id: string; // Which business this customer record belongs to (for tenant isolation)
  email: string; // Can be unique per business or globally
  name: string;
  phone?: string | null;
  profile_notes?: string | null; // Internal notes about the customer by the business
  status: Extract<Status, 'active' | 'inactive' | 'blacklisted'>;
  // marketing_consent, etc.
}

export interface CreateCustomerDto {
  business_id: string;
  email: string;
  name: string;
  phone?: string | null;
  profile_notes?: string | null;
  status?: string;
  settings?: Record<string, any>;
  user_id?: string;
}

export interface UpdateCustomerDto {
  email?: string;
  name?: string;
  phone?: string | null;
  profile_notes?: string | null;
  status?: string;
  settings?: Record<string, any>;
  user_id?: string;
}
