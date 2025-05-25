import { Request, Response, NextFunction } from 'express';
import { employeeService } from '@/services/employee.service';
import { AppError } from '@/utils/errorHandler';
import { UserRole } from '@/types/user.types';
import { getAppContext } from '@/utils/asyncContext';
import { PERMISSIONS } from '@/types/user.types';

function requirePermissionOrThrow(required: string) {
  const ctx = getAppContext();
  if (!ctx || !ctx.userId || !ctx.tenantId || !ctx.businessId) {
    throw new AppError('Missing context for permission check.', 403);
  }
  if (!ctx.permissions || !ctx.permissions.includes(required)) {
    throw new AppError('Insufficient permissions.', 403);
  }
}

export const employeeController = {
  inviteOrAddEmployeeHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const inviterUserId = req.userId; // User performing the action

      if (!businessId || !inviterUserId) {
        return next(new AppError('Business context and inviter identity are required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_EMPLOYEES);
      const { email, role, name } = req.body;
      if (!email || !role) {
        return next(new AppError('Email and role are required to add an employee.', 400));
      }

      const result = await employeeService.inviteOrAddEmployee(
        businessId,
        inviterUserId,
        email,
        role as UserRole,
        name
      );
      res.status(isFinite(result.message.indexOf('New user')) ? 201 : 200).json({
        // 201 if new user created, 200 if existing added
        success: true,
        message: result.message,
        data: result.employee || result.invitation, // Prefer sending employee details if available
        statusCode: isFinite(result.message.indexOf('New user')) ? 201 : 200,
      });
    } catch (error) {
      next(error);
    }
  },

  getEmployeesByBusinessHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return next(new AppError('Business ID is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_EMPLOYEES);
      const employees = await employeeService.getEmployeesByBusiness(businessId);
      res.status(200).json({ success: true, data: employees, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  getEmployeeDetailsHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const { employeeUserId } = req.params; // userId of the employee being fetched
      if (!businessId) {
        return next(new AppError('Business context is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_EMPLOYEES);
      const employee = await employeeService.getEmployeeDetails(businessId, employeeUserId);
      if (!employee) {
        return next(new AppError('Employee not found.', 404));
      }
      res.status(200).json({ success: true, data: employee, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  updateEmployeeRoleHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const { employeeUserId } = req.params;
      const { role } = req.body;

      if (!businessId) {
        return next(new AppError('Business context is required.', 400));
      }
      if (!role) {
        return next(new AppError('New role is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_EMPLOYEES);
      // Add validation: e.g., can't change own role if not admin, can't make everyone not an owner.
      // Check if req.userId (current user) is same as employeeUserId
      // if (req.userId === employeeUserId && !(req.roles?.includes('business_owner') || req.roles?.includes('tenant_admin'))) {
      //    return next(new AppError("You cannot change your own role unless you are an owner/admin.", 403));
      // }

      const updatedEmployee = await employeeService.updateEmployeeRole(
        businessId,
        employeeUserId,
        role as UserRole
      );
      if (!updatedEmployee) {
        return next(new AppError('Employee not found or update failed.', 404));
      }
      res.status(200).json({
        success: true,
        message: 'Employee role updated successfully.',
        data: updatedEmployee,
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  removeEmployeeFromBusinessHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const { employeeUserId } = req.params;
      if (!businessId) {
        return next(new AppError('Business context is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_EMPLOYEES);
      // Add validation: e.g., can't remove self if last owner.
      // if (req.userId === employeeUserId) {
      //    // Check if they are the last owner, etc.
      // }
      const success = await employeeService.removeEmployeeFromBusiness(businessId, employeeUserId);
      if (!success) {
        return next(new AppError('Employee not found or could not be removed.', 404));
      }
      res.status(200).json({
        success: true,
        message: 'Employee removed from business successfully.',
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },
};
