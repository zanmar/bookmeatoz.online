import { Router } from 'express';
import { employeeController } from '@/controllers/employee.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { PERMISSIONS } from '@/types';
import scheduleRoutesForEmployee from './schedule.routes'; // Import the schedule router

const router = Router();

// Base employee routes require MANAGE_EMPLOYEES
router.use(
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess,
  authMiddleware.authorizePermissions(PERMISSIONS.MANAGE_EMPLOYEES)
);

// POST /api/v1/employees - Invite or add a new employee
router.post('/', employeeController.inviteOrAddEmployeeHandler);

// GET /api/v1/employees - Get all employees for the current business
router.get('/', employeeController.getEmployeesByBusinessHandler);

// GET /api/v1/employees/:employeeUserId - Get details of a specific employee
router.get('/:employeeUserId', employeeController.getEmployeeDetailsHandler);

// PUT /api/v1/employees/:employeeUserId/role - Update an employee's role
router.put('/:employeeUserId/role', employeeController.updateEmployeeRoleHandler);

// DELETE /api/v1/employees/:employeeUserId - Remove an employee from the business
router.delete('/:employeeUserId', employeeController.removeEmployeeFromBusinessHandler);

// --- Nested Schedule Routes for a specific employee ---
// This will make routes like: /api/v1/employees/:employeeId/schedule/working-hours
// The `employeeId` param from this router will be available to scheduleRoutesForEmployee due to `mergeParams: true`
router.use('/:employeeId/schedule', scheduleRoutesForEmployee);

export default router;
