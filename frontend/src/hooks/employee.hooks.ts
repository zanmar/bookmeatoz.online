import { useQuery } from '@tanstack/react-query';
import apiService from '@/services/apiService';
import { EmployeeProfile, PaginatedResponse } from '@/types';
import { queryKeys } from '@/config/queryKeys';
import { useTenant } from '@/contexts/TenantContext';

interface FetchEmployeesParams {
  serviceId?: string;
  businessId?: string;
}

export const useFetchEmployees = (params: FetchEmployeesParams = {}) => {
  const { businessInfo } = useTenant();
  const effectiveBusinessId = params.businessId || businessInfo?.id;

  const queryKey = queryKeys.employees.list(effectiveBusinessId, { service_id: params.serviceId, is_active: true, limit: 200 });

  return useQuery<PaginatedResponse<EmployeeProfile>, Error>({
    queryKey: queryKey,
    queryFn: async () => {
      if (!effectiveBusinessId) {
        throw new Error("Business context not available to fetch employees.");
      }
      const apiParams: Record<string, any> = { is_active: true, limit: 200 };
      if (params.serviceId) {
        apiParams.service_id = params.serviceId;
      }
      // business_id is typically handled by backend context based on tenant/subdomain
      const response = await apiService.get<PaginatedResponse<EmployeeProfile>>('/employees', { params: apiParams });
      return response.data.data || { data: [], total: 0, page: 1, limit: 200, totalPages: 1 };
    },
    enabled: !!effectiveBusinessId, // Fetch all active employees if no serviceId, or filter by serviceId if provided
  });
};

export const useEmployee = (employeeId: string | null | undefined) => {
  const { businessInfo } = useTenant();
  const businessId = businessInfo?.id;
  const key = queryKeys.employees.detail(businessId, employeeId || '');

  return useQuery<EmployeeProfile, Error>({
    queryKey: key,
    queryFn: async () => {
      if (!businessId || !employeeId) throw new Error("Business ID or Employee ID is missing.");
      // Ensure the response is correctly typed, expecting { data: EmployeeProfile }
      const response = await apiService.get<{ data: EmployeeProfile }>(`/employees/${employeeId}`);
      if (!response.data.data) throw new Error("Employee not found or API response malformed.");
      return response.data.data;
    },
    enabled: !!businessId && !!employeeId,
  });
};
