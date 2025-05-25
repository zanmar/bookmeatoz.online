import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '@/utils/errorHandler';

export const validateRequest =
  (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        // Use AppError for consistent error responses
        return next(
          new AppError('Validation failed.', 400, true, formattedErrors, 'VALIDATION_ERROR')
        );
      }
      // For other errors during parsing (should be rare)
      return next(
        new AppError('Invalid request data.', 400, true, undefined, 'INVALID_REQUEST_DATA')
      );
    }
  };

// Example Schemas (you would define these in separate files, e.g., src/schemas/auth.schemas.ts)

// import * as z from 'zod';
// export const loginSchema = z.object({
//   body: z.object({
//     email: z.string().email(),
//     password: z.string().min(1),
//   }),
// });

// export const createServiceSchema = z.object({
//   body: z.object({
//     name: z.string().min(1),
//     duration: z.number().int().positive(),
//     price: z.number().positive(),
//     currency: z.string().length(3),
//     // ... other fields
//   }),
//   // params: z.object({ businessId: z.string().uuid() }) // If businessId is from params
// });
