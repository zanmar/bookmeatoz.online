import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-white to-secondary-lightest flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          {/* You can replace this with your actual logo */}
          <img 
            className="mx-auto h-12 w-auto" 
            src="/logo-placeholder.svg" // Replace with your logo path e.g., /bookmeatoz-logo.svg
            alt="BookMeAtOz" 
            onError={(e) => (e.currentTarget.src = 'https://placehold.co/200x50/06b6d4/white?text=BookMeAtOz&font=Inter')}
          />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-darkest">
          Welcome
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10">
          <Outlet /> {/* This is where LoginPage or RegisterPage will be rendered */}
        </div>
      </div>
      <p className="mt-8 text-center text-sm text-neutral-dark">
        &copy; {new Date().getFullYear()} BookMeAtOz.online. All rights reserved.
      </p>
    </div>
  );
};

export default AuthLayout;
