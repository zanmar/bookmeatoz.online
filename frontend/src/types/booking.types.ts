import { z } from 'zod';

export const CustomerDetailsSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional().refine(val => !val || /^[+]?[0-9]{10,15}$/.test(val), {
    message: "Invalid phone number format",
  }),
  notes: z.string().optional(),
});

export const PublicBookingFormSchema = z.object({
  serviceId: z.string().min(1, { message: "Please select a service" }),
  employeeId: z.string().optional(),
  selectedDate: z.date({ required_error: "Please select a date" }),
  selectedTimeSlot: z.string().min(1, { message: "Please select a time slot" }), // ISO string UTC
  customerDetails: CustomerDetailsSchema,
});

export type PublicBookingFormData = z.infer<typeof PublicBookingFormSchema>;

export interface CreateBookingPayload {
  service_id: string;
  employee_id?: string;
  start_time: string; // ISO Date string (UTC)
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
}
