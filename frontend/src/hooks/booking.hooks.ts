import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/services/apiService';
import { CreateBookingPayload, Booking, ApiErrorResponse } from '@/types';
// import { queryKeys } from '@/config/queryKeys'; // Uncomment if invalidation is needed
import { toast } from 'react-hot-toast';

export const useCreateBooking = () => {
  // const queryClient = useQueryClient(); // Uncomment if invalidation is needed

  return useMutation<Booking, Error, CreateBookingPayload>(
    async (bookingPayload: CreateBookingPayload) => {
      // Assuming the API returns { data: Booking } structure for a successful POST
      const response = await apiService.post<{ data: Booking }>('/bookings', bookingPayload);
      if (!response.data || !response.data.data) { // Check both response.data and response.data.data
        throw new Error("Booking creation failed or API response malformed.");
      }
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        // The component's onSuccess callback (passed to mutate) will handle UI changes like navigation.
        // Generic success feedback can be given here.
        toast.success(`Booking confirmed! ID: ${data.id.substring(0, 8)}... Check your email for details.`);
        
        // Example invalidation (if queryKeys were set up for bookings list):
        // queryClient.invalidateQueries(queryKeys.bookings.lists()); 
        // queryClient.invalidateQueries(queryKeys.availability.all()); // May also want to invalidate availability
      },
      onError: (error: ApiErrorResponse | Error) => {
        // Generic error feedback. Component can use mutation.isError and mutation.error for more specific UI.
        const message = (error as ApiErrorResponse)?.message || 'Failed to create booking. Please try again.';
        toast.error(message);
      },
    }
  );
};
