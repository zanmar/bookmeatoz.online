// Error handler utility placeholder

// Minimal AppError implementation for service/controller use
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any;
  code?: string;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    errors?: any,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Express global error handler middleware
export function globalErrorHandler(err: any, req: any, res: any, next: any) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    errors: err.errors || undefined,
    code: err.code || undefined,
  });
}
