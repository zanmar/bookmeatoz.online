import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/auth.service'; // To be created
import { AppError } from '@/utils/errorHandler';
import { LoginResponse, User } from '@/types'; // Assuming User type for registration

export const authController = {
  registerUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Basic validation, more robust validation should be in middleware
      const { email, password, name, role } = req.body; // Role might be 'customer' by default
      if (!email || !password || !name) {
        return next(new AppError('Email, password, and name are required.', 400));
      }
      // Validate password strength (from security_considerations.md)
      // const { isPasswordStrong } = require('@/utils/security'); // Fictional util
      // if (!isPasswordStrong(password)) {
      //   return next(new AppError('Password does not meet security requirements.', 400));
      // }

      const newUser = await authService.register({ email, password, name, requestedRole: role });
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: { userId: newUser.id }, // Don't return full user object or password hash
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  },

  loginUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(new AppError('Email and password are required.', 400));
      }
      const loginData: LoginResponse = await authService.login(email, password);
      // Set HttpOnly cookie for refresh token if using them
      // res.cookie('refreshToken', loginData.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: loginData, // Contains accessToken and user details
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  logoutUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      if (!token || !req.user) {
        return next(new AppError('No active session to logout.', 400));
      }
      await authService.logout(token, req.user.exp); // Pass token and its expiry for blacklist
      res.status(200).json({ success: true, message: 'Logout successful.', statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body; // Or from HttpOnly cookie: const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return next(new AppError('Refresh token is required.', 400));
      }
      const newTokens = await authService.refreshAccessToken(refreshToken);
      // res.cookie('refreshToken', newTokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully.',
        data: { accessToken: newTokens.accessToken },
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  getCurrentUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        // userId is populated by authenticate middleware from DB check
        return next(new AppError('User not authenticated or user ID not found.', 401));
      }
      // Fetch full, fresh user details if needed, or use req.user if JWT payload is sufficient
      const user = await authService.getUserById(req.userId);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }
      // Ensure roles and permissions are up-to-date for the current context if necessary
      const contextualUser = await authService.getContextualUser(
        user.id,
        req.tenantId,
        req.businessId
      );

      res.status(200).json({
        success: true,
        data: contextualUser, // Return contextual user (with current roles/permissions)
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  requestPasswordReset: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) return next(new AppError('Email is required.', 400));
      await authService.requestPasswordReset(email);
      res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword)
        return next(new AppError('Token and new password are required.', 400));
      // Validate password strength
      await authService.resetPassword(token, newPassword);
      res
        .status(200)
        .json({ success: true, message: 'Password has been reset successfully.', statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },

  verifyEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      if (!token) return next(new AppError('Verification token is required.', 400));
      await authService.verifyEmail(token);
      res
        .status(200)
        .json({ success: true, message: 'Email verified successfully.', statusCode: 200 });
    } catch (error) {
      next(error);
    }
  },
};
