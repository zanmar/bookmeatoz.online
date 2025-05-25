import React, { useState, useEffect } from 'react'; // Removed useCallback as it's not directly used now
import { useParams } from 'react-router-dom'; // Removed useNavigate as it's not used
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService'; // Keep for slot check
import { 
  // Service, // No longer directly needed as type hint here
  // TimeSlot, // No longer directly needed as type hint here
  CreatePublicBookingDto, Booking, ApiErrorResponse,
  PublicBookingFormSchema, PublicBookingFormData 
} from '@/types';

// TanStack Query Hooks
import { useServices } from '@/hooks/services.hooks';
import { useFetchEmployees } from '@/hooks/employee.hooks';
import { useFetchAvailableTimeSlots } from '@/hooks/availability.hooks';
import { useCreateBooking } from '@/hooks/booking.hooks'; // Import the new hook

// Components
import ServiceSelector from '@/components/booking/ServiceSelector';
import EmployeeSelector from '@/components/booking/EmployeeSelector';
import DatePickerEnhanced from '@/components/booking/DatePickerEnhanced';
import TimeSlotPicker from '@/components/booking/TimeSlotPicker';
import CustomerDetailsForm from '@/components/booking/CustomerDetailsForm';
import Spinner from '@/components/common/Spinner';
import TimeDisplay from '@/components/common/TimeDisplay';
import { useTimezone } from '@/hooks/useTimezone';
import { toast } from 'react-hot-toast';

type BookingStep = 'service' | 'datetime' | 'details' | 'confirmation';

const TenantPublicBookingPage: React.FC = () => {
  const { businessInfo, isLoadingTenant, currentSubdomain } = useTenant();
  const { user: authenticatedUser } = useAuth();
  // const navigate = useNavigate(); // Not currently used
  const { serviceIdFromUrl } = useParams<{ serviceIdFromUrl?: string }>();
  
  const { 
    businessTimezone, 
    userLocalTimezone, 
    formatInBusinessTimezone, 
    // formatInUserLocalTimezone, // Not directly used
  } = useTimezone();

  const { 
    control, 
    watch, 
    setValue, 
    handleSubmit,
    reset: resetForm, 
    formState: { errors, isSubmitting: isFormSubmitting } 
  } = useForm<PublicBookingFormData>({
    resolver: zodResolver(PublicBookingFormSchema),
    defaultValues: {
      serviceId: serviceIdFromUrl || "",
      employeeId: "",
      selectedDate: undefined,
      selectedTimeSlot: "",
      customerDetails: {
        name: authenticatedUser?.profile?.name || authenticatedUser?.email?.split('@')[0] || '',
        email: authenticatedUser?.email || '',
        phone: authenticatedUser?.profile?.phone || '',
        notes: '',
      },
    },
  });

  const watchedServiceId = watch("serviceId");
  const watchedEmployeeId = watch("employeeId");
  const watchedSelectedDate = watch("selectedDate");
  const watchedTimeSlot = watch("selectedTimeSlot"); // Used for conditional rendering

  const [bookingStep, setBookingStep] = useState<BookingStep>(serviceIdFromUrl ? 'datetime' : 'service');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  const createBookingMutation = useCreateBooking(); // Initialize the mutation hook

  useEffect(() => {
    if (authenticatedUser) {
      setValue("customerDetails.name", authenticatedUser.profile?.name || authenticatedUser.email.split('@')[0] || '', { shouldValidate: false });
      setValue("customerDetails.email", authenticatedUser.email || '', { shouldValidate: false });
      setValue("customerDetails.phone", authenticatedUser.profile?.phone || '', { shouldValidate: false });
    }
  }, [authenticatedUser, setValue]);

  const { 
    data: servicesData, 
    // isLoading: isLoadingServices, // Handled by ServiceSelector
    isError: isErrorServices, 
    error: errorServices 
  } = useServices({ is_active: true, limit: 100, businessId: businessInfo?.id }, { enabled: !!businessInfo?.id });

  useEffect(() => {
    if (serviceIdFromUrl && servicesData?.data && !watchedServiceId) {
        const preselectedService = servicesData.data.find(s => s.id === serviceIdFromUrl);
        if (preselectedService) {
            setValue("serviceId", serviceIdFromUrl, { shouldDirty: true });
            setBookingStep('datetime');
        }
    }
  }, [serviceIdFromUrl, servicesData, setValue, watchedServiceId]);

  const { 
    // data: employeesData, // Handled by EmployeeSelector
    // isLoading: isLoadingEmployees, // Handled by EmployeeSelector
    isError: isErrorEmployees, 
    error: errorEmployees 
  } = useFetchEmployees( // Still needed to know if there's an error to display
    { serviceId: watchedServiceId || undefined, businessId: businessInfo?.id }
  );

  const formattedDateForAPI = React.useMemo(() => {
    if (!watchedSelectedDate || !businessTimezone) return undefined;
    return formatInBusinessTimezone(watchedSelectedDate, 'yyyy-MM-dd');
  }, [watchedSelectedDate, businessTimezone, formatInBusinessTimezone]);

  const { 
    data: slotsData, 
    isLoading: isLoadingSlots, 
    isError: isErrorSlots, 
    error: errorSlots,
    refetch: fetchSlots 
  } = useFetchAvailableTimeSlots(
    { 
      service_id: watchedServiceId!, 
      date: formattedDateForAPI!, 
      employee_id: watchedEmployeeId || undefined,
    }, 
    businessTimezone,
  );
  const availableSlots = slotsData || [];

  useEffect(() => {
    if (watchedServiceId && formattedDateForAPI && businessTimezone) {
      // Slots will be fetched automatically by TanStack Query if key parameters change.
      // Manual refetch can be used if needed: fetchSlots();
    }
  }, [watchedServiceId, formattedDateForAPI, businessTimezone]);


  const onFormSubmit: SubmitHandler<PublicBookingFormData> = async (data) => {
    setBookingError(null); // Clear previous errors
    
    if (!data.serviceId || !data.selectedTimeSlot || !businessInfo?.id) {
      setBookingError("Core booking information is missing. Please ensure service, date, and time are selected.");
      toast.error("Core booking information is missing."); // Consider if hook's error toast is enough
      return;
    }

    try {
      // 1. Slot Re-validation
      const slotCheckResponse = await apiService.get<{ isAvailable: boolean }>(
        `/bookings/public/${businessInfo.id}/slot-check`,
        { params: { 
            service_id: data.serviceId, 
            start_time: data.selectedTimeSlot,
            employee_id: data.employeeId || undefined,
          } 
        }
      );
      if (!slotCheckResponse.data?.isAvailable) {
        setBookingError("Sorry, this time slot was just taken. Please select another time.");
        toast.error("Sorry, this time slot was just taken. Please select another time."); 
        setBookingStep('datetime');
        setValue("selectedTimeSlot", ""); // Clear the invalid slot
        fetchSlots(); // Refetch slots for the selected date
        return;
      }

      // 2. Construct Booking Payload
      // Ensure this matches CreateBookingPayload if different from CreatePublicBookingDto
      const bookingPayload: CreatePublicBookingDto = { 
        service_id: data.serviceId,
        employee_id: data.employeeId || undefined,
        start_time: data.selectedTimeSlot,
        customer_name: data.customerDetails.name,
        customer_email: data.customerDetails.email,
        customer_phone: data.customerDetails.phone || undefined,
        notes: data.customerDetails.notes || undefined,
        customer_id: authenticatedUser?.id || undefined,
      };
      
      // 3. Call the mutation from useCreateBooking hook
      createBookingMutation.mutate(bookingPayload, {
        onSuccess: (bookingData) => {
          setBookingSuccess(bookingData); // Set booking success data for UI
          setBookingStep('confirmation'); // Move to confirmation step
          // Reset form to initial state or specific desired state
          resetForm({ 
            serviceId: "", 
            employeeId: "", 
            selectedDate: undefined, 
            selectedTimeSlot: "", 
            customerDetails: { 
              name: authenticatedUser?.profile?.name || '', // Keep prefill for logged-in user
              email: authenticatedUser?.email || '',
              phone: authenticatedUser?.profile?.phone || '',
              notes: '' 
            }
          });
          // Success toast is handled by the useCreateBooking hook's onSuccess
        },
        onError: (error: any) => {
          // The useCreateBooking hook's onError already shows a toast.
          // Set component-level error for display in UI if needed.
          const message = (error as ApiErrorResponse)?.message || 'Booking creation failed. Please try again.';
          setBookingError(message); // Update UI with specific error message
        }
      });

    } catch (slotCheckError: any) { 
      const message = (slotCheckError as ApiErrorResponse)?.message || "Failed to verify slot availability. Please try again.";
      setBookingError(message);
      toast.error(message); 
    }
  };
  
  if (isLoadingTenant && !businessInfo) return <div className="flex items-center justify-center min-h-screen bg-gray-50"><Spinner size="h-12 w-12" color="text-primary" /><p className="ml-3 text-gray-600">Loading business information...</p></div>;
  if (!businessInfo && !isLoadingTenant && currentSubdomain) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg shadow-md max-w-lg mx-auto mt-10">The business '{currentSubdomain}' could not be found or is not active. Please check the web address.</div>;
  if (!businessInfo && !isLoadingTenant && !currentSubdomain) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg shadow-md max-w-lg mx-auto mt-10">This booking page is not directly accessible. Please visit a specific business's booking page.</div>;
  if (!businessInfo?.timezone) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg shadow-md max-w-lg mx-auto mt-10">Business timezone not configured. Booking is unavailable.</div>;

  const servicesForSelector = servicesData?.data || [];
  // const employeesForSelector = employeesData?.data || []; // EmployeeSelector fetches its own data
  const slotsForPicker = availableSlots; 
  const selectedServiceFull = servicesForSelector.find(s => s.id === watchedServiceId);

  // Determine overall disabled state for form elements
  const isProcessing = isFormSubmitting || createBookingMutation.isLoading;

  return (
    <div className="min-h-screen bg-gray-100 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onFormSubmit)} className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 md:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-center text-gray-900 mb-3">Book Your Appointment</h1>
          {businessInfo && <p className="text-center text-gray-600 mb-10">with <span className="font-semibold text-primary-dark">{businessInfo.name}</span></p>}
          
          {bookingError && <div role="alert" className="my-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm shadow-md"><strong className="font-bold">Oops! </strong><span className="block sm:inline ml-1">{bookingError}</span></div>}
          {/* Display errors from TanStack Query hooks if needed */}
          {isErrorServices && <div role="alert" className="my-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm shadow-md">Error loading services: {errorServices?.message}</div>}
          {isErrorEmployees && <div role="alert" className="my-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm shadow-md">Error loading staff: {errorEmployees?.message}</div>}
          {isErrorSlots && <div role="alert" className="my-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm shadow-md">Error loading time slots: {errorSlots?.message}</div>}


          {bookingStep === 'confirmation' && bookingSuccess ? (
            <div className="text-center py-10">
              <svg className="w-20 h-20 text-green-500 mx-auto mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h2 className="text-2xl font-semibold text-green-700 mb-3">Booking Confirmed!</h2>
              <div className="text-gray-700 space-y-1">
                <p>Service: <span className="font-medium">{servicesData?.data?.find(s => s.id === bookingSuccess.service_id)?.name}</span></p>
                <p>Date: <span className="font-medium">{formatInBusinessTimezone(new Date(bookingSuccess.start_time), 'MMMM d, yyyy')}</span></p>
                {bookingSuccess.start_time && businessTimezone && 
                    <p>Time: <TimeDisplay utcTime={bookingSuccess.start_time} targetTimezone={businessTimezone} format="h:mm a" showTimezoneAbbreviation={true} />
                    </p>
                }
              </div>
              <p className="text-gray-500 text-sm mt-3">Booking ID: <span className="font-mono">{bookingSuccess.id.substring(0,13)}...</span></p>
              <p className="mt-6 text-gray-600">A confirmation email will be sent to <span className="font-medium">{bookingSuccess.customer_email}.</span></p>
              <button type="button" onClick={() => { setBookingStep('service'); setBookingSuccess(null); resetForm({ serviceId: "", employeeId: "", selectedDate: undefined, selectedTimeSlot: "", customerDetails: { name: authenticatedUser?.profile?.name || '', email: authenticatedUser?.email || '', phone:authenticatedUser?.profile?.phone || '', notes:'' } }); }} className="mt-8 btn btn-primary py-2.5 px-8 text-base">Book Another Appointment</button>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <Controller
                name="serviceId"
                control={control}
                rules={{ required: "Please select a service" }}
                render={({ field }) => (
                  <ServiceSelector
                    onSelectService={(serviceId) => {
                      field.onChange(serviceId);
                      setValue("employeeId", ""); 
                      setValue("selectedDate", undefined); 
                      setValue("selectedTimeSlot", ""); 
                      setBookingStep('datetime'); 
                    }}
                    selectedServiceId={field.value}
                    disabled={isProcessing || (bookingStep !== 'service' && bookingStep !== 'datetime' && bookingStep !== 'details' )}
                  />
                )}
              />
              {errors.serviceId && <p className="text-xs text-red-600">{errors.serviceId.message}</p>}
              
              {watchedServiceId && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">Date & Time for: <span className="text-primary-dark">{selectedServiceFull?.name}</span></h2>
                  {selectedServiceFull && <p className="text-sm text-gray-500 mb-4">Duration: {selectedServiceFull.duration_minutes} minutes. Price: {selectedServiceFull.currency} {selectedServiceFull.price.toFixed(2)}</p>}

                  <Controller
                    name="employeeId"
                    control={control}
                    render={({ field }) => (
                      <EmployeeSelector
                        serviceId={watchedServiceId} 
                        onSelectEmployee={(employeeId) => {
                          field.onChange(employeeId);
                          setValue("selectedDate", undefined); 
                          setValue("selectedTimeSlot", ""); 
                        }}
                        selectedEmployeeId={field.value}
                        allowAny={true}
                        disabled={isProcessing || !watchedServiceId || (bookingStep !== 'datetime' && bookingStep !== 'details')}
                      />
                    )}
                  />

                  <Controller
                    name="selectedDate"
                    control={control}
                    rules={{ validate: (value) => !!value || "Please select a date" }}
                    render={({ field }) => (
                      <DatePickerEnhanced
                        onSelectDate={(date) => {
                          field.onChange(date);
                          setValue("selectedTimeSlot", ""); 
                        }}
                        selectedDate={field.value}
                        disabled={isProcessing || !watchedServiceId || (bookingStep !== 'datetime' && bookingStep !== 'details')}
                        businessTimezone={businessTimezone}
                      />
                    )}
                  />
                  {errors.selectedDate && <p className="text-xs text-red-600">{errors.selectedDate.message}</p>}
                  
                  <Controller
                    name="selectedTimeSlot"
                    control={control}
                    rules={{ validate: (value) => !!value || "Please select a time slot" }}
                    render={({ field }) => (
                      <TimeSlotPicker
                        slots={slotsForPicker}
                        onSelectSlot={(slot) => {
                          field.onChange(slot.start_time); 
                          setBookingStep('details'); 
                        }}
                        selectedSlotStartTime={field.value}
                        isLoadingSlots={isLoadingSlots}
                        disabled={isProcessing || !watchedServiceId || !watchedSelectedDate || (bookingStep !== 'datetime' && bookingStep !== 'details')}
                      />
                    )}
                  />
                  {errors.selectedTimeSlot && <p className="text-xs text-red-600">{errors.selectedTimeSlot.message}</p>}
                </div>
              )}
              
              {bookingStep === 'details' && watchedServiceId && watchedSelectedDate && watchedTimeSlot && (
                 <div className="mt-8 pt-6 border-t border-gray-200">
                    <CustomerDetailsForm 
                      onSubmit={async () => { /* This onSubmit prop is effectively unused now */ }}
                      disabled={isProcessing} 
                      control={control} 
                      errors={errors.customerDetails} 
                    />
                 </div>
              )}

              {bookingStep === 'details' && watchedServiceId && watchedSelectedDate && watchedTimeSlot && (
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="w-full btn btn-primary py-3 text-base mt-6 disabled:opacity-70 flex items-center justify-center"
                >
                  {isProcessing ? <><Spinner color="text-white" /> Processing...</> : 'Confirm Booking'}
                </button>
              )}
            </div>
          )}
        </form>
         <p className="text-center text-xs text-gray-500 mt-8">Powered by BookMeAtOz.online</p>
      </div>
    </div>
  );
};
export default TenantPublicBookingPage;
