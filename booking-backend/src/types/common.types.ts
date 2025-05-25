// Common type definitions for BookMeAtOz
export interface BaseEntity {
  id: string; // UUID
  created_at: Date;
  updated_at: Date;
  settings?: Record<string, any>; // JSONB
}

export type Status =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'past_due'
  | 'rejected';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string> | Array<{ field?: string; message: string }>;
  statusCode: number;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  statusCode: number;
}
