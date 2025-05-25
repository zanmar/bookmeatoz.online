import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import apiService from '@/services/apiService';
import { Service, ApiErrorResponse, PERMISSIONS } from '@/types/index'; // Assuming PERMISSIONS is exported from types or a constants file

// Placeholder components (to be created)
// import ServiceList from '@/components/dashboard/services/ServiceList';
// import ServiceFormModal from '@/components/dashboard/services/ServiceFormModal';
// import Button from '@/components/common/Button';

// --- Placeholder Components (inlined for now) ---
const ServiceList: React.FC<{ services: Service[], onEdit: (service: Service) => void, onDelete: (serviceId: string) => void, canManage: boolean }> = ({ services, onEdit, onDelete, canManage }) => (
  <div className="mt-6 bg-white shadow sm:rounded-lg">
    <ul role="list" className="divide-y divide-gray-200">
      {services.length === 0 && <li className="p-4 text-center text-gray-500">No services found.</li>}
      {services.map((service) => (
        <li key={service.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-primary-dark truncate">{service.name}</p>
              <p className="text-xs text-gray-500 truncate">{service.description || 'No description'}</p>
            </div>
            <div className="ml-2 flex-shrink-0 flex space-x-2">
              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                {service.currency} {service.price} ({service.duration} min)
              </p>
              {canManage && (
                <>
                  <button
                    onClick={() => onEdit(service)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(service.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
           <div className="mt-1 text-xs text-gray-500">
            Status: <span className={`capitalize font-semibold ${service.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{service.status}</span>
            {service.is_private && <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">Private</span>}
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const ServiceFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<Service>) => Promise<void>;
  initialData?: Service | null;
}> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<Service>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        duration: initialData.duration,
        price: initialData.price,
        currency: initialData.currency || 'USD', // Default currency
        status: initialData.status || 'active',
        settings: initialData.settings || {},
        category_id: initialData.category_id,
        is_private: initialData.is_private || false,
      });
    } else {
      setFormData({ name: '', duration: 30, price: 0, currency: 'USD', status: 'active', is_private: false });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(formData);
      onClose(); // Close modal on successful submission
    } catch (apiError: any) {
      setError(apiError.message || 'Failed to save service.');
      console.error("Service form submission error:", apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          {initialData ? 'Edit Service' : 'Add New Service'}
        </h3>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input type="number" name="duration" id="duration" value={formData.duration || 0} onChange={handleChange} required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
              <input type="number" name="price" id="price" value={formData.price || 0} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
           <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
              <input type="text" name="currency" id="currency" value={formData.currency || 'USD'} onChange={handleChange} required maxLength={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="e.g., USD, EUR" />
            </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" id="status" value={formData.status || 'active'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
           <div className="flex items-center">
            <input id="is_private" name="is_private" type="checkbox" checked={formData.is_private || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <label htmlFor="is_private" className="ml-2 block text-sm text-gray-900">Private Service (not publicly listed)</label>
          </div>
          {/* Add fields for settings (JSON editor or structured fields) and category_id (dropdown) if needed */}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-50">
              {isSubmitting ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const ManageServicesPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { businessInfo, isLoadingTenant } = useTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const canManageServices = hasPermission(PERMISSIONS.MANAGE_SERVICES);

  const fetchServices = useCallback(async () => {
    if (!businessInfo?.id) return;
    setIsLoadingServices(true);
    setError(null);
    try {
      // The backend route for services under current business context is just '/services'
      const response = await apiService.get<Service[]>('/services');
      setServices(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch services:", err);
      setError((err as ApiErrorResponse).message || 'Failed to load services.');
      setServices([]);
    } finally {
      setIsLoadingServices(false);
    }
  }, [businessInfo?.id]);

  useEffect(() => {
    if (businessInfo?.id && canManageServices) { // Or a separate VIEW_SERVICES permission
      fetchServices();
    } else if (businessInfo?.id && !canManageServices) {
        setError("You don't have permission to view services for this business.");
        setServices([]);
    }
  }, [businessInfo?.id, fetchServices, canManageServices]);

  const handleAddService = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!businessInfo?.id) return;
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) return;

    try {
      await apiService.delete(`/services/${serviceId}`);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      // Show success notification
    } catch (err: any) {
      console.error("Failed to delete service:", err);
      setError((err as ApiErrorResponse).message || 'Failed to delete service.');
      // Show error notification
    }
  };

  const handleFormSubmit = async (formData: Partial<Service>) => {
    if (!businessInfo?.id) throw new AppError('Business context not found', 400);

    try {
      if (editingService) {
        // Update existing service
        const response = await apiService.put<Partial<Service>, Service>(`/services/${editingService.id}`, formData);
        setServices(prev => prev.map(s => s.id === editingService.id ? response.data! : s));
      } else {
        // Create new service
        const response = await apiService.post<Partial<Service>, Service>('/services', formData);
        setServices(prev => [...prev, response.data!]);
      }
      setIsModalOpen(false);
      setEditingService(null);
      // Show success notification
    } catch (err) {
      console.error("Failed to save service:", err);
      // Error is handled by modal, but re-throw if page needs to know
      throw err;
    }
  };


  if (isLoadingTenant || (isLoadingServices && services.length === 0)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Manage Services</h1>
        <p>Loading services...</p>
      </div>
    );
  }

  if (!businessInfo) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Manage Services</h1>
        <p className="text-red-500">No business context found. Please ensure you are operating within a business.</p>
      </div>
    );
  }

   if (!canManageServices && !isLoadingServices && services.length === 0 && !error) {
     // If they can't manage, and we haven't loaded services (because fetchServices depends on canManageServices for now)
     // or if loading finished and there's no error but still no services because of permissions.
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Services</h1>
        <p className="text-orange-500">You do not have permission to manage or view services for this business.</p>
      </div>
    );
  }


  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Manage Services for {businessInfo.name}</h1>
        {canManageServices && (
          <button
            onClick={handleAddService}
            className="btn btn-primary" // Using example class from index.css
          >
            Add New Service
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {isLoadingServices ? (
        <p>Loading services list...</p>
      ) : (
        <ServiceList
            services={services}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
            canManage={canManageServices}
        />
      )}

      {canManageServices && (
        <ServiceFormModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingService(null); }}
          onSubmit={handleFormSubmit}
          initialData={editingService}
        />
      )}
    </div>
  );
};

export default ManageServicesPage;
