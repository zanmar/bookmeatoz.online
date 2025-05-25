import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import apiService from '@/services/apiService';
import { Booking, ApiErrorResponse, PERMISSIONS, PaginatedResponse } from '@/types'; // Ensure Booking type is defined

// Placeholder Components
const BookingList: React.FC<{
  bookings: Booking[];
  onUpdateStatus: (bookingId: string, newStatus: Booking['status']) => void;
  canManage: boolean;
}> = ({ bookings, onUpdateStatus, canManage }) => (
  <div className="mt-6 bg-white shadow sm:rounded-lg">
    <ul role="list" className="divide-y divide-gray-200">
      {bookings.length === 0 && <li className="p-4 text-center text-gray-500">No bookings found for the selected criteria.</li>}
      {bookings.map((booking) => (
        <li key={booking.id} className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-dark">
                {/* @ts-ignore (customer_name, service_name, employee_name are from JOIN in backend) */}
                Service: {booking.service_name || booking.service_id} with Customer: {booking.customer_name || booking.customer_id}
              </p>
              <p className="text-xs text-gray-600">
                Time: {new Date(booking.start_time).toLocaleString()} - {new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
              {/* @ts-ignore */}
              {booking.employee_name && <p className="text-xs text-gray-500">With: {booking.employee_name}</p>}
            </div>
            <div className="text-sm">
                Status: <span className={`font-semibold px-2 py-0.5 rounded-full text-xs
                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'cancelled' || booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'}`}>
                    {booking.status}
                </span>
            </div>
          </div>
          {canManage && (
            <div className="mt-2 flex space-x-2">
              {booking.status === 'pending' && (
                <button onClick={() => onUpdateStatus(booking.id, 'confirmed')} className="text-xs btn btn-outline !py-1 !px-2 !border-green-500 !text-green-600 hover:!bg-green-50">Confirm</button>
              )}
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <button onClick={() => onUpdateStatus(booking.id, 'cancelled')} className="text-xs btn btn-outline !py-1 !px-2 !border-red-500 !text-red-600 hover:!bg-red-50">Cancel</button>
              )}
               {booking.status === 'confirmed' && (
                <button onClick={() => onUpdateStatus(booking.id, 'completed')} className="text-xs btn btn-outline !py-1 !px-2 !border-blue-500 !text-blue-600 hover:!bg-blue-50">Mark Completed</button>
              )}
              {/* Add more actions: Reschedule, View Details, No-show */}
            </div>
          )}
        </li>
      ))}
    </ul>
  </div>
);

// --- Main Page Component ---
const ManageBookingsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { businessInfo, isLoadingTenant } = useTenant();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().split('T')[0], // Default to today
    dateTo: '',
    status: '',
    employeeId: '',
  });

  const canManageBookings = hasPermission(PERMISSIONS.MANAGE_BOOKINGS); // Or more granular view/update permissions

  const fetchBookings = useCallback(async (page = 1) => {
    if (!businessInfo?.id || !canManageBookings) return;
    setIsLoadingBookings(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10', // Or make configurable
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.status && { status: filters.status }),
        ...(filters.employeeId && { employeeId: filters.employeeId }),
      });
      const response = await apiService.get<PaginatedResponse<Booking>>(`/bookings?${queryParams.toString()}`);
      setBookings(response.data?.data || []);
      setTotalBookings(response.data?.pagination?.total || 0);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setCurrentPage(response.data?.pagination?.page || 1);
    } catch (err: any) {
      setError((err as ApiErrorResponse).message || 'Failed to load bookings.');
    } finally {
      setIsLoadingBookings(false);
    }
  }, [businessInfo?.id, canManageBookings, filters]);

  useEffect(() => {
    if (businessInfo?.id && canManageBookings) {
      fetchBookings(currentPage);
    } else if (businessInfo?.id && !canManageBookings) {
      setError("You don't have permission to manage bookings.");
      setBookings([]);
    }
  }, [businessInfo?.id, fetchBookings, canManageBookings, currentPage]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new filter
    fetchBookings(1);
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['status']) => {
    if (!confirm(`Are you sure you want to change status to "${newStatus}"?`)) return;
    try {
      await apiService.put(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings(currentPage); // Refresh list
      // Show success notification
    } catch (err: any) {
      setError((err as ApiErrorResponse).message || `Failed to update booking status.`);
    }
  };

  if (isLoadingTenant) return <div className="p-6"><p>Loading business information...</p></div>;
  if (!businessInfo) return <div className="p-6 text-red-500">No business context.</div>;
  if (!canManageBookings) return <div className="p-6 text-orange-500">No permission to manage bookings.</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">Manage Bookings for {businessInfo.name}</h1>
      
      {/* Filters Section */}
      <form onSubmit={handleFilterSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg shadow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">From Date</label>
          <input type="date" name="dateFrom" id="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">To Date</label>
          <input type="date" name="dateTo" id="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" id="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
        {/* Add Employee filter if needed, fetching employees for dropdown */}
        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <button type="submit" className="btn btn-primary w-full">Apply Filters</button>
        </div>
      </form>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {isLoadingBookings ? <p>Loading bookings...</p> : (
        <>
          <BookingList bookings={bookings} onUpdateStatus={handleUpdateStatus} canManage={canManageBookings} />
          {totalBookings > 0 && (
            <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
              <p>Showing {bookings.length} of {totalBookings} bookings</p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50">Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}
      {/* TODO: Add button/modal for staff to create a new booking */}
    </div>
  );
};

export default ManageBookingsPage;
