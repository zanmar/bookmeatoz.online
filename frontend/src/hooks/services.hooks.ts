import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import apiService from '@/services/apiService';
import { Service, ApiSuccessResponse, PaginatedResponse, CreateServiceDto, UpdateServiceDto } from '@/types'; // Define DTOs
import { queryKeys } from '@/config/queryKeys';
import { useTenant } from '@/contexts/TenantContext'; // To get current businessId

// --- DTOs for Service (assuming they are or will be in @/types) ---
// export interface CreateServiceDto extends Omit<Service, 'id' | 'business_id' | 'created_at' | 'updated_at'> {}
// export interface UpdateServiceDto extends Partial<CreateServiceDto> {}


// Hook to fetch a list of services for the current business
export const useServices = (filters?: Record<string, any>, pagination?: { page: number; limit: number }) => {
  const { businessInfo } = useTenant();
  const businessId = businessInfo?.id;

  // Construct a stable query key that includes businessId, filters, and pagination
  const key = queryKeys.services.list(businessId, { ...filters, ...pagination });

  return useQuery<PaginatedResponse<Service>, Error>({
    queryKey: key,
    queryFn: async () => {
      if (!businessId) throw new Error("Business context not available to fetch services.");
      // API endpoint for services should be contextualized by businessId on the backend
      // or accept businessId as a param if not using a contextualized base URL.
      // Assuming backend route is /services and it uses req.businessId from middleware
      const response = await apiService.get<PaginatedResponse<Service>>('/services', { 
        params: { ...filters, ...pagination } 
      });
      return response.data.data || { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }; // Ensure data field exists
    },
    enabled: !!businessId, // Only run query if businessId is available
    // keepPreviousData: true, // Useful for pagination to keep showing old data while new loads
  });
};

// Hook to fetch a single service by its ID for the current business
export const useService = (serviceId: string | null | undefined) => {
  const { businessInfo } = useTenant();
  const businessId = businessInfo?.id;
  const key = queryKeys.services.detail(businessId, serviceId || '');

  return useQuery<Service, Error>({
    queryKey: key,
    queryFn: async () => {
      if (!businessId || !serviceId) throw new Error("Business ID or Service ID is missing.");
      // Backend route /services/:serviceId should use req.businessId from middleware
      const response = await apiService.get<Service>(`/services/${serviceId}`);
      if (!response.data.data) throw new Error("Service not found or API response malformed.");
      return response.data.data;
    },
    enabled: !!businessId && !!serviceId, // Only run if both IDs are available
  });
};

// Hook for creating a new service
export const useCreateService = () => {
  const queryClient = useQueryClient();
  const { businessInfo } = useTenant();
  const businessId = businessInfo?.id;

  return useMutation<Service, Error, CreateServiceDto, { previousServices?: PaginatedResponse<Service> | Service[] }>(
    async (newServiceData: CreateServiceDto) => {
      if (!businessId) throw new Error("Business context not available for creating service.");
      // Backend route /services (POST) should use req.businessId from middleware
      const response = await apiService.post<CreateServiceDto, Service>('/services', newServiceData);
      if (!response.data.data) throw new Error("Failed to create service or API response malformed.");
      return response.data.data;
    },
    {
      onMutate: async (newServiceData) => {
        // Optimistic Update: Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ queryKey: queryKeys.services.lists(businessId) });

        // Snapshot the previous value
        const previousServices = queryClient.getQueryData<PaginatedResponse<Service>>(queryKeys.services.list(businessId));
        
        // Optimistically update to the new value
        if (previousServices) {
          // This is a simplified optimistic update. For lists, it's harder.
          // You might add a placeholder or just invalidate and refetch.
          // For now, let's just log it. A common pattern is to add to the list immediately.
          // queryClient.setQueryData<PaginatedResponse<Service>>(queryKeys.services.list(businessId), (old) => 
          //   old ? { ...old, data: [...old.data, { ...newServiceData, id: 'temp-id', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), business_id: businessId } as Service] } : old
          // );
        }
        return { previousServices };
      },
      onError: (err, newServiceData, context) => {
        // Rollback on error
        if (context?.previousServices) {
          queryClient.setQueryData(queryKeys.services.list(businessId), context.previousServices);
        }
        toast.error(`Failed to create service: ${(err as ApiErrorResponse).message || 'Unknown error'}`);
      },
      onSettled: () => {
        // Always refetch after error or success to ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.services.lists(businessId) });
      },
      onSuccess: (data) => {
        toast.success(`Service "${data.name}" created successfully!`);
        // Optionally, update cache directly if you have the full list structure
        // queryClient.setQueryData(queryKeys.services.list(businessId), (oldData: PaginatedResponse<Service> | undefined) => { ... add newItem ... });
      }
    }
  );
};

// Hook for updating an existing service
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  const { businessInfo } = useTenant();
  const businessId = businessInfo?.id;

  return useMutation<Service, Error, { serviceId: string; data: UpdateServiceDto }, { previousService?: Service, previousServicesList?: PaginatedResponse<Service> | Service[] }>(
    async ({ serviceId, data }) => {
      if (!businessId) throw new Error("Business context not available for updating service.");
      const response = await apiService.put<UpdateServiceDto, Service>(`/services/${serviceId}`, data);
      if (!response.data.data) throw new Error("Failed to update service or API response malformed.");
      return response.data.data;
    },
    {
      onMutate: async (updatedServiceData) => {
        const { serviceId, data: newServiceDetails } = updatedServiceData;
        const serviceDetailKey = queryKeys.services.detail(businessId, serviceId);
        const servicesListKey = queryKeys.services.list(businessId);

        await queryClient.cancelQueries({ queryKey: serviceDetailKey });
        await queryClient.cancelQueries({ queryKey: servicesListKey });

        const previousService = queryClient.getQueryData<Service>(serviceDetailKey);
        const previousServicesList = queryClient.getQueryData<PaginatedResponse<Service>>(servicesListKey);

        // Optimistically update the specific service detail
        if (previousService) {
          queryClient.setQueryData<Service>(serviceDetailKey, { ...previousService, ...newServiceDetails });
        }
        // Optimistically update the service in the list
        if (previousServicesList) {
            queryClient.setQueryData<PaginatedResponse<Service>>(servicesListKey, old => ({
                ...(old || { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
                data: (old?.data || []).map(s => s.id === serviceId ? { ...s, ...newServiceDetails } : s),
            }));
        }
        return { previousService, previousServicesList };
      },
      onError: (err, variables, context) => {
        if (context?.previousService) {
          queryClient.setQueryData(queryKeys.services.detail(businessId, variables.serviceId), context.previousService);
        }
        if (context?.previousServicesList) {
          queryClient.setQueryData(queryKeys.services.list(businessId), context.previousServicesList);
        }
        toast.error(`Failed to update service: ${(err as ApiErrorResponse).message || 'Unknown error'}`);
      },
      onSettled: (data, error, variables) => {
        // Invalidate both the specific service detail and the list to refetch fresh data
        queryClient.invalidateQueries({ queryKey: queryKeys.services.detail(businessId, variables.serviceId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.services.lists(businessId) });
      },
      onSuccess: (data) => {
         toast.success(`Service "${data.name}" updated successfully!`);
      }
    }
  );
};

// Hook for deleting a service
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  const { businessInfo } = useTenant();
  const businessId = businessInfo?.id;

  return useMutation<ApiSuccessResponse, Error, string, { previousServices?: PaginatedResponse<Service> | Service[] }>( // string is serviceId
    async (serviceId: string) => {
      if (!businessId) throw new Error("Business context not available for deleting service.");
      const response = await apiService.delete(`/services/${serviceId}`);
      return response.data; // Expects backend to return success:true
    },
    {
      onMutate: async (serviceIdToDelete) => {
        const servicesListKey = queryKeys.services.list(businessId);
        await queryClient.cancelQueries({ queryKey: servicesListKey });
        const previousServices = queryClient.getQueryData<PaginatedResponse<Service>>(servicesListKey);
        if (previousServices) {
            queryClient.setQueryData<PaginatedResponse<Service>>(servicesListKey, old => ({
                ...(old || { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
                data: (old?.data || []).filter(s => s.id !== serviceIdToDelete),
                total: (old?.total || 0) -1,
            }));
        }
        return { previousServices };
      },
      onError: (err, serviceId, context) => {
        if (context?.previousServices) {
          queryClient.setQueryData(queryKeys.services.list(businessId), context.previousServices);
        }
        toast.error(`Failed to delete service: ${(err as ApiErrorResponse).message || 'Unknown error'}`);
      },
      onSettled: () => {
        // Invalidate the list to ensure it's up-to-date
        queryClient.invalidateQueries({ queryKey: queryKeys.services.lists(businessId) });
        // Also invalidate any queries for individual services if one was deleted
        // queryClient.invalidateQueries({ queryKey: queryKeys.services.details(businessId) }); // Broader invalidation
      },
      onSuccess: (data, serviceId) => {
        toast.success(`Service deleted successfully!`);
        // Remove the specific service detail query from cache if it exists
        queryClient.removeQueries({ queryKey: queryKeys.services.detail(businessId, serviceId) });
      }
    }
  );
};
