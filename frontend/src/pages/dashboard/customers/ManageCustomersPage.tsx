import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import apiService from '@/services/apiService';
import { Customer, ApiErrorResponse, PERMISSIONS, PaginatedResponse } from '@/types';

// Placeholder Components (would be in separate files)
const CustomerList: React.FC<{
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  canManage: boolean;
}> = ({ customers, onEdit, onDelete, canManage }) => (
  <div className="mt-6 bg-white shadow sm:rounded-lg">
    <ul role="list" className="divide-y divide-gray-200">
      {customers.length === 0 && <li className="p-4 text-center text-gray-500">No customers found.</li>}
      {customers.map((customer) => (
        <li key={customer.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-primary-dark truncate">{customer.name}</p>
              <p className="text-xs text-gray-500 truncate">{customer.email} {customer.phone && `- ${customer.phone}`}</p>
            </div>
            {canManage && (
              <div className="ml-2 flex-shrink-0 flex space-x-2">
                 <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800' :
                    customer.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>{customer.status}</p>
                <button onClick={() => onEdit(customer)} className="text-xs font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                <button onClick={() => onDelete(customer.id)} className="text-xs font-medium text-red-600 hover:text-red-900">Delete</button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const CustomerFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<Omit<Customer, 'id'|'business_id'|'created_at'|'updated_at'>>) => Promise<void>;
  initialData?: Customer | null;
}> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<Omit<Customer, 'id'|'business_id'|'created_at'|'updated_at'>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ? 
        { 
          name: initialData.name, 
          email: initialData.email, 
          phone: initialData.phone, 
          profile_notes: initialData.profile_notes, 
          status: initialData.status,
          user_id: initialData.user_id, // Keep user_id if editing
          settings: initialData.settings,
        } : 
        { name: '', email: '', phone: '', profile_notes: '', status: 'active' }
      );
      setError(null);
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (apiError: any) {
      setError(apiError.message || 'Failed to save customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{initialData ? 'Edit Customer' : 'Add New Customer'}</h3>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
            <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
           <div>
            <label htmlFor="profile_notes" className="block text-sm font-medium text-gray-700">Notes (Internal)</label>
            <textarea name="profile_notes" id="profile_notes" value={formData.profile_notes || ''} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" id="status" value={formData.status || 'active'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>
          {/* user_id is usually not manually set/edited in a simple form like this unless specific logic for linking exists */}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark border border-transparent rounded-md shadow-sm disabled:opacity-50">
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Main Page Component ---
const ManageCustomersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { businessInfo, isLoadingTenant } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const canManageCustomers = hasPermission(PERMISSIONS.MANAGE_CUSTOMERS);

  const fetchCustomers = useCallback(async (page = 1, search = '') => {
    if (!businessInfo?.id || !canManageCustomers) return;
    setIsLoadingCustomers(true);
    setError(null);
    try {
      const response = await apiService.get<PaginatedResponse<Customer>>(
        `/customers?page=${page}&limit=10&searchTerm=${encodeURIComponent(search)}` // Add status filter if needed
      );
      setCustomers(response.data?.data || []);
      setTotalCustomers(response.data?.pagination?.total || 0);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setCurrentPage(response.data?.pagination?.page || 1);
    } catch (err: any) {
      setError((err as ApiErrorResponse).message || 'Failed to load customers.');
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [businessInfo?.id, canManageCustomers]);

  useEffect(() => {
    if (businessInfo?.id) {
      if (canManageCustomers) {
        fetchCustomers(currentPage, searchTerm);
      } else {
        setError("You don't have permission to manage customers.");
        setCustomers([]);
      }
    }
  }, [businessInfo?.id, fetchCustomers, canManageCustomers, currentPage, searchTerm]);
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Optionally debounce this or fetch on submit
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchCustomers(1, searchTerm);
  };


  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!businessInfo?.id) return;
    if (!window.confirm('Are you sure you want to delete this customer? This may affect their booking history.')) return;
    try {
      await apiService.delete(`/customers/${customerId}`);
      fetchCustomers(currentPage, searchTerm); // Refresh list
      // Show success notification
    } catch (err: any) {
      setError((err as ApiErrorResponse).message || 'Failed to delete customer.');
    }
  };

  const handleFormSubmit = async (formData: Partial<Omit<Customer, 'id'|'business_id'|'created_at'|'updated_at'>>) => {
    if (!businessInfo?.id) throw new AppError('Business context not found', 400);
    try {
      if (editingCustomer) {
        await apiService.put<Partial<Customer>, Customer>(`/customers/${editingCustomer.id}`, formData);
      } else {
        await apiService.post<Partial<Customer>, Customer>('/customers', formData);
      }
      fetchCustomers(editingCustomer ? currentPage : 1, searchTerm); // Refresh, go to page 1 if new
      setIsModalOpen(false);
      setEditingCustomer(null);
      // Show success
    } catch (err) {
      throw err; // Re-throw for modal to display error
    }
  };

  if (isLoadingTenant) return <div className="p-6"><p>Loading business information...</p></div>;
  if (!businessInfo) return <div className="p-6 text-red-500">No business context. Select a business.</div>;
  if (!canManageCustomers) return <div className="p-6 text-orange-500">No permission to manage customers.</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Customers for {businessInfo.name}</h1>
        <button onClick={handleAddCustomer} className="btn btn-primary w-full sm:w-auto">Add Customer</button>
      </div>
      
      <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
        <input 
          type="text" 
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {isLoadingCustomers ? <p>Loading customers...</p> : (
        <>
          <CustomerList
            customers={customers}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            canManage={canManageCustomers}
          />
          {totalCustomers > 0 && (
            <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
              <p>Showing {customers.length} of {totalCustomers} customers</p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50">Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingCustomer}
      />
    </div>
  );
};

export default ManageCustomersPage;
