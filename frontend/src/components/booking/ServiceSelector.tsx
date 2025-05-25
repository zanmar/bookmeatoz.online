import React from 'react';
import { Service } from '@/types';
import { useServices } from '@/hooks/services.hooks'; // Added import

interface ServiceSelectorProps {
  // services: Service[]; // Removed
  onSelectService: (serviceId: string) => void;
  selectedServiceId?: string;
  disabled?: boolean;
  // isLoading?: boolean; // Removed
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onSelectService, selectedServiceId, disabled }) => {
  const { data: servicesData, isLoading, isError, error } = useServices({ is_active: true, limit: 100 }); // Added hook call
  const services = servicesData?.data || [];

  if (isLoading) {
    return (
      <div className="mb-6">
        <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">1. Select a Service:</label>
        <div className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500">
          Loading services...
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">1. Select a Service:</label>
      <select
        id="service"
        name="service"
        value={selectedServiceId || ''}
        onChange={(e) => onSelectService(e.target.value)}
        disabled={disabled || isLoading || services.length === 0} // Added isLoading to disabled state
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="" disabled>-- Choose a service --</option>
        {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min) - {s.currency} {s.price.toFixed(2)}</option>)}
      </select>
      {isError && <p className="text-xs text-red-500 mt-1">Error loading services: {error?.message}</p>}
      {services.length === 0 && !isLoading && !isError && <p className="text-xs text-gray-500 mt-1">No services available for booking at the moment.</p>}
    </div>
  );
};

export default ServiceSelector;
