import { Router } from 'express';
import { bookingController } from '@/controllers/booking.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { PERMISSIONS } from '@/types';

const router = Router();

// --- Publicly accessible routes ---
router.get('/public/:businessId/availability', bookingController.getAvailableSlotsHandler);

// NEW: Public endpoint to check if a specific slot is still available
router.get(
  '/public/:businessId/slot-check', // Query params: service_id, start_time, employee_id (optional)
  bookingController.checkSpecificSlotAvailabilityHandler // New controller method
);

// --- Authenticated Routes ---
router.post('/', authMiddleware.authenticate, bookingController.createBookingHandler);
// ... other authenticated booking routes ...
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess,
  authMiddleware.authorizePermissions([
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.VIEW_ASSIGNED_BOOKINGS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
  ]),
  bookingController.getBookingsByBusinessHandler
);
router.get(
  '/:bookingId',
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess,
  bookingController.getBookingByIdHandler
);
router.put(
  '/:bookingId/status',
  authMiddleware.authenticate,
  authMiddleware.validateBusinessAccess,
  authMiddleware.authorizePermissions(PERMISSIONS.MANAGE_BOOKINGS),
  bookingController.updateBookingStatusHandler
);

export default router;
