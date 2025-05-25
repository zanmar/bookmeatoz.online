import winston from 'winston';

const { format, transports } = winston;
const { combine, timestamp, json, colorize, printf, errors } = format;

// Custom format to include tenantId and businessId if available in metadata
const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...metadata }) => {
  let log = `${ts} ${level}: ${message}`;
  if (stack) {
    log = `${log}\n${stack}`;
  }
  // Add metadata like tenantId, businessId if present
  const meta = Object.entries(metadata)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(' ');
  if (meta) {
    log += ` ${meta}`;
  }
  return log;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json() // For file transport
  ),
  defaultMeta: { service: 'booking-backend' },
  transports: [
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      tailable: true,
    }),
  ],
  exceptionHandlers: [new transports.File({ filename: 'logs/exceptions.log' })],
  rejectionHandlers: [new transports.File({ filename: 'logs/rejections.log' })],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), consoleFormat),
      level: 'debug',
    })
  );
}

export default logger;
