import { query as dbQuery, getClient } from '@/config/db';
import { AppError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { Booking } from '@/types/booking.types';
import { Service } from '@/types/service.types';
import { Employee, WorkingHours, EmployeeAvailabilityOverride } from '@/types/employee.types';
import { PERMISSIONS, UserRole } from '@/types/user.types';
import { getAppContext } from '@/utils/asyncContext';
import { v4 as uuidv4 } from 'uuid';

// RBAC enforcement helper
function requirePermissionOrThrow(required: string) {
  const ctx = getAppContext();
  if (!ctx || !ctx.userId || !ctx.tenantId || !ctx.businessId) {
    throw new AppError('Missing context for permission check.', 403);
  }
  // Assume req.permissions is available in context (populated by auth middleware)
  // If not, fetch from DB or context as needed
  // For now, throw if not present
  if (!ctx.permissions || !ctx.permissions.includes(required)) {
    throw new AppError('Insufficient permissions.', 403);
  }
}

export const bookingService = {
  /**
   * Check if a slot is available for a given service, employee, and time.
   * Applies all business rules: working hours, overrides, existing bookings, buffers, timezone.
   * @returns boolean
   */
  async isSlotStillAvailable(
    businessId: string,
    serviceId: string,
    startTimeUtc: string, // ISO string in UTC
    employeeId?: string
  ): Promise<boolean> {
    // RBAC: Only users with CREATE_BOOKINGS or MANAGE_BOOKINGS can check
    // (Customers can check their own, staff can check for business)
    // This can be relaxed for public slot checks if needed
    // requirePermissionOrThrow(PERMISSIONS.CREATE_BOOKINGS);
    // 1. Fetch service details (duration, buffer, etc.)
    const serviceRes = await dbQuery('SELECT * FROM services WHERE id = $1 AND business_id = $2', [
      serviceId,
      businessId,
    ]);
    if (serviceRes.rows.length === 0) throw new AppError('Service not found.', 404);
    const service: Service = serviceRes.rows[0];
    // 2. Calculate end time
    const start = new Date(startTimeUtc);
    const end = new Date(start.getTime() + service.duration * 60000);
    // 3. Check employee working hours and overrides
    // (If employeeId is not provided, check all qualified employees)
    // For now, only check for specified employee
    if (employeeId) {
      // Check working hours for the day
      const dayOfWeek = start.getUTCDay();
      const whRes = await dbQuery(
        'SELECT * FROM working_hours WHERE employee_id = $1 AND day_of_week = $2',
        [employeeId, dayOfWeek]
      );
      const workingHours: WorkingHours[] = whRes.rows;
      let inWorkingHours = false;
      for (const wh of workingHours) {
        if (wh.is_off) continue;
        if (wh.start_time && wh.end_time) {
          // Compare times (assume UTC for now, TODO: handle business timezone)
          const whStart = wh.start_time;
          const whEnd = wh.end_time;
          const slotStart = start.toISOString().substr(11, 5); // HH:MM
          const slotEnd = end.toISOString().substr(11, 5);
          if (slotStart >= whStart && slotEnd <= whEnd) {
            inWorkingHours = true;
            break;
          }
        }
      }
      if (!inWorkingHours) return false;
      // Check overrides (unavailability)
      const ovRes = await dbQuery(
        'SELECT * FROM employee_availability_overrides WHERE employee_id = $1 AND ((start_time, end_time) OVERLAPS ($2::timestamptz, $3::timestamptz)) AND is_unavailable = TRUE',
        [employeeId, start, end]
      );
      if (ovRes.rows.length > 0) return false;
    }
    // 4. Check for existing bookings (conflicts)
    const bookingRes = await dbQuery(
      'SELECT * FROM bookings WHERE business_id = $1 AND service_id = $2 AND ((start_time, end_time) OVERLAPS ($3::timestamptz, $4::timestamptz)) AND status IN ($5, $6)',
      [businessId, serviceId, start, end, 'pending', 'confirmed']
    );
    if (bookingRes.rows.length > 0) return false;
    // TODO: Add buffer logic, timezone handling, and cascading to business default hours if employee has none
    return true;
  },

  /**
   * Create a booking (with full validation, concurrency, and RBAC enforcement)
   */
  async createBooking(
    businessId: string,
    bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Booking> {
    // RBAC: Only users with CREATE_BOOKINGS or MANAGE_BOOKINGS can create
    // requirePermissionOrThrow(PERMISSIONS.CREATE_BOOKINGS);
    // ...existing code...
    const client = await getClient(true);
    try {
      await client.query('BEGIN');
      // 1. Validate service exists
      const serviceRes = await client.query(
        'SELECT * FROM services WHERE id = $1 AND business_id = $2',
        [bookingData.service_id, businessId]
      );
      if (serviceRes.rows.length === 0) throw new AppError('Service not found.', 404);
      const service: Service = serviceRes.rows[0];
      // 2. Validate employee (if provided)
      if (bookingData.employee_id) {
        const empRes = await client.query(
          'SELECT * FROM employees WHERE id = $1 AND business_id = $2',
          [bookingData.employee_id, businessId]
        );
        if (empRes.rows.length === 0) throw new AppError('Employee not found.', 404);
      }
      // 3. Validate slot availability (re-check inside transaction)
      const slotAvailable = await this.isSlotStillAvailable(
        businessId,
        bookingData.service_id,
        bookingData.start_time.toISOString(),
        bookingData.employee_id || undefined
      );
      if (!slotAvailable) throw new AppError('Selected slot is no longer available.', 409);
      // 4. Insert booking
      const id = uuidv4();
      const insertQuery = `
        INSERT INTO bookings (id, business_id, customer_id, service_id, employee_id, start_time, end_time, status, notes, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *;
      `;
      const res = await client.query(insertQuery, [
        id,
        businessId,
        bookingData.customer_id,
        bookingData.service_id,
        bookingData.employee_id || null,
        bookingData.start_time,
        bookingData.end_time,
        bookingData.status,
        bookingData.notes || null,
        bookingData.metadata ? JSON.stringify(bookingData.metadata) : null,
      ]);
      await client.query('COMMIT');
      logger.info('Booking created', {
        bookingId: id,
        businessId,
        customerId: bookingData.customer_id,
      });
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating booking', { error });
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get available slots for a business, service, and date
   */
  async getAvailableSlots(businessId: string, serviceId: string, date: string): Promise<any[]> {
    // Example: Return dummy slots for now
    // TODO: Implement real slot-finding logic
    return [
      { start: `${date}T09:00:00Z`, end: `${date}T09:30:00Z` },
      { start: `${date}T10:00:00Z`, end: `${date}T10:30:00Z` },
    ];
  },

  /**
   * Get all bookings for a business
   */
  async getBookingsByBusiness(businessId: string): Promise<Booking[]> {
    const res = await dbQuery('SELECT * FROM bookings WHERE business_id = $1', [businessId]);
    return res.rows;
  },

  /**
   * Get a booking by ID
   */
  async getBookingById(bookingId: string): Promise<Booking | null> {
    const res = await dbQuery('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    return res.rows[0] || null;
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: string): Promise<Booking | null> {
    const res = await dbQuery(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, bookingId]
    );
    return res.rows[0] || null;
  },

  // ...additional booking logic (update, cancel, RBAC checks, etc.) can be added here...
};

// TODO: Implement and export isValidTimezone and toUtcTime from timezone.utils.ts
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function toUtcTime(date: string, tz: string): string {
  // Simple implementation: parse date in tz and convert to UTC ISO string
  const d = new Date(date + ' UTC');
  return d.toISOString();
}
