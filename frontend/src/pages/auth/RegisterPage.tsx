import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '@/services/apiService';
import { ApiErrorResponse, User } from '@/types'; // Assuming User type for response data
import Spinner from '@/components/common/Spinner';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" })
    // .regex(/[a-z]/, { message: "Password must contain a lowercase letter" }) // Add more rules as needed
    // .regex(/[A-Z]/, { message: "Password must contain an uppercase letter" })
    // .regex(/[0-9]/, { message: "Password must contain a number" })
    // .regex(/[^a-zA-Z0-9]/, { message: "Password must contain a special character" })
    ,
  confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Path of error
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setServerError(null);
    setRegistrationSuccess(false);
    try {
      // Backend expects `name`, `email`, `password`. `confirmPassword` is only for frontend validation.
      const payload = { name: data.name, email: data.email, password: data.password };
      const response = await apiService.post<typeof payload, { userId: string }>('/auth/register', payload);

      if (response.success) {
        setRegistrationSuccess(true);
        // Optionally navigate to login after a delay or show a persistent success message
        // setTimeout(() => navigate('/login'), 3000);
      } else {
        setServerError(response.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      const err = error as ApiErrorResponse;
      console.error("Registration error:", err);
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        setServerError(err.errors.map(e => e.message).join(', '));
      } else {
        setServerError(err.message || "An unexpected error occurred. Please try again.");
      }
    }
  };

  if (registrationSuccess) {
    return (
      <div className="text-center">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 className="text-xl font-semibold text-green-700">Registration Successful!</h2>
        <p className="text-neutral-dark mt-2">Please check your email to verify your account.</p>
        <p className="mt-4">
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
        <h2 className="text-xl font-semibold text-center text-neutral-darkest mb-1">Create your account</h2>
        <p className="text-sm text-center text-neutral-dark mb-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            Sign in
          </Link>
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
            {serverError}
          </div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-darkest">Full Name</label>
          <input id="name" type="text" {...register("name")} disabled={isSubmitting}
            className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-dark/50 focus:outline-none sm:text-sm disabled:bg-gray-100
              ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
          {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-darkest">Email address</label>
          <input id="email" type="email" autoComplete="email" {...register("email")} disabled={isSubmitting}
            className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-dark/50 focus:outline-none sm:text-sm disabled:bg-gray-100
              ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
          {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-darkest">Password</label>
          <input id="password" type="password" {...register("password")} disabled={isSubmitting}
            className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-dark/50 focus:outline-none sm:text-sm disabled:bg-gray-100
              ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
          {errors.password && <p role="alert" className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-darkest">Confirm Password</label>
          <input id="confirmPassword" type="password" {...register("confirmPassword")} disabled={isSubmitting}
            className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-dark/50 focus:outline-none sm:text-sm disabled:bg-gray-100
              ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
          {errors.confirmPassword && <p role="alert" className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <button type="submit" disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-70">
            {isSubmitting ? <><Spinner size="h-5 w-5" color="text-white"/> Creating Account...</> : 'Create Account'}
          </button>
        </div>
      </form>
    </>
  );
};

export default RegisterPage;
