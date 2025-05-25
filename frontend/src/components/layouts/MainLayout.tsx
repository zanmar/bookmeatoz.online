// /var/www/bookmeatoz.online_ts/frontend/src/components/layouts/MainLayout.tsx
import React, { useState, Fragment } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Assuming path is correct
import { Transition } from '@headlessui/react'; // For mobile menu transition
import ResponsiveIndicator from '@/components/common/ResponsiveIndicator';
import MobileDebugger from '@/components/common/MobileDebugger';

// Placeholder icons (replace with actual icons from a library like Lucide-React or Heroicons)
const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Services', href: '/services' }, // Public services page
  { name: 'Contact Us', href: '/contact' },
];

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 xs:h-16 sm:h-20">
            {/* Logo */}
            <div className="flex-shrink-0 min-w-0">
              <Link to="/" className="flex items-center space-x-1 xs:space-x-2">
                <img
                  className="h-7 xs:h-8 sm:h-10 w-auto"
                  src="/logo-placeholder.svg"
                  alt="BookMeAtOz"
                  onError={(e) => (e.currentTarget.src = 'https://placehold.co/140x32/06b6d4/white?text=BookMeAtOz&font=Inter')}
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:items-center md:space-x-4 lg:space-x-6 xl:space-x-8">
              {navLinks.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `px-2 lg:px-3 py-2 rounded-md text-sm lg:text-base font-medium transition-colors whitespace-nowrap
                    ${isActive
                      ? 'bg-primary-lightest text-primary-dark'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Auth Buttons / Dashboard Link - Desktop */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3 flex-shrink-0">{isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-3 lg:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm lg:text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors whitespace-nowrap"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-2 lg:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm lg:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors whitespace-nowrap"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-2 lg:px-3 py-2 border border-transparent rounded-md shadow-sm text-sm lg:text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors whitespace-nowrap"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary touch-manipulation"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <Transition
          show={mobileMenuOpen}
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-100 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="md:hidden absolute top-full inset-x-0 z-50 shadow-xl bg-white border-t border-gray-200" id="mobile-menu">
            <div className="px-3 xs:px-4 pt-2 pb-3 space-y-1 sm:px-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {navLinks.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-3 rounded-md text-base font-medium transition-colors touch-manipulation min-h-[44px] flex items-center
                    ${isActive
                      ? 'bg-primary-lightest text-primary-dark'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
            <div className="pt-3 pb-4 border-t border-gray-200 px-3 xs:px-4 sm:px-6">
              <div className="space-y-3">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </Transition>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="bg-neutral-darkest text-neutral-light py-6 xs:py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 text-center">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="xs:col-span-2 lg:col-span-1 text-left xs:text-center lg:text-left">
              <h3 className="text-sm sm:text-base font-semibold text-gray-400 tracking-wider uppercase">BookMeAtOz</h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed">
                Simplifying bookings for businesses and customers.
              </p>
            </div>
            <div className="text-left xs:text-center">
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Quick Links</h3>
              <ul className="mt-2 space-y-1">
                <li><Link to="/about" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">About Us</Link></li>
                <li><Link to="/services" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">Services</Link></li>
                <li><Link to="/contact" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div className="text-left xs:text-center lg:text-center">
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-2 space-y-1">
                <li><Link to="/privacy-policy" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-4 sm:pt-6 border-t border-gray-700">
            <p className="text-xs sm:text-sm text-gray-500">
              &copy; {new Date().getFullYear()} BookMeAtOz.online. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <ResponsiveIndicator />
      <MobileDebugger />
    </div>
  );
};

export default MainLayout;
