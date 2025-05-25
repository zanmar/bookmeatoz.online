// /var/www/bookmeatoz.online_ts/frontend/src/hooks/business.hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/services/apiService';
import { BusinessProfile, UpdateBusinessSettingsDto, ApiErrorResponse } from '@/types';
import { queryKeys } from '@/config/queryKeys';
import { useTenant } from '@/contexts/TenantContext';
import toast from '@/utils/toast';

// Hook to fetch current business details (including settings)
// Assumes backend endpoint /businesses/current or /businesses/:id returns BusinessProfile
export const useCurrentBusinessProfile = () => {
  const { businessInfo } = useTenant(); // Get current businessId from tenant context
  const businessId = businessInfo?.id;

  return useQuery<BusinessProfile, ApiErrorResponse>({
    queryKey: queryKeys.businesses.detail(businessId), // Or a more specific key like queryKeys.businesses.settings(businessId)
    queryFn: async () => {
      if (!businessId) throw new Error("No active business context to fetch settings.");
      // Assuming backend provides an endpoint to get full business profile including settings
      // This might be the same as the general business detail endpoint
      const response = await apiService.get<BusinessProfile>(`/businesses/${businessId}/profile`); // Or just `/businesses/${businessId}`
      if (!response.data.data) throw new Error("Business profile not found or API response malformed.");
      return response.data.data;
    },
    enabled: !!businessId, // Only run if businessId is available
    staleTime: 1000 * 60 * 15, // Settings might not change too often, 15 mins stale time
  });
};

// Hook for updating business settings
export const useUpdateBusinessSettings = () => {
  const queryClient = useQueryClient();
  const { businessInfo } = useTenant();
  const businessId = businessInfo?.id;

  return useMutation<BusinessProfile, ApiErrorResponse, UpdateBusinessSettingsDto, { previousSettings?: BusinessProfile }>(
    async (settingsData: UpdateBusinessSettingsDto) => {
      if (!businessId) throw new Error("No active business context to update settings.");
      // Assuming backend has an endpoint like PUT /businesses/:id/settings or just PUT /businesses/:id
      const response = await apiService.put<UpdateBusinessSettingsDto, BusinessProfile>(`/businesses/${businessId}/settings`, settingsData);
      if (!response.data.data) throw new Error("Failed to update business settings or API response malformed.");
      return response.data.data;
    },
    {
      onMutate: async (newSettingsData) => {
        const settingsQueryKey = queryKeys.businesses.detail(businessId); // Or settings specific key
        await queryClient.cancelQueries({ queryKey: settingsQueryKey });
        const previousSettings = queryClient.getQueryData<BusinessProfile>(settingsQueryKey);
        
        if (previousSettings) {
          queryClient.setQueryData<BusinessProfile>(settingsQueryKey, {
            ...previousSettings,
            ...newSettingsData, // Optimistically update general fields
            settings: { // Merge settings object
                ...(previousSettings.settings || {}),
                ...newSettingsData // If newSettingsData contains the full settings object or partial
            }
          });
        }
        return { previousSettings };
      },
      onError: (err, newData, context) => {
        if (context?.previousSettings) {
          queryClient.setQueryData(queryKeys.businesses.detail(businessId), context.previousSettings);
        }
        toast.error(`Failed to update settings: ${err.message || 'Unknown error'}`);
      },
      onSuccess: (data) => {
        toast.success("Business settings updated successfully!");
        // Invalidate and refetch to ensure consistency, or just set data if optimistic update is perfect
        queryClient.setQueryData(queryKeys.businesses.detail(businessId), data);
        // If business name/slug changes, tenant context might need an update too
        // queryClient.invalidateQueries({ queryKey: queryKeys.tenants.current() }); // If tenant context holds business name
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.businesses.detail(businessId) });
      },
    }
  );
};
