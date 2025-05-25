// /var/www/bookmeatoz.online_ts/frontend/src/pages/public/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Placeholder icons (replace with actual icons from a library)
const CalendarIcon = () => <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UsersIcon = () => <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CogIcon = () => <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;


const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-12 xs:space-y-16 md:space-y-20 lg:space-y-24">
      {/* Hero Section */}
      <section className="pt-8 xs:pt-12 pb-8 xs:pb-12 md:pt-20 md:pb-16 bg-gradient-to-br from-primary-lightest via-white to-secondary-lightest rounded-lg xs:rounded-xl shadow-lg mx-2 xs:mx-0">
        <div className="max-w-4xl mx-auto text-center px-3 xs:px-4 sm:px-6">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-darkest leading-tight">
            Effortless <span className="text-primary-dark">Booking</span> & <span className="text-secondary-dark">Scheduling</span>
          </h1>
          <p className="mt-3 xs:mt-4 sm:mt-6 max-w-2xl mx-auto text-sm xs:text-base sm:text-lg md:text-xl text-neutral-dark leading-relaxed px-2 xs:px-0">
            BookMeAtOz empowers businesses to manage appointments seamlessly and helps customers book services with ease.
            Focus on what you do best, we'll handle the schedule.
          </p>
          <div className="mt-6 xs:mt-8 sm:mt-10 flex flex-col xs:flex-row justify-center items-stretch xs:items-center space-y-3 xs:space-y-0 xs:space-x-3 sm:space-x-4 lg:space-x-6 px-2 xs:px-4 sm:px-0">
            <Link
              to="/register"
              className="w-full xs:w-auto xs:min-w-[180px] sm:min-w-[200px] inline-flex items-center justify-center px-4 xs:px-6 sm:px-8 py-3 sm:py-3.5 border border-transparent text-sm sm:text-base font-semibold rounded-lg shadow-md text-white bg-primary hover:bg-primary-dark transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark touch-manipulation"
            >
              Register Your Business
            </Link>
            <Link
              to="/public-businesses"
              className="w-full xs:w-auto xs:min-w-[180px] sm:min-w-[200px] inline-flex items-center justify-center px-4 xs:px-6 sm:px-8 py-3 sm:py-3.5 border-2 border-primary-dark text-sm sm:text-base font-semibold rounded-lg text-primary-dark bg-white hover:bg-primary-lightest transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark touch-manipulation"
            >
              Find a Service
            </Link>
          </div>
          {!isAuthenticated && (
            <p className="mt-6 xs:mt-8 text-xs xs:text-sm text-neutral-dark">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-dark underline">
                Login here
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-darkest">Why Choose BookMeAtOz?</h2>
            <p className="mt-2 sm:mt-3 text-base sm:text-lg text-neutral-dark max-w-2xl mx-auto">
              Everything you need to manage your appointments and grow your client base, all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <div className="flex flex-col items-center text-center p-4 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
              <CalendarIcon />
              <h3 className="mt-4 sm:mt-5 text-lg sm:text-xl font-semibold text-neutral-darkest">Easy Online Booking</h3>
              <p className="mt-2 text-sm text-neutral-dark leading-relaxed">
                Allow customers to book your services 24/7 from any device through your personalized booking page.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
              <UsersIcon />
              <h3 className="mt-4 sm:mt-5 text-lg sm:text-xl font-semibold text-neutral-darkest">Staff & Schedule Management</h3>
              <p className="mt-2 text-sm text-neutral-dark leading-relaxed">
                Manage employee schedules, working hours, and availability overrides with intuitive tools.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow sm:col-span-2 lg:col-span-1">
              <CogIcon />
              <h3 className="mt-4 sm:mt-5 text-lg sm:text-xl font-semibold text-neutral-darkest">Multi-Tenant Ready</h3>
              <p className="mt-2 text-sm text-neutral-dark leading-relaxed">
                Perfect for individual businesses or service chains needing isolated management for multiple locations or brands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Call to Action Section */}
      <section className="py-8 sm:py-12 bg-primary-lightest rounded-xl shadow-lg mx-4 sm:mx-0">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-darkest">Ready to Simplify Your Bookings?</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-neutral-dark leading-relaxed">
            Join BookMeAtOz today and transform how you manage your appointments.
            Quick setup, easy to use, and powerful features.
          </p>
          <div className="mt-6 sm:mt-8">
            <Link
              to="/register"
              className="inline-flex items-center justify-center w-full sm:w-auto min-w-[250px] px-8 sm:px-10 py-3 sm:py-4 border border-transparent text-base sm:text-lg font-semibold rounded-lg shadow-md text-white bg-secondary hover:bg-secondary-dark transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-dark"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
