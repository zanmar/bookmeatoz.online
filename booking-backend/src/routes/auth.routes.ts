import { Router } from 'express';
import { authController } from '@/controllers/auth.controller'; // To be created
import { authMiddleware } from '@/middleware/auth.middleware'; // To be created
// Add input validation middleware if you have one (e.g., using express-validator or Zod)
// import { validateLogin, validateRegister } from '@/middleware/validation.middleware';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  // validateRegister, // Example validation
  authController.registerUser
);

// POST /api/v1/auth/login
router.post(
  '/login',
  // validateLogin, // Example validation
  authController.loginUser
);

// POST /api/v1/auth/logout
router.post(
  '/logout',
  authMiddleware.authenticate, // User must be authenticated to logout (to invalidate token)
  authController.logoutUser
);

// POST /api/v1/auth/refresh-token
router.post(
  '/refresh-token',
  authController.refreshToken // Needs specific logic for refresh tokens
);

// GET /api/v1/auth/me
// Returns the currently authenticated user's profile
router.get('/me', authMiddleware.authenticate, authController.getCurrentUser);

// POST /api/v1/auth/request-password-reset
router.post('/request-password-reset', authController.requestPasswordReset);

// POST /api/v1/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// POST /api/v1/auth/verify-email
router.post('/verify-email', authController.verifyEmail);

export default router;
