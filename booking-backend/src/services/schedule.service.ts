import { query as dbQuery, getClient, PoolClient } from '@/config/db';
import { AppError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import {
  WorkingHours,
  EmployeeAvailabilityOverride,
  SetWorkingHoursDto,
  AvailabilityOverrideInput,
  UpdateAvailabilityOverrideDto,
  WorkingHourInput,
} from '@/types/schedule.types';
import { v4 as uuidv4 } from 'uuid';
import {
  isValidTimezone,
  combineDateAndTimeInTimezoneToUTC,
  toUtcTime,
} from '@/utils/timezone.utils'; // Assuming these exist

const isValidTimeFormat = (time: string): boolean => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

// Helper to check if two time intervals [start1, end1] and [start2, end2] overlap
// Times are expected as "HH:MM" strings
const doTimeIntervalsOverlap = (
  start1Str: string,
  end1Str: string,
  start2Str: string,
  end2Str: string
): boolean => {
  // Convert to minutes from midnight for easier comparison
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };
  const start1 = timeToMinutes(start1Str);
  const end1 = timeToMinutes(end1Str);
  const start2 = timeToMinutes(start2Str);
  const end2 = timeToMinutes(end2Str);

  // Check for overlap: (StartA < EndB) and (StartB < EndA)
  return start1 < end2 && start2 < end1;
};

export const scheduleService = {
  async setEmployeeWorkingHours(
    businessId: string,
    employeeId: string,
    workingHoursData: SetWorkingHoursDto // Array of WorkingHourInput, can have multiple entries per day
  ): Promise<WorkingHours[]> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const empCheck = await client.query(
        'SELECT 1 FROM employees WHERE id = $1 AND business_id = $2',
        [employeeId, businessId]
      );
      if (empCheck.rows.length === 0) {
        throw new AppError('Employee not found or does not belong to this business.', 404);
      }

      // Validate input for overlaps within the same day
      for (let i = 0; i < 7; i++) {
        const dayEntries = workingHoursData.working_hours.filter(
          (wh: WorkingHourInput) => wh.day_of_week === i && !wh.is_off
        );
        for (let j = 0; j < dayEntries.length; j++) {
          for (let k = j + 1; k < dayEntries.length; k++) {
            if (
              doTimeIntervalsOverlap(
                dayEntries[j].start_time,
                dayEntries[j].end_time,
                dayEntries[k].start_time,
                dayEntries[k].end_time
              )
            ) {
              throw new AppError(
                `Overlapping working times provided for day ${i} (${dayEntries[j].start_time}-${dayEntries[j].end_time} and ${dayEntries[k].start_time}-${dayEntries[k].end_time}).`,
                400
              );
            }
          }
        }
      }

      await client.query('DELETE FROM working_hours WHERE employee_id = $1', [employeeId]);

      const insertedHours: WorkingHours[] = [];
      // Use workingHoursData.working_hours for iteration/filtering
      for (const wh of workingHoursData.working_hours) {
        if (wh.day_of_week < 0 || wh.day_of_week > 6)
          throw new AppError(`Invalid day_of_week: ${wh.day_of_week}.`, 400);

        let startTimeToStore: string | null = null;
        let endTimeToStore: string | null = null;

        if (!wh.is_off) {
          if (!isValidTimeFormat(wh.start_time) || !isValidTimeFormat(wh.end_time)) {
            throw new AppError(
              `Invalid time format for day ${wh.day_of_week}. Expected HH:MM.`,
              400
            );
          }
          if (wh.start_time >= wh.end_time) {
            throw new AppError(
              `Start time must be before end time for day ${wh.day_of_week}.`,
              400
            );
          }
          startTimeToStore = wh.start_time;
          endTimeToStore = wh.end_time;
        }

        const id = uuidv4();
        const insertQuery = `
          INSERT INTO working_hours (id, employee_id, business_id, day_of_week, start_time, end_time, is_off, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *;
        `;
        const result = await client.query(insertQuery, [
          id,
          employeeId,
          businessId,
          wh.day_of_week,
          startTimeToStore,
          endTimeToStore,
          wh.is_off === undefined ? false : wh.is_off,
        ]);
        insertedHours.push(result.rows[0]);
      }

      await client.query('COMMIT');
      logger.info(`Working hours set for employee ${employeeId} in business ${businessId}`);
      return insertedHours.sort(
        (a, b) =>
          a.day_of_week - b.day_of_week || (a.start_time || '').localeCompare(b.start_time || '')
      );
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error setting employee working hours:', { employeeId, error });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to set working hours.', 500);
    } finally {
      client.release();
    }
  },

  async getEmployeeWorkingHours(businessId: string, employeeId: string): Promise<WorkingHours[]> {
    // ... (implementation as before, ensure it orders correctly if multiple blocks per day)
    try {
      const empCheck = await dbQuery('SELECT 1 FROM employees WHERE id = $1 AND business_id = $2', [
        employeeId,
        businessId,
      ]);
      if (empCheck.rows.length === 0)
        throw new AppError('Employee not found or does not belong to this business.', 404);
      const result = await dbQuery(
        'SELECT * FROM working_hours WHERE employee_id = $1 ORDER BY day_of_week ASC, start_time ASC',
        [employeeId]
      );
      return result.rows;
    } catch (error) {
      /* ... */ throw new AppError('Failed to retrieve working hours.', 500);
    }
  },

  async getBusinessDefaultWorkingHours(businessId: string): Promise<WorkingHours[]> {
    try {
      const result = await dbQuery(
        'SELECT * FROM working_hours WHERE business_id = $1 AND employee_id IS NULL ORDER BY day_of_week ASC, start_time ASC',
        [businessId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching business default working hours:', { businessId, error });
      throw new AppError('Failed to retrieve business default working hours.', 500);
    }
  },

  // Method to set business default hours (similar to setEmployeeWorkingHours but with employee_id = NULL)
  async setBusinessDefaultWorkingHours(
    businessId: string,
    workingHoursData: SetWorkingHoursDto
  ): Promise<WorkingHours[]> {
    // ... (implementation similar to setEmployeeWorkingHours, validating overlaps, ensuring employee_id is NULL)
    // This would be called from Business Settings management.
    const client = await getClient();
    try {
      await client.query('BEGIN');
      // Validate input for overlaps
      // ...
      await client.query(
        'DELETE FROM working_hours WHERE business_id = $1 AND employee_id IS NULL',
        [businessId]
      );
      const insertedHours: WorkingHours[] = [];
      for (const wh of workingHoursData.working_hours) {
        /* ... insert with employee_id = NULL ... */
      }
      await client.query('COMMIT');
      return insertedHours;
    } catch (error) {
      /* ... */
    } finally {
      client.release();
    }
    return []; // Placeholder
  },

  async createEmployeeOverride(
    businessId: string,
    employeeId: string,
    overrideData: AvailabilityOverrideInput
  ): Promise<EmployeeAvailabilityOverride> {
    const { start_time, end_time, reason } = overrideData;
    // Fix: Add nullish coalescing for start_time/end_time when creating Date objects
    const startTimeUTC = start_time ? new Date(start_time) : new Date();
    const endTimeUTC = end_time ? new Date(end_time) : new Date();
    // ... (validations as before) ...
    if (isNaN(startTimeUTC.getTime()) || isNaN(endTimeUTC.getTime()))
      throw new AppError('Invalid date format.', 400);
    if (startTimeUTC >= endTimeUTC)
      throw new AppError('Override start time must be before end time.', 400);

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const empCheck = await client.query(
        'SELECT 1 FROM employees WHERE id = $1 AND business_id = $2',
        [employeeId, businessId]
      );
      if (empCheck.rows.length === 0)
        throw new AppError('Employee not found or does not belong to this business.', 404);

      // Check for overlapping overrides
      const overlapCheck = await client.query(
        `SELECT 1 FROM employee_availability_overrides
         WHERE employee_id = $1 AND business_id = $2
         AND (($3 < end_time AND $4 > start_time) OR ($3 > start_time AND $3 < end_time))
         LIMIT 1;`,
        [employeeId, businessId, startTimeUTC, endTimeUTC]
      );
      if (overlapCheck.rows.length > 0)
        throw new AppError('This override overlaps with an existing one.', 409);

      const id = uuidv4();
      const insertQuery = `
        INSERT INTO employee_availability_overrides (id, employee_id, start_time, end_time, reason, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *;
      `;
      const result = await client.query(insertQuery, [
        id,
        employeeId,
        startTimeUTC,
        endTimeUTC,
        reason,
      ]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      /* ... */
    } finally {
      client.release();
    }
    // Fallback, should be handled by specific error throws
    throw new AppError('Failed to create availability override.', 500);
  },

  async updateEmployeeOverride(
    businessId: string,
    employeeId: string,
    overrideId: string,
    updateData: UpdateAvailabilityOverrideDto
  ): Promise<EmployeeAvailabilityOverride | null> {
    const { start_time, end_time, reason } = updateData;
    const startTimeUTC = start_time ? new Date(start_time) : new Date();
    const endTimeUTC = end_time ? new Date(end_time) : new Date();

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const empCheck = await client.query(
        'SELECT 1 FROM employees WHERE id = $1 AND business_id = $2',
        [employeeId, businessId]
      );
      if (empCheck.rows.length === 0)
        throw new AppError('Employee not found or does not belong to this business.', 404);

      // Check if override exists
      const overrideCheck = await client.query(
        'SELECT * FROM employee_availability_overrides WHERE id = $1 AND employee_id = $2',
        [overrideId, employeeId]
      );
      if (overrideCheck.rows.length === 0) throw new AppError('Override not found.', 404);

      // If times are changing, check for conflicts
      if (
        start_time !== overrideCheck.rows[0].start_time ||
        end_time !== overrideCheck.rows[0].end_time
      ) {
        const conflictCheck = await client.query(
          `SELECT 1 FROM employee_availability_overrides
           WHERE employee_id = $1 AND business_id = $2
           AND (($3 < end_time AND $4 > start_time) OR ($3 > start_time AND $3 < end_time))
           LIMIT 1;`,
          [employeeId, businessId, startTimeUTC, endTimeUTC]
        );
        if (conflictCheck.rows.length > 0)
          throw new AppError('The new time range conflicts with an existing override.', 409);
      }

      const updateQuery = `
        UPDATE employee_availability_overrides
        SET start_time = $1, end_time = $2, reason = $3, updated_at = NOW()
        WHERE id = $4 RETURNING *;
      `;
      const result = await client.query(updateQuery, [
        startTimeUTC,
        endTimeUTC,
        reason,
        overrideId,
      ]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      /* ... */
    } finally {
      client.release();
    }
    return null;
  },

  // ... (getEmployeeOverrides, deleteEmployeeOverride as before) ...
  async getEmployeeOverrides(
    businessId: string,
    employeeId: string,
    dateRange?: { from: string; to: string }
  ): Promise<EmployeeAvailabilityOverride[]> {
    /* ... */ return [];
  },
  async deleteEmployeeOverride(
    businessId: string,
    employeeId: string,
    overrideId: string
  ): Promise<boolean> {
    /* ... */ return false;
  },
};
