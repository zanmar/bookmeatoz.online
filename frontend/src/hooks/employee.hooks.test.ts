import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiService from '@/services/apiService';
import { useFetchEmployees } from './employee.hooks';
import { useTenant } from '@/contexts/TenantContext';
import { EmployeeProfile, PaginatedResponse } from '@/types';

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

describe('useFetchEmployees', () => {
  const mockBusinessId = 'business-123';
  const mockServiceId = 'service-abc';

  beforeEach(() => {
    vi.resetAllMocks();
    (useTenant as vi.Mock).mockReturnValue({
      businessInfo: { id: mockBusinessId, timezone: 'America/New_York' },
      isLoadingTenant: false,
    });
  });

  it('should fetch employees successfully when serviceId is provided', async () => {
    const mockEmployees: EmployeeProfile[] = [
      { id: 'emp-1', user_id: 'user-1', business_id: mockBusinessId, name: 'John Doe', email: 'john@example.com' },
    ];
    const mockResponse: PaginatedResponse<EmployeeProfile> = { data: mockEmployees, total: 1, page: 1, limit: 200, totalPages: 1 };
    (apiService.get as vi.Mock).mockResolvedValue({ data: { data: mockResponse } });

    const { result } = renderHook(() => useFetchEmployees({ serviceId: mockServiceId }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(apiService.get).toHaveBeenCalledWith('/employees', { params: { service_id: mockServiceId, is_active: true, limit: 200 } });
  });

  it('should fetch all active employees if serviceId is not provided', async () => {
    const mockResponse: PaginatedResponse<EmployeeProfile> = { data: [], total: 0, page: 1, limit: 200, totalPages: 0 };
    (apiService.get as vi.Mock).mockResolvedValue({ data: { data: mockResponse } });
    const { result } = renderHook(() => useFetchEmployees({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.get).toHaveBeenCalledWith('/employees', { params: { is_active: true, limit: 200 } });
  });
  
  it('should be disabled if businessId is not available from useTenant', () => {
    (useTenant as vi.Mock).mockReturnValue({ businessInfo: null, isLoadingTenant: false });
    const { result } = renderHook(() => useFetchEmployees({ serviceId: mockServiceId }), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(apiService.get).not.toHaveBeenCalled();
  });

  it('should return an error state if API call fails', async () => {
    (apiService.get as vi.Mock).mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useFetchEmployees({ serviceId: mockServiceId }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Network Error');
  });
});
