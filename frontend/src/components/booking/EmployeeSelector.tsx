import React from 'react';
import { EmployeeDetails } from '@/types';

interface EmployeeSelectorProps {
  employees: EmployeeDetails[];
  onSelectEmployee: (employeeId: string) => void;
  selectedEmployeeId?: string;
  allowAny?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ employees, onSelectEmployee, selectedEmployeeId, allowAny = true, disabled, isLoading }) => {
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
  if (!allowAny && employees.length === 0) return null;


  return (
    <div className="mb-6">
      <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">2. Select an Employee (Optional):</label>
      <select
        id="employee"
        name="employee"
        value={selectedEmployeeId || ''}
        onChange={(e) => onSelectEmployee(e.target.value)}
        disabled={disabled || (employees.length === 0 && !allowAny)}
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {allowAny && <option value="">Any Available</option>}
        {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.name}</option>)}
      </select>
       {employees.length === 0 && !allowAny && <p className="text-xs text-gray-500 mt-1">No specific staff members available for this service.</p>}
    </div>
  );
};

export default EmployeeSelector;
