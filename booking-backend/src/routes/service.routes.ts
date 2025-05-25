// Service routes placeholder
import { Router } from 'express';
import { serviceController } from '@/controllers/service.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { PERMISSIONS } from '@/types'; // Import PERMISSIONS

const router = Router();

// All routes below require authentication and a valid business context.
// authMiddleware.validateBusinessAccess ensures the user has a general link to the business.
// Specific permissions (like MANAGE_SERVICES) control CRUD actions.

// POST /api/v1/services - Create a new service for the current business
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess, // Ensures req.businessId is set and user has access
  authMiddleware.authorizePermissions(PERMISSIONS.MANAGE_SERVICES),
  serviceController.createServiceHandler
);

// GET /api/v1/services - Get all services for the current business (req.businessId)
// This could also be a public route if businessId is passed differently,
// but here it's for authenticated users managing their business.
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess,
  // No specific permission to *view* services if you have business access,
  // but MANAGE_SERVICES implies view. Or add a VIEW_SERVICES permission.
  // For simplicity, if they can manage, they can view.
  authMiddleware.authorizePermissions(PERMISSIONS.MANAGE_SERVICES), // Or a new VIEW_SERVICES permission
  serviceController.getServicesByBusinessHandler
);

// GET /api/v1/services/:serviceId - Get a specific service by ID for the current business
router.get(
  '/:serviceId',
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess,
  authMiddleware.authorizePermissions(PERMISSIONS.MANAGE_SERVICES), // Or VIEW_SERVICES
  serviceController.getServiceByIdHandler
);

// PUT /api/v1/services/:serviceId - Update a specific service
router.put(
  '/:serviceId',
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess,
  authMiddleware.authorizePermissions(PERMISSIONS.MANAGE_SERVICES),
  serviceController.updateServiceHandler
);

// DELETE /api/v1/services/:serviceId - Delete a specific service
router.delete(
  '/:serviceId',
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess,
  authMiddleware.authorizePermissions(PERMISSIONS.MANAGE_SERVICES),
  serviceController.deleteServiceHandler
);

// --- Publicly Accessible Service Routes (Example) ---
// These would typically not go through the standard authMiddleware.validateBusinessAccess
// if they are meant for unauthenticated users viewing a business's services.
// They would rely on `tenantMiddleware` to resolve businessId from subdomain or a path param.

// GET /api/v1/public/services/by-business/:businessIdForPublicView
// This route assumes businessIdForPublicView is a path parameter for public access.
// No authMiddleware.authenticate here.
// router.get(
//   '/public/by-business/:businessIdForPublicView',
//   // tenantMiddleware might be implicitly run if this is part of the main app
//   // or needs specific handling if businessIdForPublicView is the sole identifier
//   serviceController.getServicesByBusinessHandler // Controller needs to handle public case
// );

export default router;
