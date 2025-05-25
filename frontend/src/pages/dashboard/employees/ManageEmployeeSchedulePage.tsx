import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import apiService from '@/services/apiService';
import { 
    WorkingHours, 
    EmployeeAvailabilityOverride, 
    EmployeeDetails, 
    ApiErrorResponse, 
    PERMISSIONS,
    WorkingHourInput, 
    AvailabilityOverrideInput
} from '@/types';
import Spinner from '@/components/common/Spinner';
import WeeklyScheduleEditor from '@/components/schedule/WeeklyScheduleEditor';
import AvailabilityOverridesManager from '@/components/schedule/AvailabilityOverridesManager';
import toast from '@/utils/toast'; // Import the toast utility

const ManageEmployeeSchedulePage: React.FC = () => {
  const { employeeIdFromParams } = useParams<{ employeeIdFromParams: string }>();
  const { businessInfo, isLoadingTenant } = useTenant();
  const { hasPermission } = useAuth();

  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [overrides, setOverrides] = useState<EmployeeAvailabilityOverride[]>([]);
  
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null); // Renamed from error for clarity

  const canManageSchedules = hasPermission(PERMISSIONS.MANAGE_SCHEDULES);

  useEffect(() => {
    if (employeeIdFromParams && businessInfo?.id && canManageSchedules) {
      setIsLoadingEmployee(true);
      setPageError(null);
      apiService.get<EmployeeDetails>(`/employees/${employeeIdFromParams}`) 
        .then(response => {
            if (response.data && response.data.business_id === businessInfo.id) {
                setEmployeeDetails(response.data);
            } else if (response.data && response.data.business_id !== businessInfo.id) {
                setPageError("Employee does not belong to the current business context.");
                setEmployeeDetails(null);
            } else {
                 setPageError("Employee not found.");
                 setEmployeeDetails(null);
            }
        })
        .catch(err => {
          console.error("Failed to fetch employee details:", err);
          setPageError("Could not load employee information.");
          setEmployeeDetails(null);
        })
        .finally(() => setIsLoadingEmployee(false));
    } else if (!canManageSchedules && businessInfo?.id) {
        setPageError("You do not have permission to manage schedules.");
        setIsLoadingEmployee(false);
    }
  }, [employeeIdFromParams, businessInfo?.id, canManageSchedules]);

  const fetchWorkingHours = useCallback(async () => {
    if (!employeeIdFromParams || !businessInfo?.id || !canManageSchedules) return;
    setIsLoadingSchedule(true); setPageError(null);
    try {
      const response = await apiService.get<WorkingHours[]>(`/employees/${employeeIdFromParams}/schedule/working-hours`);
      setWorkingHours(response.data || []);
    } catch (err: any) {
      setPageError((err as ApiErrorResponse).message || 'Failed to load working hours.');
      toast.error('Failed to load working hours.');
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [employeeIdFromParams, businessInfo?.id, canManageSchedules]);

  const fetchOverrides = useCallback(async () => {
    if (!employeeIdFromParams || !businessInfo?.id || !canManageSchedules) return;
    setPageError(null);
    try {
      const response = await apiService.get<EmployeeAvailabilityOverride[]>(`/employees/${employeeIdFromParams}/schedule/overrides`);
      setOverrides(response.data || []);
    } catch (err: any) {
      setPageError((err as ApiErrorResponse).message || 'Failed to load availability overrides.');
      toast.error('Failed to load availability overrides.');
    }
  }, [employeeIdFromParams, businessInfo?.id, canManageSchedules]);

  useEffect(() => {
    if (employeeDetails && employeeIdFromParams === employeeDetails.id) {
        fetchWorkingHours();
        fetchOverrides();
    } else if (!isLoadingEmployee && employeeIdFromParams && !employeeDetails && !pageError) {
        setPageError("Employee details could not be loaded, or ID mismatch. Cannot load schedule.");
    }
  }, [employeeDetails, employeeIdFromParams, fetchWorkingHours, fetchOverrides, isLoadingEmployee, pageError]);

  const handleSaveWorkingHours = async (hours: WorkingHourInput[]) => {
    if (!employeeIdFromParams || !businessInfo?.id) return;
    setPageError(null);
    try {
      const response = await apiService.put<SetWorkingHoursDto, WorkingHours[]>(
        `/employees/${employeeIdFromParams}/schedule/working-hours`,
        hours
      );
      setWorkingHours(response.data || []);
      toast.success('Working hours updated successfully!');
    } catch (err: any) {
      const errorMsg = (err as ApiErrorResponse).message || 'Failed to save working hours.';
      setPageError(errorMsg);
      toast.error(errorMsg);
      throw err; 
    }
  };

  const handleAddOverride = async (overrideData: AvailabilityOverrideInput) => {
    if (!employeeIdFromParams || !businessInfo?.id) return;
    setPageError(null);
    try {
      const response = await apiService.post<AvailabilityOverrideInput, EmployeeAvailabilityOverride>(
        `/employees/${employeeIdFromParams}/schedule/overrides`,
        overrideData
      );
      setOverrides(prev => [...prev, response.data!].sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
      toast.success('Availability override added successfully!');
    } catch (err: any) {
      const errorMsg = (err as ApiErrorResponse).message || 'Failed to add override.';
      setPageError(errorMsg);
      toast.error(errorMsg);
      throw err;
    }
  };
  
  const handleUpdateOverride = async (overrideId: string, updateData: Partial<AvailabilityOverrideInput>) => {
    if (!employeeIdFromParams || !businessInfo?.id) return;
    setPageError(null);
    try {
      const response = await apiService.put<Partial<AvailabilityOverrideInput>, EmployeeAvailabilityOverride>(
        `/employees/${employeeIdFromParams}/schedule/overrides/${overrideId}`,
        updateData
      );
      setOverrides(prev => prev.map(ov => ov.id === overrideId ? response.data! : ov)
        .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
      toast.success('Availability override updated successfully!');
    } catch (err: any) {
      const errorMsg = (err as ApiErrorResponse).message || 'Failed to update override.';
      setPageError(errorMsg);
      toast.error(errorMsg);
      throw err;
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    if (!employeeIdFromParams || !businessInfo?.id) return;
    if (!window.confirm("Are you sure you want to delete this availability override?")) return; // Keep confirm for destructive actions
    setPageError(null);
    try {
      await apiService.delete(`/employees/${employeeIdFromParams}/schedule/overrides/${overrideId}`);
      setOverrides(prev => prev.filter(ov => ov.id !== overrideId));
      toast.success('Availability override deleted successfully!');
    } catch (err: any) {
      const errorMsg = (err as ApiErrorResponse).message || 'Failed to delete override.';
      setPageError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // ... (loading states and JSX as before, pageError is used for general page-level errors) ...
  if (isLoadingTenant || isLoadingEmployee) {
    return <div className="p-6 flex justify-center items-center min-h-[300px]"><Spinner size="h-10 w-10" /> <span className="ml-3">Loading employee data...</span></div>;
  }
  if (!businessInfo) {
    return <div className="p-6 text-red-500">Business context not found.</div>;
  }
  if (!canManageSchedules) {
    return <div className="p-6 text-orange-500">You do not have permission to manage schedules.</div>;
  }
  if (!employeeIdFromParams || !employeeDetails) { 
    return <div className="p-6 text-red-500">{pageError || 'Employee not found.'} <Link to="/dashboard/employees" className="text-primary hover:underline">Go back to employees list.</Link></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <Link to="/dashboard/employees" className="text-sm text-primary hover:underline mb-2 inline-block">
          &larr; Back to Employees List
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Manage Schedule for <span className="text-primary-dark">{employeeDetails.name || employeeDetails.email}</span>
        </h1>
        <p className="text-sm text-gray-500">Employee Record ID (employees.id): {employeeDetails.id}</p>
        <p className="text-sm text-gray-500">Business: {businessInfo.name}</p>
      </div>

      {pageError && !isLoadingSchedule && <div role="alert" className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg shadow-md">{pageError}</div>}

      <div className="bg-white p-6 shadow-xl rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Working Hours</h2>
        {(isLoadingSchedule && !workingHours.length) ? (
            <div className="flex justify-center items-center py-8"><Spinner size="h-8 w-8" /><span className="ml-2">Loading working hours...</span></div>
        ) : (
            <WeeklyScheduleEditor
                initialHours={workingHours}
                onSave={handleSaveWorkingHours}
                employeeTimezone={businessInfo.timezone}
            />
        )}
      </div>

      <div className="bg-white p-6 shadow-xl rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Availability Overrides (Time Off / Special Hours)</h2>
         {(isLoadingSchedule && !overrides.length && (!workingHours.length || workingHours.length > 0) ) ? ( 
            <div className="flex justify-center items-center py-8"><Spinner size="h-8 w-8" /><span className="ml-2">Loading overrides...</span></div>
        ) : (
            <AvailabilityOverridesManager
                overrides={overrides}
                onAddOverride={handleAddOverride}
                onUpdateOverride={handleUpdateOverride}
                onDeleteOverride={handleDeleteOverride}
                employeeTimezone={businessInfo.timezone}
            />
        )}
      </div>
    </div>
  );
};

export default ManageEmployeeSchedulePage;
