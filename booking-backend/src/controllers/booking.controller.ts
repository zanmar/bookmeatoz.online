import { Request, Response, NextFunction } from 'express';
import { bookingService } from '@/services/booking.service';
import { AppError } from '@/utils/errorHandler';
import { PERMISSIONS } from '@/types/user.types';
import { getAppContext } from '@/utils/asyncContext';

function requirePermissionOrThrow(required: string) {
  const ctx = getAppContext();
  if (!ctx || !ctx.userId || !ctx.tenantId || !ctx.businessId) {
    throw new AppError('Missing context for permission check.', 403);
  }
  if (!ctx.permissions || !ctx.permissions.includes(required)) {
    throw new AppError('Insufficient permissions.', 403);
  }
}

export const bookingController = {
  // Handler to check slot availability (RBAC: anyone can check, but can restrict if needed)
  checkSpecificSlotAvailabilityHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.params.businessId;
      if (!businessId) {
        return next(new AppError('Business ID is required.', 400));
      }
      const { service_id, start_time, employee_id } = req.query;
      if (!service_id || !start_time) {
        return next(new AppError('Service ID and start time are required for slot check.', 400));
      }
      // Optionally enforce RBAC for slot check (e.g., only authenticated users)
      // requirePermissionOrThrow(PERMISSIONS.CREATE_BOOKINGS);
      const isAvailable = await bookingService.isSlotStillAvailable(
        businessId,
        service_id as string,
        start_time as string,
        employee_id as string | undefined
      );
      res.status(200).json({ success: true, data: { isAvailable }, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  // Handler to create a booking (RBAC: must have CREATE_BOOKINGS or MANAGE_BOOKINGS)
  createBookingHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return next(new AppError('Business context is required to create a booking.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.CREATE_BOOKINGS);
      const bookingData = req.body;
      // Optionally validate bookingData with Zod here
      const newBooking = await bookingService.createBooking(businessId, bookingData);
      res.status(201).json({
        success: true,
        message: 'Booking created successfully.',
        data: newBooking,
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  },

  // Handler to get available slots (RBAC: anyone can view)
  getAvailableSlotsHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.params.businessId;
      if (!businessId) {
        return next(new AppError('Business ID is required.', 400));
      }
      const { service_id, date } = req.query;
      if (!service_id || !date) {
        return next(
          new AppError('Service ID and date are required to retrieve available slots.', 400)
        );
      }
      // Use correct bookingService method names
      const slots = await bookingService.getAvailableSlots(
        businessId,
        service_id as string,
        date as string
      );
      res.status(200).json({ success: true, data: slots, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  // Handler to get bookings by business (RBAC: must have VIEW_BOOKINGS or similar)
  getBookingsByBusinessHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return next(new AppError('Business context is required to retrieve bookings.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.VIEW_OWN_BOOKINGS);
      // Use correct bookingService method names
      const bookings = await bookingService.getBookingsByBusiness(businessId);
      res.status(200).json({ success: true, data: bookings, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  // Handler to get a booking by ID (RBAC: must have VIEW_BOOKINGS or similar)
  getBookingByIdHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookingId = req.params.bookingId;
      if (!bookingId) {
        return next(new AppError('Booking ID is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.VIEW_OWN_BOOKINGS);
      // Use correct bookingService method names
      const booking = await bookingService.getBookingById(bookingId);
      if (!booking) {
        return next(new AppError('Booking not found.', 404));
      }
      res.status(200).json({ success: true, data: booking, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  // Handler to update booking status (RBAC: must have MANAGE_BOOKINGS)
  updateBookingStatusHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookingId = req.params.bookingId;
      if (!bookingId) {
        return next(new AppError('Booking ID is required.', 400));
      }
      requirePermissionOrThrow(PERMISSIONS.MANAGE_BOOKINGS);
      const { status } = req.body;
      if (!status) {
        return next(new AppError('Status is required to update booking.', 400));
      }
      // Use correct bookingService method names
      const updatedBooking = await bookingService.updateBookingStatus(bookingId, status);
      res.status(200).json({
        success: true,
        message: 'Booking status updated successfully.',
        data: updatedBooking,
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  // ...other handlers as needed...
};

export default bookingController;
