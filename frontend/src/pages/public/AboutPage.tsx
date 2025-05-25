// /var/www/bookmeatoz.online_ts/frontend/src/pages/public/AboutPage.tsx
import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="py-4 xs:py-6 sm:py-8 lg:py-12 bg-white rounded-xl shadow-lg p-3 xs:p-4 sm:p-6 md:p-10 mx-2 xs:mx-0">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl xs:text-3xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-darkest mb-4 xs:mb-6 sm:mb-8 text-center leading-tight">
          About BookMeAtOz
        </h1>
        
        <section className="mb-6 xs:mb-8 sm:mb-12">
          <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold text-primary-dark mb-2 xs:mb-3 sm:mb-4">Our Mission</h2>
          <p className="text-sm xs:text-base sm:text-base text-neutral-dark leading-relaxed">
            At BookMeAtOz, our mission is to simplify the world of appointment scheduling for both businesses and their customers. 
            We believe that managing bookings shouldn't be a chore, but a seamless experience that empowers service providers 
            to focus on what they do best – delivering excellent services. We strive to provide an intuitive, powerful, and 
            flexible platform that adapts to the diverse needs of modern businesses.
          </p>
        </section>

        <section className="mb-6 xs:mb-8 sm:mb-12">
          <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold text-primary-dark mb-2 xs:mb-3 sm:mb-4">Our Story</h2>
          <p className="text-sm xs:text-base sm:text-base text-neutral-dark leading-relaxed mb-3 xs:mb-3 sm:mb-4">
            BookMeAtOz was born from the observation that many businesses, especially small to medium-sized ones, struggle with 
            inefficient booking systems, missed appointments, and the administrative overhead of manual scheduling. 
            We envisioned a solution that leverages technology to automate these processes, enhance customer convenience, 
            and provide valuable insights to business owners.
          </p>
          <p className="text-sm xs:text-base sm:text-base text-neutral-dark leading-relaxed">
            Our journey started with a small team of passionate developers and business strategists dedicated to creating a 
            user-centric platform. After months of research, design, and development, BookMeAtOz emerged as a comprehensive 
            tool designed to be both powerful for businesses and incredibly easy for their clients to use.
          </p>
        </section>

        <section className="mb-6 xs:mb-8 sm:mb-12">
          <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold text-primary-dark mb-2 xs:mb-3 sm:mb-4">Why Choose Us?</h2>
          <ul className="list-disc list-inside text-sm xs:text-base sm:text-base text-neutral-dark space-y-2 xs:space-y-2 sm:space-y-3 leading-relaxed pl-2 xs:pl-0">
            <li>
              <span className="font-semibold">User-Friendly Interface:</span> We prioritize simplicity and ease of use for both businesses and their customers.
            </li>
            <li>
              <span className="font-semibold">Flexible & Customizable:</span> Tailor services, schedules, and booking rules to fit your unique business needs.
            </li>
            <li>
              <span className="font-semibold">Multi-Tenant Ready:</span> Perfect for single locations or multi-branch operations with centralized or decentralized management.
            </li>
            <li>
              <span className="font-semibold">Reliable & Secure:</span> We are committed to protecting your data and ensuring our platform is always available when you need it.
            </li>
            <li>
              <span className="font-semibold">Continuous Improvement:</span> We actively listen to user feedback and are dedicated to constantly enhancing BookMeAtOz with new features and improvements.
            </li>
          </ul>
        </section>
        
        {/* Conceptual: Team Section
        <section>
          <h2 className="text-2xl font-semibold text-primary-dark mb-6 text-center">Meet Our Team (Conceptual)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center text-gray-500">Avatar</div>
                <h3 className="text-lg font-medium text-neutral-darkest">Team Member {i}</h3>
                <p className="text-sm text-primary">Role/Title</p>
              </div>
            ))}
          </div>
        </section>
        */}
      </div>
    </div>
  );
};

export default AboutPage;
