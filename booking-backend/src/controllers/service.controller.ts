// Service controller placeholder
import { Request, Response, NextFunction } from 'express';
import { serviceService } from '@/services/service.service';
import { AppError } from '@/utils/errorHandler';
import { Service } from '@/types';
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

export const serviceController = {
  createServiceHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId; // Populated by tenantMiddleware and validated by authMiddleware.validateBusinessAccess
      const tenantId = req.tenantId;

      if (!businessId || !tenantId) {
        return next(new AppError('Business context is required to create a service.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_SERVICES);
      const serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'business_id'> =
        req.body;
      const newService = await serviceService.createService(businessId, tenantId, serviceData);
      res.status(201).json({
        success: true,
        message: 'Service created successfully.',
        data: newService,
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  },

  getServiceByIdHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const { serviceId } = req.params;
      if (!businessId) {
        return next(new AppError('Business context is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_SERVICES); // Or VIEW_SERVICES if available
      const service = await serviceService.getServiceById(businessId, serviceId);
      if (!service) {
        return next(new AppError('Service not found.', 404));
      }
      res.status(200).json({ success: true, data: service, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  getServicesByBusinessHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId; // This should be the primary identifier
      // If fetching for a public view, businessId might come from params if route is /public/businesses/:businessId/services
      // For authenticated routes, req.businessId from middleware is preferred.
      const currentBusinessId = businessId || req.params.businessIdForPublicView;

      if (!currentBusinessId) {
        return next(new AppError('Business ID is required to fetch services.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_SERVICES); // Or VIEW_SERVICES if available
      // Add query param filters from req.query if needed
      const filters = {
        status: req.query.status as Service['status'] | undefined,
        categoryId: req.query.categoryId as string | undefined,
        isPrivate: req.query.isPrivate ? req.query.isPrivate === 'true' : undefined,
      };

      const services = await serviceService.getServicesByBusiness(currentBusinessId, filters);
      res.status(200).json({ success: true, data: services, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  updateServiceHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const { serviceId } = req.params;
      if (!businessId) {
        return next(new AppError('Business context is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_SERVICES);
      const updateData: Partial<Service> = req.body;
      const updatedService = await serviceService.updateService(businessId, serviceId, updateData);
      if (!updatedService) {
        return next(new AppError('Service not found or update failed.', 404));
      }
      res.status(200).json({
        success: true,
        message: 'Service updated successfully.',
        data: updatedService,
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteServiceHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      const { serviceId } = req.params;
      if (!businessId) {
        return next(new AppError('Business context is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_SERVICES);
      const success = await serviceService.deleteService(businessId, serviceId);
      if (!success) {
        // This case might be handled by service throwing 404 if not found
        return next(new AppError('Service not found or could not be deleted.', 404));
      }
      res
        .status(200)
        .json({ success: true, message: 'Service deleted successfully.', statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },
};
