import { query as dbQuery, getClient } from '@/config/db';
import { AppError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { Notification } from '@/types/notification.types';
import { PaginatedResponse } from '@/types';
import { v4 as uuidv4 } from 'uuid';
// import { io } from '@/app'; // Conceptual: Import Socket.IO instance if integrated directly in app.ts

// Define NotificationType based on your application's events
export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'booking_reminder_24h'
  | 'booking_reminder_1h'
  | 'employee_invited'
  | 'new_message' // Example
  | 'system_announcement';

export interface CreateNotificationDto {
  user_id: string;
  type: NotificationType;
  title?: string;
  content: string;
  data?: Record<string, any>; // e.g., { bookingId: '...', serviceName: '...' }
  tenant_id?: string;
  business_id?: string;
}

export const notificationService = {
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const { user_id, type, title, content, data, tenant_id, business_id } = dto;
    const id = uuidv4();

    const insertQuery = `
      INSERT INTO notifications (id, user_id, type, title, content, data, tenant_id, business_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;
    try {
      const result = await dbQuery(insertQuery, [
        id,
        user_id,
        type,
        title,
        content,
        data ? JSON.stringify(data) : null,
        tenant_id,
        business_id,
      ]);
      const newNotification: Notification = result.rows[0];
      logger.info(`Notification created for user ${user_id}, type ${type}, ID: ${id}`);

      // **WebSocket Integration (Conceptual):**
      // If Socket.IO is set up and 'io' instance is available:
      // if (io) {
      //   io.to(`user_${user_id}`).emit('new_notification', newNotification);
      //   logger.debug(`Emitted 'new_notification' to user_${user_id}`);
      // } else {
      //   logger.warn('Socket.IO instance not available for real-time notification.');
      // }

      return newNotification;
    } catch (error: any) {
      logger.error('Error creating notification:', { dto, error: error.message });
      throw new AppError('Failed to create notification.', 500);
    }
  },

  async getUserNotifications(
    userId: string,
    filters: { read_status?: boolean; type?: NotificationType } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<Notification>> {
    let selectQuery = 'SELECT * FROM notifications WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (filters.read_status !== undefined) {
      const filterStr = ` AND read_status = $${paramIndex++}`;
      selectQuery += filterStr;
      countQuery += filterStr;
      queryParams.push(filters.read_status);
    }
    if (filters.type) {
      const filterStr = ` AND type = $${paramIndex++}`;
      selectQuery += filterStr;
      countQuery += filterStr;
      queryParams.push(filters.type);
    }

    selectQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
    const offset = (pagination.page - 1) * pagination.limit;
    queryParams.push(pagination.limit, offset);

    const countParams = queryParams.slice(0, paramIndex - 3);

    try {
      const notificationsResult = await dbQuery(selectQuery, queryParams);
      const totalResult = await dbQuery(countQuery, countParams);
      const total = parseInt(totalResult.rows[0].count, 10);

      return {
        data: notificationsResult.rows,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      };
    } catch (error: any) {
      logger.error('Error fetching user notifications:', { userId, filters, error: error.message });
      throw new AppError('Failed to retrieve notifications.', 500);
    }
  },

  async markNotificationAsRead(
    userId: string,
    notificationId: string
  ): Promise<Notification | null> {
    const updateQuery = `
      UPDATE notifications
      SET read_status = TRUE, read_at = NOW()
      WHERE id = $1 AND user_id = $2 AND read_status = FALSE
      RETURNING *;
    `;
    try {
      const result = await dbQuery(updateQuery, [notificationId, userId]);
      if (result.rows.length === 0) {
        logger.warn(`Notification not found or already read: ${notificationId} for user ${userId}`);
        // Optionally fetch and return the notification even if already read
        const current = await dbQuery(
          'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
          [notificationId, userId]
        );
        return current.rows.length > 0 ? current.rows[0] : null;
      }
      logger.info(`Notification marked as read: ${notificationId} for user ${userId}`);
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error marking notification as read:', {
        notificationId,
        userId,
        error: error.message,
      });
      throw new AppError('Failed to mark notification as read.', 500);
    }
  },

  async markAllNotificationsAsRead(userId: string): Promise<{ count: number }> {
    const updateQuery = `
      UPDATE notifications
      SET read_status = TRUE, read_at = NOW()
      WHERE user_id = $1 AND read_status = FALSE;
    `;
    try {
      const result = await dbQuery(updateQuery, [userId]);
      logger.info(`${result.rowCount} notifications marked as read for user ${userId}`);
      return { count: result.rowCount || 0 };
    } catch (error: any) {
      logger.error('Error marking all notifications as read:', { userId, error: error.message });
      throw new AppError('Failed to mark all notifications as read.', 500);
    }
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const countQuery =
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_status = FALSE;';
    try {
      const result = await dbQuery(countQuery, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error fetching unread notification count:', { userId, error });
      throw new AppError('Failed to get unread notification count.', 500);
    }
  },
};
