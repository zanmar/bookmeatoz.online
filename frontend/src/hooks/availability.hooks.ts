import { useQuery } from '@tanstack/react-query';
import apiService from '@/services/apiService';
import { TimeSlot, AvailabilityQuery as AvailabilityQueryParams } from '@/types';
import { queryKeys } from '@/config/queryKeys';
import { useTenant } from '@/contexts/TenantContext';

export const useFetchAvailableTimeSlots = (params: AvailabilityQueryParams, businessTimezone: string | undefined) => {
  const { businessInfo } = useTenant();
  const businessId = businessInfo?.id;
  const { service_id: serviceId, date, employee_id: employeeId } = params;

  const queryKey = queryKeys.availability.slots(businessId, serviceId, date, employeeId, businessTimezone);

  return useQuery<TimeSlot[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      if (!businessId || !serviceId || !date || !businessTimezone) {
        throw new Error("Missing required parameters: businessId, serviceId, date, or businessTimezone.");
      }
      const apiParams: Record<string, any> = {
        service_id: serviceId,
        date: date,
        timezone: businessTimezone,
      };
      if (employeeId && employeeId !== 'any') {
        apiParams.employee_id = employeeId;
      }
      // Expecting response like { data: TimeSlot[] }
      const response = await apiService.get<{ data: TimeSlot[] }>('/availability/slots', { params: apiParams });
      return response.data.data || [];
    },
    enabled: !!businessId && !!serviceId && !!date && !!businessTimezone,
    // staleTime: 60 * 1000, // Consider 1 minute stale time for availability
  });
};
