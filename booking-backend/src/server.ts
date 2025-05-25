import { server, app } from './app'; // Import server (for Socket.IO) and app (for Express logic)
import dotenv from 'dotenv';
import logger from '@/utils/logger';
import { testDBConnection, pool as primaryPool } from '@/config/db'; // Import primaryPool for explicit closing
// Import readPool if you want to explicitly close it too, though pg.Pool usually handles this.
// import { readPool } from '@/config/db';
import { initializeSchedulers } from './services/scheduler.service';

dotenv.config(); // Ensure .env is loaded if not already by a specific entry point

const PORT = process.env.PORT || 8083;

const startServer = async () => {
  try {
    // 1. Test Database Connection
    await testDBConnection();

    // 2. Initialize Schedulers (e.g., for reminders)
    if (process.env.NODE_ENV !== 'test') {
      // Avoid running schedulers during automated tests
      initializeSchedulers();
    }

    // 3. Start HTTP Server (which now also serves Socket.IO via the 'server' instance from app.ts)
    server.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`API base URL: ${process.env.API_BASE_URL || '/api/v1'}`);
      // You could add a check here to see if Socket.IO is listening if needed,
      // but it's implicitly handled by server.listen if io is attached to 'server'.
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1); // Exit if critical startup steps fail
  }
};

// Graceful Shutdown Handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  // 1. Close HTTP server to stop accepting new connections
  server.close(async (err) => {
    if (err) {
      logger.error('Error during HTTP server close:', err);
      process.exit(1); // Force exit if server close fails
    }
    logger.info('HTTP server closed.');

    // 2. Close database connections
    // pg.Pool's end() method drains the pool and closes active connections.
    try {
      await primaryPool.end();
      logger.info('Primary database pool closed.');
      // if (readPool) { // If you have a separate read pool
      //   await readPool.end();
      //   logger.info('Read replica database pool closed.');
      // }
    } catch (dbError) {
      logger.error('Error closing database pools:', dbError);
    }

    // 3. Other cleanup (e.g., close Redis connections, stop cron jobs if they need explicit stopping)
    // For node-cron, tasks stop when the process exits. For BullMQ, workers need graceful shutdown.
    logger.info('Cleanup finished. Exiting.');
    process.exit(0);
  });

  // Force shutdown if graceful shutdown fails after a timeout
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000); // 10 seconds timeout
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Sent by process managers like PM2, Docker
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Catches Ctrl+C

// Handle critical errors that should cause a shutdown
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', {
    promiseDetails: promise,
    reason: reason?.stack || reason,
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { errorMessage: error.message, stack: error.stack });
  // For uncaught exceptions, exiting quickly is generally safer.
  // Trigger graceful shutdown to attempt cleanup.
  gracefulShutdown('uncaughtException');
});

// Start the server
startServer();
