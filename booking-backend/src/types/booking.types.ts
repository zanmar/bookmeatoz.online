import { BaseEntity, Status } from './common.types';

// Booking types placeholder

export interface Booking extends BaseEntity {
  business_id: string;
  customer_id: string; // Link to a User acting as a customer, or a separate Customers table
  service_id: string;
  employee_id?: string | null; // Optional if service can be performed by any available
  start_time: Date;
  end_time: Date;
  status: Extract<Status, 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected'>;
  notes?: string | null;
  metadata?: Record<string, any>; // JSONB for custom fields, payment info link, etc.
  business_timezone: string; // Add this field for scheduler.service.ts
}
