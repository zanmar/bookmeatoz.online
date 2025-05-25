// /var/www/bookmeatoz.online_ts/frontend/src/pages/public/ServicesPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

// Placeholder icons
const SalonIcon = () => <svg className="h-10 w-10 text-primary-dark mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const ConsultantIcon = () => <svg className="h-10 w-10 text-primary-dark mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const FitnessIcon = () => <svg className="h-10 w-10 text-primary-dark mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;


const PublicServicesPage: React.FC = () => {
  // In a real scenario, this page might:
  // 1. List categories of services BookMeAtOz supports.
  // 2. OR, if there's a public business directory, fetch and display businesses.
  // For now, it's a generic page about the types of services.

  const serviceCategories = [
    { name: "Salons & Spas", description: "Haircuts, styling, manicures, pedicures, massages, facials, and more beauty treatments.", icon: SalonIcon },
    { name: "Consultants & Coaches", description: "Business consulting, life coaching, financial advisory, legal consultations, and other professional services.", icon: ConsultantIcon },
    { name: "Health & Fitness", description: "Personal training sessions, yoga classes, physiotherapy appointments, nutritionist consultations.", icon: FitnessIcon },
    { name: "Workshops & Classes", description: "Group classes, educational workshops, art lessons, music lessons, and more.", icon: () => <svg className="h-10 w-10 text-primary-dark mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z"></path><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg> },
    { name: "Repair & Maintenance", description: "Appliance repair, automotive services, home maintenance, IT support appointments.", icon: () => <svg className="h-10 w-10 text-primary-dark mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg> },
    { name: "And Many More...", description: "BookMeAtOz is flexible enough to support a wide variety of appointment-based businesses.", icon: () => <svg className="h-10 w-10 text-primary-dark mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7"></path></svg> },
  ];

  return (
    <div className="py-4 xs:py-6 sm:py-8 lg:py-12 bg-white rounded-xl shadow-lg p-3 xs:p-4 sm:p-6 md:p-10 mx-2 xs:mx-0">
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl xs:text-3xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-darkest mb-3 xs:mb-4 sm:mb-4 leading-tight">
            Services You Can Manage & Book
          </h1>
          <p className="text-sm xs:text-base sm:text-lg text-neutral-dark max-w-3xl mx-auto mb-6 xs:mb-8 sm:mb-12 leading-relaxed px-2 xs:px-0">
            BookMeAtOz is designed for a diverse range of service-based businesses. Whether you're a solo practitioner or manage a team,
            our platform helps you streamline your bookings and connect with clients.
          </p>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
          {serviceCategories.map((category) => (
            <div key={category.name} className="bg-gray-50 p-4 xs:p-5 sm:p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow touch-manipulation">
              <category.icon />
              <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-neutral-darkest mb-2">{category.name}</h3>
              <p className="text-xs xs:text-sm sm:text-sm text-neutral-dark leading-relaxed">{category.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 xs:mt-12 sm:mt-16 text-center px-2 xs:px-0">
          <h2 className="text-xl xs:text-2xl sm:text-2xl font-semibold text-neutral-darkest mb-3 xs:mb-4 sm:mb-4">Ready to Get Started?</h2>
          <p className="text-sm xs:text-base sm:text-base text-neutral-dark mb-4 xs:mb-5 sm:mb-6 max-w-xl mx-auto">
            If you're a business, register today to start managing your appointments effortlessly. If you're a customer, find and book services with ease.
          </p>
          <div className="flex flex-col xs:flex-col sm:flex-row justify-center items-center space-y-3 xs:space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/register"
              className="w-full xs:w-full sm:w-auto inline-flex items-center justify-center px-4 xs:px-6 sm:px-6 py-3 border border-transparent text-sm xs:text-base sm:text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark min-h-[44px] touch-manipulation whitespace-nowrap"
            >
              Register Your Business
            </Link>
            <Link
              to="/public-businesses" // Conceptual link
              className="w-full xs:w-full sm:w-auto inline-flex items-center justify-center px-4 xs:px-6 sm:px-6 py-3 border-2 border-primary-dark text-sm xs:text-base sm:text-base font-medium rounded-md text-primary-dark bg-white hover:bg-primary-lightest min-h-[44px] touch-manipulation whitespace-nowrap"
            >
              Find a Service Provider
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicServicesPage;
