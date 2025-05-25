import React from 'react';
// import { EmployeeDetails } from '@/types'; // Replaced with EmployeeProfile
import { EmployeeProfile } from '@/types';
import { useFetchEmployees } from '@/hooks/employee.hooks'; // Added import

interface EmployeeSelectorProps {
  // employees: EmployeeDetails[]; // Removed
  serviceId?: string | null; // Added prop
  onSelectEmployee: (employeeId: string) => void;
  selectedEmployeeId?: string;
  allowAny?: boolean;
  disabled?: boolean;
  // isLoading?: boolean; // Removed
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ serviceId, onSelectEmployee, selectedEmployeeId, allowAny = true, disabled }) => {
  const { data: employeesData, isLoading, isError, error } = useFetchEmployees({ serviceId: serviceId || undefined }); // Added hook call
  const employees = employeesData?.data || [];

  if (isLoading) {
     return (
      <div className="mb-6">
        <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">2. Select an Employee (Optional):</label>
        <div className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500">
          Loading staff...
        </div>
      </div>
    );
  }
  
  // Don't render if no specific employees and "Any Available" is the only or default choice handled by parent
  if (!serviceId) { // If no service is selected, don't show employee selector or show a message
    return (
      <div className="mb-6">
        <label htmlFor="employee" className="block text-sm font-medium text-gray-400 mb-1">2. Select an Employee (Optional):</label>
        <div className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50 text-gray-400">
          Please select a service first.
        </div>
      </div>
    );
  }
  
  if (!allowAny && employees.length === 0 && !isLoading) return null;


  return (
    <div className="mb-6">
      <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">2. Select an Employee (Optional):</label>
      <select
        id="employee"
        name="employee"
        value={selectedEmployeeId || ''}
        onChange={(e) => onSelectEmployee(e.target.value)}
        disabled={disabled || isLoading || (employees.length === 0 && !allowAny)} // Added isLoading
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {allowAny && <option value="">Any Available</option>}
        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      {isError && <p className="text-xs text-red-500 mt-1">Error loading staff: {error?.message}</p>}
      {employees.length === 0 && !isLoading && !isError && allowAny && <p className="text-xs text-gray-500 mt-1">No specific staff members available for this service, 'Any Available' can be used.</p>}
      {employees.length === 0 && !isLoading && !isError && !allowAny && <p className="text-xs text-gray-500 mt-1">No specific staff members available for this service.</p>}
    </div>
  );
};

export default EmployeeSelector;
