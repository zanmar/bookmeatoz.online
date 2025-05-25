import cron from 'node-cron';
import logger from '@/utils/logger';
import { query as dbQuery } from '@/config/db';
import { Booking, User, Business, Service } from '@/types';
import { emailService } from './email.service';
import { notificationService, CreateNotificationDto } from './notification.service';
import { formatInTimeZone, isValidTimezone } from '@/utils/timezone.utils';

// Helper to get bookings needing reminders
async function getBookingsForReminder(
  reminderWindowStart: Date,
  reminderWindowEnd: Date
): Promise<Booking[]> {
  // Fetches bookings whose start_time falls within the window and are confirmed
  const query = `
    SELECT b.*, 
           c.email as customer_email, c.name as customer_name,
           biz.name as business_name, biz.timezone as business_timezone,
           s.name as service_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN businesses biz ON b.business_id = biz.id
    JOIN services s ON b.service_id = s.id
    WHERE b.start_time >= $1 AND b.start_time < $2
      AND b.status = 'confirmed'
      AND b.reminder_sent_24h = FALSE; -- Add flags to booking table to track sent reminders
      -- OR AND b.reminder_sent_1h = FALSE; depending on job type
  `;
  // Note: You'll need to add `reminder_sent_24h` (BOOLEAN DEFAULT FALSE) and
  // `reminder_sent_1h` (BOOLEAN DEFAULT FALSE) columns to your `bookings` table via a migration.
  try {
    const result = await dbQuery(query, [reminderWindowStart, reminderWindowEnd]);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching bookings for reminders:', error);
    return [];
  }
}

async function updateReminderSentFlag(bookingId: string, reminderType: '24h' | '1h') {
  const fieldToUpdate = reminderType === '24h' ? 'reminder_sent_24h' : 'reminder_sent_1h';
  try {
    await dbQuery(`UPDATE bookings SET ${fieldToUpdate} = TRUE WHERE id = $1`, [bookingId]);
    logger.info(`Reminder flag '${fieldToUpdate}' set for booking ${bookingId}`);
  } catch (error) {
    logger.error(`Error updating ${fieldToUpdate} flag for booking ${bookingId}:`, error);
  }
}

export const initializeSchedulers = () => {
  logger.info('Initializing schedulers...');

  // Schedule for 24-hour reminders (e.g., run every hour to check)
  // This job will run at the beginning of every hour.
  cron.schedule('0 * * * *', async () => {
    logger.info('Running 24-hour booking reminder job...');
    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // Start of 24h window (23h from now)
    const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // End of 24h window (25h from now)

    // Fetch bookings that are 24 hours away (+/- 1 hour buffer for job timing)
    // AND reminder_sent_24h = FALSE
    // The query needs to be more precise: bookings starting between 24 and 25 hours from now.
    const nowPlus23Hours = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const nowPlus25Hours = new Date(Date.now() + 25 * 60 * 60 * 1000);

    // Adjust getBookingsForReminder to use the reminder_sent_24h flag
    const bookingsToRemind = await getBookingsForReminder(nowPlus23Hours, nowPlus25Hours); // Adapt this function

    for (const booking of bookingsToRemind) {
      if (
        !booking.customer_id ||
        !booking.business_timezone ||
        !isValidTimezone(booking.business_timezone)
      ) {
        logger.warn(
          `Skipping reminder for booking ${booking.id} due to missing email or invalid business timezone.`
        );
        continue;
      }
      try {
        // Send Email Reminder
        await emailService.sendBookingReminderEmail(
          booking.customer_id,
          booking,
          (booking as any).customer_name, // Assuming JOIN populates this
          (booking as any).business_name,
          booking.business_timezone,
          (booking as any).service_name,
          '24h'
        );
        // Create In-App Notification
        const notificationContent = `Reminder: Your booking for ${(booking as any).service_name} at ${(booking as any).business_name} is tomorrow around ${formatInTimeZone(booking.start_time, 'p', booking.business_timezone)}.`;
        await notificationService.createNotification({
          user_id: booking.customer_id, // Assuming customer_id can be linked to a user_id for in-app. If not, this needs adjustment.
          // If customers table has user_id FK:
          // const customerUser = await dbQuery('SELECT user_id FROM customers WHERE id = $1', [booking.customer_id]);
          // if(customerUser.rows[0]?.user_id) { /* create notification for customerUser.rows[0].user_id */ }
          type: 'booking_reminder_24h',
          title: 'Booking Reminder',
          content: notificationContent,
          data: { bookingId: booking.id, businessId: booking.business_id },
          business_id: booking.business_id,
        });
        await updateReminderSentFlag(booking.id, '24h');
      } catch (err) {
        logger.error(`Failed to send 24h reminder for booking ${booking.id}:`, err);
      }
    }
    logger.info(
      `24-hour booking reminder job finished. Processed ${bookingsToRemind.length} bookings.`
    );
  });

  // Schedule for 1-hour reminders (e.g., run every 15 minutes to check)
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Running 1-hour booking reminder job...');
    const nowPlus55Minutes = new Date(Date.now() + 55 * 60 * 1000);
    const nowPlus65Minutes = new Date(Date.now() + 65 * 60 * 1000);
    // Fetch bookings starting between 55 and 65 minutes from now
    // AND reminder_sent_1h = FALSE
    // const bookingsToRemind = await getBookingsForReminder(nowPlus55Minutes, nowPlus65Minutes, '1h');
    // ... similar logic to send email & in-app notification, then update reminder_sent_1h flag ...
  });

  // TODO: Add other jobs:
  // - Follow-up after appointments (e.g., "Rate your experience")
  // - Re-engaging inactive users
  // - Cleaning up old notification_blacklist entries or expired tokens.
};

// Call this in your main server.ts or app.ts to start the cron jobs
// if (process.env.NODE_ENV !== 'test') { // Don't run schedulers during tests
//   initializeSchedulers();
// }
