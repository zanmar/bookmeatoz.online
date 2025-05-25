import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiService from '@/services/apiService';
import { useFetchAvailableTimeSlots } from './availability.hooks';
import { useTenant } from '@/contexts/TenantContext';
import { TimeSlot, AvailabilityQuery } from '@/types';

vi.mock('@/services/apiService');
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: vi.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useFetchAvailableTimeSlots', () => {
  const mockBusinessId = 'business-123';
  const mockServiceId = 'service-abc';
  const mockDate = '2024-07-28';
  const mockBusinessTimezone = 'America/New_York';
  const defaultParams: AvailabilityQuery = { service_id: mockServiceId, date: mockDate };

  beforeEach(() => {
    vi.resetAllMocks();
    (useTenant as vi.Mock).mockReturnValue({
      businessInfo: { id: mockBusinessId, timezone: mockBusinessTimezone },
      isLoadingTenant: false,
    });
  });

  it('should fetch available time slots successfully', async () => {
    const mockSlots: TimeSlot[] = [{ start_time: '2024-07-28T14:00:00Z', end_time: '2024-07-28T15:00:00Z', is_available: true }];
    (apiService.get as vi.Mock).mockResolvedValue({ data: { data: mockSlots } });
    const { result } = renderHook(() => useFetchAvailableTimeSlots(defaultParams, mockBusinessTimezone), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSlots);
    expect(apiService.get).toHaveBeenCalledWith('/availability/slots', { params: { service_id: mockServiceId, date: mockDate, timezone: mockBusinessTimezone } });
  });

  it('should include employee_id in params if provided and not "any"', async () => {
    (apiService.get as vi.Mock).mockResolvedValue({ data: { data: [] } });
    const paramsWithEmployee: AvailabilityQuery = { ...defaultParams, employee_id: 'emp-xyz' };
    renderHook(() => useFetchAvailableTimeSlots(paramsWithEmployee, mockBusinessTimezone), { wrapper });
    await waitFor(() => expect(apiService.get).toHaveBeenCalled());
    expect(apiService.get).toHaveBeenCalledWith('/availability/slots', { params: { service_id: mockServiceId, date: mockDate, timezone: mockBusinessTimezone, employee_id: 'emp-xyz' } });
  });
  
  it('should not include employee_id if it is "any"', async () => {
    (apiService.get as vi.Mock).mockResolvedValue({ data: { data: [] } });
    const paramsWithAnyEmployee: AvailabilityQuery = { ...defaultParams, employee_id: 'any' };
    renderHook(() => useFetchAvailableTimeSlots(paramsWithAnyEmployee, mockBusinessTimezone), { wrapper });
    await waitFor(() => expect(apiService.get).toHaveBeenCalled());
    expect(apiService.get).toHaveBeenCalledWith('/availability/slots', { params: { service_id: mockServiceId, date: mockDate, timezone: mockBusinessTimezone } });
  });

  it('should be disabled if critical params are missing', () => {
    const { result: r1 } = renderHook(() => useFetchAvailableTimeSlots(defaultParams, undefined), { wrapper }); // No timezone
    expect(r1.current.isFetching).toBe(false);
    const { result: r2 } = renderHook(() => useFetchAvailableTimeSlots({ ...defaultParams, service_id: '' }, mockBusinessTimezone), { wrapper }); // No serviceId
    expect(r2.current.isFetching).toBe(false);
     (useTenant as vi.Mock).mockReturnValue({ businessInfo: null, isLoadingTenant: false }); // No businessId
    const { result: r3 } = renderHook(() => useFetchAvailableTimeSlots(defaultParams, mockBusinessTimezone), { wrapper });
    expect(r3.current.isFetching).toBe(false);
    expect(apiService.get).not.toHaveBeenCalled();
  });

  it('should return an error state if API call fails', async () => {
    (apiService.get as vi.Mock).mockRejectedValue(new Error('API Error'));
    const { result } = renderHook(() => useFetchAvailableTimeSlots(defaultParams, mockBusinessTimezone), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('API Error');
  });
});
