import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiService from '@/services/apiService';
import { ApiErrorResponse } from '@/types';
import Spinner from '@/components/common/Spinner';
import toast from '@/utils/toast';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" })
    // Add more password strength rules if desired, matching backend
    // .regex(/[a-z]/, "Must include lowercase")
    // .regex(/[A-Z]/, "Must include uppercase")
    // .regex(/[0-9]/, "Must include number")
    // .regex(/[^a-zA-Z0-9]/, "Must include special character")
    , 
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null); // null = checking, true = valid, false = invalid

  // Optional: Validate token on page load (backend might do this on submit anyway)
  // useEffect(() => {
  //   if (token) {
  //     apiService.post('/auth/validate-reset-token', { token }) // Hypothetical endpoint
  //       .then(() => setIsValidToken(true))
  //       .catch(() => {
  //         setIsValidToken(false);
  //         setServerError("Invalid or expired password reset token.");
  //       });
  //   } else {
  //     setIsValidToken(false);
  //     setServerError("No reset token provided.");
  //   }
  // }, [token]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (data) => {
    setServerError(null);
    if (!token) {
      setServerError("No reset token found in URL.");
      toast.error("Reset token missing.");
      return;
    }
    try {
      const response = await apiService.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      if (response.data.success) {
        setIsSuccess(true);
        toast.success("Password reset successfully! You can now login.");
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setServerError(response.data.message || "Failed to reset password.");
        toast.error(response.data.message || "Failed to reset password.");
      }
    } catch (error) {
      const err = error as ApiErrorResponse;
      console.error("Reset password error:", err);
      setServerError(err.message || "An invalid or expired token was used, or an unexpected error occurred.");
      toast.error(err.message || "Password reset failed.");
    }
  };
  
  // if (isValidToken === null) { // Optional loading state for token validation
  //   return <div className="text-center p-10"><Spinner size="h-8 w-8" /> <p>Validating token...</p></div>;
  // }
  // if (isValidToken === false && serverError) { // If initial token validation failed
  //    return <div className="text-center p-10 text-red-600">{serverError} <Link to="/forgot-password">Request new link</Link></div>;
  // }


  if (isSuccess) {
    return (
      <div className="text-center">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 className="text-xl font-semibold text-green-700">Password Reset Successful!</h2>
        <p className="text-neutral-dark mt-2">You can now log in with your new password.</p>
        <p className="mt-6">
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            Proceed to Login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold text-center text-neutral-darkest mb-2">Reset Your Password</h2>
        <p className="text-sm text-center text-neutral-dark mb-6">
          Enter your new password below.
        </p>
      </div>
      {!token && <div role="alert" className="p-3 mb-4 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">Invalid or missing reset token. Please request a new password reset link.</div>}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && !isSuccess && (
          <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
            {serverError}
          </div>
        )}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-darkest">New Password</label>
          <input id="newPassword" type="password" {...register("newPassword")} disabled={isSubmitting || !token}
            className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-dark/50 focus:outline-none sm:text-sm disabled:bg-gray-100
              ${errors.newPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
          {errors.newPassword && <p role="alert" className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-darkest">Confirm New Password</label>
          <input id="confirmPassword" type="password" {...register("confirmPassword")} disabled={isSubmitting || !token}
            className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-dark/50 focus:outline-none sm:text-sm disabled:bg-gray-100
              ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
          {errors.confirmPassword && <p role="alert" className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <button type="submit" disabled={isSubmitting || !token}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-70">
            {isSubmitting ? <><Spinner size="h-5 w-5" color="text-white"/> Resetting Password...</> : 'Reset Password'}
          </button>
        </div>
      </form>
       <div className="mt-6 text-center">
        <p className="text-sm">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            Login
          </Link>
        </p>
      </div>
    </>
  );
};

export default ResetPasswordPage;
