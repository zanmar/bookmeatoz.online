import { BaseEntity, Status } from './common.types';
import { UserRole } from './user.types';

export interface Employee extends BaseEntity {
  business_id: string;
  user_id: string; // Link to a User record
  status: Extract<Status, 'active' | 'inactive'>;
  role: UserRole; // e.g., 'staff', 'manager' within this business context from user_roles table
}

export interface EmployeeService extends BaseEntity {
  employee_id: string;
  service_id: string;
}

export interface WorkingHours extends BaseEntity {
  business_id?: string; // For general business hours
  employee_id?: string; // For specific employee hours (overrides business hours)
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 for Sunday, 6 for Saturday
  start_time: string; // HH:MM format (e.g., "09:00")
  end_time: string; // HH:MM format (e.g., "17:00")
  is_off?: boolean; // If true, this day is off
}

export interface EmployeeAvailabilityOverride extends BaseEntity {
  employee_id: string;
  start_time: Date;
  end_time: Date;
  reason?: string; // e.g., "Vacation", "Doctor's Appointment"
  is_unavailable: boolean; // true if unavailable, false if it's a special available slot
}

export interface EmployeeDetails extends Employee {
  user_email: string;
  user_name: string;
  user_profile?: Record<string, any>;
}

export interface EmployeeInvitation {
  business_id: string;
  email: string;
  role: UserRole;
  invited_by: string; // user_id of inviter
  invitation_token: string;
  expires_at: Date;
}
