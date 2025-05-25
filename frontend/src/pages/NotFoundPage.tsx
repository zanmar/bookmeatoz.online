import React from 'react';

/**
 * NotFoundPage - 404 page for BookMeAtOz
 * See BookMeAtOz Technical Documentation (TypeScript App).md for structure and features.
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <h2 className="text-4xl font-bold mb-4 text-red-600">404 - Page Not Found</h2>
      <p className="text-lg text-gray-700 mb-6 max-w-xl text-center">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <a
        href="/"
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go Home
      </a>
    </div>
  );
};

export default NotFoundPage;
