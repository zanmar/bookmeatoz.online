// Notification types placeholder

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title?: string;
  content: string;
  data?: Record<string, any>;
  tenant_id?: string;
  business_id?: string;
  read?: boolean;
  created_at: Date;
  updated_at?: Date;
}
