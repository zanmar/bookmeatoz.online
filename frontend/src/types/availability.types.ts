export interface TimeSlot {
  start_time: string; // ISO Date string (UTC from backend, to be converted to business TZ for display)
  end_time: string;   // ISO Date string (UTC from backend)
  employee_id?: string; // If a specific employee is associated
  is_available: boolean; // Should always be true for slots returned for booking
}

export interface AvailabilityQuery {
  service_id: string;
  date: string; // YYYY-MM-DD (in business's local timezone)
  employee_id?: string; // Optional: for specific employee
}
