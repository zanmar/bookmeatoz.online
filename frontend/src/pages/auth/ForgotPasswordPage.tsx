import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import apiService from '@/services/apiService';
import { ApiErrorResponse } from '@/types';
import Spinner from '@/components/common/Spinner';
import toast from '@/utils/toast'; // Assuming you'll integrate a proper toast library

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
    setServerMessage(null);
    setIsSuccess(false);
    try {
      const response = await apiService.post('/auth/request-password-reset', data);
      if (response.data.success) {
        setIsSuccess(true);
        setServerMessage(response.data.message || "If an account with that email exists, a password reset link has been sent.");
        toast.success(response.data.message || "Password reset link sent!");
      } else {
        // This case might not be hit if apiService throws for non-2xx
        setServerMessage(response.data.message || "Failed to request password reset.");
        toast.error(response.data.message || "Failed to request password reset.");
      }
    } catch (error) {
      const err = error as ApiErrorResponse;
      console.error("Forgot password error:", err);
      setServerMessage(err.message || "An unexpected error occurred. Please try again.");
      toast.error(err.message || "An unexpected error occurred.");
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 className="text-xl font-semibold text-green-700">Request Sent!</h2>
        <p className="text-neutral-dark mt-2">{serverMessage}</p>
        <p className="mt-6">
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            &larr; Back to Login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold text-center text-neutral-darkest mb-2">Forgot Your Password?</h2>
        <p className="text-sm text-center text-neutral-dark mb-6">
          No worries! Enter your email address below, and we'll send you a link to reset your password.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverMessage && !isSuccess && ( // Show server error only if not success
          <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
            {serverMessage}
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-darkest">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              disabled={isSubmitting}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-dark/50 focus:outline-none sm:text-sm disabled:bg-gray-100
                ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}
            />
            {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-70"
          >
            {isSubmitting ? <><Spinner size="h-5 w-5" color="text-white" /> Sending Link...</> : 'Send Password Reset Link'}
          </button>
        </div>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm">
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            &larr; Back to Login
          </Link>
        </p>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
