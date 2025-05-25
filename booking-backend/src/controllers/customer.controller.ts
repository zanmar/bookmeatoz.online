import { Request, Response, NextFunction } from 'express';
import { customerService } from '@/services/customer.service';
import { AppError } from '@/utils/errorHandler';
import { Customer } from '@/types/customer.types';
import { getAppContext } from '@/utils/asyncContext';
import { PERMISSIONS } from '@/types/user.types';

// Define CreateCustomerDto and UpdateCustomerDto inline since not exported from types
interface CreateCustomerDto {
  user_id?: string | null;
  email: string;
  name: string;
  phone?: string | null;
  profile_notes?: string | null;
  status?: 'active' | 'inactive' | 'blacklisted';
  settings?: Record<string, any>;
}

interface UpdateCustomerDto {
  email?: string;
  name?: string;
  phone?: string | null;
  profile_notes?: string | null;
  status?: 'active' | 'inactive' | 'blacklisted';
  settings?: Record<string, any>;
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

export const customerController = {
  createCustomerHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return next(new AppError('Business context is required to create a customer.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_CUSTOMERS);
      const customerData: CreateCustomerDto = req.body;

      // Fix: Remove user_id if null, ensure business_id is present and user_id is string or undefined
      const { user_id, ...rest } = customerData;
      const customerDataWithBusiness = {
        ...rest,
        business_id: businessId,
        ...(user_id ? { user_id } : {}),
      };
      const newCustomer = await customerService.createCustomer(
        businessId,
        customerDataWithBusiness
      );
      res.status(201).json({
        success: true,
        message: 'Customer created successfully.',
        data: newCustomer,
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  },

  getCustomerByIdHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const { customerId } = req.params;
      if (!businessId) {
        return next(new AppError('Business context is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_CUSTOMERS);
      const customer = await customerService.getCustomerById(businessId, customerId);
      if (!customer) {
        return next(new AppError('Customer not found.', 404));
      }
      res.status(200).json({ success: true, data: customer, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  getCustomersByBusinessHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return next(new AppError('Business ID is required to fetch customers.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_CUSTOMERS);
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const filters = {
        status: req.query.status as Customer['status'] | undefined,
        searchTerm: req.query.searchTerm as string | undefined,
      };

      const result = await customerService.getCustomersByBusiness(businessId, filters, {
        page,
        limit,
      });
      res.status(200).json({
        success: true,
        data: result.customers,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  updateCustomerHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const { customerId } = req.params;
      if (!businessId) {
        return next(new AppError('Business context is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_CUSTOMERS);
      const updateData: UpdateCustomerDto = req.body;
      const updatedCustomer = await customerService.updateCustomer(
        businessId,
        customerId,
        updateData
      );
      if (!updatedCustomer) {
        return next(new AppError('Customer not found or update failed.', 404));
      }
      res.status(200).json({
        success: true,
        message: 'Customer updated successfully.',
        data: updatedCustomer,
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteCustomerHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const { customerId } = req.params;
      if (!businessId) {
        return next(new AppError('Business context is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_CUSTOMERS);
      const success = await customerService.deleteCustomer(businessId, customerId);
      if (!success) {
        return next(new AppError('Customer not found or could not be deleted.', 404));
      }
      res
        .status(200)
        .json({ success: true, message: 'Customer deleted successfully.', statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },
};
