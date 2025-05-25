import { Request, Response, NextFunction } from 'express';
import { notificationService } from '@/services/notification.service';
import { AppError } from '@/utils/errorHandler';
import { getAppContext } from '@/utils/asyncContext';
import { PERMISSIONS } from '@/types/user.types';

function requirePermissionOrThrow(required: string) {
  const ctx = getAppContext();
  if (!ctx || !ctx.userId) {
    throw new AppError('Missing context for permission check.', 403);
  }
  if (!ctx.permissions || !ctx.permissions.includes(required)) {
    throw new AppError('Insufficient permissions.', 403);
  }
}

export const notificationController = {
  getUserNotificationsHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only allow users to view their own notifications, or require a permission for admin access
      requirePermissionOrThrow(PERMISSIONS.VIEW_OWN_BOOKINGS); // Or a dedicated notification permission
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const read_status = req.query.read_status ? req.query.read_status === 'true' : undefined;
      const type = req.query.type as any;

      const notifications = await notificationService.getUserNotifications(
        userId,
        { read_status, type },
        { page, limit }
      );
      res.status(200).json({
        success: true,
        data: notifications.data,
        pagination: notifications,
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  markAsReadHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      requirePermissionOrThrow(PERMISSIONS.VIEW_OWN_BOOKINGS); // Or a dedicated notification permission
      const userId = req.userId!;
      const { notificationId } = req.params;
      const notification = await notificationService.markNotificationAsRead(userId, notificationId);
      if (!notification) {
        return next(new AppError('Notification not found or already read.', 404));
      }
      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read.',
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  markAllAsReadHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      requirePermissionOrThrow(PERMISSIONS.VIEW_OWN_BOOKINGS); // Or a dedicated notification permission
      const userId = req.userId!;
      const result = await notificationService.markAllNotificationsAsRead(userId);
      res.status(200).json({
        success: true,
        data: result,
        message: `${result.count} notifications marked as read.`,
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  getUnreadCountHandler: async (req: Request, res: Response, next: NextFunction) => {
    try {
      requirePermissionOrThrow(PERMISSIONS.VIEW_OWN_BOOKINGS); // Or a dedicated notification permission
      const userId = req.userId!;
      const count = await notificationService.getUnreadNotificationCount(userId);
      res.status(200).json({ success: true, data: { count }, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },
};

// /var/www/bookmeatoz.online_ts/booking-backend/src/routes/notification.routes.ts
import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

router.use(authMiddleware.authenticate); // All notification routes require authentication

router.get('/', notificationController.getUserNotificationsHandler);
router.get('/unread-count', notificationController.getUnreadCountHandler);
router.patch('/:notificationId/read', notificationController.markAsReadHandler);
router.patch('/read-all', notificationController.markAllAsReadHandler);
// No POST for creating notifications here; they are created by other services (booking, user, etc.)

export default router;
