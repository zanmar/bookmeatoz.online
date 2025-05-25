import { Router } from 'express';
import { customerController } from '@/controllers/customer.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { PERMISSIONS } from '@/types';

const router = Router();

// All customer routes require authentication, business context validation, and MANAGE_CUSTOMERS permission.
router.use(
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess,
  authMiddleware.authorizePermissions(PERMISSIONS.MANAGE_CUSTOMERS)
);

// POST /api/v1/customers - Create a new customer for the current business
router.post('/', customerController.createCustomerHandler);

// GET /api/v1/customers - Get all customers for the current business (with pagination and filtering)
router.get('/', customerController.getCustomersByBusinessHandler);

// GET /api/v1/customers/:customerId - Get a specific customer by ID
router.get('/:customerId', customerController.getCustomerByIdHandler);

// PUT /api/v1/customers/:customerId - Update a specific customer
router.put('/:customerId', customerController.updateCustomerHandler);

// DELETE /api/v1/customers/:customerId - Delete a specific customer
router.delete('/:customerId', customerController.deleteCustomerHandler);

export default router;
