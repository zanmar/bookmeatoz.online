import React, { useState, Fragment } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext'; // To display current business/tenant
import Spinner from '@/components/common/Spinner'; // Assuming you have this

// Icons (replace with actual icons from a library like Lucide-React or Heroicons)
const HomeIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ServicesIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>;
const EmployeesIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CustomersIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const BookingsIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const SettingsIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const MenuIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloseIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;


interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
  roles?: string[]; // Roles that can see this item
  permissions?: string[]; // Permissions required for this item
}

const navigationItems: NavItem[] = [
  { name: 'Dashboard', to: '/dashboard', icon: HomeIcon },
  { name: 'Bookings', to: 'bookings', icon: BookingsIcon, roles: ['business_owner', 'manager', 'employee', 'tenant_admin', 'system_admin'] },
  { name: 'Services', to: 'services', icon: ServicesIcon, roles: ['business_owner', 'manager', 'tenant_admin', 'system_admin'] },
  { name: 'Employees', to: 'employees', icon: EmployeesIcon, roles: ['business_owner', 'manager', 'tenant_admin', 'system_admin'] },
  { name: 'Customers', to: 'customers', icon: CustomersIcon, roles: ['business_owner', 'manager', 'tenant_admin', 'system_admin'] },
  { name: 'Business Settings', to: 'business-settings', icon: SettingsIcon, roles: ['business_owner', 'tenant_admin', 'system_admin'] },
  // Add more items like "My Schedule" for employees, "Tenant Admin", "System Admin" sections
];


const DashboardLayout: React.FC = () => {
  const { user, logout, hasRole, hasPermission } = useAuth();
  const { businessInfo, tenantInfo } = useTenant();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate('/login'); // Redirect to login after logout
    setIsLoggingOut(false);
  };

  const userCanView = (item: NavItem): boolean => {
    if (!item.roles && !item.permissions) return true; // Public if no restrictions
    let roleMatch = true;
    if (item.roles) {
      roleMatch = hasRole(item.roles as any); // Cast as any if UserRole type is stricter
    }
    // let permissionMatch = true;
    // if (item.permissions) {
    //   permissionMatch = hasPermission(item.permissions);
    // }
    return roleMatch; // && permissionMatch; // Combine if using permissions too
  };
  
  const visibleNavigationItems = navigationItems.filter(userCanView);


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-neutral-darkest text-gray-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0`}>
        <div className="flex items-center justify-center h-20 border-b border-neutral-dark/50">
           <Link to="/dashboard" className="flex items-center space-x-2">
            <img 
                className="h-8 w-auto" 
                src="/logo-placeholder-white.svg" // Replace with your white/inverted logo
                alt="BookMeAtOz" 
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/150x40/0f172a/white?text=BookMeAtOz&font=Inter')}
            />
           </Link>
        </div>
        <nav className="mt-6 flex-1 px-2 space-y-1">
          {visibleNavigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/dashboard'} // `end` prop for exact match on base dashboard link
              className={({ isActive }) =>
                `group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                ${isActive
                  ? 'bg-primary-dark text-white shadow-lg'
                  : 'text-gray-300 hover:bg-neutral-dark hover:text-white'}`
              }
              onClick={() => sidebarOpen && setSidebarOpen(false)} // Close sidebar on mobile nav click
            >
              <item.icon aria-hidden="true" className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} />
              {item.name}
            </NavLink>
          ))}
        </nav>
         <div className="mt-auto p-4 border-t border-neutral-dark/50">
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:bg-red-700 hover:text-white transition-colors disabled:opacity-50"
            >
                {isLoggingOut ? 
                    <Spinner size="h-5 w-5 mr-3" color="text-gray-300" /> : 
                    <LogoutIcon aria-hidden="true" className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                }
                {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  type="button"
                  className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <MenuIcon />
                </button>
                <div className="ml-2 md:ml-0 text-sm text-gray-600">
                  {businessInfo ? (
                    <span>Current Business: <span className="font-semibold text-primary-dark">{businessInfo.name}</span></span>
                  ) : tenantInfo ? (
                     <span>Tenant: <span className="font-semibold text-primary-dark">{tenantInfo.name}</span></span>
                  ) : (
                    <span>BookMeAtOz Dashboard</span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {/* Profile dropdown or user name */}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  Hello, {user?.profile?.name || user?.email || 'User'}
                </span>
                {/* Add notifications icon, etc. */}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet /> {/* Where nested dashboard pages will render */}
        </main>
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}
    </div>
  );
};

export default DashboardLayout;
