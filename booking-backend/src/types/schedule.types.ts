// Schedule types placeholder

export interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_off: boolean;
}

export interface EmployeeAvailabilityOverride {
  id: string;
  employee_id: string;
  business_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SetWorkingHoursDto {
  business_id: string;
  employee_id?: string;
  working_hours: WorkingHours[];
}

export interface AvailabilityOverrideInput {
  employee_id: string;
  business_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export interface UpdateAvailabilityOverrideDto {
  override_id: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export interface WorkingHourInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_off: boolean;
}
