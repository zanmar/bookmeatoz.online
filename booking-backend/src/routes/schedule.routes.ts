import { Router } from 'express';
import { scheduleController } from '@/controllers/schedule.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { PERMISSIONS } from '@/types'; // Ensure PERMISSIONS is correctly typed and imported

// Create a router that will be merged with employee routes, or a standalone one.
// If standalone, it needs to handle :employeeId itself or expect it from a merged route.
// Let's make it expect :employeeId from a parent router if merged, or define it here.
// For clarity, this router will handle its own :employeeId param.
const router = Router({ mergeParams: true }); // mergeParams allows access to params from parent router if nested

// All schedule routes require authentication, business context, and MANAGE_SCHEDULES permission.
// The `validateBusinessAccess` middleware ensures `req.businessId` is set.
// The `employeeId` will come from the route parameter.
// An additional check might be needed to ensure the :employeeId belongs to req.businessId.
// This is handled within each service method for now.

router.use(
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess, // Ensures req.businessId is set and user has general access
  authMiddleware.authorizePermissions(PERMISSIONS.MANAGE_SCHEDULES)
);

// --- Working Hours for an Employee ---
// PUT /api/v1/employees/:employeeId/schedule/working-hours (Sets/Replaces all weekly hours)
router.put('/working-hours', scheduleController.setEmployeeWorkingHoursHandler);

// GET /api/v1/employees/:employeeId/schedule/working-hours
router.get('/working-hours', scheduleController.getEmployeeWorkingHoursHandler);

// --- Availability Overrides for an Employee ---
// POST /api/v1/employees/:employeeId/schedule/overrides
router.post('/overrides', scheduleController.createEmployeeOverrideHandler);

// GET /api/v1/employees/:employeeId/schedule/overrides
router.get('/overrides', scheduleController.getEmployeeOverridesHandler);

// PUT /api/v1/employees/:employeeId/schedule/overrides/:overrideId
router.put('/overrides/:overrideId', scheduleController.updateEmployeeOverrideHandler);

// DELETE /api/v1/employees/:employeeId/schedule/overrides/:overrideId
router.delete('/overrides/:overrideId', scheduleController.deleteEmployeeOverrideHandler);

export default router;
