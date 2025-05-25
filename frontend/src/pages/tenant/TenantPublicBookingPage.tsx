import React, { useState, useEffect, useCallback } from 'react';
// ... (other imports: useParams, useNavigate, useTenant, useAuth, apiService, types)
import { Service, EmployeeDetails, TimeSlot, AvailabilityQuery, CreatePublicBookingDto, Booking, ApiErrorResponse } from '@/types';
import ServiceSelector from '@/components/booking/ServiceSelector';
import EmployeeSelector from '@/components/booking/EmployeeSelector';
import DatePickerEnhanced from '@/components/booking/DatePickerEnhanced';
import TimeSlotPicker from '@/components/booking/TimeSlotPicker';
import CustomerDetailsForm from '@/components/booking/CustomerDetailsForm';
import Spinner from '@/components/common/Spinner';
import TimeDisplay from '@/components/common/TimeDisplay'; // Import TimeDisplay
import { useTimezone } from '@/hooks/useTimezone'; // Import useTimezone

// import { format } from 'date-fns'; // No longer needed if using useTimezone for formatting API date string

type BookingStep = 'service' | 'datetime' | 'details' | 'confirmation';

const TenantPublicBookingPage: React.FC = () => {
  const { businessInfo, isLoadingTenant, currentSubdomain } = useTenant();
  const { user: authenticatedUser } = useAuth();
  const navigate = useNavigate();
  const { serviceIdFromUrl } = useParams<{ serviceIdFromUrl?: string }>();
  const { 
    businessTimezone, 
    userLocalTimezone, 
    formatInBusinessTimezone, 
    formatInUserLocalTimezone,
    combineDateAndTimeInBusinessTZToUTC, // For constructing UTC from local parts
  } = useTimezone(); // Use the hook

  // ... (state variables as before) ...
  const [bookingStep, setBookingStep] = useState<BookingStep>('service');
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [employeesForService, setEmployeesForService] = useState<EmployeeDetails[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '' });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // ... (useEffect for customerDetails prefill as before) ...
   useEffect(() => {
    if (authenticatedUser) {
      setCustomerDetails({
        name: authenticatedUser.profile?.name || authenticatedUser.email.split('@')[0] || '',
        email: authenticatedUser.email || '',
        phone: authenticatedUser.profile?.phone || '',
      });
    } else {
        setCustomerDetails({ name: '', email: '', phone: '' });
    }
  }, [authenticatedUser]);

  // ... (useEffect for fetching services as before) ...
  useEffect(() => {
    if (businessInfo?.id) {
      setIsLoadingServices(true); setBookingError(null);
      apiService.get<Service[]>(`/public/services/by-business/${businessInfo.id}?status=active&isPrivate=false`)
        .then(response => {
          setAvailableServices(response.data || []);
          if (serviceIdFromUrl && bookingStep === 'service') { 
            const preselected = response.data?.find(s => s.id === serviceIdFromUrl);
            if (preselected) { setSelectedService(preselected); setBookingStep('datetime'); }
          }
        }).catch(err => { setBookingError("Could not load services."); })
        .finally(() => setIsLoadingServices(false));
    }
  }, [businessInfo?.id, serviceIdFromUrl, bookingStep]);

  // ... (useEffect for fetching employees as before) ...
  useEffect(() => {
    if (selectedService && businessInfo?.id) {
      setIsLoadingEmployees(true); setBookingError(null);
      apiService.get<EmployeeDetails[]>(`/public/employees/by-service/${businessInfo.id}/${selectedService.id}`)
        .then(response => setEmployeesForService(response.data || []))
        .catch(err => { setEmployeesForService([]); })
        .finally(() => setIsLoadingEmployees(false));
    } else { setEmployeesForService([]); }
  }, [selectedService, businessInfo?.id]);


  const fetchSlots = useCallback(async () => {
    if (!selectedService || !selectedDate || !businessInfo?.id || !businessTimezone) {
      setAvailableSlots([]); return;
    }
    setIsLoadingSlots(true); setAvailableSlots([]); setBookingError(null);
    
    // The selectedDate is a JS Date object (midnight local user time).
    // We need 'YYYY-MM-DD' string that represents that calendar day *in the business's timezone*.
    const formattedDateForAPI = formatInBusinessTimezone(selectedDate, 'yyyy-MM-dd');
    if (!formattedDateForAPI) {
        setBookingError("Invalid date or business timezone configuration.");
        setIsLoadingSlots(false);
        return;
    }
    
    const query: AvailabilityQuery = {
      service_id: selectedService.id, date: formattedDateForAPI, 
      employee_id: selectedEmployeeId || undefined,
      // Optionally send client's timezone for backend logging/awareness
      // timezone: userLocalTimezone 
    };
    try {
      const response = await apiService.get<TimeSlot[]>(`/bookings/public/${businessInfo.id}/availability`, { params: query });
      setAvailableSlots(response.data || []);
    } catch (err: any) {
      setBookingError((err as ApiErrorResponse).message || "Could not load available times.");
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedService, selectedDate, selectedEmployeeId, businessInfo?.id, businessTimezone, formatInBusinessTimezone]);

  useEffect(() => {
    if (selectedService && selectedDate && businessInfo?.id && businessTimezone) fetchSlots();
  }, [fetchSlots]); // fetchSlots has its dependencies

  // ... (handleServiceSelect, handleEmployeeSelect, handleDateSelect, handleSlotSelect as before) ...
  const handleServiceSelect = (serviceId: string) => { /* ... */ };
  const handleEmployeeSelect = (employeeId: string) => { /* ... */ };
  const handleDateSelect = (date: Date) => { setSelectedDate(date); setSelectedSlot(null); setAvailableSlots([]); };
  const handleSlotSelect = (slot: TimeSlot) => { setSelectedSlot(slot); setBookingStep('details'); };


  const handleCustomerDetailsSubmit = async (details: { name: string; email: string; phone?: string; notes?: string }) => {
    if (!selectedService || !selectedSlot || !businessInfo?.id || !selectedSlot.start_time) {
      setBookingError("Booking information is incomplete."); return;
    }
    setIsSubmittingBooking(true); setBookingError(null);
    try {
      // Slot re-validation before final booking
      const slotCheckResponse = await apiService.get<{ isAvailable: boolean }>(
        `/bookings/public/${businessInfo.id}/slot-check`,
        { params: { 
            service_id: selectedService.id, 
            start_time: selectedSlot.start_time, // This is already UTC ISO string
            employee_id: selectedSlot.employee_id 
          } 
        }
      );
      if (!slotCheckResponse.data?.isAvailable) {
        setBookingError("Sorry, this time slot was just taken. Please select another time.");
        setIsSubmittingBooking(false); setBookingStep('datetime'); fetchSlots(); return;
      }

      const bookingPayload: CreatePublicBookingDto = {
        service_id: selectedService.id, employee_id: selectedSlot.employee_id,
        start_time: selectedSlot.start_time, // Send UTC ISO string
        customer_name: details.name, customer_email: details.email,
        customer_phone: details.phone, notes: details.notes,
        customer_id: authenticatedUser?.id || '',
      };
      const response = await apiService.post<CreatePublicBookingDto, Booking>('/bookings', bookingPayload);
      setBookingSuccess(response.data!); setBookingStep('confirmation');
      toast.success("Booking confirmed!");
    } catch (err: any) {
      const apiErr = err as ApiErrorResponse;
      setBookingError(apiErr.message || "Failed to create booking.");
      toast.error(apiErr.message || "Booking failed.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };
  
  // ... (renderStepIndicator as before) ...
  const renderStepIndicator = () => { /* ... */ return <nav>...</nav>};


  if (isLoadingTenant && !businessInfo) return <div className="flex items-center justify-center min-h-screen bg-gray-50"><Spinner size="h-12 w-12" color="text-primary" /><p className="ml-3 text-gray-600">Loading business information...</p></div>;
  if (!businessInfo && !isLoadingTenant && currentSubdomain) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg shadow-md max-w-lg mx-auto mt-10">The business '{currentSubdomain}' could not be found or is not active. Please check the web address.</div>;
  if (!businessInfo && !isLoadingTenant && !currentSubdomain) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg shadow-md max-w-lg mx-auto mt-10">This booking page is not directly accessible. Please visit a specific business's booking page.</div>;
  if (!businessInfo?.timezone) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg shadow-md max-w-lg mx-auto mt-10">Business timezone not configured. Booking is unavailable.</div>;


  return (
    <div className="min-h-screen bg-gray-100 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 md:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-center text-gray-900 mb-3">Book Your Appointment</h1>
          {businessInfo && <p className="text-center text-gray-600 mb-10">with <span className="font-semibold text-primary-dark">{businessInfo.name}</span></p>}
          
          {renderStepIndicator()}

          {bookingError && <div role="alert" className="my-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm shadow-md"><strong className="font-bold">Oops! </strong><span className="block sm:inline ml-1">{bookingError}</span></div>}

          {bookingStep === 'confirmation' && bookingSuccess ? (
            <div className="text-center py-10">
              <svg className="w-20 h-20 text-green-500 mx-auto mb-5" /* ... */ ></svg>
              <h2 className="text-2xl font-semibold text-green-700 mb-3">Booking Confirmed!</h2>
              <div className="text-gray-700 space-y-1">
                <p>Service: <span className="font-medium">{selectedService?.name}</span></p>
                <p>Date: <span className="font-medium">{selectedDate && formatInBusinessTimezone(selectedDate, 'MMMM d, yyyy')}</span></p>
                {selectedSlot && 
                    <p>Time: <TimeDisplay utcTime={selectedSlot.start_time} targetTimezone={businessTimezone || userLocalTimezone} format="h:mm a" showTimezoneAbbreviation={true} />
                    </p>
                }
              </div>
              <p className="text-gray-500 text-sm mt-3">Booking ID: <span className="font-mono">{bookingSuccess.id.substring(0,13)}...</span></p>
              <p className="mt-6 text-gray-600">A confirmation email will be sent to <span className="font-medium">{(bookingSuccess as any).customer_email || customerDetails.email}.</span></p>
              <button onClick={() => navigate('/')} className="mt-8 btn btn-primary py-2.5 px-8 text-base">Back to Home</button>
            </div>
          ) : (
            <div className="mt-8">
              <ServiceSelector services={availableServices} onSelectService={handleServiceSelect} selectedServiceId={selectedService?.id} disabled={isSubmittingBooking || bookingStep !== 'service'} isLoading={isLoadingServices}/>
              {bookingStep !== 'service' && selectedService && (
                <div className={`transition-opacity duration-500 ease-in-out ${bookingStep === 'datetime' || bookingStep === 'details' ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">Date & Time for: <span className="text-primary-dark">{selectedService.name}</span></h2>
                    <p className="text-sm text-gray-500 mb-4">Duration: {selectedService.duration} minutes. Price: {selectedService.currency} {selectedService.price.toFixed(2)}</p>
                    <EmployeeSelector employees={employeesForService} onSelectEmployee={handleEmployeeSelect} selectedEmployeeId={selectedEmployeeId} disabled={isSubmittingBooking || bookingStep !== 'datetime'} isLoading={isLoadingEmployees}/>
                    <DatePickerEnhanced onSelectDate={handleDateSelect} selectedDate={selectedDate} disabled={isSubmittingBooking || bookingStep !== 'datetime'} businessTimezone={businessInfo?.timezone} />
                    <TimeSlotPicker slots={availableSlots} onSelectSlot={handleSlotSelect} isLoadingSlots={isLoadingSlots} selectedSlotStartTime={selectedSlot?.start_time} disabled={!selectedDate || isSubmittingBooking || bookingStep !== 'datetime'} businessTimezone={businessInfo?.timezone} />
                  </div>
                </div>
              )}
              {bookingStep === 'details' && selectedSlot && (
                 <div className={`transition-opacity duration-500 ease-in-out ${bookingStep === 'details' ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                    <CustomerDetailsForm onSubmit={handleCustomerDetailsSubmit} initialDetails={customerDetails} isSubmittingBooking={isSubmittingBooking} disabled={isSubmittingBooking} />
                 </div>
              )}
            </div>
          )}
        </div>
         <p className="text-center text-xs text-gray-500 mt-8">Powered by BookMeAtOz.online</p>
      </div>
    </div>
  );
};
export default TenantPublicBookingPage;
