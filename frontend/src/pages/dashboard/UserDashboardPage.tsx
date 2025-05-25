// /var/www/bookmeatoz.online_ts/frontend/src/pages/dashboard/UserDashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { PERMISSIONS, Booking, Service, ApiErrorResponse, PaginatedResponse } from '@/types'; // Assuming these types
import { useQuery } from '@tanstack/react-query'; // For fetching upcoming bookings etc.
import apiService from '@/services/apiService';
import { queryKeys } from '@/config/queryKeys';
import Spinner from '@/components/common/Spinner';
import TimeDisplay from '@/components/common/TimeDisplay';

// Placeholder icons
const CalendarPlusIcon = () => <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm11-10h3m-3 4h3m-3 4h3M3 3h18M3 7h18M3 11h18M3 15h18" /></svg>;
const UsersIcon = () => <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CogIcon = () => <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ClipboardListIcon = () => <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;


const UserDashboardPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { businessInfo } = useTenant();

  // Fetch upcoming bookings (example, adjust API endpoint and filters)
  const { data: upcomingBookings, isLoading: isLoadingBookings, error: bookingsError } = useQuery<Booking[], ApiErrorResponse>({
    queryKey: queryKeys.bookings.list(businessInfo?.id, { 
        status: 'confirmed', // or 'pending,confirmed'
        dateFrom: new Date().toISOString().split('T')[0], // From today
        limit: 5, // Show a few
        // Add employeeId: user.employeeId if user is an employee and should only see their bookings
        // Add customerId: user.customerId if user is a customer
    }),
    queryFn: async () => {
      if (!businessInfo?.id) return []; // Or throw, but query will be disabled
      const params: any = { 
        status: 'confirmed', 
        dateFrom: new Date().toISOString().split('T')[0],
        limit: 5,
        sortBy: 'start_time', // Assuming backend supports sorting
        sortOrder: 'asc',
      };
      // If user is an employee and not a manager/owner, only fetch their bookings
      if (user && user.roles?.includes('employee') && !user.roles?.includes('manager') && !user.roles?.includes('business_owner')) {
        // Need to get employees.id from users.id (user.id)
        // This might require another API call or for user object to contain employees.id
        // For now, conceptual: params.employeeId = user.employeeProfileId; 
      }

      const response = await apiService.get<PaginatedResponse<Booking>>(`/bookings`, { params });
      return response.data.data?.data || [];
    },
    enabled: !!businessInfo?.id && (hasPermission(PERMISSIONS.VIEW_ASSIGNED_BOOKINGS) || hasPermission(PERMISSIONS.MANAGE_BOOKINGS)),
  });

  const quickLinks = [
    { name: 'New Booking', to: 'bookings/new', icon: CalendarPlusIcon, permission: PERMISSIONS.CREATE_BOOKINGS }, // Assuming a dedicated new booking page
    { name: 'Manage Bookings', to: 'bookings', icon: ClipboardListIcon, permission: PERMISSIONS.MANAGE_BOOKINGS },
    { name: 'Manage Customers', to: 'customers', icon: UsersIcon, permission: PERMISSIONS.MANAGE_CUSTOMERS },
    { name: 'Business Settings', to: 'business-settings', icon: CogIcon, permission: PERMISSIONS.MANAGE_BUSINESS_SETTINGS },
  ].filter(link => hasPermission(link.permission));


  return (
    <div className="space-y-4 xs:space-y-6 sm:space-y-8 p-3 xs:p-4 sm:p-6">
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Welcome back, {user?.profile?.name || user?.email}!
        </h1>
        {businessInfo && (
          <p className="mt-1 text-sm xs:text-base sm:text-lg text-gray-600">
            You are managing: <span className="font-semibold text-primary-dark">{businessInfo.name}</span>
          </p>
        )}
      </div>

      {/* Quick Actions */}
      {quickLinks.length > 0 && (
        <section>
          <h2 className="text-lg xs:text-xl sm:text-xl font-semibold text-gray-800 mb-2 xs:mb-3 sm:mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-4">
            {quickLinks.map(link => (
              <Link
                key={link.name}
                to={link.to}
                className="bg-white p-3 xs:p-4 sm:p-4 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center text-primary-dark hover:bg-primary-lightest min-h-[44px] touch-manipulation"
              >
                <link.icon />
                <span className="font-medium text-sm xs:text-base sm:text-base">{link.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Bookings Overview */}
      {(hasPermission(PERMISSIONS.VIEW_ASSIGNED_BOOKINGS) || hasPermission(PERMISSIONS.MANAGE_BOOKINGS)) && (
        <section>
          <h2 className="text-lg xs:text-xl sm:text-xl font-semibold text-gray-800 mb-2 xs:mb-3 sm:mb-3">Upcoming Bookings</h2>
          <div className="bg-white p-3 xs:p-4 sm:p-6 shadow rounded-lg">
            {isLoadingBookings && <div className="flex items-center justify-center p-4"><Spinner /> <span className="ml-2 text-sm xs:text-base">Loading upcoming bookings...</span></div>}
            {bookingsError && <p className="text-red-500 text-sm xs:text-base">Error loading bookings: {bookingsError.message}</p>}
            {!isLoadingBookings && !bookingsError && upcomingBookings && upcomingBookings.length === 0 && (
              <p className="text-gray-500 text-center py-4 text-sm xs:text-base">No upcoming confirmed bookings found.</p>
            )}
            {upcomingBookings && upcomingBookings.length > 0 && (
              <ul className="divide-y divide-gray-200">
                {upcomingBookings.map(booking => (
                  <li key={booking.id} className="py-3">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between space-y-2 xs:space-y-0">
                      <div className="flex-1">
                        <p className="text-sm xs:text-sm sm:text-base font-medium text-gray-900">
                          {/* @ts-ignore */}
                          {booking.service_name || 'Service'} with {booking.customer_name || 'Customer'}
                        </p>
                        <p className="text-xs xs:text-xs sm:text-sm text-gray-500">
                          <TimeDisplay utcTime={booking.start_time} format="MMM d, h:mm a" showTimezoneAbbreviation />
                           {/* @ts-ignore */}
                          {booking.employee_name && ` - Staff: ${booking.employee_name}`}
                        </p>
                      </div>
                      <Link to={`bookings/${booking.id}`} className="text-xs xs:text-xs sm:text-sm font-medium text-primary hover:underline touch-manipulation self-start xs:self-center">Details</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
             <div className="mt-4 text-right">
                <Link to="bookings" className="text-sm xs:text-sm sm:text-base font-medium text-primary hover:text-primary-dark touch-manipulation">
                    View All Bookings &rarr;
                </Link>
            </div>
          </div>
        </section>
      )}
      
      {/* Placeholder for Notifications/Alerts */}
      <section>
        <h2 className="text-lg xs:text-xl sm:text-xl font-semibold text-gray-800 mb-2 xs:mb-3 sm:mb-3">Notifications & Alerts</h2>
        <div className="bg-white p-3 xs:p-4 sm:p-6 shadow rounded-lg">
          <p className="text-gray-600 text-sm xs:text-base sm:text-base">Important system alerts or new notifications will appear here.</p>
          <div className="mt-4 p-4 xs:p-6 sm:p-6 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-400">
            <span className="text-xs xs:text-sm sm:text-base">Notifications Area - To be implemented (e.g., using NotificationBell component)</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserDashboardPage;
