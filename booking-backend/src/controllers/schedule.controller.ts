import { Request, Response, NextFunction } from 'express';
import { scheduleService } from '@/services/schedule.service';
import { AppError } from '@/utils/errorHandler';
import { WorkingHourInput, SetWorkingHoursDto } from '@/types/schedule.types';
import { getAppContext } from '@/utils/asyncContext';
import { PERMISSIONS } from '@/types/user.types';

// Removed local WorkingHourInput and SetWorkingHoursDto definitions
// import { WorkingHourInput, SetWorkingHoursDto } from '@/types/schedule.types';

// Define DTOs inline since not exported from types
interface AvailabilityOverrideInput {
  start_time: Date;
  end_time: Date;
  reason?: string;
  is_unavailable: boolean;
}
interface UpdateAvailabilityOverrideDto {
  start_time?: Date;
  end_time?: Date;
  reason?: string;
  is_unavailable?: boolean;
}

function requirePermissionOrThrow(required: string) {
  const ctx = getAppContext();
  if (!ctx || !ctx.userId || !ctx.tenantId || !ctx.businessId) {
    throw new AppError('Missing context for permission check.', 403);
  }
  if (!ctx.permissions || !ctx.permissions.includes(required)) {
    throw new AppError('Insufficient permissions.', 403);
  }
}

export const scheduleController = {
  setEmployeeWorkingHoursHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId!;
      const { employeeId } = req.params;
      let workingHoursData: WorkingHourInput[] = req.body;

      if (!Array.isArray(workingHoursData)) {
        return next(new AppError('Working hours data must be an array.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_SCHEDULES);
      // Ensure is_off is always boolean (not undefined)
      workingHoursData = workingHoursData.map((wh) => ({
        ...wh,
        is_off: wh.is_off === undefined ? false : wh.is_off,
      }));
      const workingHoursDto = {
        business_id: businessId,
        employee_id: employeeId,
        working_hours: workingHoursData,
      };
      const updatedHours = await scheduleService.setEmployeeWorkingHours(
        businessId,
        employeeId,
        workingHoursDto
      );
      res.status(200).json({
        success: true,
        message: `Working hours set successfully for employee ${employeeId}.`,
        data: updatedHours,
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  getEmployeeWorkingHoursHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId!;
      const { employeeId } = req.params;
      requirePermissionOrThrow(PERMISSIONS.MANAGE_SCHEDULES);
      const workingHours = await scheduleService.getEmployeeWorkingHours(businessId, employeeId);
      res.status(200).json({ success: true, data: workingHours, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  createEmployeeOverrideHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId!;
      const { employeeId } = req.params;
      requirePermissionOrThrow(PERMISSIONS.MANAGE_SCHEDULES);
      const overrideData: AvailabilityOverrideInput = req.body;
      // Convert Date fields to ISO strings
      const overrideInput = {
        ...overrideData,
        business_id: businessId,
        employee_id: employeeId,
        start_time:
          overrideData.start_time instanceof Date
            ? overrideData.start_time.toISOString()
            : overrideData.start_time,
        end_time:
          overrideData.end_time instanceof Date
            ? overrideData.end_time.toISOString()
            : overrideData.end_time,
      };
      const newOverride = await scheduleService.createEmployeeOverride(
        businessId,
        employeeId,
        overrideInput
      );
      res.status(201).json({
        success: true,
        message: 'Availability override created successfully.',
        data: newOverride,
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  },

  getEmployeeOverridesHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId!;
      const { employeeId } = req.params;
      const { from, to } = req.query; // ISO date strings

      const dateRange = from && to ? { from: from as string, to: to as string } : undefined;
      const overrides = await scheduleService.getEmployeeOverrides(
        businessId,
        employeeId,
        dateRange
      );
      res.status(200).json({ success: true, data: overrides, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  updateEmployeeOverrideHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId!;
      const { employeeId, overrideId } = req.params;
      const updateData: UpdateAvailabilityOverrideDto = req.body;
      // Convert Date fields to ISO strings if present
      const updateDataWithId = {
        ...updateData,
        override_id: overrideId,
        start_time:
          updateData.start_time instanceof Date
            ? updateData.start_time.toISOString()
            : updateData.start_time,
        end_time:
          updateData.end_time instanceof Date
            ? updateData.end_time.toISOString()
            : updateData.end_time,
      };
      const updatedOverride = await scheduleService.updateEmployeeOverride(
        businessId,
        employeeId,
        overrideId,
        updateDataWithId
      );
      if (!updatedOverride) {
        return next(new AppError('Override not found or update failed.', 404));
      }
      res.status(200).json({
        success: true,
        message: 'Availability override updated successfully.',
        data: updatedOverride,
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteEmployeeOverrideHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId!;
      const { employeeId, overrideId } = req.params;
      const success = await scheduleService.deleteEmployeeOverride(
        businessId,
        employeeId,
        overrideId
      );
      if (!success) {
        return next(new AppError('Override not found or could not be deleted.', 404));
      }
      res.status(200).json({
        success: true,
        message: 'Availability override deleted successfully.',
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },
};
