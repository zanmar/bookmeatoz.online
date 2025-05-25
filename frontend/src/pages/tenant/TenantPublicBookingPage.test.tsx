import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import TenantPublicBookingPage from './TenantPublicBookingPage';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTimezone } from '@/hooks/useTimezone';
import { useServices } from '@/hooks/services.hooks';
import { useFetchEmployees } from '@/hooks/employee.hooks';
import { useFetchAvailableTimeSlots } from '@/hooks/availability.hooks';
import { useCreateBooking } from '@/hooks/booking.hooks';
import apiService from '@/services/apiService'; // For slot check
import { toast } from 'react-hot-toast';
import { Service, EmployeeProfile, TimeSlot, PaginatedResponse, Booking } from '@/types';

// --- Mocks ---
vi.mock('@/contexts/TenantContext');
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useTimezone');
vi.mock('@/hooks/services.hooks');
vi.mock('@/hooks/employee.hooks');
vi.mock('@/hooks/availability.hooks');
vi.mock('@/hooks/booking.hooks');
vi.mock('@/services/apiService');
vi.mock('react-hot-toast');

// Mock react-datepicker (simplified)
vi.mock('react-datepicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockDatePicker = React.forwardRef(({ selected, onChange, placeholderText, id }: any, ref: any) => (
    <input
      ref={ref}
      id={id}
      value={selected ? selected.toISOString().split('T')[0] : ''} // Format as YYYY-MM-DD for input value
      onChange={(e) => onChange(new Date(e.target.value))} // Pass new Date based on input
      placeholder={placeholderText}
      data-testid={`mock-datepicker-${id || 'datepicker'}`}
    />
  ));
  MockDatePicker.displayName = 'MockDatePicker';
  return { default: MockDatePicker };
});


// --- Test Setup ---
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity }, // Disable retries and keep data fresh for tests
    mutations: { retry: false },
  },
});

const AllTheProviders: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ children, initialEntries = ['/'] }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<>{children}</>} />
          <Route path="/service/:serviceIdFromUrl" element={<>{children}</>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// --- Mock Data ---
const mockBusinessId = 'biz-123';
const mockBusinessTimezone = 'America/New_York';
const mockService1: Service = { id: 's1', name: 'Consultation', duration_minutes: 60, price: 100, currency: 'USD', business_id: mockBusinessId, is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' };
const mockService2: Service = { id: 's2', name: 'Follow-up', duration_minutes: 30, price: 50, currency: 'USD', business_id: mockBusinessId, is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' };
const mockServicesResponse: PaginatedResponse<Service> = { data: [mockService1, mockService2], total: 2, page: 1, limit: 10, totalPages: 1 };

const mockEmployee1: EmployeeProfile = { id: 'emp1', name: 'Dr. Smith', user_id: 'u1', business_id: mockBusinessId, email: 'smith@example.com' };
const mockEmployee2: EmployeeProfile = { id: 'emp2', name: 'Dr. Jones', user_id: 'u2', business_id: mockBusinessId, email: 'jones@example.com' };
const mockEmployeesResponse: PaginatedResponse<EmployeeProfile> = { data: [mockEmployee1, mockEmployee2], total: 2, page: 1, limit: 10, totalPages: 1 };

const mockAvailableSlots: TimeSlot[] = [
  { start_time: '2024-08-15T14:00:00Z', end_time: '2024-08-15T15:00:00Z', is_available: true, employee_id: 'emp1' },
  { start_time: '2024-08-15T15:00:00Z', end_time: '2024-08-15T16:00:00Z', is_available: true, employee_id: 'emp2' },
];

const mockBooking: Booking = {
  id: 'booking-123',
  service_id: mockService1.id,
  employee_id: mockEmployee1.id,
  start_time: mockAvailableSlots[0].start_time,
  end_time: mockAvailableSlots[0].end_time,
  customer_name: 'Test User',
  customer_email: 'test@example.com',
  business_id: mockBusinessId,
  customer_id: 'cust-1',
  status: 'confirmed',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// --- Main Test Suite ---
describe('TenantPublicBookingPage', () => {
  let mockCreateBookingMutate = vi.fn();
  let mockFormatInBusinessTimezone = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks(); // Reset all mocks before each test

    (useTenant as vi.Mock).mockReturnValue({
      businessInfo: { id: mockBusinessId, name: 'Test Business', timezone: mockBusinessTimezone },
      isLoadingTenant: false,
      currentSubdomain: 'testbusiness',
    });
    (useAuth as vi.Mock).mockReturnValue({ user: null, isLoading: false });
    
    mockFormatInBusinessTimezone = vi.fn((date, formatStr) => {
        if (!date) return '';
        // Simplified mock, assumes date is JS Date object
        if (formatStr === 'yyyy-MM-dd') return date.toISOString().split('T')[0];
        if (formatStr === 'MMMM d, yyyy') return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if (formatStr === 'p') return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: mockBusinessTimezone });
        return date.toISOString();
    });

    (useTimezone as vi.Mock).mockReturnValue({
      businessTimezone: mockBusinessTimezone,
      userLocalTimezone: 'America/Los_Angeles', // Example user TZ
      formatInBusinessTimezone: mockFormatInBusinessTimezone,
      formatInUserLocalTimezone: vi.fn(dateStr => new Date(dateStr).toLocaleString()), // Simplified
    });

    (useServices as vi.Mock).mockReturnValue({ data: { data: mockServicesResponse }, isLoading: false, isError: false });
    (useFetchEmployees as vi.Mock).mockReturnValue({ data: { data: mockEmployeesResponse }, isLoading: false, isError: false });
    (useFetchAvailableTimeSlots as vi.Mock).mockReturnValue({ data: mockAvailableSlots, isLoading: false, isError: false, refetch: vi.fn() });
    
    mockCreateBookingMutate = vi.fn((payload, { onSuccess }) => {
      // Simulate successful booking
      if (onSuccess) onSuccess(mockBooking);
    });
    (useCreateBooking as vi.Mock).mockReturnValue({ mutate: mockCreateBookingMutate, isLoading: false });

    (apiService.get as vi.Mock).mockImplementation(url => {
      if (url.includes('/slot-check')) {
        return Promise.resolve({ data: { isAvailable: true } });
      }
      return Promise.reject(new Error(`Unhandled API GET request: ${url}`));
    });
    (toast.success as vi.Mock).mockImplementation(message => console.log(`Toast success: ${message}`));
    (toast.error as vi.Mock).mockImplementation(message => console.log(`Toast error: ${message}`));
  });

  test('allows a user to complete the booking flow', async () => {
    render(
      <AllTheProviders>
        <TenantPublicBookingPage />
      </AllTheProviders>
    );

    // 1. Select Service
    await screen.findByText('1. Select a Service:');
    const serviceSelect = screen.getByRole('combobox', { name: /select a service/i });
    await act(async () => {
        fireEvent.change(serviceSelect, { target: { value: mockService1.id } });
    });
    await waitFor(() => expect(serviceSelect).toHaveValue(mockService1.id));
    
    // 2. Select Employee (optional, stick with "Any Available" or select one)
    // For this test, let's assume "Any Available" is fine, or select the first one if needed by subsequent steps.
    // If a specific employee is required for certain slots, that needs to be handled.
    // The EmployeeSelector might auto-select if only one is available or keep "Any".
    // We'll find the employee selector and ensure it's present.
    await screen.findByText('2. Select an Employee (Optional):');
    const employeeSelect = screen.getByRole('combobox', { name: /select an employee/i });
    // fireEvent.change(employeeSelect, { target: { value: mockEmployee1.id } }); // Optional: select a specific employee
    // await waitFor(() => expect(employeeSelect).toHaveValue(mockEmployee1.id));


    // 3. Select Date
    await screen.findByText('3. Select Date:');
    const datePickerInput = screen.getByTestId('mock-datepicker-booking-date'); // id from DatePickerEnhanced
    // Simulate date selection - mock requires YYYY-MM-DD string that it can parse
    const selectedDate = new Date(2024, 7, 15); // August 15, 2024 (month is 0-indexed)
    await act(async () => {
        fireEvent.change(datePickerInput, { target: { value: '2024-08-15' } });
    });
    // Check if the selectedDate is reflected in the DatePicker (mock formats it to YYYY-MM-DD)
    await waitFor(() => expect(datePickerInput).toHaveValue('2024-08-15'));


    // 4. Select Time Slot
    // Wait for slots to be displayed (mocked slots for 2024-08-15)
    // The mockFormatInBusinessTimezone will format the UTC slot time.
    // For '2024-08-15T14:00:00Z' with 'America/New_York' (EDT, UTC-4) this is 10:00 AM.
    // Let's use a more robust way to find the button if exact time formatting in test is tricky.
    const expectedSlotText = /10:00 AM/i; // Adjust regex based on mockFormatInBusinessTimezone output for 'p'
    await screen.findByText(expectedSlotText); // Wait for the slot to appear
    const timeSlotButton = screen.getByText(expectedSlotText);
    await act(async () => {
        fireEvent.click(timeSlotButton);
    });

    // 5. Fill Customer Details
    await screen.findByText('5. Your Details:');
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/Notes for your booking/i), { target: { value: 'Test notes' } });

    // 6. Submit Booking
    const confirmButton = screen.getByRole('button', { name: /Confirm Booking/i });
    await act(async () => {
        fireEvent.click(confirmButton);
    });

    // 7. Verify Confirmation
    await waitFor(() => {
      expect(mockCreateBookingMutate).toHaveBeenCalledTimes(1);
    });
    
    // Check payload for createBookingMutation
    const expectedPayload: CreatePublicBookingDto = {
      service_id: mockService1.id,
      employee_id: expect.any(String), // Or undefined if "Any Available" was selected and translated to undefined
      start_time: mockAvailableSlots[0].start_time, // Assuming first slot was clicked
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '1234567890',
      notes: 'Test notes',
      customer_id: undefined, // Since mockAuth has user: null
    };
    
    // Check if the actual payload matches the expected, allowing employee_id to be flexible
    const actualPayload = mockCreateBookingMutate.mock.calls[0][0];
    expect(actualPayload).toMatchObject({
        ...expectedPayload,
        employee_id: actualPayload.employee_id // Accept whatever employee_id was actually sent
    });


    await screen.findByText('Booking Confirmed!');
    expect(screen.getByText(`Service: ${mockService1.name}`)).toBeInTheDocument();
    // Date and Time display depends on mockFormatInBusinessTimezone and TimeDisplay component logic
    // Example: expect(screen.getByText(/August 15, 2024/i)).toBeInTheDocument();
    // Example: expect(screen.getByText(/10:00 AM/i)).toBeInTheDocument(); // Time in business TZ

    // Verify toast.success was called (by the hook)
    // The hook calls toast.success, so we check if it was called.
    // The exact message depends on the hook's implementation.
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Booking confirmed!"));
  });

  // Add more tests:
  // - Pre-selection of service via URL parameter
  // - Error handling (e.g., slot check fails, booking creation fails)
  // - UI state when no services, no employees, no slots are available
  // - Form validation errors display
});
