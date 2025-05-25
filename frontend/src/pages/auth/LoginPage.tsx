import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';
import { ApiErrorResponse, LoginResponse } from '@/types';
import Spinner from '@/components/common/Spinner';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }), // Min 1 for presence, backend handles actual length
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login: authLoginContext } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setServerError(null);
    try {
      const response = await apiService.post<LoginFormValues, LoginResponse>('/auth/login', data);
      if (response.success && response.data) {
        await authLoginContext(response.data.accessToken, response.data.user);
        navigate(from, { replace: true });
      } else {
        // This case should ideally be handled by apiService interceptor throwing an error
        setServerError(response.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      const err = error as ApiErrorResponse;
      console.error("Login error:", err);
      setServerError(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold text-center text-neutral-darkest mb-1">Sign in to your account</h2>
        <p className="text-sm text-center text-neutral-dark mb-6">
          Or{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
            create a new account
          </Link>
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
            {serverError}
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
          <label htmlFor="password" className="block text-sm font-medium text-neutral-darkest">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              disabled={isSubmitting}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-dark/50 focus:outline-none sm:text-sm disabled:bg-gray-100
                ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}
            />
            {errors.password && <p role="alert" className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-dark">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-70"
          >
            {isSubmitting ? <><Spinner size="h-5 w-5" color="text-white" /> Signing in...</> : 'Sign in'}
          </button>
        </div>
      </form>
    </>
  );
};

export default LoginPage;
