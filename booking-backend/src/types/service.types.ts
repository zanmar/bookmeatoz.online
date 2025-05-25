import { BaseEntity, Status } from './common.types';

export interface Service extends BaseEntity {
  business_id: string;
  name: string;
  description?: string | null;
  duration: number; // in minutes
  price: number; // or string for precision, depending on currency handling
  currency?: string;
  status: Extract<Status, 'active' | 'inactive'>;
  settings?: Record<string, any>;
  category_id?: string;
  is_private?: boolean;
}
