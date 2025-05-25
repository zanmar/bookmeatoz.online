import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService from '@/services/apiService';
import { ApiErrorResponse } from '@/types';
import Spinner from '@/components/common/Spinner';
import toast from '@/utils/toast';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setMessage("Invalid verification link: No token provided.");
      setVerificationStatus('error');
      toast.error("Invalid verification link.");
      return;
    }

    const verify = async () => {
      try {
        const response = await apiService.post('/auth/verify-email', { token });
        if (response.data.success) {
          setMessage(response.data.message || "Email verified successfully! You can now login.");
          setVerificationStatus('success');
          toast.success(response.data.message || "Email verified!");
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        } else {
          setMessage(response.data.message || "Email verification failed. The link might be invalid or expired.");
          setVerificationStatus('error');
          toast.error(response.data.message || "Email verification failed.");
        }
      } catch (error) {
        const err = error as ApiErrorResponse;
        console.error("Email verification error:", err);
        setMessage(err.message || "An error occurred during email verification. The link may be invalid or expired.");
        setVerificationStatus('error');
        toast.error(err.message || "Verification error.");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="text-center">
      {verificationStatus === 'verifying' && (
        <>
          <Spinner size="h-12 w-12" color="text-primary"/>
          <h2 className="mt-4 text-xl font-semibold text-neutral-darkest">{message}</h2>
        </>
      )}
      {verificationStatus === 'success' && (
        <>
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h2 className="text-xl font-semibold text-green-700">Email Verified!</h2>
            <p className="text-neutral-dark mt-2">{message}</p>
            <p className="mt-6">
                You will be redirected to the login page shortly. If not, click here: {' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                Proceed to Login
                </Link>
            </p>
        </>
      )}
      {verificationStatus === 'error' && (
         <>
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h2 className="text-xl font-semibold text-red-700">Verification Failed</h2>
            <p className="text-neutral-dark mt-2">{message}</p>
            <p className="mt-6">
                If you believe this is an error, please contact support or try{' '}
                <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
                registering again
                </Link>.
            </p>
         </>
      )}
    </div>
  );
};

export default VerifyEmailPage;
