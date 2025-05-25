export interface Service {
  id: string;
  business_id: string;
  name:string;
  description?: string;
  duration_minutes: number;
  price: number;
  currency: string;
  category_id?: string;
  is_active: boolean;
  buffer_time_before_minutes?: number;
  buffer_time_after_minutes?: number;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
}
